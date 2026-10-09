// Exercicios de aplicacao das matrizes e dos sistemas de equacoes lineares a economia e gestao.
// Todos sao construidos a partir da solucao (escolhe-se a solucao, calcula-se o segundo membro), por isso
// a resposta e exata e os numeros sao "limpos". A resposta final e conferida pelo motor, nunca por IA.
import { Matrix, solveSystem, det } from './matrix.js';
import { Frac, F, gcd } from './fraction.js';

const NB = ' ';
const P10 = (k) => 10n ** BigInt(k);

// ---------- numeros (virgula decimal, milhares separados) ----------
function partes(f) {
  let d = f.d, a = 0, c = 0;
  while (d % 2n === 0n) { d /= 2n; a++; }
  while (d % 5n === 0n) { d /= 5n; c++; }
  if (d !== 1n) return null;
  const k = Math.max(a, c);
  const v = ((f.n < 0n ? -f.n : f.n) * P10(k)) / f.d;
  const s = v.toString().padStart(k + 1, '0');
  return { neg: f.n < 0n, int: k ? s.slice(0, -k) : s, dec: k ? s.slice(-k) : '' };
}
export function fmt(f, { latex = false, min = 0 } = {}) {
  const p = partes(f);
  if (!p) return latex ? f.toLatex() : f.toString();
  let dec = p.dec.replace(/0+$/, ''); while (dec.length < min) dec += '0';
  let int = p.int;
  if (int.length >= 5) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, latex ? '\\,' : NB);
  return (p.neg ? '-' : '') + int + (dec ? (latex ? '{,}' : ',') + dec : '');
}
const N = (f) => fmt(F(0).add(f), { latex: true }); // numero em LaTeX
const T = (f, min = 0) => fmt(F(0).add(f), { min }); // numero em texto
const E = (f) => { f = F(0).add(f); return T(f, f.isInt() ? 0 : 2) + NB + '€'; };
const casas = (f) => { const p = partes(f); return p ? p.dec.replace(/0+$/, '').length : 99; };
const M$ = (x) => `$${N(x)}$`;
const col = (xs) => Matrix.from(xs.map((x) => [Frac.of(x)]));
const paren = (s) => (s.startsWith('-') ? `(${s})` : s);

// ---------- LaTeX ----------
function sisLatex(A, vars, b) {
  const linhas = A.rows.map((r, i) => {
    let first = true;
    const cels = r.map((c, j) => {
      if (c.isZero()) return '';
      const sg = c.sign() < 0 ? '-' : first ? '' : '+'; first = false;
      const a = c.abs(); return `${sg}${a.eq(1) ? '' : N(a)}${vars[j]}`;
    });
    return cels.join(' & ') + ` & = & ${N(b.get(i, 0))}`;
  });
  return `\\left\\{\\begin{array}{${'r'.repeat(A.n)}cr}${linhas.join(' \\\\ ')}\\end{array}\\right.`;
}
const matL = (Mx, aug = -1) => `\\left[\\begin{array}{${aug > 0 ? 'c'.repeat(aug) + '|' + 'c'.repeat(Mx.n - aug) : 'c'.repeat(Mx.n)}}${Mx.rows.map((r) => r.map(N).join(' & ')).join(' \\\\ ')}\\end{array}\\right]`;
const txt = (s) => `\\text{${s}}`;
// tabela: cab = cabecalho (texto), linhas = [rotulo, ...numeros em LaTeX]; ultima coluna separada por barra
function tab(cab, linhas, separaUltima = true) {
  const n = cab.length, cols = 'l|' + 'c'.repeat(n - 2) + (separaUltima ? '|c' : 'c');
  return `$\\begin{array}{${cols}}${cab.map((c) => (c ? txt(c) : '')).join(' & ')} \\\\ \\hline ${linhas.map((l) => l.map((c, j) => (j === 0 ? txt(c) : c)).join(' & ')).join(' \\\\ ')}\\end{array}$`;
}
const lin = (c, k, v) => { // c + k v
  let s = '';
  if (!c.isZero()) s = N(c);
  if (!k.isZero()) { const a = k.abs(), t = (a.eq(1) ? '' : N(a)) + v; s += s ? (k.sign() < 0 ? ' - ' : ' + ') + t : (k.sign() < 0 ? '-' : '') + t; }
  return s || '0';
};
const verif = (row, sol, rhs) => `${row.map((c, i) => `${paren(N(c))}\\times${paren(N(sol[i]))}`).join('+')}=${N(rhs)}`;
const opL = (op) => {
  const kf = op.k !== undefined && op.k !== null ? Frac.of(op.k) : null;
  const k = kf ? (kf.sign() < 0 ? `(${kf.toLatex()})` : kf.toLatex()) : '';
  switch (op.t) {
    case 'troca': return `L_${op.i + 1}\\leftrightarrow L_${op.j + 1}`;
    case 'escala': return `${k}L_${op.i + 1}\\to L_${op.i + 1}`;
    case 'divide': return `L_${op.i + 1}\\div ${k}`;
    default: { const m = Frac.of(op.m), mt = m.eq(1) ? '' : m.eq(-1) ? '-' : m.toLatex(); return `${mt}L_${op.p + 1}+L_${op.r + 1}\\to L_${op.r + 1}`; }
  }
};

// multiplica cada linha por um fator para ficar com inteiros sem divisor comum
function limpa(A, b) {
  const rows = [], bs = [], esc = [];
  A.rows.forEach((r, i) => {
    const bi = b.get(i, 0); let m = 1n;
    [...r, bi].forEach((x) => { m = (m / gcd(m, x.d)) * x.d; });
    const ints = [...r, bi].map((x) => x.mul(m)); let g = 0n; ints.forEach((x) => { g = gcd(g, x.n); }); if (g === 0n) g = 1n;
    const k = new Frac(m, g);
    esc.push(k); rows.push(r.map((x) => x.mul(k))); bs.push([bi.mul(k)]);
  });
  return { A: Matrix.from(rows), b: Matrix.from(bs), esc };
}

// ---------- construcao do exercicio ----------
function monta(o) {
  const { nivel, enunciado, vars, defs, A, b, sol, rotulos, unidades, resp, fim, passo1, t2, spi, lim = 5 } = o;
  const n = A.n, L = limpa(A, b), s = solveSystem(L.A, L.b);
  if (s.steps.length > 14 || s.steps.some((p) => p.matriz.maxSize() > lim)) return null;
  let geral = null;
  if (spi) {
    if (s.tipo !== 'SPI' || s.rA !== n - 1) return null;
    const r = n - 1;
    for (let i = 0; i < r; i++) for (let j = 0; j < r; j++) if (!s.final.get(i, j).eq(i === j ? 1 : 0)) return null;
    geral = Array.from({ length: r }, (_, i) => ({ c: s.final.get(i, n), k: s.final.get(i, r).neg() })); // x_i = c + k * x_livre
    const t = sol[n - 1];
    for (let i = 0; i < r; i++) if (!geral[i].c.add(geral[i].k.mul(t)).eq(sol[i])) throw new Error('gestao: solucao geral incoerente');
  } else if (s.tipo !== 'SPD' || !s.solucao.every((v, i) => v.eq(sol[i]))) throw new Error('gestao: solucao incoerente');
  const escTxt = L.esc.map((k, i) => (k.eq(1) ? '' : k.d === 1n ? `multiplica-se $L_${i + 1}$ por $${k.toLatex()}$` : k.n === 1n ? `divide-se $L_${i + 1}$ por $${k.d}$` : `multiplica-se $L_${i + 1}$ por $${k.toLatex()}$`)).filter(Boolean);
  const ops = s.steps.map((p) => `$${opL(p.op)}$`).join(';  ');
  const gl = geral ? `\\;\\Rightarrow\\;\\left\\{\\begin{array}{l}${geral.map((g, i) => `${vars[i]}=${lin(g.c, g.k, vars[n - 1])}`).join(' \\\\ ')}\\end{array}\\right.` : '';
  const res = [
    passo1 || { texto: `Definir as incógnitas: ${defs.join('; ')}.` },
    { texto: t2 || 'Traduzir o enunciado para um sistema de equações lineares.', latex: sisLatex(A, vars, b) },
    { texto: 'Escrever a matriz ampliada do sistema' + (escTxt.length ? ` (para trabalhar só com inteiros, ${escTxt.join('; ')})` : '') + '.', latex: matL(L.A.hcat(L.b), n) },
    { texto: `Condensar pelo método de Gauss-Jordan (${s.steps.length} operações): ${ops}.` + (geral ? ` A variável $${vars[n - 1]}$ fica livre.` : ''), latex: matL(s.final, n) + gl },
    { texto: typeof fim === 'function' ? fim(geral) : fim },
  ];
  return { tipo: 'gestao', nivel, enunciado, dados: { A, b }, resposta: { kind: 'vetor', valor: resp, rotulos, unidades }, resolucao: res };
}

// ---------- familias ----------
const BENS = [{ nome: 'garrafas de vinho do Algarve', un: 'garrafas' }, { nome: 'noites de alojamento numa unidade hoteleira', un: 'noites' }, { nome: 'bilhetes para um espetáculo', un: 'bilhetes' }, { nome: 'laranjas de Silves', un: 'kg' }, { nome: 'passeios de barco na Ria Formosa', un: 'passeios' }];

// nivel 1: equilibrio de mercado
function mercado(rng, nivel) {
  const b = rng.int(2, 9), d = rng.int(2, 9), p = rng.int(3, 15), q = rng.int(10, 90);
  const a = q + b * p, c = d * p - q;
  if (c < 1 || c > 150 || a > 300) return null;
  const bem = rng.pick(BENS);
  return monta({
    nivel, vars: ['p', 'q'], A: Matrix.from([[b, 1], [-d, 1]]), b: col([a, -c]), sol: [F(p), F(q)], resp: [F(p), F(q)],
    enunciado: `Num mercado de ${bem.nome}, a procura é dada por $q=${a}-${b}p$ e a oferta por $q=-${c}+${d}p$, em que $p$ é o preço unitário (em €) e $q$ a quantidade (em ${bem.un}).\nDetermine o preço e a quantidade de equilíbrio.`,
    defs: ['$p$ o preço de equilíbrio (em €)', `$q$ a quantidade de equilíbrio (em ${bem.un})`],
    t2: 'No equilíbrio a procura é igual à oferta, logo o par $(p,q)$ verifica as duas equações.',
    rotulos: ['Preço de equilíbrio $p$', 'Quantidade de equilíbrio $q$'], unidades: ['€', bem.un],
    fim: `Equilíbrio: preço $p=${p}$ € e quantidade $q=${q}$ ${bem.un}. Verificação: procura $${a}-${b}\\times${p}=${q}$ e oferta $-${c}+${d}\\times${p}=${q}$.`,
  });
}

// nivel 2: equilibrio com imposto por unidade
function mercadoImposto(rng, nivel) {
  const b = rng.int(2, 8), d = rng.int(2, 8), a = rng.int(60, 200), c = rng.int(5, 40), t = rng.int(1, 4);
  const den = b + d; if (![4, 5, 8, 10].includes(den)) return null;
  const p = F(a + c + d * t, den), q = F(a).sub(p.mul(b));
  if (casas(p) > 2 || casas(q) > 2 || p.cmp(t) <= 0 || q.sign() <= 0 || q.cmp(2) < 0) return null;
  const bem = rng.pick(BENS), rf = q.mul(t);
  return monta({
    nivel, vars: ['p', 'q'], A: Matrix.from([[b, 1], [-d, 1]]), b: col([a, -c - d * t]), sol: [p, q], resp: [p, q, rf],
    enunciado: `Num mercado de ${bem.nome}, a procura é $q=${a}-${b}p$ e a oferta, antes de impostos, é $q=-${c}+${d}p$ ($p$ em €, $q$ em ${bem.un}). O Estado lança um imposto de ${t} € por unidade, suportado pelos produtores, e a oferta passa a ser $q=-${c}+${d}(p-${t})$.\nDetermine o preço e a quantidade de equilíbrio depois do imposto e a receita fiscal do Estado.`,
    defs: ['$p$ o preço de equilíbrio com imposto (em €)', `$q$ a quantidade de equilíbrio (em ${bem.un})`],
    t2: `Procura e oferta (já com o imposto) têm de coincidir. A oferta $q=-${c}+${d}(p-${t})$ escreve-se $q-${d}p=${-c - d * t}$.`,
    rotulos: ['Preço de equilíbrio $p$', 'Quantidade de equilíbrio $q$', 'Receita fiscal'], unidades: ['€', bem.un, '€'],
    fim: `Com imposto: $p=${N(p)}$ € e $q=${N(q)}$ ${bem.un}. A receita fiscal é o imposto por unidade vezes a quantidade: $${t}\\times${N(q)}=${N(rf)}$ €.`,
  });
}

// niveis 1 e 2: vendas e precos
const ART = [
  { loc: 'Uma pastelaria de Faro', dias: ['Sábado', 'Domingo', 'Segunda'], it: [['bolos', 1, 4], ['cafés', 1, 2], ['sumos', 1, 4]] },
  { loc: 'A bilheteira de um museu em Lagos', dias: ['Dia 1', 'Dia 2', 'Dia 3'], it: [['bilhetes de adulto', 5, 12], ['bilhetes de criança', 2, 6], ['bilhetes de estudante', 3, 8]] },
  { loc: 'Um bar de praia em Vilamoura', dias: ['Sexta', 'Sábado', 'Domingo'], it: [['gelados', 2, 4], ['sumos', 2, 4], ['cervejas', 1, 3]] },
  { loc: 'Uma loja de recordações em Tavira', dias: ['Semana 1', 'Semana 2', 'Semana 3'], it: [['postais', 1, 3], ['ímanes', 2, 6], ['t-shirts', 8, 20]] },
];
function vendas(rng, nivel, n) {
  const ctx = rng.pick(ART), its = ctx.it.slice(0, n), dias = ctx.dias.slice(0, n);
  const pr = its.map(([, lo, hi]) => F(rng.int(2 * lo, 2 * hi), 2));
  const C = Matrix.from(Array.from({ length: n }, () => Array.from({ length: n }, () => F(rng.int(n === 2 ? 5 : 3, n === 2 ? 30 : 25)))));
  if (det(C).isZero()) return null;
  const R = C.rows.map((r) => r.reduce((s, c, j) => s.add(c.mul(pr[j])), F(0)));
  const vars = ['x', 'y', 'z'].slice(0, n);
  return monta({
    nivel, vars, A: C, b: col(R), sol: pr, resp: pr,
    enunciado: `${ctx.loc} registou as vendas e as receitas (em euros) seguintes:\n${tab(['', ...its.map((i) => i[0]), 'Receita'], C.rows.map((r, i) => [dias[i], ...r.map(N), N(R[i])]))}\nDetermine o preço unitário de cada artigo, supondo que não variou.`,
    defs: its.map((it, j) => `$${vars[j]}$ o preço dos ${it[0].replace(/^bilhetes/, 'bilhetes')} (em €)`),
    rotulos: its.map((it) => `Preço dos ${it[0]}`), unidades: its.map(() => '€'),
    fim: `Preços: ${its.map((it, j) => `${it[0]} a ${E(pr[j])}`).join('; ')}. Verificação na 1.ª equação: $${verif(C.rows[0], pr, R[0])}$.`,
    lim: 7,
  });
}

// niveis 1 e 2: misturas (racoes)
const ALIM = ['milho', 'soja', 'luzerna', 'cevada', 'farelo de trigo', 'aveia'], NUTR = ['proteínas', 'hidratos de carbono', 'vitaminas', 'minerais', 'fibras'];
function racao(rng, nivel, n) {
  const al = rng.shuffle(ALIM).slice(0, n), nu = rng.shuffle(NUTR).slice(0, n);
  const C = Matrix.from(Array.from({ length: n }, () => Array.from({ length: n }, () => F(rng.int(n === 2 ? 1 : 0, 6)))));
  if (det(C).isZero()) return null;
  const x = al.map(() => F(rng.int(2, n === 2 ? 15 : 12)));
  const R = C.rows.map((r) => r.reduce((s, c, j) => s.add(c.mul(x[j])), F(0)));
  const vars = ['x', 'y', 'z'].slice(0, n), cap = (s) => s[0].toUpperCase() + s.slice(1);
  return monta({
    nivel, vars, A: C, b: col(R), sol: x, resp: x,
    enunciado: `Uma exploração agrícola prepara uma ração misturando ${al.join(', ').replace(/, ([^,]*)$/, ' e $1')}. A tabela indica as unidades de cada nutriente por kg de alimento e as unidades que a mistura deve fornecer.\n${tab(['', ...al.map(cap), 'Necessário'], C.rows.map((r, i) => [cap(nu[i]), ...r.map(N), N(R[i])]))}\nQuantos kg de cada alimento se devem misturar?`,
    defs: al.map((a, j) => `$${vars[j]}$ os kg de ${a}`),
    rotulos: al.map((a) => `Kg de ${a}`), unidades: al.map(() => 'kg'),
    fim: `Devem misturar-se ${al.map((a, j) => `${T(x[j])} kg de ${a}`).join(', ').replace(/, ([^,]*)$/, ' e $1')}. Verificação na 1.ª equação: $${verif(C.rows[0], x, R[0])}$.`,
  });
}

// nivel 2: ocupacao de um hotel
function hotel(rng, nivel) {
  const rel = rng.int(0, 1), k = rng.int(2, 3), x = rng.int(4, 14), z = rng.int(3, 12);
  const y = rel === 0 ? k * x : x + z;
  const pi = rng.int(8, 16) * 5, pd = rng.int(14, 26) * 5, ps = rng.int(14, 30) * 10;
  const Nq = x + y + z, R = pi * x + pd * y + ps * z;
  const row3 = rel === 0 ? [k, -1, 0] : [1, -1, 1];
  const A = Matrix.from([[1, 1, 1], [pi, pd, ps], row3]);
  if (det(A).isZero() || Nq > 80) return null;
  const nome = rng.pick(['Hotel Praia Dourada', 'Hotel Ria Formosa', 'Hotel Sagres Mar', 'Hotel Vila Real']);
  const frase = rel === 0 ? `o número de quartos duplos ocupados foi ${k === 2 ? 'o dobro' : 'o triplo'} do número de quartos individuais` : 'o número de quartos duplos ocupados foi igual à soma dos quartos individuais com as suites';
  return monta({
    nivel, vars: ['x', 'y', 'z'], A, b: col([Nq, R, 0]), sol: [x, y, z].map((v) => F(v)), resp: [x, y, z].map((v) => F(v)),
    enunciado: `Numa noite, o ${nome} teve ${Nq} quartos ocupados (individuais, duplos e suites) e uma receita de ${E(F(R))}. O preço por noite é de ${E(F(pi))} num quarto individual, ${E(F(pd))} num duplo e ${E(F(ps))} numa suite. Sabe-se que ${frase}.\nQuantos quartos de cada tipo estiveram ocupados?`,
    defs: ['$x$ o número de quartos individuais', '$y$ o número de quartos duplos', '$z$ o número de suites'],
    rotulos: ['Quartos individuais', 'Quartos duplos', 'Suites'], unidades: ['quartos', 'quartos', 'quartos'],
    fim: `Estiveram ocupados ${x} quartos individuais, ${y} duplos e ${z} suites. Verificação da receita: $${pi}\\times${x}+${pd}\\times${y}+${ps}\\times${z}=${R}$ €.`,
    lim: 6,
  });
}

// nivel 2: plano de producao (recursos esgotados)
function producao(rng, nivel) {
  const maq = rng.int(0, 1) === 0;
  const prods = ['A', 'B', 'C'], rec = maq ? ['Máquina I', 'Máquina II', 'Máquina III'] : ['Montagem', 'Acabamento', 'Embalagem'];
  const C = Matrix.from(Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => F(rng.int(1, 5)))));
  if (det(C).isZero()) return null;
  const x = prods.map(() => F(rng.int(2, 12) * 10));
  const R = C.rows.map((r) => r.reduce((s, c, j) => s.add(c.mul(x[j])), F(0)));
  const vars = ['x', 'y', 'z'];
  return monta({
    nivel, vars, A: C, b: col(R), sol: x, resp: x,
    enunciado: `Uma fábrica produz três artigos A, B e C. A tabela indica as horas ${maq ? 'de cada máquina' : 'de cada secção'} necessárias para produzir uma unidade de cada artigo e o total de horas disponíveis.\n${tab(['', ...prods, 'Total'], C.rows.map((r, i) => [rec[i], ...r.map(N), N(R[i])]))}\nQuantas unidades de cada artigo se devem produzir para utilizar todo o tempo disponível?`,
    defs: prods.map((p, j) => `$${vars[j]}$ as unidades produzidas do artigo ${p}`),
    rotulos: prods.map((p) => `Artigo ${p}`), unidades: prods.map(() => 'unidades'),
    fim: `Devem produzir-se ${T(x[0])} unidades de A, ${T(x[1])} de B e ${T(x[2])} de C. Verificação na 1.ª linha: $${verif(C.rows[0], x, R[0])}$ horas.`,
  });
}

// niveis 2 e 3: investimento em tres fundos
const FUNDOS = ['A', 'B', 'C'];
function investimento(rng, nivel, spi) {
  let r, rel, x, y, z, ex = null;
  if (spi) {
    const r0 = rng.int(2, 5), dl = rng.int(1, 2); r = [r0, r0 + dl, r0 + 2 * dl];
    z = rng.int(2, 9) * 5000; x = rng.int(1, 8) * 5000; y = rng.int(2, 10) * 5000;
  } else {
    r = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    rel = rng.int(0, 2); const m = rng.int(1, 6) * 1000;
    z = rng.int(2, 15) * 1000; y = rng.int(3, 25) * 1000; x = rng.int(3, 25) * 1000;
    if (rel === 0) x = 2 * z; else if (rel === 1) x = y + z; else y = z + 5 * m;
  }
  const M = x + y + z, J = (r[0] * x + r[1] * y + r[2] * z) / 100;
  if (M > 150000 || J !== Math.floor(J)) return null;
  const taxas = r.map((t) => `${t}%`);
  const A = [[1, 1, 1], r.map((t) => F(t, 100))];
  const vars = ['x', 'y', 'z'], defs = FUNDOS.map((f, j) => `$${vars[j]}$ o montante aplicado no fundo ${f} (em €)`);
  const base = `Um investidor aplicou ${E(F(M))} em três fundos, A, B e C, com rendimentos anuais de ${taxas[0]}, ${taxas[1]} e ${taxas[2]}, respetivamente. No final do ano recebeu ${E(F(J))} de juros.`;
  if (spi) {
    const c1 = x - z, c2 = y + 2 * z; // x = z + c1, y = c2 - 2z
    const zmax = c2 / 2, zmin = Math.max(0, -c1);
    if (zmax < zmin + 2500 || (c2 % 2) !== 0) return null;
    const max = rng.next() < 0.5;
        return monta({
      nivel, vars, A: Matrix.from(A), b: col([M, J]), sol: [x, y, z].map((v) => F(v)), spi: true, lim: 8,
      resp: max ? [F(zmax)] : [F(x), F(y)],
      enunciado: max
        ? `${base}\nDetermine o maior montante que pode ter sido aplicado no fundo C, sabendo que nenhum montante pode ser negativo.`
        : `${base}\nSabendo que foram aplicados ${E(F(z))} no fundo C, determine os montantes aplicados nos fundos A e B.`,
      defs, rotulos: max ? ['Maior montante no fundo C'] : ['Montante no fundo A', 'Montante no fundo B'], unidades: max ? ['€'] : ['€', '€'],
      fim: (g) => (max
        ? `Solução geral: $x=${lin(g[0].c, g[0].k, 'z')}$ e $y=${lin(g[1].c, g[1].k, 'z')}$. Como $y\\ge0$, vem $z\\le${N(F(c2, 2))}$. Com $x\\ge0$, $z\\ge${N(F(zmin))}$. O maior montante possível no fundo C é ${E(F(zmax))}.`
        : `Com $z=${N(F(z))}$: $x=${N(F(x))}$ e $y=${N(F(y))}$. Verificação: $${N(F(x))}+${N(F(y))}+${N(F(z))}=${N(F(M))}$.`),
    });
  }
  // determinado: terceira equacao
  const m5 = y - z; // so usado na relacao 3
  const row3 = rel === 0 ? [1, 0, -2] : rel === 1 ? [1, -1, -1] : [0, 1, -1];
  const b3 = rel === 2 ? m5 : 0;
  const fraseRel = rel === 0 ? 'o montante aplicado no fundo A foi o dobro do aplicado no fundo C' : rel === 1 ? 'o montante do fundo A foi igual à soma dos montantes dos fundos B e C' : `no fundo B foram aplicados mais ${E(F(m5))} do que no fundo C`;
  const Am = Matrix.from([[1, 1, 1], r.map((t) => F(t, 100)), row3]);
  if (det(Am).isZero()) return null;
  return monta({
    nivel, vars, A: Am, b: col([M, J, b3]), sol: [x, y, z].map((v) => F(v)), lim: 8,
    resp: [x, y, z].map((v) => F(v)),
    enunciado: `${base} Sabe-se que ${fraseRel}.\nQuanto foi aplicado em cada fundo?`,
    defs, rotulos: FUNDOS.map((f) => `Montante no fundo ${f}`), unidades: FUNDOS.map(() => '€'),
    fim: `Foram aplicados ${E(F(x))} no fundo A, ${E(F(y))} no B e ${E(F(z))} no C. Verificação dos juros: $${N(F(r[0], 100))}\\times${N(F(x))}+${N(F(r[1], 100))}\\times${N(F(y))}+${N(F(r[2], 100))}\\times${N(F(z))}=${N(F(J))}$ €.`,
  });
}

// nivel 3: modelo input-output de Leontief, X = AX + D
const SETORES = [['Agricultura', 'Indústria', 'Serviços'], ['Pescas', 'Turismo', 'Comércio'], ['Hotelaria', 'Restauração', 'Transportes']];
function leontief(rng, nivel) {
  const n = rng.next() < 0.6 ? 2 : 3, set = rng.pick(SETORES).slice(0, n);
  const A = Matrix.from(Array.from({ length: n }, () => Array.from({ length: n }, () => F(rng.pick([0, 1, 1, 2, 2, 3, 4]), 10))));
  if (A.rows.flat().filter((v) => !v.isZero()).length < n + 1) return null;
  for (let j = 0; j < n; j++) if (A.rows.reduce((s, r) => s.add(r[j]), F(0)).cmp(F(8, 10)) > 0) return null;
  const X = Array.from({ length: n }, () => F(rng.int(4, 30) * 10));
  const AX = A.mul(col(X)), Dm = col(X).sub(AX);
  if (Dm.rows.some((r) => r[0].cmp(10) < 0)) return null;
  const IA = Matrix.identity(n).sub(A), vars = Array.from({ length: n }, (_, i) => `x_${i + 1}`);
  return monta({
    nivel, vars, A: IA, b: Dm, sol: X, resp: X, lim: 6,
    enunciado: `Numa economia com ${n} setores (${set.map((s, i) => `${i + 1}: ${s}`).join(', ')}), a matriz dos coeficientes técnicos é $A=${matL(A)}$ e a procura final (em milhões de €) é $D=${matL(Dm)}$.\nSabendo que $X=AX+D$, determine a produção $X$ de cada setor.`,
    defs: set.map((s, i) => `$x_${i + 1}$ a produção do setor ${s}`),
    passo1: { texto: 'Como $X=AX+D$, tem-se $X-AX=D$, isto é, $(I-A)X=D$. Calcula-se $I-A$ e resolve-se o sistema com $X=(x_1,\\ldots)^T$ como incógnita.', latex: `I-A=${matL(IA)}\\qquad D=${matL(Dm)}` },
    t2: 'Escrever o sistema $(I-A)X=D$.',
    rotulos: set.map((s) => `Produção de ${s}`), unidades: set.map(() => 'M€'),
    fim: `A produção necessária é ${set.map((s, i) => `${T(X[i])} M€ em ${s}`).join(', ').replace(/, ([^,]*)$/, ' e $1')}. Verificação: $AX+D=${matL(AX.add(Dm))}=X$.`,
  });
}

// nivel 3: fluxos numa rotunda (sistema possivel indeterminado)
function rotunda(rng, nivel) {
  const x = Array.from({ length: 4 }, () => rng.int(8, 40) * 10), d = x.map((v, i) => v - x[(i + 3) % 4]);
  const e = [], s = [];
  for (let i = 0; i < 4; i++) { const ei = rng.int(8, 30) * 10, si = ei - d[i]; if (si < 20 || si > 400) return null; e.push(ei); s.push(si); }
  const c = x.map((v) => v - x[3]), min = rng.next() < 0.5;
  const xmin = Math.max(0, ...c.map((v) => -v));
  if (min && !(c.some((v) => v < 0))) return null;
  const A = Matrix.from([[1, 0, 0, -1], [-1, 1, 0, 0], [0, -1, 1, 0], [0, 0, -1, 1]]), nomes = ['A', 'B', 'C', 'D'], ant = [4, 1, 2, 3];
  const vars = ['x_1', 'x_2', 'x_3', 'x_4'];
  const tb = tab(['', ...nomes], [['Entram', ...e.map(String)], ['Saem', ...s.map(String)]], false);
  const base = `Numa rotunda de sentido único com quatro acessos, A, B, C e D, a circulação faz-se de A para B, de B para C, de C para D e de D para A. A tabela indica os veículos por hora que entram e saem em cada acesso.\n${tb}\nSeja $x_1$ o fluxo (veículos/hora) no troço AB, $x_2$ em BC, $x_3$ em CD e $x_4$ em DA, e admita que em cada acesso o número de veículos que chega é igual ao número que sai.`;
  return monta({
    nivel, vars, A, b: col(d), sol: x.map((v) => F(v)), spi: true, lim: 6,
    resp: min ? [F(xmin)] : [F(x[0]), F(x[1]), F(x[2])],
    enunciado: min ? `${base}\nDetermine o menor valor possível de $x_4$, sabendo que nenhum fluxo pode ser negativo.` : `${base}\nSabendo que $x_4=${x[3]}$, determine $x_1$, $x_2$ e $x_3$.`,
    defs: ['$x_1,x_2,x_3,x_4$ os fluxos nos troços AB, BC, CD e DA'],
    passo1: { texto: `Em cada acesso, os veículos que chegam (do troço anterior e de fora) são tantos como os que saem (para o troço seguinte e para fora):\n${nomes.map((nm, i) => `${nm}: $x_${ant[i]}+${e[i]}=x_${i + 1}+${s[i]}$`).join(';  ')}.` },
    t2: 'Passar as incógnitas para o 1.º membro e escrever o sistema.',
    rotulos: min ? ['Menor valor de $x_4$'] : ['Fluxo $x_1$', 'Fluxo $x_2$', 'Fluxo $x_3$'], unidades: min ? ['veíc./h'] : ['veíc./h', 'veíc./h', 'veíc./h'],
    fim: (g) => (min
      ? `Solução geral: ${g.map((q, i) => `$x_${i + 1}=${lin(q.c, q.k, 'x_4')}$`).join(', ')}. Todos têm de ser $\\ge0$: ${g.filter((q) => q.c.sign() < 0).map((q, i) => `$x_4\\ge${N(q.c.neg())}$`).join(', ')}. O menor valor possível de $x_4$ é ${xmin} veículos por hora.`
      : `Com $x_4=${x[3]}$: ${g.map((q, i) => `$x_${i + 1}=${N(F(x[i]))}$`).join(', ')}. Verificação no acesso A: $x_4+${e[0]}=${x[3] + e[0]}=x_1+${s[0]}$.`),
  });
}

const FAM = {
  1: [mercado, (r, n) => vendas(r, n, 2), (r, n) => racao(r, n, 2)],
  2: [mercadoImposto, (r, n) => vendas(r, n, 3), (r, n) => racao(r, n, 3), hotel, producao, (r, n) => investimento(r, n, false)],
  3: [(r, n) => investimento(r, n, true), leontief, rotunda],
};

export function gestao(rng, nivel) {
  const lista = FAM[nivel] || FAM[1];
  for (let i = 0; i < 400; i++) { const r = rng.pick(lista)(rng, nivel); if (r) return r; }
  throw new Error('gerador sem solucao dentro dos limites');
}
