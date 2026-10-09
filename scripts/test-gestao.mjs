// Testa o modulo Economia e Gestao: milhares de exercicios, resposta exata, LaTeX valido, resolucao com no maximo 5 passos.
import { gerar, verificar, TIPOS } from '../web/js/engine/generators.js';
import { Frac } from '../web/js/engine/fraction.js';
import katex from '../web/vendor/katex/katex.mjs';
let falhas = 0, n = 0; const fam = {};
const bad = (m) => { falhas++; if (falhas < 15) console.log('FALHA', m); };
const rend = (s, id) => { for (const p of s.split(/(\$[^$]+\$)/g)) if (p.startsWith('$') && p.length > 2) { try { katex.renderToString(p.slice(1, -1), { throwOnError: true, strict: 'error' }); } catch (e) { bad(id + ' katex: ' + e.message.slice(0, 120) + ' :: ' + p.slice(0, 80)); } } };
const N = Number(process.argv[2] || 600);
if (!TIPOS.includes('gestao')) { console.log('gestao nao esta em TIPOS'); process.exit(1); }
const t0 = Date.now();
for (const nivel of [1, 2, 3]) for (let s = 1; s <= N; s++) {
  const seed = (s * 7919 + nivel * 104729) >>> 0; let ex;
  try { ex = gerar('gestao', seed, nivel); } catch (e) { bad(`nivel ${nivel} seed ${seed}: ${e.message}`); continue; }
  n++; const id = ex.id; const r = ex.resposta;
  if (r.kind !== 'vetor' || r.valor.length !== r.rotulos.length || r.valor.length !== r.unidades.length) bad(id + ' resposta mal formada');
  if (!verificar(ex, r.valor.map((v) => String(v)))) bad(id + ' nao aceita a resposta certa');
  const dec = r.valor.map((v) => v.isInt() ? String(v) : v.toString()); // fracao 64/5
  if (!verificar(ex, r.valor.map((v) => { const x = v.n * 100n / v.d; return (v.isInt() ? String(v.n) : (Number(v.n) / Number(v.d)).toString().replace('.', ',')); }))) bad(id + ' nao aceita a virgula decimal ' + JSON.stringify(r.valor.map(String)));
  if (r.valor.length && verificar(ex, r.valor.map((v, i) => (i === 0 ? String(v.add(1)) : String(v))))) bad(id + ' aceita resposta errada');
  if (verificar(ex, r.valor.slice(1).map(String))) bad(id + ' aceita resposta curta');
  if (ex.resolucao.length !== 5) bad(id + ' resolucao com ' + ex.resolucao.length + ' passos');
  rend(ex.enunciado, id); for (const p of ex.resolucao) { rend(p.texto || '', id); if (p.latex) rend('$' + p.latex + '$', id); }
  const all = ex.enunciado + JSON.stringify(ex.resolucao);
  if (/undefined|NaN|\[object|Infinity/.test(all)) bad(id + ' texto com undefined/NaN');
  const k = ex.resolucao[0].texto.slice(0, 18) + '|' + nivel; fam[k] = (fam[k] || 0) + 1;
}
console.log(n, 'exercicios gerados em', Date.now() - t0, 'ms;', falhas, 'falhas');
console.log(fam);
process.exit(falhas ? 1 : 0);
