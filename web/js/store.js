// Estado local (versao de teste). Na versao final: IndexedDB + sincronizacao com o servidor (D1); o servidor revalida pontos.
import { diaChave } from './rules.js';
const KEY = 'mat1.v2';
let mem = null;
export const AVATAR_PADRAO = { genero: 'h', top: 'shortFlat', hairColor: '2c1b18', hatColor: '25557c', accessories: 'none', accessoriesColor: '262e33', facialHair: 'none', facialHairColor: '2c1b18',
  clothing: 'shirtCrewNeck', clothesColor: '3c4f5c', clothingGraphic: 'diamond', eyebrows: 'defaultNatural', eyes: 'default', mouth: 'smile', skinColor: 'edb98a', fundo: 0, moldura: 0 };
const vazio = () => ({ perfil: { alcunha: '', nome: '', regime: '', local: '', id: '', criado: 0, teste: '' }, conta: { email: '', ev: false, dev: '0', ver: 0, rem: { xp: 0, st: {}, tipo: {} }, rd: {}, avSnap: '', avT: 0, pfSnap: '', pfT: 0, visto: '' }, liga: { chave: '', aceitou: 0, fila: [], xp: 0, visto: '', prof: 0 }, avatar: { ...AVATAR_PADRAO }, som: true, sal: Math.floor(Math.random() * 1e9), xp: 0, dias: [], porTipo: {}, contador: 0,
  hoje: { dia: '', n: {}, certas: 0, semPistas: 0, desafios: 0, reclamadas: [] },
  stats: { certas: 0, erradas: 0, semPistas: 0, desafios: 0, perfeitos: 0, certasTipo: {} }, conquistas: {} });
function ler() { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* sem armazenamento */ } return null; }
export function estado() { if (!mem) { mem = Object.assign(vazio(), ler() || {}); mem.avatar = { ...AVATAR_PADRAO, ...mem.avatar }; mem.perfil = { ...vazio().perfil, ...mem.perfil }; mem.liga = { ...vazio().liga, ...mem.liga }; mem.conta = { ...vazio().conta, ...mem.conta }; mem.conta.rem = { ...vazio().conta.rem, ...mem.conta.rem }; } return mem; }
export function gravar() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* ok */ } }
// copia de seguranca do progresso antes de operacoes que o fundem com a conta (nunca se apaga sozinha)
export function copiaSeguranca() { try { const s = localStorage.getItem(KEY); if (s) localStorage.setItem(KEY + '.bak', s); } catch { /* sem armazenamento */ } }
export function apagarTudo() { try { localStorage.removeItem(KEY); } catch { /* ok */ } mem = null; }
export function sequencia() {
  const s = estado(); let n = 0; const dias = new Set(s.dias); let d = new Date();
  if (!dias.has(diaChave(d))) d = new Date(d.getTime() - 86400000);
  while (dias.has(diaChave(d))) { n++; d = new Date(d.getTime() - 86400000); }
  return n;
}
export function registarDia() {
  const s = estado(), k = diaChave();
  if (!s.dias.includes(k)) s.dias.push(k);
  if (s.hoje.dia !== k) s.hoje = { dia: k, n: {}, certas: 0, semPistas: 0, desafios: 0, reclamadas: [] };
}
export function nHoje(tipo) { registarDia(); return estado().hoje.n[tipo] || 0; }
// certo: se o exercicio foi resolvido; semHist: nao conta para o nivel do tipo (erro ja registado antes)
export function registarResultado(tipo, certo, xp, { semPistas = false, desafio = false, perfeito = false, semHist = false } = {}) {
  const s = estado(); registarDia();
  if (!semHist) {
    const t = (s.porTipo[tipo] ||= { hist: [], nivel: 1 });
    t.hist.push(certo ? 1 : 0); if (t.hist.length > 10) t.hist.shift();
    const ult = t.hist.slice(-5); const c = ult.reduce((a, b) => a + b, 0);
    if (ult.length >= 5 && c >= 4 && t.nivel < 3) { t.nivel++; t.hist = []; }
    else if (ult.length >= 5 && c <= 1 && t.nivel > 1) { t.nivel--; t.hist = []; }
    if (!certo) s.stats.erradas++;
  }
  if (certo) {
    s.hoje.n[tipo] = (s.hoje.n[tipo] || 0) + 1; s.hoje.certas++; s.stats.certas++;
    s.stats.certasTipo[tipo] = (s.stats.certasTipo[tipo] || 0) + 1;
    if (semPistas) { s.hoje.semPistas++; s.stats.semPistas++; }
  }
  if (desafio) { s.hoje.desafios++; s.stats.desafios++; if (perfeito) s.stats.perfeitos++; }
  s.xp += xp; gravar();
}
export function darXP(xp) { const s = estado(); s.xp += xp; gravar(); }
export const dominio = (tipo) => { const t = estado().porTipo[tipo]; if (!t || !t.hist.length) return 0; return t.hist.reduce((a, b) => a + b, 0) / Math.max(5, t.hist.length); };
export const nivelTipo = (tipo) => estado().porTipo[tipo]?.nivel || 1;
export function novaSemente() { const s = estado(); s.contador++; gravar(); return (s.sal + s.contador * 7919) >>> 0; }
export const snapshot = () => { const s = estado(); return { xp: s.xp, conquistas: { ...s.conquistas } }; };
