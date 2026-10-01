import { Frac, F } from './fraction.js';

export class Matrix {
  constructor(rows) {
    this.rows = rows.map((r) => r.map((x) => Frac.of(x)));
    this.m = this.rows.length; this.n = this.m ? this.rows[0].length : 0;
    if (this.rows.some((r) => r.length !== this.n)) throw new RangeError('linhas de tamanhos diferentes');
  }
  static from(rows) { return new Matrix(rows); }
  static parse(rows) { return new Matrix(rows.map((r) => r.map((x) => { const f = Frac.parse(x); if (!f) throw new RangeError('valor invalido: ' + x); return f; }))); }
  static identity(n) { return new Matrix(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? F(1) : F(0))))); }
  static zeros(m, n) { return new Matrix(Array.from({ length: m }, () => Array.from({ length: n }, () => F(0)))); }
  get(i, j) { return this.rows[i][j]; }
  clone() { return new Matrix(this.rows.map((r) => r.slice())); }
  eq(o) { return this.m === o.m && this.n === o.n && this.rows.every((r, i) => r.every((x, j) => x.eq(o.rows[i][j]))); }
  add(o) { return new Matrix(this.rows.map((r, i) => r.map((x, j) => x.add(o.rows[i][j])))); }
  sub(o) { return new Matrix(this.rows.map((r, i) => r.map((x, j) => x.sub(o.rows[i][j])))); }
  scale(k) { return new Matrix(this.rows.map((r) => r.map((x) => x.mul(k)))); }
  transpose() { return new Matrix(Array.from({ length: this.n }, (_, j) => this.rows.map((r) => r[j]))); }
  mul(o) {
    if (this.n !== o.m) throw new RangeError('dimensoes incompativeis');
    return new Matrix(Array.from({ length: this.m }, (_, i) => Array.from({ length: o.n }, (_, j) => this.rows[i].reduce((s, x, k) => s.add(x.mul(o.rows[k][j])), F(0)))));
  }
  pow(k) { let r = Matrix.identity(this.n); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  // sub-matriz por colunas [a,b)
  cols(a, b) { return new Matrix(this.rows.map((r) => r.slice(a, b))); }
  hcat(o) { return new Matrix(this.rows.map((r, i) => r.concat(o.rows[i]))); }
  maxSize() { return Math.max(...this.rows.flat().map((x) => x.size())); }
  toArray() { return this.rows.map((r) => r.map(String)); }
  toLatex(aug = -1) {
    const cols = aug > 0 ? 'c'.repeat(aug) + '|' + 'c'.repeat(this.n - aug) : 'c'.repeat(this.n);
    return `\\left[\\begin{array}{${cols}}${this.rows.map((r) => r.map((x) => x.toLatex()).join(' & ')).join(' \\\\ ')}\\end{array}\\right]`;
  }
}

// Operacoes elementares na notacao da UC
//  {t:'troca', i, j}           troca das linhas i e j (seta curva)
//  {t:'escala', i, k}          linha i  <-  k * linha i          (x k a direita da linha)
//  {t:'divide', i, k}          linha i  <-  linha i : k          (: k a direita da linha)
//  {t:'jacobi', p, r, m}       linha r  <-  linha r + m * linha p   (p tem o elemento redutor; m escreve-se a esquerda da linha r)
export function applyOp(M, op) {
  const R = M.rows.map((r) => r.slice());
  const chk = (i) => { if (!Number.isInteger(i) || i < 0 || i >= M.m) throw new RangeError('linha invalida'); };
  switch (op.t) {
    case 'troca': chk(op.i); chk(op.j); [R[op.i], R[op.j]] = [R[op.j], R[op.i]]; break;
    case 'escala': { chk(op.i); const k = Frac.of(op.k); if (k.isZero()) throw new RangeError('fator nulo'); R[op.i] = R[op.i].map((x) => x.mul(k)); break; }
    case 'divide': { chk(op.i); const k = Frac.of(op.k); if (k.isZero()) throw new RangeError('divisao por zero'); R[op.i] = R[op.i].map((x) => x.div(k)); break; }
    case 'jacobi': { chk(op.p); chk(op.r); if (op.p === op.r) throw new RangeError('linha igual'); const m = Frac.of(op.m); R[op.r] = R[op.r].map((x, j) => x.add(m.mul(M.rows[op.p][j]))); break; }
    default: throw new RangeError('operacao desconhecida: ' + op.t);
  }
  return new Matrix(R);
}

// Condensacao (Gauss) ou Gauss-Jordan com registo dos passos, na notacao da UC.
// limitCols: so usa as primeiras colunas para escolher redutores (matriz ampliada).
export function reduce(M, { jordan = false, limitCols = M.n, unit = false } = {}) {
  let A = M.clone(); const steps = []; const pivots = [];
  let row = 0;
  const push = (op) => { A = applyOp(A, op); steps.push({ op, matriz: A }); };
  for (let c = 0; c < limitCols && row < A.m; c++) {
    const cand = []; for (let r = row; r < A.m; r++) if (!A.get(r, c).isZero()) cand.push(r);
    if (!cand.length) continue;
    // escolhe o redutor: prefere +-1, depois o menor valor absoluto, depois a linha mais acima
    cand.sort((a, b) => {
      const x = A.get(a, c).abs(), y = A.get(b, c).abs();
      const ux = x.eq(1) ? 0 : 1, uy = y.eq(1) ? 0 : 1;
      return ux - uy || x.cmp(y) || a - b;
    });
    const pr = cand[0];
    if (pr !== row) push({ t: 'troca', i: row, j: pr });
    const p = A.get(row, c);
    const targets = []; for (let r = jordan ? 0 : row + 1; r < A.m; r++) if (r !== row && !A.get(r, c).isZero()) targets.push(r);
    for (const r of targets) {
      const a = A.get(r, c);
      // multiplicador inteiro quando possivel; senao escala primeiro a linha que muda
      const q = a.div(p);
      if (q.isInt()) push({ t: 'jacobi', p: row, r, m: q.neg() });
      else {
        // a/p = u/v em termos mais simples: escala r por v, depois Jacobi com -u
        const v = q.d, u = q.n;
        push({ t: 'escala', i: r, k: v });
        push({ t: 'jacobi', p: row, r, m: new Frac(-u) });
      }
    }
    pivots.push([row, c]);
    row++;
  }
  // linhas nulas para o fim (por exemplo [0 0 0 | k] abaixo de uma linha toda nula)
  for (let i = row; i < A.m; i++) {
    if (A.rows[i].every((x) => x.isZero())) {
      const j = A.rows.findIndex((r, idx) => idx > i && r.some((x) => !x.isZero()));
      if (j > 0) push({ t: 'troca', i, j });
    }
  }
  if (unit) { // divide cada linha pelo seu redutor (forma reduzida)
    for (const [r, c] of pivots) { const p = A.get(r, c); if (!p.eq(1)) push({ t: 'divide', i: r, k: p }); }
  }
  return { result: A, steps, pivots, rank: pivots.length };
}

export function rank(M) { return reduce(M).rank; }

export function det(M) {
  if (M.m !== M.n) throw new RangeError('matriz nao quadrada');
  let A = M.clone(), d = F(1);
  for (let c = 0; c < A.n; c++) {
    let pr = -1; for (let r = c; r < A.m; r++) if (!A.get(r, c).isZero()) { pr = r; break; }
    if (pr < 0) return F(0);
    if (pr !== c) { A = applyOp(A, { t: 'troca', i: c, j: pr }); d = d.neg(); }
    d = d.mul(A.get(c, c));
    for (let r = c + 1; r < A.m; r++) if (!A.get(r, c).isZero()) A = applyOp(A, { t: 'jacobi', p: c, r, m: A.get(r, c).div(A.get(c, c)).neg() });
  }
  return d;
}

export function inverse(M) {
  if (M.m !== M.n) throw new RangeError('matriz nao quadrada');
  if (det(M).isZero()) return null;
  const aug = M.hcat(Matrix.identity(M.n));
  const { result, steps } = reduce(aug, { jordan: true, unit: true, limitCols: M.n });
  return { inv: result.cols(M.n, 2 * M.n), steps, aug };
}

// Sistema A x = b: classificacao SPD / SPI / SI, solucao e grau de indeterminacao
export function solveSystem(A, b) {
  const aug = A.hcat(b);
  const { result, steps, pivots } = reduce(aug, { jordan: true, unit: true, limitCols: A.n });
  const rA = pivots.length;
  // R(A|b)
  const rAug = reduce(aug).rank;
  const n = A.n;
  if (rA < rAug) return { tipo: 'SI', rA, rAug, n, gi: null, solucao: null, steps, final: result };
  if (rA === n) return { tipo: 'SPD', rA, rAug, n, gi: 0, solucao: Array.from({ length: n }, (_, i) => result.get(i, n)), steps, final: result };
  return { tipo: 'SPI', rA, rAug, n, gi: n - rA, solucao: null, steps, final: result };
}
