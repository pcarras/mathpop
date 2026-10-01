import { gerar, verifySteps, verificar, Matrix, Frac } from '../engine/index.js';
import { nHoje, nivelTipo, registarResultado, novaSemente, sequencia, snapshot } from '../store.js';
import { xpDesafio, NOMES, PASSOS_TIPOS } from '../rules.js';
import { tex, texBloco } from '../ui/tex.js';
import { grid } from '../ui/grid.js';
import { answerWidget } from '../ui/answer.js';
import { teclado, usarTeclado } from '../ui/keypad.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sfx.js';
import { festa, tintaEm, celebrar, contar } from '../ui/fx.js';

const GLIFO = { inversa: 'A⁻¹', caracteristica: 'R(A)', sistema: 'Ax=b' };
const OPS = { jacobi: 'Jacobi', escala: '× k', divide: ': k', troca: 'Trocar' };

export function passos(root, go, tipoArg, atualizarTopo) {
  document.body.classList.remove('imersivo');
  if (!PASSOS_TIPOS.includes(tipoArg)) {
    root.innerHTML = `<h1>Por passos</h1><p class="giz" style="margin:6px 0 10px">Resolve como nas aulas. O motor verifica linha a linha.</p>
      ${PASSOS_TIPOS.map((t) => `<button class="painel tipo-cartao" data-t="${t}"><span class="g">${GLIFO[t]}</span><span style="flex:1"><b style="font:900 24px var(--display)">${NOMES[t]}</b><br><span class="nota">Nível ${nivelTipo(t)} de 3 · condensação</span></span>${icon('seta')}</button>`).join('')}`;
    root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); go('passos/' + b.dataset.t); }));
    root.querySelectorAll('.tipo-cartao svg').forEach((s) => (s.style.cssText = 'width:22px;height:22px;color:var(--giz-2)'));
    return;
  }
  document.body.classList.add('imersivo');
  const nivel = Math.max(1, nivelTipo(tipoArg)), ex = gerar(tipoArg, novaSemente(), tipoArg === 'inversa' ? Math.max(2, nivel) : nivel);
  if (location.search.includes('debug')) window.__ex = ex;
  const P = ex.passos, m = P.inicial.m, n = P.inicial.n, aug = P.limitCols && P.limitCols < n ? P.limitCols : -1;
  root.innerHTML = `<div class="sessao-topo"><button class="icon-btn" id="sair" aria-label="Sair">${icon('fechar')}</button><div style="flex:1"><h1 style="font-size:30px">${NOMES[tipoArg]} por passos</h1></div><span class="chip ciano">Nível ${ex.nivel}</span></div>
    <div class="painel enun" id="enun"></div>
    <p class="giz" style="margin:4px 4px 0">Jacobi: o multiplicador escreve-se à esquerda da linha que muda.</p>
    <div id="lista"></div>
    <div class="linha" style="margin:4px 0 0 18px"><button class="btn fantasma" id="add" style="min-height:44px">+ Passo</button><button class="btn fantasma" id="rem" style="min-height:44px">Remover último</button></div>
    <div class="painel" style="margin-top:18px;position:relative" id="resp"><b>Resposta final</b><div style="margin-top:10px" id="respw"></div></div>
    <div class="dock" id="dock"></div>`;
  const $ = (s) => root.querySelector(s);
  $('#sair').addEventListener('click', () => go('home'));
  $('#enun').innerHTML = tex(ex.enunciado) + (tipoArg === 'sistema' ? texBloco(P.inicial.toLatex(aug)) : '');
  const w = answerWidget(ex); $('#respw').appendChild(w.el);
  const cartas = [];
  const prev = () => (cartas.length ? cartas[cartas.length - 1].g.valores() : P.inicial.toArray());
  const campo = (k, ph) => `<input class="cel p-${k}" placeholder="${ph}" aria-label="${({ k: 'multiplicador', i: 'linha', j: 'linha' })[ph] || ph}" autocomplete="off" ${usarTeclado() ? 'inputmode="none"' : ''}>`;
  function pintar(c) {
    const op = c.op; const p = c.el.querySelector('.params');
    p.innerHTML = op === 'jacobi' ? `${campo('m', 'k')}<span>× L</span>${campo('p', 'i')}<span>+ L</span>${campo('r', 'j')}` : op === 'troca' ? `<span>L</span>${campo('i', 'i')}<span>↔ L</span>${campo('j', 'j')}` : `<span>L</span>${campo('i', 'linha')}<span>${op === 'escala' ? '×' : ':'}</span>${campo('k', 'k')}`;
    p.querySelectorAll('.cel').forEach((x) => x.addEventListener('focus', () => x.select()));
  }
  function addPasso() {
    const c = { op: 'jacobi', el: document.createElement('div') }; c.el.className = 'passo';
    c.el.innerHTML = `<span class="n">${cartas.length + 1}</span><div class="ops" role="group" aria-label="Operação">${Object.entries(OPS).map(([k, v]) => `<button type="button" data-op="${k}" aria-pressed="${k === 'jacobi'}">${v}</button>`).join('')}</div><div class="params"></div><div class="gr"></div>`;
    c.g = grid(m, n, { aug, valores: prev() }); c.el.querySelector('.gr').appendChild(c.g.el);
    c.el.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => { c.op = b.dataset.op; c.el.querySelectorAll('[data-op]').forEach((x) => x.setAttribute('aria-pressed', x === b)); pintar(c); sfx.clique(); c.el.querySelector('.params .cel').focus(); }));
    pintar(c); $('#lista').appendChild(c.el); cartas.push(c); c.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); c.el.querySelector('.params .cel').focus({ preventScroll: true });
    root.style.paddingBottom = dock.offsetHeight + 20 + 'px';
  }
  const dock = $('#dock'); let feito = false;
  const acoes = document.createElement('div'); acoes.className = 'acoes'; acoes.innerHTML = `<button class="btn grande" id="ver">Verificar resolução</button>`; dock.appendChild(acoes);
  if (usarTeclado()) dock.appendChild(teclado(root, { onOk: () => $('#ver').click() }));
  requestAnimationFrame(() => { addPasso(); });
  $('#add').addEventListener('click', () => { sfx.clique(); addPasso(); });
  $('#rem').addEventListener('click', () => { if (cartas.length > 1) cartas.pop().el.remove(); });
  function lerOp(c) {
    const v = (k) => c.el.querySelector('.p-' + k)?.value ?? '';
    const L = (x) => { const k = parseInt(x, 10); if (!Number.isInteger(k) || k < 1 || k > m) throw new Error('linha inválida'); return k - 1; };
    const f = (x) => { const r = Frac.parse(x); if (!r) throw new Error('valor inválido'); return r; };
    if (c.op === 'jacobi') return { t: 'jacobi', m: f(v('m')), p: L(v('p')), r: L(v('r')) };
    if (c.op === 'troca') return { t: 'troca', i: L(v('i')), j: L(v('j')) };
    return { t: c.op, i: L(v('i')), k: f(v('k')) };
  }
  $('#ver').addEventListener('click', () => {
    if (feito) return;
    const folha = (cls, html) => { const f = document.createElement('div'); f.className = 'folha ' + cls; f.innerHTML = html; document.body.appendChild(f); dock.style.display = 'none'; return f; };
    let steps;
    try { steps = cartas.map((c, i) => { try { return { op: lerOp(c), matriz: Matrix.parse(c.g.valores()) }; } catch (e) { throw new Error(`Passo ${i + 1}: confere a operação e a matriz (${e.message}).`); } }); }
    catch (e) { sfx.erro(); const f = folha('info', `<h3>Falta preencher</h3><p>${e.message}</p><button class="btn ouro grande" id="ok">Corrigir</button>`); f.querySelector('#ok').addEventListener('click', () => { f.remove(); dock.style.display = ''; }); return; }
    feito = true;
    const v = verifySteps(P.inicial, steps, { goal: P.goal, limitCols: P.limitCols }), respOk = verificar(ex, w.get());
    const crit = { ...v.criterios, resposta: respOk ? 1 : 0 }, tudo = v.todosCertos && v.formaOk && respOk;
    const antes = snapshot(), xp = xpDesafio({ nivel: ex.nivel, criterios: crit, nHoje: nHoje(tipoArg), dias: Math.max(1, sequencia()) });
    registarResultado(tipoArg, tudo, xp, { semPistas: false, desafio: true, perfeito: tudo });
    cartas.forEach((c, i) => { const p = v.passos[i]; c.el.classList.add(p.ok ? 'ok' : 'err'); c.el.querySelector('.n').textContent = p.ok ? '✓' : '✕';
      if (p.ok) c.g.marcar(steps[i].matriz.rows.map((r) => r.map(() => true))); else if (p.esperada) c.g.marcar(p.esperada.rows.map((r, a) => r.map((x, b) => x.eq(steps[i].matriz.get(a, b))))); });
    w.marcar(respOk);
    if (tudo) { sfx.certo(); festa(1.6); tintaEm(w.alvo, $('#resp')); } else { sfx.erro(); }
    const fe = v.primeiroErro, pct = (x) => Math.round(x * 100) + '%';
    const linhas = [fe ? `<b>Primeiro erro no passo ${fe.n}</b> (${fe.tipo === 'metodo' ? 'método' : 'cálculo'})${fe.erroTipico && fe.erroTipico !== 'nenhum' ? ': ' + fe.erroTipico : ''}. ${fe.comentario || 'Refaz a conta desse passo.'}` : 'Todos os passos estão certos.'];
    if (!v.formaOk) linhas.push(P.goal === 'reduzida' ? 'A matriz final ainda não está na forma reduzida.' : 'A matriz final ainda não está condensada.');
    linhas.push(respOk ? 'Resposta final certa.' : 'A resposta final não coincide.');
    const f = folha(tudo ? 'certo' : 'erro', `<h3>${tudo ? 'Resolução perfeita!' : 'Quase lá'}</h3><div class="xp"><span id="ganho">0</span> XP</div><p style="margin:8px 0">${linhas.join('<br>')}</p><p class="nota" style="color:inherit;opacity:.85">Método ${pct(crit.metodo)} · Cálculos ${pct(crit.calculos)} · Resposta ${pct(crit.resposta)}</p>
      <div class="linha" style="margin-top:10px"><button class="btn ${tudo ? 'certo' : 'erro'}" id="outro" style="flex:1">Outro exercício</button><button class="btn fantasma" id="rever" style="flex:1">Rever passos</button></div>`);
    contar(f.querySelector('#ganho'), 0, xp, 700); atualizarTopo();
    f.querySelector('#outro').addEventListener('click', async () => { f.remove(); await celebrar(antes); go('passos/' + tipoArg + '?' + Date.now()); });
    f.querySelector('#rever').addEventListener('click', async () => { f.remove(); dock.innerHTML = `<div class="acoes"><button class="btn grande" id="sai">Concluir</button></div>`; dock.style.display = ''; root.style.paddingBottom = dock.offsetHeight + 20 + 'px'; dock.querySelector('#sai').addEventListener('click', async () => { await celebrar(antes); go('home'); }); });
  });
}
