// Cliente da liga: fila de respostas certas (o servidor refaz cada exercicio e confere), sincronizacao e ranking.
import { estado, gravar } from '../store.js';
const API = '/api/liga', CACHE = 'mat1.liga.ok';
let disp = null, timer = null, aCorrer = null;
try { disp = localStorage.getItem(CACHE) === '1' ? true : null; } catch { /* sem armazenamento */ }
export const disponivelAgora = () => disp === true;
export async function ligaDisponivel() {
  try { const r = await fetch(API, { cache: 'no-store' }); disp = r.ok && (await r.json()).ligado === true; } catch { if (disp === null) disp = false; }
  try { localStorage.setItem(CACHE, disp ? '1' : '0'); } catch { /* ok */ }
  return disp;
}
export const naLiga = () => !!estado().liga.chave;
export const eProfessor = () => !!estado().liga.prof;
async function post(corpo) {
  const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  let j = {}; try { j = await r.json(); } catch { /* sem corpo */ }
  return { status: r.status, ...j };
}
// plataforma, tipo de aparelho (telemovel, tablet, computador) e se a app esta instalada (so isto, para o professor ver a adesao)
export function dispositivo() {
  const ua = navigator.userAgent || ''; let pl = 'outro';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) pl = 'ios'; else if (/Android/.test(ua)) pl = 'android'; else if (/Windows/.test(ua)) pl = 'windows'; else if (/Macintosh|Mac OS/.test(ua)) pl = 'mac'; else if (/Linux|X11|CrOS/.test(ua)) pl = 'linux';
  let inst = false; try { inst = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { /* sem matchMedia */ }
  const maxT = navigator.maxTouchPoints || 0;
  const fm = /iPad/.test(ua) || (/Macintosh/.test(ua) && maxT > 1) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tab' : /iPhone|iPod|Android/.test(ua) ? 'tel' : 'pc';
  return { pl, fm, inst };
}
const instantaneo = () => { const s = estado(), p = s.perfil; return { nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, avatar: s.avatar, disp: dispositivo() }; };

export async function entrarNaLiga() {
  const s = estado(), L = s.liga, p = s.perfil;
  const corpo = () => ({ a: 'registar', id: p.id, sal: s.sal, nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, avatar: s.avatar, disp: dispositivo(), consentimento: true });
  let r = await post(corpo());
  if (r.status === 409) { p.id = crypto.randomUUID(); r = await post(corpo()); }
  if (r.status === 200 && r.chave) { L.chave = r.chave; L.prof = 0; L.aceitou = Date.now(); L.visto = JSON.stringify(instantaneo()); L.fila = []; L.xp = 0; gravar(); return { ok: true }; }
  return { ok: false, erro: r.erro || 'rede' };
}
export function enfileirar(ev) {
  const L = estado().liga; if (!L.chave) return;
  L.fila.push(ev); if (L.fila.length > 500) L.fila.splice(0, L.fila.length - 500); gravar(); agendar();
}
export function agendar(ms = 20000) { clearTimeout(timer); timer = setTimeout(() => { sincronizar(); }, ms); }
// envia a fila (e o perfil, se mudou). Devolve {ok, xp}. Nunca lanca erro.
export function sincronizar(forcar = false) {
  if (aCorrer) return aCorrer;
  const L = estado().liga; if (!L.chave) return Promise.resolve({ ok: false, erro: 'fora' });
  const exec = (async () => {
    await null;
    try {
      for (let volta = 0; volta < 20; volta++) {
        const snap = JSON.stringify(instantaneo()), lote = L.fila.slice(0, 50);
        if (!lote.length && snap === L.visto && !(forcar && volta === 0)) return { ok: true, xp: L.xp };
        const corpo = { a: 'sync', id: estado().perfil.id, chave: L.chave, ev: lote };
        if (snap !== L.visto) corpo.perfil = JSON.parse(snap);
        const r = await post(corpo);
        if (r.status === 200) { L.fila.splice(0, lote.length); L.xp = r.xp; L.visto = snap; L.prof = r.prof ? 1 : 0; gravar(); if (!L.fila.length) return { ok: true, xp: L.xp }; continue; }
        if (r.status === 401) { L.chave = ''; L.fila = []; gravar(); return { ok: false, erro: 'auth' }; }
        agendar(30000); return { ok: false, erro: r.erro || 'servidor' };
      }
      return { ok: true, xp: L.xp };
    } catch { agendar(60000); return { ok: false, erro: 'rede' }; }
  })();
  aCorrer = exec; exec.then(() => { if (aCorrer === exec) aCorrer = null; });
  return exec;
}
export async function ranking(escopo, periodo) {
  await sincronizar();
  try { const L = estado().liga; const r = await post({ a: 'ranking', id: estado().perfil.id, chave: L.chave, escopo, periodo }); if (r.status === 401) { L.chave = ''; gravar(); return { erro: 'auth' }; } if (r.status === 200) { const antes = L.prof; L.prof = r.prof ? 1 : 0; if (antes !== L.prof) gravar(); } return r.status === 200 ? r : { erro: r.erro || 'servidor' }; } catch { return { erro: 'rede' }; }
}
export async function sairDaLiga() {
  const L = estado().liga;
  try { const r = await post({ a: 'apagar', id: estado().perfil.id, chave: L.chave }); if (r.status !== 200 && r.status !== 401) return false; } catch { return false; }
  L.chave = ''; L.fila = []; L.xp = 0; L.visto = ''; L.aceitou = 0; L.prof = 0; gravar(); return true;
}
// professor: o servidor confere o codigo (nunca fica na app) e guarda o estatuto
export async function tornarProfessor(codigo) {
  const L = estado().liga; if (!L.chave) return { ok: false, erro: 'fora' };
  try {
    await sincronizar();
    const r = await post({ a: 'professor', id: estado().perfil.id, chave: L.chave, codigo });
    if (r.status === 200) { L.prof = 1; gravar(); return { ok: true }; }
    return { ok: false, erro: r.status === 403 ? 'codigo' : r.status === 429 ? 'muitas' : r.status === 503 ? 'sem_codigo' : 'servidor' };
  } catch { return { ok: false, erro: 'rede' }; }
}
export async function painelProf() {
  const L = estado().liga;
  try { const r = await post({ a: 'painel', id: estado().perfil.id, chave: L.chave }); if (r.status === 403) { L.prof = 0; gravar(); } return r.status === 200 ? r : { erro: r.erro || 'servidor' }; } catch { return { erro: 'rede' }; }
}
export async function ocultarAluno(alvo, oculto) {
  const L = estado().liga;
  try { const r = await post({ a: 'ocultar', id: estado().perfil.id, chave: L.chave, alvo, oculto }); return r.status === 200; } catch { return false; }
}
// arranque: tenta enviar o que ficou por enviar e volta a tentar quando a rede regressa
export function iniciarLiga() {
  addEventListener('online', () => { if (naLiga()) sincronizar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && naLiga() && estado().liga.fila.length) sincronizar(); });
  let ultimoPing = 0; const ping = () => { if (naLiga() && Date.now() - ultimoPing > 30 * 60000) { ultimoPing = Date.now(); sincronizar(true); } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ping(); });
  if (naLiga()) setTimeout(ping, 3000);
}
