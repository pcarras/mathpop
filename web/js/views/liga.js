// Liga da turma: ranking verdadeiro (servidor). Só aparecem alcunhas, avatares e pontos de treino validados.
import { estado } from '../store.js';
import { icon } from '../ui/icons.js';
import { avatarHTML } from '../ui/avatar.js';
import { sfx } from '../ui/sfx.js';
import { naLiga, ranking, eProfessor } from '../game/liga.js';
import { temConta } from '../game/conta.js';
import { nivelDe, diaChave } from '../rules.js';
import { ecraCriar } from './conta.js';
import { painelProfessor } from './painel.js';
import { nomeRegime, nomeLocal } from './entrada.js';

const esc = (t) => String(t ?? '').replace(/[<>&"]/g, '');
let escopo = 'turma', filtro = 'tudo', busca = '';
const av2 = (v, s) => { try { return avatarHTML(v, { s, selo: true }); } catch { return avatarHTML({}, { s, selo: true }); } };
const av = (v, s) => { try { return avatarHTML(v, { s }); } catch { return avatarHTML({}, { s }); } };
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// entrar na liga = criar conta (email e palavra-passe) ou entrar numa conta existente
function consentimento(root, go) { ecraCriar(root, { aoFim: () => liga(root, go) }); }

const seg = (id, lista, atual) => `<div class="seg" role="radiogroup" aria-label="${id}" style="grid-template-columns:repeat(${lista.length},1fr)">${lista.map(([k, n]) => `<button type="button" role="radio" aria-checked="${atual === k}" data-${id}="${k}" style="min-height:42px;font-size:15px">${n}</button>`).join('')}</div>`;

// faíscas: pequenas estrelas de quatro pontas que cintilam à volta do avatar (posições fixas por pódio, sem aleatório)
const faiscas = (seed, cores, n = 9) => `<span class="fq" aria-hidden="true">${Array.from({ length: n }, (_, i) => { const a = (i * 47 + seed * 29) % 100, b = (i * 31 + seed * 53) % 100, s = 8 + ((i * 5 + seed) % 3) * 4; return `<i style="left:${a}%;top:${b}%;--s:${s}px;--c:${cores[i % cores.length]};--d:${((i * 0.37 + seed * 0.21) % 2.2).toFixed(2)}s"></i>`; }).join('')}</span>`;

// números a subir até ao valor final
function contar(el, fim, ms = 900) {
  if (!el) return;
  if (calmo() || fim < 2) { el.textContent = fim; return; }
  const t0 = performance.now();
  const passo = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(fim * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

// posição de ontem para hoje: guarda-se a posição do último dia em que o aluno abriu a liga e compara-se com a de hoje
function variacao(chave, pos) {
  try {
    const K = 'mat1.liga.pos', o = JSON.parse(localStorage.getItem(K) || '{}'), hoje = diaChave(); let e = o[chave] || {};
    if (!e.c) e = { c: { p: pos, d: hoje } };
    else if (e.c.d !== hoje) e = { b: e.c, c: { p: pos, d: hoje } };
    else e = { b: e.b, c: { p: pos, d: hoje } };
    o[chave] = e; localStorage.setItem(K, JSON.stringify(o));
    return e.b ? e.b.p - pos : 0;
  } catch { return 0; }
}

export async function liga(root, go, mantem = false) {
  if (!naLiga()) return consentimento(root, go);
  if (!mantem) { busca = ''; filtro = 'tudo'; }
  const p = estado().perfil;
  const cab = `<div class="linha" style="margin:2px 0 8px"><h1>Liga</h1><span class="espaco"></span><span class="chip">${icon('liga')}${escopo === 'turma' ? nomeLocal(p.local) + ', ' + nomeRegime(p.regime).toLowerCase() : 'Geral'}</span></div>
    <div style="display:grid;gap:8px">${seg('escopo', [['turma', 'A minha turma'], ['geral', 'Todos']], escopo)}</div>`;
  const barraProf = eProfessor() ? `<div class="painel" style="margin-top:12px;display:flex;gap:10px;align-items:center"><span style="flex:1"><b>Professor</b><span class="nota" style="display:block">Estás fora da tabela. Os teus pontos não contam.</span></span><button class="btn ouro" id="abrePainel" style="min-height:44px">Painel</button></div>` : '';
  const barraConta = !eProfessor() && !temConta() ? `<div class="painel" style="margin-top:12px;display:flex;gap:10px;align-items:center"><span style="flex:1"><b>Guarda o teu progresso</b><span class="nota" style="display:block">Associa um email e usa a app em qualquer aparelho.</span></span><button class="btn ouro" id="assocEmail" style="min-height:44px">Associar</button></div>` : '';
  root.innerHTML = cab + barraProf + barraConta + '<div id="corpo" class="painel" style="margin-top:12px;text-align:center"><p class="nota">A carregar a tabela...</p></div>';
  root.querySelectorAll('[data-escopo]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); escopo = b.dataset.escopo; liga(root, go, true); }));
  root.querySelector('#assocEmail')?.addEventListener('click', () => { sfx.clique(); ecraCriar(root, { aoFim: () => liga(root, go), aoVoltar: () => liga(root, go) }); });
  root.querySelector('#abrePainel')?.addEventListener('click', () => { sfx.clique(); painelProfessor(root, () => liga(root, go)); });
  const r = await ranking(escopo, 'total');
  const corpo = root.querySelector('#corpo'); if (!corpo) return;
  if (r.erro === 'auth') return consentimento(root, go);
  if (r.erro) { corpo.innerHTML = `<p class="giz">${r.erro === 'rede' ? 'Sem ligação. Os teus pontos ficam guardados e seguem quando houver rede.' : 'A liga não respondeu. Tenta outra vez daqui a pouco.'}</p><button class="btn fantasma" id="tenta" style="margin-top:8px">Tentar outra vez</button>`; corpo.querySelector('#tenta').addEventListener('click', () => liga(root, go)); return; }
  const L = r.lista; corpo.remove();
  if (!r.prof && r.profs && r.profs.length) root.insertAdjacentHTML('beforeend', r.profs.map((t) => `<div class="linha-liga prof" style="margin-top:12px">${av2(t.v, 44)}<span style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.alc)}</b><span class="nota" style="font-size:12px">Professor da UC. Fora de concurso.</span></span><span style="width:28px;display:block">${icon('capelo')}</span></div>`).join(''));
  if (!L.length) { root.insertAdjacentHTML('beforeend', `<section class="painel" style="margin-top:12px;text-align:center"><div class="giz">Ainda ninguém tem pontos aqui.</div><p class="nota" style="margin:6px 0 12px">Sê o primeiro: um treino e já estás na tabela.</p><button class="btn ouro" data-go="treinar">${icon('treinar')} Treinar agora</button></section>`); root.querySelector('[data-go]').addEventListener('click', () => go('treinar')); return; }

  const meu = r.minha && !r.prof ? r.minha : null, meuPos = meu ? meu.pos : 0;
  const eu = { pos: meuPos, alc: p.alcunha || (p.nome || '').split(' ')[0] || 'Tu', v: estado().avatar, xp: meu ? meu.xp : 0 };
  const acima = meuPos > 1 ? L[meuPos - 2] : null, abaixo = meu ? L[meuPos] : null;

  // pódio: os três primeiros, com brilho metálico e faíscas
  const cor = ['#FFC23D', '#D5DEEF', '#E08A45'], faisca = [['#FFF3B0', '#FFC23D', '#fff'], ['#fff', '#BFD0F0', '#8FB4FF'], ['#FFD2A1', '#E08A45', '#fff']];
  const top = L.slice(0, 3), ordem = top.length >= 3 ? [1, 0, 2] : top.map((_, i) => i);
  const podio = `<div class="podio" style="${top.length < 3 ? 'grid-template-columns:repeat(' + top.length + ',1fr)' : ''}">${ordem.map((i) => { const t = top[i], h = [100, 132, 80][i === 0 ? 1 : i === 1 ? 0 : 2]; return `<div class="col p${i + 1}" style="--mc:${cor[i]}"><div class="pdt">${i === 0 ? '<span class="halo" aria-hidden="true"></span>' : ''}${faiscas(i + 1, faisca[i], i === 0 ? 12 : 8)}${i === 0 ? `<span class="coroa">${icon('coroa')}</span>` : ''}<span class="aro">${av(t.v, i === 0 ? 84 : 66)}</span></div><div class="nm" style="color:${t.eu ? 'var(--ciano)' : 'inherit'}">${esc(t.alc)}${t.eu ? ' (tu)' : ''}</div><div class="pts"><b data-n="${t.xp}">${calmo() ? t.xp : 0}</b> pts</div><div class="base" style="height:${h}px;--pc:${cor[i]}"><span>${t.pos}</span></div></div>`; }).join('')}</div>`;

  // cartão da posição: número grande, subida desde a última visita e distância ao colega de cima
  let hero;
  if (r.prof) hero = `<section class="painel"><div class="giz">Estás a ver a tabela como professor. Não entras na contagem.</div></section>`;
  else if (!meu) hero = `<section class="painel" style="text-align:center"><div class="giz">Ainda não tens pontos.</div><p class="nota" style="margin:6px 0 12px">Um treino chega para entrares na tabela.</p><button class="btn ouro" data-go="treinar">${icon('treinar')} Treinar agora</button></section>`;
  else {
    const dv = variacao(escopo + ':' + p.id, meuPos);
    const nv = nivelDe(meu.xp);
    const dchip = dv > 0 ? `<span class="chip certo-c">▲ ${dv} desde a última visita</span>` : dv < 0 ? `<span class="chip erro-c">▼ ${-dv} desde a última visita</span>` : '';
    let msg, prog = '';
    if (meuPos === 1) msg = 'Estás em primeiro lugar. Aguenta a posição.';
    else if (acima) {
      const falta = acima.xp - meu.xp + 1, base = abaixo ? abaixo.xp : Math.max(0, meu.xp - 40), pct = Math.max(6, Math.min(100, Math.round(((meu.xp - base) / Math.max(1, acima.xp + 1 - base)) * 100)));
      msg = `Faltam <b>${falta}</b> ${falta === 1 ? 'ponto' : 'pontos'} para ultrapassares ${esc(acima.alc)}.`;
      prog = `<div class="barra-p ouro" style="margin:10px 0 2px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${calmo() ? pct : 0}%" data-w="${pct}"></i></div><div class="hp-leg"><span>${esc(eu.alc)}</span><span>${esc(acima.alc)}</span></div>`;
    } else msg = 'Continua a treinar para subires na tabela.';
    const pts = (n) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;
    const defende = abaixo ? `<p class="nota" style="margin:8px 0 0">${abaixo.xp === meu.xp ? `${esc(abaixo.alc)} tem os mesmos pontos que tu.` : `${meuPos > 1 ? 'Atrás de ti, ' : ''}${esc(abaixo.alc)} está a ${meuPos > 1 ? pts(meu.xp - abaixo.xp) : pts(meu.xp - abaixo.xp) + ' de ti'}.`}</p>` : '';
    hero = `<section class="painel hero-pos"><div class="hp-n"><span class="hp-num">${meuPos}<span class="ord">.º</span></span><span class="hp-de">de ${r.total}</span></div><div class="hp-r"><div class="giz">${msg}</div>${prog}${defende}<div class="hp-chips"><span class="chip ouro">${icon('raio')}<span data-n="${meu.xp}">${calmo() ? meu.xp : 0}</span> pontos</span><span class="chip">${esc(nv.titulo)}</span>${dchip}</div>${meuPos > 3 ? '<button class="btn fantasma" id="irEu" style="min-height:44px;margin-top:10px;width:100%;font-size:15px;padding:0 10px">Ir para a minha linha</button>' : ''}</div></section>`;
  }

  // lista completa: tudo a partir do 4.º lugar, com pesquisa e filtro "perto de mim"
  const resto = L.slice(3); let primeira = true;
  const linha = (t, i) => {
    const alvo = meu && t.pos === meuPos - 1, atras = meu && t.pos === meuPos + 1;
    const sub = alvo ? `<span class="tag-alvo">Próximo alvo</span> faltam ${t.xp - meu.xp + 1}` : atras ? (t.xp === meu.xp ? 'tem os mesmos pontos que tu' : `a ${meu.xp - t.xp} ${meu.xp - t.xp === 1 ? 'ponto' : 'pontos'} de te apanhar`) : (t.t ? esc(t.t) : '');
    return `<div class="linha-liga ${t.eu ? 'eu' : ''} ${t.pos <= 10 ? 't10' : ''} ${alvo ? 'alvo' : ''} ${primeira ? 'ent' : ''}" style="--i:${Math.min(i, 14)}" data-pos="${t.pos}"><span class="pos">${t.pos}</span>${av(t.v, 42)}<span class="lj"><b>${esc(t.alc)}${t.eu ? ' (tu)' : ''}</b>${sub ? `<span class="nota">${sub}</span>` : ''}</span><span class="chip ouro">${icon('raio')}${t.xp}</span></div>`;
  };
  const desenhaLista = () => {
    const q = busca.trim().toLowerCase(); let rows = resto, nota = '';
    if (q) rows = L.filter((t) => t.alc.toLowerCase().includes(q));
    else if (filtro === 'perto' && meu) { rows = L.filter((t) => Math.abs(t.pos - meuPos) <= 5 && t.pos > 3); nota = rows.length ? `A mostrar as posições ${rows[0].pos} a ${rows[rows.length - 1].pos}.` : ''; }
    const fora = meu && meu.fora && !q ? `<div class="nota" style="text-align:center;margin:6px 0">...</div>${linha({ ...eu, eu: true }, rows.length)}` : '';
    const lista = root.querySelector('#lista'); if (!lista) return;
    lista.innerHTML = (nota ? `<p class="nota" style="margin:2px 0 4px;text-align:center">${nota}</p>` : '') + (rows.length ? rows.map((t, i) => linha(t, i)).join('') : '<p class="nota" style="text-align:center;margin:12px 0">Nenhum colega com esse nome.</p>') + fora;
    primeira = false; vigiar();
  };
  const ctrl = `<div class="ctrl"><input id="busca" class="campo" type="search" placeholder="Procurar um colega" aria-label="Procurar um colega" autocomplete="off" value="${esc(busca)}">${meu && meuPos > 3 ? seg('filtro', [['tudo', 'Tabela completa'], ['perto', 'Perto de mim']], filtro) : ''}</div>`;
  root.insertAdjacentHTML('beforeend', `<section class="painel" style="text-align:center;padding-bottom:0;overflow:hidden;margin-top:12px">${podio}</section>${hero}${resto.length || (meu && meu.fora) ? ctrl + '<div id="lista"></div>' : ''}<p class="nota" style="margin:12px 0 0">Contam só os exercícios de treino, conferidos pelo servidor. Os pontos acumulam até ao teste.</p><button type="button" id="minhaBarra" class="minha-barra" hidden aria-label="Ir para a minha posição"></button>`);

  // barra fixa com a minha posição quando a minha linha está fora do ecrã
  const barra = root.querySelector('#minhaBarra');
  let obs = null, vHero = true, vEu = false;
  const mostra = () => { if (barra) barra.hidden = vHero || vEu; };
  function vigiar() {
    obs?.disconnect(); obs = null;
    const el = root.querySelector('#lista .linha-liga.eu'), hero = root.querySelector('.hero-pos'); if (!barra || !meu || meuPos <= 3 || !('IntersectionObserver' in window)) return;
    vEu = false; if (!el) { vEu = false; }
    obs = new IntersectionObserver((es) => { for (const e of es) { if (e.target === el) vEu = e.isIntersecting; else vHero = e.isIntersecting; } mostra(); }, { threshold: 0.5 });
    if (el) obs.observe(el); if (hero) obs.observe(hero);
  }
  if (barra && meu && meuPos > 3) { barra.innerHTML = `<span class="mb-pos">${meuPos}.º</span>${av(eu.v, 32)}<b>${esc(eu.alc)}</b><span class="chip ouro" style="margin-left:auto">${icon('raio')}${meu.xp}</span>`; barra.addEventListener('click', () => { sfx.clique(); irParaMim(); }); }
  function irParaMim() {
    if (!root.querySelector('#lista .linha-liga.eu')) { filtro = 'tudo'; busca = ''; const b = root.querySelector('#busca'); if (b) b.value = ''; root.querySelectorAll('[data-filtro]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.filtro === 'tudo'))); desenhaLista(); }
    const alvo = root.querySelector('#lista .linha-liga.eu'); if (!alvo) return;
    alvo.scrollIntoView({ behavior: calmo() ? 'auto' : 'smooth', block: 'center' }); alvo.classList.remove('flash'); void alvo.offsetWidth; alvo.classList.add('flash');
  }
  root.querySelector('[data-go]')?.addEventListener('click', () => go('treinar'));
  root.querySelector('#irEu')?.addEventListener('click', () => { sfx.clique(); irParaMim(); });
  root.querySelector('#busca')?.addEventListener('input', (e) => { busca = e.target.value; desenhaLista(); });
  root.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); filtro = b.dataset.filtro; root.querySelectorAll('[data-filtro]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); desenhaLista(); }));
  if (root.querySelector('#lista')) desenhaLista();
  // animações de entrada: pontos a subir e barra a encher
  root.querySelectorAll('.podio [data-n], .hero-pos [data-n]').forEach((el) => contar(el, Number(el.dataset.n)));
  requestAnimationFrame(() => root.querySelectorAll('.barra-p i[data-w]').forEach((i) => { i.style.width = i.dataset.w + '%'; }));
}
