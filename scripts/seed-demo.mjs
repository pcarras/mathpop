// Povoa o servidor de desenvolvimento com alunos ficticios para ver o painel do professor: node scripts/seed-demo.mjs [http://localhost:8092]
import { gerar, TIPOS } from '../web/js/engine/generators.js';
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
const resp = (ex) => { const r = ex.resposta; if (r.kind === 'escalar') return String(r.valor); if (r.kind === 'matriz') return r.valor.rows ? r.valor.rows.map((l) => l.map(String)) : JSON.parse(JSON.stringify(r.valor)); return { tipo: r.valor.tipo, solucao: (r.valor.solucao || []).map(String) }; };
const nomes = ['Ana Beatriz Silva', 'Rui Costa', 'Marta Neves', 'Tiago Pereira', 'Inês Matos', 'João Rocha', 'Sofia Lima', 'Pedro Alves', 'Carla Dias', 'Diogo Ramos', 'Beatriz Faria', 'Miguel Sousa', 'Leonor Pinto', 'André Gomes', 'Catarina Reis', 'Bruno Cardoso', 'Daniela Mota', 'Hugo Teixeira', 'Rita Vaz', 'Nuno Batista'];
const alcs = ['', 'Pivô Veloz', 'MatrizX', '', 'DetMaster', 'Gauss', '', 'Inversa', 'Cramer', '', 'Zero', 'LinhaL1', '', 'Espaço', 'Rank3', '', 'Pivot', 'Sistema', '', 'Algarvio'];
const plats = ['ios', 'ios', 'android', 'android', 'android', 'windows', 'mac', 'ios'];
let i = 0;
for (const nome of nomes) {
  const id = crypto.randomUUID(), sal = Math.floor(Math.random() * 1e9), k = i++;
  const r = await post({ a: 'registar', id, sal, nome, alc: alcs[k], regime: k % 3 === 0 ? 'noturno' : 'diurno', local: k % 4 === 0 ? 'faro' : 'portimao', avatar: { top: ['bob', 'shortFlat', 'longButNotTooLong', 'curly'][k % 4], skinColor: ['edb98a', 'ffdbb4', 'd08b5b', 'ae5d29'][k % 4], clothesColor: ['3c4f5c', '25557c', 'ff5c5c', '929598'][k % 4], fundo: k % 3 }, disp: { pl: plats[k % plats.length], inst: k % 3 !== 0 }, consentimento: true });
  const n = [0, 4, 12, 25, 40, 9, 18, 33][k % 8]; let c = 0; const ev = [];
  for (let j = 0; j < n; j++) { c++; const t = TIPOS[(j + k) % TIPOS.length], s = (sal + c * 7919) >>> 0, nivel = 1 + (j % 3); ev.push({ t, n: nivel, s, p: j % 5 === 0 ? 1 : 0, e: j % 4 === 0, r: resp(gerar(t, s, nivel)), ts: Date.now() - 2.9 * 86400000 + Math.floor((j / Math.max(1, n)) * 2.8 * 86400000) + (k % 5) * 600000 }); }
  for (let b = 0; b < ev.length; b += 40) await post({ a: 'sync', id, chave: r.chave, ev: ev.slice(b, b + 40) });
}
console.log('alunos criados:', i);
