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
async function post(corpo) {
  const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  let j = {}; try { j = await r.json(); } catch { /* sem corpo */ }
  return { status: r.status, ...j };
}
const instantaneo = () => { const s = estado(), p = s.perfil; return { nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, avatar: s.avatar }; };

export async function entrarNaLiga() {
  const s = estado(), L = s.liga, p = s.perfil;
  const corpo = () => ({ a: 'registar', id: p.id, sal: s.sal, nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, avatar: s.avatar, consentimento: true });
  let r = await post(corpo());
  if (r.status === 409) { p.id = crypto.randomUUID(); r = await post(corpo()); }
  if (r.status === 200 && r.chave) { L.chave = r.chave; L.aceitou = Date.now(); L.visto = JSON.stringify(instantaneo()); L.fila = []; L.xp = 0; gravar(); return { ok: true }; }
  return { ok: false, erro: r.erro || 'rede' };
}
export function enfileirar(ev) {
  const L = estado().liga; if (!L.chave) return;
  L.fila.push(ev); if (L.fila.length > 500) L.fila.splice(0, L.fila.length - 500); gravar(); agendar();
}
export function agendar(ms = 20000) { clearTimeout(timer); timer = setTimeout(() => { sincronizar(); }, ms); }
// envia a fila (e o perfil, se mudou). Devolve {ok, xp}. Nunca lanca erro.
export function sincronizar() {
  if (aCorrer) return aCorrer;
  const L = estado().liga; if (!L.chave) return Promise.resolve({ ok: false, erro: 'fora' });
  const exec = (async () => {
    await null;
    try {
      for (let volta = 0; volta < 20; volta++) {
        const snap = JSON.stringify(instantaneo()), lote = L.fila.slice(0, 50);
        if (!lote.length && snap === L.visto) return { ok: true, xp: L.xp };
        const corpo = { a: 'sync', id: estado().perfil.id, chave: L.chave, ev: lote };
        if (snap !== L.visto) corpo.perfil = JSON.parse(snap);
        const r = await post(corpo);
        if (r.status === 200) { L.fila.splice(0, lote.length); L.xp = r.xp; L.visto = snap; gravar(); if (!L.fila.length) return { ok: true, xp: L.xp }; continue; }
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
  try { const L = estado().liga; const r = await post({ a: 'ranking', id: estado().perfil.id, chave: L.chave, escopo, periodo }); if (r.status === 401) { L.chave = ''; gravar(); return { erro: 'auth' }; } return r.status === 200 ? r : { erro: r.erro || 'servidor' }; } catch { return { erro: 'rede' }; }
}
export async function sairDaLiga() {
  const L = estado().liga;
  try { const r = await post({ a: 'apagar', id: estado().perfil.id, chave: L.chave }); if (r.status !== 200 && r.status !== 401) return false; } catch { return false; }
  L.chave = ''; L.fila = []; L.xp = 0; L.visto = ''; L.aceitou = 0; gravar(); return true;
}
// arranque: tenta enviar o que ficou por enviar e volta a tentar quando a rede regressa
export function iniciarLiga() {
  addEventListener('online', () => { if (naLiga()) sincronizar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && naLiga() && estado().liga.fila.length) sincronizar(); });
  if (naLiga()) agendar(3000);
}
