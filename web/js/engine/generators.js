// Geradores de exercicios com semente. Cada gerador devolve o enunciado, a resposta calculada pelo motor
// e a resolucao passo a passo na notacao da UC. A IA nunca decide a resposta certa.
import { makeRng } from './rng.js';
import { Matrix, applyOp, reduce, det, inverse, solveSystem, rank } from './matrix.js';
import { Frac, F } from './fraction.js';

const MAXDIG = 3; // nenhum numero com mais de 3 algarismos nas respostas
const rndMat = (rng, m, n, lo, hi) => Matrix.from(Array.from({ length: m }, () => Array.from({ length: n }, () => F(rng.int(lo, hi)))));
const L = (M, aug = -1) => '$' + M.toLatex(aug) + '$';
const opTexto = (op) => {
  const r = (i) => `L${i + 1}`;
  switch (op.t) {
    case 'troca': return `trocar ${r(op.i)} com ${r(op.j)}`;
    case 'escala': return `${r(op.i)} × ${op.k}`;
    case 'divide': return `${r(op.i)} : ${op.k}`;
    case 'jacobi': return `${r(op.r)} ← ${r(op.r)} + (${op.m}) × ${r(op.p)}`;
    default: return '';
  }
};
const stepsToRes = (init, steps, aug = -1) => [
  { texto: 'Matriz inicial.', matriz: init },
  ...steps.map((s) => ({ texto: opTexto(s.op), op: s.op, matriz: s.matriz })),
].map((x) => ({ ...x, latex: x.matriz ? x.matriz.toLatex(aug) : undefined }));

function tries(rng, fn, n = 300) {
  for (let i = 0; i < n; i++) { const r = fn(); if (r) return r; }
  throw new Error('gerador sem solucao dentro dos limites');
}

// ---- produto de matrizes ----
function produto(rng, nivel) {
  const [m, k, n] = nivel === 1 ? [2, 2, 2] : nivel === 2 ? [2, 3, 2] : [3, 3, 3];
  return tries(rng, () => {
    const A = rndMat(rng, m, k, -3, 4), B = rndMat(rng, k, n, -3, 4);
    const C = A.mul(B);
    if (C.maxSize() > MAXDIG) return null;
    return {
      tipo: 'produto', nivel,
      enunciado: `Sendo $A$ e $B$ as matrizes seguintes, determine $A\\cdot B$.\n$A=${A.toLatex()}$  $B=${B.toLatex()}$`,
      dados: { A, B }, resposta: { kind: 'matriz', valor: C },
      resolucao: [{ texto: `Cada elemento $c_{ij}$ é a soma dos produtos da linha $i$ de $A$ pelos elementos da coluna $j$ de $B$. O resultado tem ordem ${m}×${n}.`, latex: C.toLatex() }],
    };
  });
}

// ---- determinante por Sarrus (3x3) ou regra direta (2x2) ----
function determinante(rng, nivel) {
  const n = nivel === 1 ? 2 : 3;
  return tries(rng, () => {
    const A = rndMat(rng, n, n, -4, 4); const d = det(A);
    if (d.size() > MAXDIG) return null;
    if (nivel < 3 && d.isZero()) return null;
    let texto;
    if (n === 2) texto = `$|A| = (${A.get(0, 0)})(${A.get(1, 1)}) - (${A.get(0, 1)})(${A.get(1, 0)}) = ${d}$`;
    else {
      const g = (i, j) => `(${A.get(i, j)})`;
      const pos = [[0, 0, 1, 1, 2, 2], [0, 1, 1, 2, 2, 0], [0, 2, 1, 0, 2, 1]].map(([a, b, c, dd, e, f]) => `${g(a, b)}${g(c, dd)}${g(e, f)}`);
      const neg = [[0, 2, 1, 1, 2, 0], [0, 0, 1, 2, 2, 1], [0, 1, 1, 0, 2, 2]].map(([a, b, c, dd, e, f]) => `${g(a, b)}${g(c, dd)}${g(e, f)}`);
      texto = `Regra de Sarrus: $|A| = ${pos.join(' + ')} - [${neg.join(' + ')}] = ${d}$`;
    }
    return { tipo: 'determinante', nivel, enunciado: `Calcule o determinante de $A=${A.toLatex()}$.`, dados: { A }, resposta: { kind: 'escalar', valor: d }, resolucao: [{ texto }] };
  });
}

// ---- inversa ----
function inversa(rng, nivel) {
  const n = nivel === 1 ? 2 : 3;
  return tries(rng, () => {
    // constroi uma matriz invertivel por operacoes elementares sobre a identidade
    let A = Matrix.identity(n);
    for (let s = 0; s < (n === 2 ? 3 : 5); s++) {
      const i = rng.int(0, n - 1); let j = rng.int(0, n - 1); if (i === j) j = (j + 1) % n;
      A = applyOp(A, rng.next() < 0.7 ? { t: 'jacobi', p: i, r: j, m: F(rng.pick([-3, -2, -1, 1, 2, 3])) } : { t: 'troca', i, j });
    }
    if (nivel === 3) { const i = rng.int(0, n - 1); A = applyOp(A, { t: 'escala', i, k: F(rng.pick([-2, 2, 3])) }); }
    const r = inverse(A);
    if (!r || r.inv.maxSize() > MAXDIG || A.maxSize() > 2) return null;
    return {
      tipo: 'inversa', nivel,
      enunciado: `Determine, se existir, a matriz inversa de $A=${A.toLatex()}$ pelo método de Gauss-Jordan.`,
      dados: { A }, resposta: { kind: 'matriz', valor: r.inv },
      resolucao: stepsToRes(r.aug, r.steps, n),
      passos: { inicial: r.aug, steps: r.steps, goal: 'reduzida', limitCols: n },
    };
  });
}

// ---- caracteristica (condensacao) ----
function caracteristica(rng, nivel) {
  return tries(rng, () => {
    const A0 = rndMat(rng, 3, 4, -3, 4);
    // impoe uma dependencia linear com probabilidade 0,6
    let A = A0;
    if (rng.next() < 0.6) {
      const c = rng.pick([-2, -1, 1, 2]), d = rng.pick([-1, 1, 2]);
      const rows = A0.rows.map((r) => r.slice());
      rows[2] = rows[0].map((x, j) => x.mul(c).add(rows[1][j].mul(d)));
      A = Matrix.from(rows);
    }
    const r = reduce(A);
    if (A.maxSize() > 2 || r.result.maxSize() > MAXDIG + 1 || r.steps.length > (nivel === 1 ? 6 : 9) || r.steps.length < 2) return null;
    return {
      tipo: 'caracteristica', nivel,
      enunciado: `Determine a característica da matriz $A=${A.toLatex()}$ por condensação.`,
      dados: { A }, resposta: { kind: 'escalar', valor: F(r.rank) },
      resolucao: stepsToRes(A, r.steps),
      passos: { inicial: A, steps: r.steps, goal: 'condensada' },
    };
  });
}

// ---- sistema 3x3 ----
function sistema(rng, nivel) {
  return tries(rng, () => {
    const A = rndMat(rng, 3, 3, -3, 4);
    const x = [F(rng.int(-3, 4)), F(rng.int(-3, 4)), F(rng.int(-3, 4))];
    let b = Matrix.from(A.rows.map((row) => [row.reduce((s, a, j) => s.add(a.mul(x[j])), F(0))]));
    let Af = A;
    if (nivel === 3) { // torna dependente: L3 = c*L1 + d*L2; b3 consistente (SPI) ou nao (SI)
      const rows = A.rows.map((r) => r.slice()), bb = b.rows.map((r) => r.slice());
      rows[2] = rows[0].map((v, j) => v.add(rows[1][j]));
      bb[2] = [bb[0][0].add(bb[1][0]).add(rng.next() < 0.5 ? F(0) : F(rng.pick([1, 2, -1])))];
      Af = Matrix.from(rows); b = Matrix.from(bb);
    }
    const s = solveSystem(Af, b);
    if (nivel < 3 && s.tipo !== 'SPD') return null;
    if (nivel === 3 && (s.tipo === 'SPD' || s.rA !== 2)) return null;
    if (s.final.maxSize() > MAXDIG || s.steps.length > 14) return null;
    const vars = ['x', 'y', 'z'];
    const eq = Af.rows.map((r, i) => r.map((c, j) => (c.isZero() ? '' : `${c.sign() < 0 ? '-' : '+'} ${c.abs().eq(1) ? '' : c.abs()}${vars[j]}`)).filter(Boolean).join(' ').replace(/^\+ /, '') + ` = ${b.get(i, 0)}`);
    return {
      tipo: 'sistema', nivel,
      enunciado: `Resolva o sistema pelo método de Gauss-Jordan e classifique-o (SPD, SPI ou SI):\n${eq.join(';  ')}`,
      dados: { A: Af, b },
      resposta: { kind: 'sistema', valor: { tipo: s.tipo, solucao: s.solucao, gi: s.gi, rA: s.rA, rAug: s.rAug } },
      resolucao: stepsToRes(Af.hcat(b), s.steps, 3),
      passos: { inicial: Af.hcat(b), steps: s.steps, goal: 'reduzida', limitCols: 3 },
    };
  });
}

export const GERADORES = { produto, determinante, inversa, caracteristica, sistema };
export const TIPOS = Object.keys(GERADORES);

export function gerar(tipo, semente, nivel = 1) {
  const g = GERADORES[tipo]; if (!g) throw new RangeError('tipo desconhecido: ' + tipo);
  const ex = g(makeRng(semente), nivel);
  return { ...ex, semente, id: `${tipo}-${nivel}-${semente}` };
}

// Verificacao exata da resposta final do aluno.
// matriz: given = [[str]] ; escalar: given = str ; sistema: given = {tipo, solucao?:[str]}
export function verificar(ex, given) {
  const r = ex.resposta;
  try {
    if (r.kind === 'matriz') return Matrix.parse(given).eq(r.valor);
    if (r.kind === 'escalar') { const f = Frac.parse(given); return !!f && f.eq(r.valor); }
    if (r.kind === 'sistema') {
      if (!given || given.tipo !== r.valor.tipo) return false;
      if (r.valor.tipo !== 'SPD') return true;
      return r.valor.solucao.every((s, i) => { const f = Frac.parse(given.solucao?.[i] ?? ''); return !!f && f.eq(s); });
    }
  } catch { return false; }
  return false;
}
export { rank };
