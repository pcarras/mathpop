// Fracoes exatas com BigInt. Nunca usa float nas respostas.
const abs = (a) => (a < 0n ? -a : a);
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };

export class Frac {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new RangeError('denominador nulo');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  static of(x) { return x instanceof Frac ? x : new Frac(x); }
  // aceita "3", "-3/4", "0,5", "-1.25", " 7 / 2 "
  static parse(str) {
    const s = String(str).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');
    let m = s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (m) { if (BigInt(m[2]) === 0n) return null; return new Frac(BigInt(m[1]), BigInt(m[2])); }
    m = s.match(/^([+-]?)(\d*)\.(\d+)$/);
    if (m) return new Frac(BigInt((m[1] === '-' ? '-' : '') + (m[2] || '0') + m[3]), 10n ** BigInt(m[3].length));
    m = s.match(/^[+-]?\d+$/);
    return m ? new Frac(BigInt(s)) : null;
  }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); if (o.n === 0n) throw new RangeError('divisao por zero'); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  inv() { return new Frac(this.d, this.n); }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  cmp(o) { o = Frac.of(o); const x = this.n * o.d - o.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }
  isZero() { return this.n === 0n; }
  isInt() { return this.d === 1n; }
  sign() { return this.n < 0n ? -1 : this.n > 0n ? 1 : 0; }
  abs() { return new Frac(abs(this.n), this.d); }
  // texto simples: "-3/4"
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
  // numero de algarismos maximo (para limitar a dificuldade)
  size() { return Math.max(String(abs(this.n)).length, String(this.d).length); }
  // LaTeX com virgula decimal nao aplicavel: fracao com \frac
  toLatex() { return this.d === 1n ? String(this.n) : `${this.n < 0n ? '-' : ''}\\frac{${abs(this.n)}}{${this.d}}`; }
}
export const F = (n, d = 1n) => new Frac(n, d);
export { gcd, abs };
