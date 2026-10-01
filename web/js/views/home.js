import { estado, dominio, nivelTipo, sequencia, snapshot } from '../store.js';
import { nivelDe, NOMES, diasAteTeste } from '../rules.js';
import { icon } from '../ui/icons.js';
import { avatarHTML } from '../ui/avatar.js';
import { missoesDeHoje, estadoMissao, reclamar } from '../game/missions.js';
import { festa, celebrar, contar } from '../ui/fx.js';
import { sfx } from '../ui/sfx.js';
import { deveSugerir, conteudo, ligar, aoMudar } from '../ui/instalar.js';

const ORDEM = ['produto', 'determinante', 'caracteristica', 'inversa', 'sistema'];
const GLIFO = { produto: 'A·B', determinante: '|A|', caracteristica: 'R(A)', inversa: 'A⁻¹', sistema: 'Ax=b' };
const POS = [[100, 62], [250, 146], [108, 232], [250, 318], [108, 404]];
const BOSS = [226, 520];
const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 180) * (60 * k - 30); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const estrelasDe = (d) => (d >= 0.9 ? 3 : d >= 0.7 ? 2 : d >= 0.4 ? 1 : 0);

function mapa() {
  const doms = ORDEM.map((t) => dominio(t)); const rec = doms.indexOf(Math.min(...doms));
  const caminho = `M${POS[0]} C${POS[0][0] + 100},${POS[0][1] - 10} 250,90 ${POS[1]} S 108,190 ${POS[2]} S 250,276 ${POS[3]} S 108,362 ${POS[4]} S 226,470 ${BOSS}`;
  const nos = ORDEM.map((t, i) => {
    const [x, y] = POS[i], d = doms[i], est = estrelasDe(d), circ = 2 * Math.PI * 47;
    const cor = d >= 0.4 ? ['#27D8E0', '#0E8F98'] : ['#4C6CB4', '#223C78'];
    return `<g class="no" data-tipo="${t}" tabindex="0" role="button" aria-label="${NOMES[t]}, domínio ${Math.round(d * 100)}%">
      ${i === rec ? `<circle class="pulso" cx="${x}" cy="${y}" r="50"/>` : ''}
      <circle cx="${x}" cy="${y}" r="47" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"/>
      <circle cx="${x}" cy="${y}" r="47" fill="none" stroke="#FF3B4E" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(circ * d).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${x} ${y})" style="filter:drop-shadow(0 0 4px rgba(255,59,78,.8))"/>
      <polygon points="${hex(x, y + 4, 38)}" fill="#0A1226" opacity=".55"/>
      <polygon points="${hex(x, y, 38)}" fill="url(#gNo${d >= 0.4 ? 'On' : 'Off'})" stroke="${cor[0]}" stroke-width="3" stroke-linejoin="round"/>
      <text x="${x}" y="${y + 9}" text-anchor="middle" class="glifo">${GLIFO[t]}</text>
      ${[0, 1, 2].map((k) => `<g transform="translate(${x - 30 + k * 20} ${y - 66}) scale(.82)">${icon(k < est ? 'estrela' : 'estrelaVazia').replace('<svg class="ico "', '<svg class="ico " width="24" height="24"')}</g>`).join('')}
      <text x="${x}" y="${y + 66}" text-anchor="middle" class="rot">${NOMES[t]}</text>
      ${i === rec ? `<text x="${x > 180 ? 327 : 33}" y="${y - 4}" text-anchor="middle" class="balao"><tspan x="${x > 180 ? 327 : 33}">Começa</tspan><tspan x="${x > 180 ? 327 : 33}" dy="16">aqui</tspan></text>` : ''}
    </g>`;
  }).join('');
  const dias = Math.max(0, diasAteTeste());
  return `<svg class="mapa" viewBox="0 0 360 590" role="group" aria-label="Jornada até ao teste">
    <defs><linearGradient id="gNoOn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E8FB8"/><stop offset="1" stop-color="#16407A"/></linearGradient>
    <linearGradient id="gNoOff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B5797"/><stop offset="1" stop-color="#1B2F63"/></linearGradient>
    <linearGradient id="gBoss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B7A"/><stop offset="1" stop-color="#9E1626"/></linearGradient></defs>
    <path d="${caminho}" fill="none" stroke="rgba(234,241,255,.22)" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>
    ${nos}
    <g class="no boss" data-tipo="teste" tabindex="0" role="button" aria-label="Simulado de teste">
      <circle cx="${BOSS[0]}" cy="${BOSS[1]}" r="62" fill="none" stroke="rgba(255,59,78,.35)" stroke-width="3" stroke-dasharray="3 9"><animateTransform attributeName="transform" type="rotate" from="0 ${BOSS} " to="360 ${BOSS}" dur="40s" repeatCount="indefinite"/></circle>
      <polygon points="${hex(BOSS[0], BOSS[1] + 5, 50)}" fill="#0A1226" opacity=".55"/>
      <polygon points="${hex(BOSS[0], BOSS[1], 50)}" fill="url(#gBoss)" stroke="#FFC23D" stroke-width="4" stroke-linejoin="round"/>
      <g transform="translate(${BOSS[0] - 15} ${BOSS[1] - 36}) scale(1.25)">${icon('coroa')}</g>
      <text x="${BOSS[0]}" y="${BOSS[1] + 16}" text-anchor="middle" class="glifo" style="font-size:30px">${dias}</text>
      <text x="${BOSS[0]}" y="${BOSS[1] + 34}" text-anchor="middle" class="rot" style="font-size:14px">${dias === 1 ? 'dia' : 'dias'}</text>
      <text x="${BOSS[0] - 92}" y="${BOSS[1] + 8}" text-anchor="middle" class="balao" style="font-size:24px">Teste</text>
      <text x="${BOSS[0] - 92}" y="${BOSS[1] + 30}" text-anchor="middle" class="balao" style="font-size:24px">28 out</text>
    </g></svg>`;
}

export function home(root, go, _a, atualizarTopo) {
  const s = estado(), nv = nivelDe(s.xp), nome = s.perfil.alcunha || (s.perfil.nome || '').split(' ')[0] || 'Jogador';
  const pct = nv.proximo ? Math.min(100, (100 * (s.xp - nv.base)) / (nv.proximo - nv.base)) : 100, circ = 2 * Math.PI * 38;
  const miss = missoesDeHoje();
  root.innerHTML = `
  <section class="heroi painel">
    <div class="heroi-av">${avatarHTML(s.avatar, { s: 104, anim: true })}</div>
    <div class="heroi-txt">
      <div class="giz">Olá, ${nome.replace(/</g, '&lt;')}</div>
      <h1 class="titulo-nv">${nv.titulo}</h1>
      <div class="linha" style="gap:8px;margin-top:8px"><span class="chip ouro">${icon('raio')}<span id="xpNum">${s.xp}</span> XP</span><span class="chip chama">${icon('chama')}${sequencia()} ${sequencia() === 1 ? 'dia' : 'dias'}</span></div>
    </div>
    <div class="anel" style="width:78px;height:78px" role="img" aria-label="Nível ${nv.indice + 1}">
      <svg viewBox="0 0 92 92"><circle class="fundo" cx="46" cy="46" r="38" fill="none" stroke-width="8"/><circle class="prog" cx="46" cy="46" r="38" fill="none" stroke-width="8" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" data-alvo="${circ * (1 - pct / 100)}"/></svg>
      <div class="anel-txt"><div class="num" style="font-size:32px">${nv.indice + 1}</div><div class="nota" style="font-size:11px;font-weight:800">nível</div></div>
    </div>
    <div style="grid-column:1/-1"><div class="barra-p"><i style="width:${pct}%"></i></div>
      <p class="nota" style="margin:6px 0 0">${nv.proximo ? `Faltam <b>${nv.proximo - s.xp}</b> XP para o nível seguinte.` : 'Nível máximo. És uma lenda.'}</p></div>
  </section>
  <div class="linha" style="margin:14px 0 0"><button class="btn grande" data-go="treinar">${icon('treinar')} Treinar agora</button></div>
  ${deveSugerir() ? `<section class="painel instalar" id="instalar">${conteudo()}</section>` : ''}
  <h2>Missões de hoje</h2>
  <section id="missoes">${miss.map((m) => { const e = estadoMissao(m); return `<div class="painel missao ${e.feita ? 'feita' : ''}" data-m="${m.id}">
      <div class="m-ico">${icon(e.reclamada ? 'check' : e.feita ? 'bau' : 'raio')}</div>
      <div style="flex:1;min-width:0"><b>${m.txt}</b><div class="barra-p ouro" style="margin-top:8px"><i style="width:${(100 * e.p) / m.alvo}%"></i></div><span class="nota">${e.p}/${m.alvo}</span></div>
      ${e.reclamada ? '<span class="chip">Feito</span>' : e.feita ? `<button class="btn ouro" data-rec="${m.id}" style="min-height:44px;padding:0 16px">+${m.xp} XP</button>` : `<span class="chip ouro">${icon('raio')}${m.xp}</span>`}</div>`; }).join('')}</section>
  <h2>Jornada até ao teste</h2>
  <p class="giz" style="margin:-4px 0 6px">Cada tema tem um anel vermelho: quanto mais domínio, mais fechado.</p>
  <section class="painel mapa-cx">${mapa()}</section>`;
  requestAnimationFrame(() => { const p = root.querySelector('.anel .prog'); if (p) setTimeout(() => p.setAttribute('stroke-dashoffset', p.dataset.alvo), 60); });
  const cx = root.querySelector('#instalar'); if (cx) { ligar(cx, () => home(root, go, _a, atualizarTopo)); const off = aoMudar(() => { if (cx.isConnected) { cx.innerHTML = conteudo(); ligar(cx, () => home(root, go, _a, atualizarTopo)); } else off(); }); }
  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  root.querySelectorAll('.no').forEach((n) => { const f = () => { sfx.clique(); go(n.dataset.tipo === 'teste' ? 'treinar' : 'treinar/' + n.dataset.tipo); }; n.addEventListener('click', f); n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); });
  root.querySelectorAll('[data-rec]').forEach((b) => b.addEventListener('click', async () => {
    const m = miss.find((x) => x.id === b.dataset.rec), antes = snapshot(); const xp = reclamar(m); if (!xp) return;
    sfx.bau(); festa(1.2); contar(root.querySelector('#xpNum'), antes.xp, estado().xp); atualizarTopo(); await celebrar(antes); home(root, go, _a, atualizarTopo);
  }));
  void nivelTipo;
}
