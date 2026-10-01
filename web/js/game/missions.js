import { estado, gravar, darXP, registarDia } from '../store.js';
import { diaChave, NOMES } from '../rules.js';
import { seedFrom, makeRng } from '../engine/index.js';
const TIPOS = Object.keys(NOMES);
// 3 missoes por dia, sempre as mesmas para o mesmo dia
export function missoesDeHoje() {
  registarDia();
  const rng = makeRng(seedFrom('missoes|' + diaChave()));
  const t = rng.pick(TIPOS);
  const pool = [
    { id: 'certas5', txt: 'Resolve 5 exercícios', alvo: 5, xp: 20, prog: (h) => h.certas },
    { id: 'sem3', txt: 'Acerta 3 sem usar pistas', alvo: 3, xp: 30, prog: (h) => h.semPistas },
    { id: 'sem5', txt: 'Acerta 5 sem usar pistas', alvo: 5, xp: 40, prog: (h) => h.semPistas },
    { id: 'tipo:' + t, txt: `Treina ${NOMES[t]} 3 vezes`, alvo: 3, xp: 25, prog: (h) => h.n[t] || 0 },
    { id: 'certas10', txt: 'Resolve 10 exercícios', alvo: 10, xp: 40, prog: (h) => h.certas },
  ];
  return rng.shuffle(pool).slice(0, 3);
}
export function estadoMissao(m) { const h = estado().hoje; const p = Math.min(m.alvo, m.prog(h)); return { p, feita: p >= m.alvo, reclamada: h.reclamadas.includes(m.id) }; }
export function reclamar(m) { const h = estado().hoje; if (h.reclamadas.includes(m.id) || !estadoMissao(m).feita) return 0; h.reclamadas.push(m.id); darXP(m.xp); gravar(); return m.xp; }
