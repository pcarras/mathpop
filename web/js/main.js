import { estado, sequencia, registarDia } from './store.js';
import { nivelDe, diasAteTeste } from './rules.js';
import { defs, icon } from './ui/icons.js';
import { avatarHTML } from './ui/avatar.js';
import { alternarSom, sfx } from './ui/sfx.js';
import { home } from './views/home.js';
import { treinar } from './views/treinar.js';
import { perfil } from './views/perfil.js';
import { registarSW } from './ui/instalar.js';
import { entrada, perfilCompleto } from './views/entrada.js';
import { ligaDisponivel, disponivelAgora, iniciarLiga } from './game/liga.js';

document.body.insertAdjacentHTML('afterbegin', defs);
const root = document.getElementById('vista');
const VISTAS = { home, treinar, perfil };  // liga: escondida ate haver ranking verdadeiro (views/liga.js)
const NAV_BASE = [['home', 'Início'], ['treinar', 'Treinar'], ['liga', 'Liga'], ['perfil', 'Perfil']];
function montarNav(comLiga) {
  document.getElementById('barra').innerHTML = NAV_BASE.filter(([k]) => k !== 'liga' || comLiga).map(([k, n]) => `<button data-go="${k}">${icon(k)}<span>${n}</span></button>`).join('');
  document.querySelectorAll('#barra [data-go]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); go(b.dataset.go); }));
}
montarNav(disponivelAgora());
export function go(rota) { const alvo = '#/' + rota; if (location.hash === alvo) render(); else location.hash = alvo; }
function marcarNav(nome) { document.querySelectorAll('#barra button').forEach((b) => { if (b.dataset.go === (VISTAS[nome] ? nome : 'home')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); }
function atualizarTopo() {
  const s = estado(), nv = nivelDe(s.xp), n = sequencia(), d = diasAteTeste();
  document.getElementById('topo-id').innerHTML = `${avatarHTML(s.avatar, { s: 44 })}<span class="topo-nome"><b>${(s.perfil.alcunha || (s.perfil.nome || '').split(' ')[0] || 'Jogador').replace(/[<>&]/g, '')}</b><small>${nv.titulo}</small></span>`;
  document.getElementById('topo-dir').innerHTML = `<span class="chip chama" title="Dias seguidos">${icon('chama')}${n}</span><span class="chip" title="Dias até ao teste">${d > 0 ? d + ' d' : 'Hoje'}</span><button class="icon-btn" id="btnSom" aria-label="${s.som !== false ? 'Desligar sons' : 'Ligar sons'}">${icon(s.som !== false ? 'som' : 'mudo')}</button>`;
  document.getElementById('btnSom').addEventListener('click', () => { alternarSom(); sfx.clique(); atualizarTopo(); });
}
function render() {
  registarDia();
  const [nome, resto] = (location.hash.replace(/^#\//, '') || 'home').split('/');
  const tipo = (resto || '').split('?')[0];
  if (!perfilCompleto(estado().perfil)) { document.querySelectorAll('.folha,.overlay').forEach((e) => e.remove()); scrollTo(0, 0); entrada(root, go, '', atualizarTopo); return; }
  const v = VISTAS[nome] || home;
  document.body.classList.remove('imersivo'); root.style.paddingBottom = '';
  document.querySelectorAll('.folha,.overlay').forEach((e) => e.remove());
  marcarNav(nome);
  scrollTo(0, 0);
  v(root, go, tipo, atualizarTopo);
  atualizarTopo(); root.focus({ preventScroll: true });
}
document.getElementById('topo-id').addEventListener('click', () => go('perfil'));
window.addEventListener('hashchange', render);
render();
registarSW();
// a liga so aparece quando o servidor esta ligado a base de dados
ligaDisponivel().then(async (ok) => {
  if (ok) { const m = await import('./views/liga.js'); VISTAS.liga = m.liga; }
  const tinha = !!document.querySelector('#barra [data-go=liga]');
  if (ok !== tinha) { montarNav(ok); marcarNav((location.hash.replace(/^#\//, '') || 'home').split('/')[0]); }
  if (ok && location.hash.startsWith('#/liga')) render();
  if (ok) iniciarLiga();
});
