// Regras do jogo: pontos, niveis, limites diarios. Sao as mesmas que o servidor revalida.
export const NIVEIS = [[0, 'Aprendiz de Matriz'], [100, 'Redutor'], [300, 'Condensador'], [700, 'Determinante'], [1300, 'Inversor'], [2200, 'Mestre de Sistemas']];
export const DATA_TESTE = '2026-10-28';
export const NOMES = { produto: 'Produto', determinante: 'Determinante', inversa: 'Inversa', caracteristica: 'Característica', sistema: 'Sistemas' };
export const PASSOS_TIPOS = ['inversa', 'caracteristica', 'sistema'];

export function nivelDe(xp) {
  let i = 0; while (i + 1 < NIVEIS.length && xp >= NIVEIS[i + 1][0]) i++;
  const prox = NIVEIS[i + 1];
  return { indice: i, titulo: NIVEIS[i][1], proximo: prox ? prox[0] : null, base: NIVEIS[i][0] };
}
export const multSequencia = (dias) => Math.min(1.5, 1 + 0.05 * Math.max(0, dias - 1));
// retornos decrescentes por tipo e por dia: 8 a 100 %, depois 50 %, depois 20 %
export const fatorDiario = (nHoje) => (nHoje < 8 ? 1 : nHoje < 15 ? 0.5 : 0.2);

export function xpTreino({ nivel, pistas, nHoje, dias }) {
  let x = 10 * nivel;
  if (pistas === 0) x *= 1.5;
  x *= Math.max(0, 1 - 0.25 * pistas);
  x *= fatorDiario(nHoje) * multSequencia(dias);
  return Math.round(x);
}
export function xpDesafio({ nivel, criterios, nHoje, dias }) {
  const base = 30 * nivel * (0.4 * criterios.metodo + 0.4 * criterios.calculos + 0.2 * (criterios.resposta ?? 0));
  return Math.round(base * fatorDiario(nHoje) * multSequencia(dias));
}
export function diasAteTeste(hoje = new Date()) {
  const t = new Date(DATA_TESTE + 'T09:00:00'); return Math.ceil((t - hoje) / 86400000);
}
// o dia comeca as 04:00
export function diaChave(d = new Date()) { const x = new Date(d.getTime() - 4 * 3600 * 1000); return x.toISOString().slice(0, 10); }
