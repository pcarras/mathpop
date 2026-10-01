// Verificador de resolucoes por passos, na notacao da UC.
// Cada passo: { op, matriz } onde op e uma operacao elementar (ver matrix.js) e matriz e o que o aluno escreveu.
// Cada passo e verificado a partir da matriz ANTERIOR DO ALUNO, por isso um erro de calculo nao invalida os passos seguintes.
import { Matrix, applyOp } from './matrix.js';
import { Frac } from './fraction.js';

export function isEchelon(M) {
  let last = -1;
  for (let i = 0; i < M.m; i++) {
    let lead = M.rows[i].findIndex((x) => !x.isZero());
    if (lead < 0) { for (let r = i + 1; r < M.m; r++) if (M.rows[r].some((x) => !x.isZero())) return false; return true; }
    if (lead <= last) return false;
    last = lead;
  }
  return true;
}
export function isReduced(M, limitCols = M.n) {
  if (!isEchelon(M)) return false;
  for (let i = 0; i < M.m; i++) {
    const lead = M.rows[i].findIndex((x, j) => j < limitCols && !x.isZero());
    if (lead < 0) continue;
    if (!M.get(i, lead).eq(1)) return false;
    for (let r = 0; r < M.m; r++) if (r !== i && !M.get(r, lead).isZero()) return false;
  }
  return true;
}

// Erros tipicos reconhecidos por regras (devolve o nome ou null)
function tipico(prev, op, got) {
  try {
    if (op.t === 'jacobi') {
      if (applyOp(prev, { ...op, m: Frac.of(op.m).neg() }).eq(got)) return 'sinal do multiplicador de Jacobi';
      if (applyOp(prev, { t: 'jacobi', p: op.r, r: op.p, m: op.m }).eq(got)) return 'linha do elemento redutor e linha que muda trocadas';
      // multiplicou a linha errada e nao somou a coluna toda
      const partial = prev.rows.map((r) => r.slice());
      const m = Frac.of(op.m);
      const full = applyOp(prev, op);
      let diffCols = 0; for (let j = 0; j < prev.n; j++) if (!full.get(op.r, j).eq(got.get(op.r, j))) diffCols++;
      if (diffCols > 0 && diffCols < prev.n) {
        const others = got.rows.every((row, i) => i === op.r || row.every((x, j) => x.eq(prev.get(i, j))));
        if (others) return 'multiplicador aplicado so a algumas colunas da linha';
      }
      void partial; void m;
    }
    if (op.t === 'escala' || op.t === 'divide') {
      const full = applyOp(prev, op);
      let diff = 0; for (let j = 0; j < prev.n; j++) if (!full.get(op.i, j).eq(got.get(op.i, j))) diff++;
      const others = got.rows.every((row, i) => i === op.i || row.every((x, j) => x.eq(prev.get(i, j))));
      if (others && diff > 0 && diff < prev.n) return 'fator aplicado so a alguns elementos da linha';
    }
    if (op.t === 'troca') return null;
  } catch { /* ignora */ }
  return null;
}

export function verifySteps(initial, steps, { goal = 'condensada', limitCols = initial.n } = {}) {
  let prevStudent = initial;
  const passos = []; let firstError = null, okCount = 0, invalid = 0;
  steps.forEach((s, idx) => {
    let exp = null, err = null;
    try { exp = applyOp(prevStudent, s.op); } catch (e) { err = e.message; }
    if (!exp) {
      invalid++; passos.push({ n: idx + 1, ok: false, tipo: 'metodo', comentario: 'Operação inválida: ' + err });
      if (!firstError) firstError = { n: idx + 1, tipo: 'metodo', comentario: 'Operação inválida: ' + err };
      return;
    }
    const ok = exp.eq(s.matriz);
    if (ok) okCount++;
    else {
      const t = tipico(prevStudent, s.op, s.matriz);
      const c = { n: idx + 1, ok: false, tipo: 'calculo', erroTipico: t || 'nenhum', esperada: exp };
      passos.push(c);
      if (!firstError) firstError = c;
      prevStudent = s.matriz;
      return;
    }
    passos.push({ n: idx + 1, ok: true });
    prevStudent = s.matriz;
  });
  const total = steps.length || 1;
  const last = steps.length ? steps[steps.length - 1].matriz : initial;
  const formaOk = goal === 'reduzida' ? isReduced(last, limitCols) : goal === 'condensada' ? isEchelon(last) : true;
  const calculos = okCount / total;
  const metodo = invalid === 0 && formaOk ? 1 : invalid === 0 && okCount > 0 ? 0.5 : 0;
  return { passos, primeiroErro: firstError, criterios: { metodo, calculos }, matrizFinal: last, formaOk, todosCertos: okCount === steps.length && invalid === 0 };
}

// Pontos por criterio (rubrica fixa da app): metodo 40 %, calculos 40 %, resposta 20 %
export function pontos({ metodo, calculos, resposta }, maximo) {
  const x = 0.4 * metodo + 0.4 * calculos + 0.2 * resposta;
  return Math.round(maximo * x);
}
export { Matrix };
