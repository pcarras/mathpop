import { estado, sequencia, registarDia } from './store.js';
import { nivelDe, diasAteTeste } from './rules.js';
import { defs, icon } from './ui/icons.js';
import { avatarHTML } from './ui/avatar.js';
import { alternarSom, sfx } from './ui/sfx.js';
import { home } from './views/home.js';
import { treinar } from './views/treinar.js';
import { perfil } from './views/perfil.js';
import { registarSW } from './ui/instalar.js';

document.body.insertAdjacentHTML('afterbegin', defs);
const root = document.getElementById('vista');
const VISTAS = { home, treinar, perfil };  // liga: escondida ate haver ranking verdadeiro (views/liga.js)
const NAV = [['home', 'Início'], ['treinar', 'Treinar'], ['perfil', 'Perfil']];
document.getElementById('barra').innerHTML = NAV.map(([k, n]) => `<button data-go="${k}">${icon(k)}<span>${n}</span></button>`).join('');
export function go(rota) { const alvo = '#/' + rota; if (location.hash === alvo) render(); else location.hash = alvo; }
function atualizarTopo() {
  const s = estado(), nv = nivelDe(s.xp), n = sequencia(), d = diasAteTeste();
  document.getElementById('topo-id').innerHTML = `${avatarHTML(s.avatar, { s: 44 })}<span class="topo-nome"><b>${(s.perfil.alcunha || 'Jogador').replace(/[<>&]/g, '')}</b><small>${nv.titulo}</small></span>`;
  document.getElementById('topo-dir').innerHTML = `<span class="chip chama" title="Dias seguidos">${icon('chama')}${n}</span><span class="chip" title="Dias até ao teste">${d > 0 ? d + ' d' : 'Hoje'}</span><button class="icon-btn" id="btnSom" aria-label="${s.som !== false ? 'Desligar sons' : 'Ligar sons'}">${icon(s.som !== false ? 'som' : 'mudo')}</button>`;
  document.getElementById('btnSom').addEventListener('click', () => { alternarSom(); sfx.clique(); atualizarTopo(); });
}
function render() {
  registarDia();
  const [nome, resto] = (location.hash.replace(/^#\//, '') || 'home').split('/');
  const tipo = (resto || '').split('?')[0];
  const v = VISTAS[nome] || home;
  document.body.classList.remove('imersivo'); root.style.paddingBottom = '';
  document.querySelectorAll('.folha,.overlay').forEach((e) => e.remove());
  document.querySelectorAll('#barra button').forEach((b) => { if (b.dataset.go === (VISTAS[nome] ? nome : 'home')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  scrollTo(0, 0);
  v(root, go, tipo, atualizarTopo);
  atualizarTopo(); root.focus({ preventScroll: true });
}
document.getElementById('topo-id').addEventListener('click', () => go('perfil'));
document.querySelectorAll('#barra [data-go]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); go(b.dataset.go); }));
window.addEventListener('hashchange', render);
render();
registarSW();
