// Conta do aluno (email + palavra-passe): o mesmo progresso em todos os aparelhos.
// Regra de ouro: nada do que o aluno ganhou se perde. Cada aparelho soma os seus proprios contadores; os dos outros aparelhos
// so se acrescentam (nunca substituem). Conjuntos (dias, conquistas) unem-se. Avatar e dados pessoais: vence a alteracao mais recente.
import { estado, gravar, copiaSeguranca, AVATAR_PADRAO } from '../store.js';
import { NOMES } from '../rules.js';
import { post, dispositivo, aoSincronizar, naLiga } from './liga.js';

const TIPOS = Object.keys(NOMES), ST = ['certas', 'erradas', 'semPistas', 'desafios', 'perfeitos'];
const jsonDe = (o) => JSON.stringify(o);
const cred = () => ({ id: estado().perfil.id, chave: estado().liga.chave });
const ouvintes = new Set();
export const aoMudarConta = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
const avisar = () => ouvintes.forEach((f) => { try { f(); } catch { /* ignorado */ } });
export const temConta = () => !!estado().conta.email && naLiga();
export const emailDaConta = () => estado().conta.email;

// contadores ganhos NESTE aparelho (total menos o que veio dos outros)
export function proprios() {
  const s = estado(), r = s.conta.rem, st = {}, tipo = {};
  for (const k of ST) st[k] = Math.max(0, (s.stats[k] || 0) - (r.st[k] || 0));
  for (const t of TIPOS) tipo[t] = Math.max(0, (s.stats.certasTipo[t] || 0) - (r.tipo[t] || 0));
  return { xp: Math.max(0, s.xp - (r.xp || 0)), st, tipo };
}
const perfilPartilhado = () => { const p = estado().perfil; return { nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, teste: p.teste || '' }; };

// estado a enviar para a nuvem. Marca a hora das alteracoes locais de avatar e dados.
export function construirBlob() {
  const s = estado(), c = s.conta;
  if (jsonDe(s.avatar) !== c.avSnap) { c.avT = Date.now(); c.avSnap = jsonDe(s.avatar); }
  if (jsonDe(perfilPartilhado()) !== c.pfSnap) { c.pfT = Date.now(); c.pfSnap = jsonDe(perfilPartilhado()); }
  const pt = {}; for (const t of TIPOS) if (s.porTipo[t]) pt[t] = s.porTipo[t].nivel || 1;
  const o = proprios();
  return { d: { ...c.rd, [c.dev]: { xp: o.xp, st: o.st, tipo: o.tipo } }, dias: [...new Set(s.dias)].sort(), conq: { ...s.conquistas }, pt,
    hoje: { dia: s.hoje.dia, n: { ...s.hoje.n }, certas: s.hoje.certas, semPistas: s.hoje.semPistas, desafios: s.hoje.desafios, rec: [...s.hoje.reclamadas] },
    av: s.avatar, avT: c.avT, pf: perfilPartilhado(), pfT: c.pfT };
}

// funde o estado da nuvem no local. Devolve true se alguma coisa mudou no aparelho.
export function fundir(r) {
  if (!r || typeof r !== 'object') return false;
  const s = estado(), c = s.conta, antes = jsonDe([s.xp, s.stats, s.dias, s.conquistas, s.avatar, s.perfil, s.porTipo, s.hoje]);
  // 1. contadores dos outros aparelhos (so crescem)
  const rem = { xp: 0, st: {}, tipo: {} }, rd = {};
  for (const [k, v] of Object.entries(r.d || {})) {
    if (k === c.dev || !v) continue; rd[k] = v; rem.xp += v.xp || 0;
    for (const x of ST) rem.st[x] = (rem.st[x] || 0) + ((v.st && v.st[x]) || 0);
    for (const t of TIPOS) rem.tipo[t] = (rem.tipo[t] || 0) + ((v.tipo && v.tipo[t]) || 0);
  }
  rem.xp = Math.max(rem.xp, c.rem.xp || 0);
  for (const x of ST) rem.st[x] = Math.max(rem.st[x] || 0, c.rem.st[x] || 0);
  for (const t of TIPOS) rem.tipo[t] = Math.max(rem.tipo[t] || 0, c.rem.tipo[t] || 0);
  const o = proprios();
  s.xp = o.xp + rem.xp;
  for (const x of ST) s.stats[x] = o.st[x] + rem.st[x];
  for (const t of TIPOS) s.stats.certasTipo[t] = o.tipo[t] + rem.tipo[t];
  c.rem = rem; c.rd = rd;
  // 2. conjuntos
  s.dias = [...new Set([...(s.dias || []), ...(r.dias || [])])].sort();
  for (const [k, v] of Object.entries(r.conq || {})) if (!s.conquistas[k] || v < s.conquistas[k]) s.conquistas[k] = v;
  for (const [t, n] of Object.entries(r.pt || {})) { const l = (s.porTipo[t] ||= { hist: [], nivel: 1 }); if (n > (l.nivel || 1)) l.nivel = n; }
  // 3. o dia de hoje (mesmo dia: o maior de cada contador)
  const h = r.hoje;
  if (h && h.dia === s.hoje.dia) {
    for (const t of Object.keys(h.n || {})) s.hoje.n[t] = Math.max(s.hoje.n[t] || 0, h.n[t] || 0);
    for (const k of ['certas', 'semPistas', 'desafios']) s.hoje[k] = Math.max(s.hoje[k] || 0, h[k] || 0);
    s.hoje.reclamadas = [...new Set([...(s.hoje.reclamadas || []), ...(h.rec || [])])];
  }
  // 4. avatar e dados pessoais: vence a alteracao mais recente
  if (jsonDe(s.avatar) !== c.avSnap) { c.avT = Date.now(); c.avSnap = jsonDe(s.avatar); }
  if (r.av && Object.keys(r.av).length && (r.avT || 0) > (c.avT || 0)) { s.avatar = { ...AVATAR_PADRAO, ...r.av }; c.avT = r.avT; c.avSnap = jsonDe(s.avatar); }
  if (jsonDe(perfilPartilhado()) !== c.pfSnap) { c.pfT = Date.now(); c.pfSnap = jsonDe(perfilPartilhado()); }
  if (r.pf && r.pf.nome && (r.pfT || 0) > (c.pfT || 0)) {
    s.perfil.nome = r.pf.nome; s.perfil.alcunha = r.pf.alc || ''; if (r.pf.regime) s.perfil.regime = r.pf.regime; if (r.pf.local) s.perfil.local = r.pf.local; if (r.pf.teste) s.perfil.teste = r.pf.teste;
    c.pfT = r.pfT; c.pfSnap = jsonDe(perfilPartilhado());
  }
  gravar();
  return jsonDe([s.xp, s.stats, s.dias, s.conquistas, s.avatar, s.perfil, s.porTipo, s.hoje]) !== antes;
}

// ler da nuvem, fundir, e enviar se houver algo novo. Nunca lanca erro.
let aCorrer = null, ultimaLeitura = 0;
export function sincronizarNuvem({ forcar = false } = {}) {
  if (!temConta()) return Promise.resolve({ ok: false, erro: 'sem_conta' });
  if (aCorrer) return aCorrer;
  const exec = (async () => {
    const c = estado().conta; let mudou = false;
    try {
      for (let volta = 0; volta < 4; volta++) {
        if (forcar || volta > 0 || Date.now() - ultimaLeitura > 120000 || !c.ver) {
          const r = await post({ a: 'nuvem', ...cred(), ver: c.ver });
          if (r.status === 401) return { ok: false, erro: 'auth' };
          if (r.status !== 200) return { ok: false, erro: r.erro || 'servidor' };
          ultimaLeitura = Date.now();
          if (r.est) { mudou = fundir(r.est) || mudou; }
          c.ver = r.ver; gravar();
        }
        const b = construirBlob(), txt = jsonDe(b);
        if (txt === c.visto) return { ok: true, mudou };
        const r2 = await post({ a: 'nuvem', ...cred(), base: c.ver, est: b });
        if (r2.status === 200) { c.ver = r2.ver; c.visto = txt; gravar(); return { ok: true, mudou }; }
        if (r2.status === 409 && r2.est) { mudou = fundir(r2.est) || mudou; c.ver = r2.ver; gravar(); continue; }
        if (r2.status === 429) { await new Promise((res) => setTimeout(res, 1500)); continue; }
        return { ok: false, erro: r2.erro || 'servidor' };
      }
      return { ok: true, mudou };
    } catch { return { ok: false, erro: 'rede' }; } finally { if (mudou) avisar(); }
  })();
  aCorrer = exec; exec.then(() => { if (aCorrer === exec) aCorrer = null; });
  return exec;
}

// ---------- criar conta, entrar, mudar a palavra-passe ----------
const emailOk = (e) => /^[^\s@]{1,64}@[^\s@]{1,200}\.[A-Za-z]{2,24}$/.test(e);
export const limparEmail = (e) => String(e || '').trim().toLowerCase();
export const validarEmail = (e) => emailOk(limparEmail(e));

// liga um email e uma palavra-passe ao jogador deste aparelho (cria-o na liga se ainda nao estava)
export async function criarConta(email, senha) {
  const s = estado(), L = s.liga, p = s.perfil, e = limparEmail(email);
  if (!validarEmail(e)) return { ok: false, erro: 'email' };
  if (String(senha).length < 6) return { ok: false, erro: 'senha' };
  if (!p.id) p.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
  const corpo = { a: 'conta', id: p.id, email: e, senha, consentimento: true, dev: '0' };
  if (L.chave) corpo.chave = L.chave; else Object.assign(corpo, { sal: s.sal, nome: p.nome, alc: p.alcunha || '', regime: p.regime, local: p.local, avatar: s.avatar, disp: dispositivo(), teste: p.teste || '', c0: s.contador });
  try {
    copiaSeguranca();
    const r = await post(corpo);
    if (r.status === 200) {
      if (r.chave) { L.chave = r.chave; L.fila = []; L.xp = 0; L.visto = ''; }
      L.aceitou = L.aceitou || Date.now(); L.prof = 0;
      Object.assign(s.conta, { email: e, dev: '0', ver: 0, visto: '' }); gravar();
      sincronizarNuvem({ forcar: true }); return { ok: true };
    }
    return { ok: false, erro: r.erro || 'servidor', status: r.status };
  } catch { return { ok: false, erro: 'rede' }; }
}

// entra numa conta que ja existe (outro aparelho, ou depois de apagar os dados do navegador)
export async function entrarConta(email, senha) {
  const s = estado(), L = s.liga, p = s.perfil, e = limparEmail(email);
  if (!validarEmail(e) || !senha) return { ok: false, erro: 'dados' };
  if (L.chave && !s.conta.email) return { ok: false, erro: 'ja_na_liga' };
  if (L.chave && s.conta.email && s.conta.email !== e) return { ok: false, erro: 'outra_conta' };
  try {
    copiaSeguranca();
    const r = await post({ a: 'entrar', email: e, senha, sal: s.sal, c0: s.contador, disp: dispositivo() });
    if (r.status !== 200) return { ok: false, erro: r.erro || 'servidor', status: r.status };
    p.id = r.id; p.criado = p.criado || Date.now();
    p.nome = r.perfil.nome; p.alcunha = r.perfil.alc || ''; p.regime = r.perfil.regime; p.local = r.perfil.local; if (r.perfil.teste) p.teste = r.perfil.teste;
    if (r.avatar && Object.keys(r.avatar).length) s.avatar = { ...AVATAR_PADRAO, ...r.avatar };
    Object.assign(L, { chave: r.chave, fila: [], xp: r.xp || 0, aceitou: Date.now(), prof: r.prof ? 1 : 0, visto: '' });
    Object.assign(s.conta, { email: e, dev: r.dev, ver: 0, visto: '', rem: { xp: 0, st: {}, tipo: {} }, rd: {}, avSnap: jsonDe(s.avatar), pfSnap: jsonDe(perfilPartilhado()), avT: 0, pfT: 0 });
    gravar();
    await sincronizarNuvem({ forcar: true });
    return { ok: true, trocar: !!r.trocar };
  } catch { return { ok: false, erro: 'rede' }; }
}

export async function mudarSenha(atual, nova) {
  if (String(nova).length < 6) return { ok: false, erro: 'senha' };
  try { const r = await post({ a: 'senha', ...cred(), atual, nova }); return r.status === 200 ? { ok: true } : { ok: false, erro: r.erro || 'servidor' }; } catch { return { ok: false, erro: 'rede' }; }
}

export function iniciarConta() {
  aoSincronizar(() => { if (temConta()) sincronizarNuvem(); });
  const ver = () => { if (document.visibilityState === 'visible' && temConta()) sincronizarNuvem(); };
  document.addEventListener('visibilitychange', ver);
  if (temConta()) setTimeout(() => sincronizarNuvem({ forcar: true }), 1500);
}
