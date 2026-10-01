// Liga da turma: DEMONSTRACAO com rivais simulados. Na versao final, os dados vem do servidor (so alcunhas).
import { estado } from '../store.js';
import { nivelDe } from '../rules.js';
import { icon } from '../ui/icons.js';
import { avatarHTML, avatarAleatorio } from '../ui/avatar.js';
import { makeRng, seedFrom } from '../engine/index.js';

const A = ['Pivô', 'Vetor', 'Jacobi', 'Matriz', 'Escada', 'Gauss', 'Núcleo', 'Traço', 'Espectro', 'Base', 'Sistema', 'Linha', 'Coluna', 'Redutor', 'Cofator', 'Adjunta', 'Diagonal', 'Ordem'];
const B = ['Veloz', 'Zen', 'Turbo', 'Ninja', 'Solar', 'Noturno', 'Astuto', 'Feroz', 'Calmo', 'Lendário', 'Preciso', 'Audaz', 'Sereno', 'Rápido', 'Brilhante', 'Cósmico'];
const semanaChave = () => { const d = new Date(); const dia = (d.getDay() + 6) % 7; const seg = new Date(d.getTime() - dia * 86400000); return seg.toISOString().slice(0, 10); };

function rivais(n) {
  const R = makeRng(seedFrom('liga|' + semanaChave())); const rng = R.next; const usados = new Set(); const out = [];
  while (out.length < n) {
    const nome = `${A[Math.floor(rng() * A.length)]} ${B[Math.floor(rng() * B.length)]}`; if (usados.has(nome)) continue; usados.add(nome);
    const xp = Math.round(Math.pow(rng(), 1.5) * 720); const av = avatarAleatorio(Math.min(5, Math.floor(rng() * 4)), rng);
    out.push({ nome, xp, av });
  }
  return out;
}

export function liga(root) {
  const s = estado(); const eu = { nome: s.perfil.alcunha || 'Tu', xp: s.xp, av: s.avatar, eu: true };
  const tabela = [...rivais(29), eu].sort((a, b) => b.xp - a.xp || (a.eu ? -1 : 1));
  const pos = tabela.findIndex((t) => t.eu) + 1; const N = tabela.length;
  const top3 = tabela.slice(0, 3);
  const cor = ['var(--ouro-esc)', 'var(--giz-3)', '#A8652A']; const ordem = [1, 0, 2];
  const podio = `<div class="podio">${ordem.map((i) => { const t = top3[i]; const h = [96, 128, 76][i === 0 ? 1 : i === 1 ? 0 : 2]; return `<div class="col">${i === 0 ? `<span style="width:30px;display:block">${icon('coroa')}</span>` : ''}${avatarHTML(t.av, { s: i === 0 ? 84 : 66 })}<div class="nm" style="color:${t.eu ? 'var(--ciano)' : 'inherit'}">${t.nome}</div><div class="nota" style="font-size:12px">${t.xp} XP</div><div class="base" style="height:${h}px;--pc:${cor[i]}">${i + 1}</div></div>`; }).join('')}</div>`;
  const linha = (t, i) => `<div class="linha-liga ${t.eu ? 'eu' : ''}"><span class="pos">${i + 1}</span>${avatarHTML(t.av, { s: 42 })}<b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.nome}</b><span class="chip ouro">${icon('raio')}${t.xp}</span></div>`;
  let lista = '';
  tabela.forEach((t, i) => {
    if (i === 3) lista += '<div class="zona sobe">Sobem de liga</div>';
    if (i === 5) lista += '<div class="zona" style="color:var(--giz-3)">Ficam</div>';
    if (i === N - 5) lista += '<div class="zona desce">Descem de liga</div>';
    if (i >= 3) lista += linha(t, i);
  });
  const msg = pos <= 5 ? 'Estás na zona de subida. Mantém o ritmo.' : pos > N - 5 ? 'Estás na zona de descida. Um bom treino muda isto.' : `Faltam ${tabela[pos - 2].xp - s.xp + 1} XP para ultrapassares o colega à tua frente.`;
  root.innerHTML = `
  <div class="linha" style="margin:2px 0 4px"><h1>Liga da turma</h1><span class="espaco"></span><span class="chip">${icon('liga')}Semana</span></div>
  <p class="nota">Demonstração com colegas simulados. No ranking verdadeiro só aparecem alcunhas.</p>
  <section class="painel" style="text-align:center;padding-bottom:0;overflow:hidden">${podio}</section>
  <section class="painel" style="margin-top:12px"><div class="giz">${msg}</div><p class="nota" style="margin:4px 0 0">És o ${pos}.º de ${N}. Nível ${nivelDe(s.xp).indice + 1}.</p></section>
  <div style="margin-top:8px">${lista}</div>`;
}
