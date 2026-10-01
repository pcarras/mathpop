import { gerar, verificar, TIPOS } from '../engine/index.js';
import { nHoje, nivelTipo, registarResultado, novaSemente, sequencia, snapshot, estado, dominio } from '../store.js';
import { xpTreino, NOMES } from '../rules.js';
import { tex, texBloco } from '../ui/tex.js';
import { answerWidget } from '../ui/answer.js';
import { teclado, usarTeclado } from '../ui/keypad.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sfx.js';
import { festa, tintaEm, celebrar, contar } from '../ui/fx.js';

const N = 5; // exercicios por sessao
const GLIFO = { produto: 'A·B', determinante: '|A|', caracteristica: 'R(A)', inversa: 'A⁻¹', sistema: 'Ax=b', misto: '?' };
const respostaTxt = (ex) => { const r = ex.resposta; if (r.kind !== 'sistema') return tex('$' + r.valor.toLatex() + '$'); const v = r.valor; return v.tipo + (v.solucao ? ' com ' + tex('$(x,y,z)=(' + v.solucao.map((s) => s.toLatex()).join(',') + ')$') : v.gi ? ` com grau de indeterminação ${v.gi}` : ''); };

export function treinar(root, go, tipoArg, atualizarTopo) {
  document.body.classList.remove('imersivo');
  if (!tipoArg || (tipoArg !== 'misto' && !TIPOS.includes(tipoArg))) {
    root.innerHTML = `<h1>Treinar</h1><p class="giz" style="margin:6px 0 10px">Sessões de ${N} exercícios. O nível ajusta-se a ti.</p>
      ${[...TIPOS, 'misto'].map((t) => `<button class="painel tipo-cartao" data-t="${t}"><span class="g">${GLIFO[t]}</span><span style="flex:1"><b style="font:900 24px var(--display)">${t === 'misto' ? 'Misto' : NOMES[t]}</b><br><span class="nota">${t === 'misto' ? 'Um pouco de tudo' : `Nível ${nivelTipo(t)} de 3 · domínio ${Math.round(dominio(t) * 100)}%`}</span></span>${icon('seta')}</button>`).join('')}`;
    root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); go('treinar/' + b.dataset.t); }));
    root.querySelectorAll('.tipo-cartao svg').forEach((s) => (s.style.cssText = 'width:22px;height:22px;color:var(--giz-2)'));
    return;
  }
  document.body.classList.add('imersivo');
  const sessao = { i: 0, res: [], xp: 0, combo: 0 };
  root.innerHTML = `<div class="sessao-topo"><button class="icon-btn" id="sair" aria-label="Sair da sessão">${icon('fechar')}</button><div class="seg" id="seg"></div><div class="combo" id="combo" aria-live="polite"></div></div><div id="cena"></div><div class="dock" id="dock"></div>`;
  const $ = (s) => root.querySelector(s);
  $('#sair').addEventListener('click', () => go('home'));
  const segs = () => { $('#seg').innerHTML = Array.from({ length: N }, (_, k) => `<i class="${k < sessao.res.length ? (sessao.res[k] === 'mau' ? 'mau' : 'ok') : k === sessao.i ? 'atual' : ''}"></i>`).join(''); $('#combo').innerHTML = sessao.combo >= 2 ? `${icon('chama')} x${sessao.combo}` : ''; };

  function exercicio() {
    segs();
    const tipo = tipoArg === 'misto' ? TIPOS[Math.floor(Math.random() * TIPOS.length)] : tipoArg;
    const nivel = nivelTipo(tipo), ex = gerar(tipo, novaSemente(), nivel);
    let pistas = 0, errou = false, feito = false;
    const cena = $('#cena'), dock = $('#dock'); dock.innerHTML = '';
    cena.innerHTML = `<div class="linha espaco" style="margin:2px 0 8px"><h1 style="font-size:32px">${NOMES[tipo]}</h1><span class="chip ciano">Nível ${nivel}</span></div>
      <div class="painel enun" id="enun"></div><div class="painel" id="resp" style="position:relative"></div><div id="pistas"></div>
      <div class="linha" style="justify-content:center"><button class="btn fantasma" id="desisto" style="min-height:40px;font-size:14px;padding:0 14px">Ver resolução (sem pontos)</button></div>`;
    $('#enun').innerHTML = tex(ex.enunciado);
    const w = answerWidget(ex); $('#resp').appendChild(w.el);
    if (location.search.includes('debug')) window.__ex = ex;
    const acoes = document.createElement('div'); acoes.className = 'acoes';
    acoes.innerHTML = `<button class="btn ouro" id="pista" aria-label="Pista" style="flex:0 0 64px;padding:0">${icon('lampada')}</button><button class="btn grande" id="ver" style="width:auto">Verificar</button>`;
    acoes.querySelector('svg').style.cssText = 'width:30px;height:30px';
    const verificarFn = () => { if (feito) return; fn.ver(); };
    dock.appendChild(acoes); if (usarTeclado()) dock.appendChild(teclado(root, { onOk: verificarFn }));
    requestAnimationFrame(() => { root.style.paddingBottom = dock.offsetHeight + 20 + 'px'; w.focus(); });
    const folha = (cls, html) => { const f = document.createElement('div'); f.className = 'folha ' + cls; f.innerHTML = html; document.body.appendChild(f); dock.style.display = 'none'; return f; };
    const fecharFolha = (f) => { f.remove(); dock.style.display = ''; };
    const passoHTML = (p, i) => `<div class="pista-cx"><small>Pista ${i + 1}</small><div>${tex(p.texto || '')}</div>${p.latex ? texBloco(p.latex) : ''}</div>`;
    function proximo(f, resultado, xp) {
      fecharFolha(f); sessao.res.push(resultado); sessao.xp += xp || 0; sessao.i++; const antes = f._antes;
      (antes ? celebrar(antes) : Promise.resolve()).then(() => (sessao.i >= N ? fim() : exercicio()));
    }
    const fn = {
      ver() {
        const ok = verificar(ex, w.get());
        if (ok) {
          const antes = snapshot(); feito = true;
          let xp = xpTreino({ nivel, pistas, nHoje: nHoje(tipo), dias: Math.max(1, sequencia()) }); if (errou) xp = Math.round(xp * 0.5);
          registarResultado(tipo, true, xp, { semPistas: pistas === 0 && !errou, semHist: errou });
          sessao.combo++; segs(); sfx.certo(); sfx.vibrar(25); w.marcar(true); tintaEm(w.alvo, $('#resp')); festa(0.6, { x: 0.5, y: 0.75 });
          const f = folha('certo', `<h3>${['Certo!', 'Boa!', 'Exato!', 'Limpinho!'][sessao.combo % 4]}</h3><div class="linha espaco"><span class="xp"><span id="ganho">0</span> XP</span><span class="nota" style="color:#CFF5E3">${errou ? 'Depois de um erro: metade dos pontos' : pistas === 0 ? 'Sem pistas: +50%' : `${pistas} pista${pistas > 1 ? 's' : ''} usada${pistas > 1 ? 's' : ''}`}</span></div><button class="btn certo grande" id="cont" style="margin-top:14px">Continuar</button>`);
          f._antes = antes; contar(f.querySelector('#ganho'), 0, xp, 700); atualizarTopo(); f.querySelector('#cont').addEventListener('click', () => proximo(f, errou ? 'ok2' : 'ok1', xp)); f.querySelector('#cont').focus();
        } else {
          if (!errou) { errou = true; registarResultado(tipo, false, 0, {}); }
          sessao.combo = 0; segs(); sfx.erro(); sfx.vibrar([40, 30, 40]); w.marcar(false); cena.classList.remove('tremer'); void cena.offsetWidth; cena.classList.add('tremer');
          const f = folha('erro', `<h3>Ainda não</h3><p>Confere os sinais e as contas. Podes tentar outra vez ou pedir uma pista.</p><button class="btn erro grande" id="outra">Tentar outra vez</button>`);
          f.querySelector('#outra').addEventListener('click', () => { fecharFolha(f); w.focus(); }); f.querySelector('#outra').focus();
        }
      },
    };
    $('#ver').addEventListener('click', verificarFn);
    $('#pista').addEventListener('click', () => {
      if (feito) return; sfx.clique(); const passos = ex.resolucao;
      if (pistas >= passos.length) return; pistas++; $('#pistas').insertAdjacentHTML('beforeend', passoHTML(passos[pistas - 1], pistas - 1)); root.style.paddingBottom = dock.offsetHeight + 20 + 'px';
    });
    $('#desisto').addEventListener('click', () => {
      if (feito) return; feito = true; if (!errou) registarResultado(tipo, false, 0, {}); sessao.combo = 0; segs();
      $('#pistas').innerHTML = `<div class="painel"><b>Resolução</b>${ex.resolucao.map((p, i) => passoHTML(p, i).replace('Pista', 'Passo')).join('')}<p style="margin-top:10px"><b>Resposta:</b> ${respostaTxt(ex)}</p></div>`;
      const f = folha('info', `<h3>Sem pontos desta vez</h3><p>Lê a resolução com calma. O próximo exercício vem com números novos.</p><button class="btn ouro grande" id="cont">Continuar</button>`);
      f.querySelector('#cont').addEventListener('click', () => proximo(f, 'mau', 0)); f.querySelector('#cont').focus();
    });
  }

  function fim() {
    document.body.classList.remove('imersivo'); root.style.paddingBottom = '';
    const primeira = sessao.res.filter((r) => r === 'ok1').length, acertou = sessao.res.filter((r) => r !== 'mau').length;
    const est = primeira >= 4 ? 3 : primeira >= 2 ? 2 : acertou >= 2 ? 1 : 0;
    if (est >= 2) { sfx.nivel(); festa(2); } else sfx.xp();
    const s = estado();
    root.innerHTML = `<div style="text-align:center;padding-top:24px"><div class="giz">Sessão completa</div><h1 class="titulo-lv" style="margin:6px 0 18px;font-size:clamp(46px,14vw,72px)">${est === 3 ? 'Perfeito!' : est === 2 ? 'Muito bem!' : est === 1 ? 'Bom treino!' : 'Continua!'}</h1>
      <div class="estrelas">${[0, 1, 2].map((k) => icon(k < est ? 'estrela' : 'estrelaVazia')).join('')}</div>
      <div class="painel" style="margin-top:22px"><div class="linha espaco"><span>Certas à primeira</span><b class="num" style="font-size:26px">${primeira}/${N}</b></div><div class="linha espaco" style="margin-top:8px"><span>XP da sessão</span><b class="num" style="font-size:26px;color:var(--ouro)" id="xpS">0</b></div><div class="linha espaco" style="margin-top:8px"><span>XP total</span><b class="num" style="font-size:26px">${s.xp}</b></div></div>
      <div class="linha" style="flex-direction:column;align-items:stretch;gap:12px;margin-top:16px"><button class="btn grande" id="outra">Outra sessão</button><button class="btn fantasma grande" id="casa">Voltar ao início</button></div></div>`;
    contar(root.querySelector('#xpS'), 0, sessao.xp, 900); atualizarTopo();
    root.querySelector('#outra').addEventListener('click', () => go('treinar/' + tipoArg + '?' + Date.now())); root.querySelector('#casa').addEventListener('click', () => go('home'));
    root.querySelectorAll('.estrelas svg').forEach((x) => (x.style.cssText = ''));
  }
  exercicio();
}
