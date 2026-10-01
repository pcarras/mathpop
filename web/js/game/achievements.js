import { estado, sequencia, nivelTipo, gravar } from '../store.js';
import { nivelDe, NOMES } from '../rules.js';
const cert = (t) => (estado().stats.certasTipo[t] || 0);
// raridade: 0 comum, 1 incomum, 2 raro, 3 epico, 4 lendario, 5 mitico
export const CONQUISTAS = [
  { id: 'primeiro', nome: 'Primeiro redutor', desc: 'Resolve o teu primeiro exercício.', r: 0, alvo: 1, prog: () => estado().stats.certas, ico: 'estrela' },
  { id: 'aquece', nome: 'Aquecimento', desc: 'Resolve 10 exercícios.', r: 0, alvo: 10, prog: () => estado().stats.certas, ico: 'raio' },
  { id: 'cem', nome: 'Centurião', desc: 'Resolve 100 exercícios.', r: 3, alvo: 100, prog: () => estado().stats.certas, ico: 'coroa' },
  { id: 'semajuda', nome: 'Sem ajuda', desc: 'Resolve 10 exercícios sem usar pistas.', r: 1, alvo: 10, prog: () => estado().stats.semPistas, ico: 'estrela' },
  { id: 'chama3', nome: 'Chama acesa', desc: 'Treina 3 dias seguidos.', r: 1, alvo: 3, prog: () => sequencia(), ico: 'chama' },
  { id: 'chama7', nome: 'Semana de ferro', desc: 'Treina 7 dias seguidos.', r: 2, alvo: 7, prog: () => sequencia(), ico: 'chama' },
  { id: 'passo1', nome: 'Passo a passo', desc: 'Resolve um desafio por passos sem erros.', r: 1, alvo: 1, prog: () => estado().stats.perfeitos, ico: 'passos' },
  { id: 'jacobi', nome: 'Mestre de Jacobi', desc: 'Resolve 10 desafios por passos sem erros.', r: 3, alvo: 10, prog: () => estado().stats.perfeitos, ico: 'passos' },
  { id: 'inv5', nome: 'Inversor', desc: 'Acerta 5 inversas.', r: 1, alvo: 5, prog: () => cert('inversa'), ico: 'estrela' },
  { id: 'car5', nome: 'Condensador', desc: 'Acerta 5 características.', r: 1, alvo: 5, prog: () => cert('caracteristica'), ico: 'estrela' },
  { id: 'det5', nome: 'Determinado', desc: 'Acerta 5 determinantes.', r: 1, alvo: 5, prog: () => cert('determinante'), ico: 'estrela' },
  { id: 'sis5', nome: 'Sistemático', desc: 'Acerta 5 sistemas.', r: 1, alvo: 5, prog: () => cert('sistema'), ico: 'estrela' },
  { id: 'explora', nome: 'Explorador', desc: 'Acerta pelo menos um exercício de cada tipo.', r: 2, alvo: Object.keys(NOMES).length, prog: () => Object.keys(NOMES).filter((t) => cert(t) > 0).length, ico: 'mapa' },
  { id: 'nivel3', nome: 'Terreno difícil', desc: 'Chega ao nível 3 num tipo de exercício.', r: 2, alvo: 1, prog: () => Object.keys(NOMES).filter((t) => nivelTipo(t) >= 3).length, ico: 'raio' },
  { id: 'mestre', nome: 'Mestre de Sistemas', desc: 'Atinge o nível máximo.', r: 4, alvo: 1, prog: () => (nivelDe(estado().xp).indice >= 5 ? 1 : 0), ico: 'coroa' },
];
export function progresso(c) { const p = Math.min(c.alvo, c.prog()); return { p, alvo: c.alvo, feito: p >= c.alvo }; }
// devolve as conquistas desbloqueadas agora
export function verificarConquistas() {
  const s = estado(), novas = [];
  for (const c of CONQUISTAS) if (!s.conquistas[c.id] && progresso(c).feito) { s.conquistas[c.id] = new Date().toISOString().slice(0, 10); novas.push(c); }
  if (novas.length) gravar();
  return novas;
}
