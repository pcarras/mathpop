// Liga da turma: ranking verdadeiro (servidor). Só aparecem alcunhas, avatares e pontos de treino validados.
import { estado } from '../store.js';
import { icon } from '../ui/icons.js';
import { avatarHTML } from '../ui/avatar.js';
import { sfx } from '../ui/sfx.js';
import { toast } from '../ui/fx.js';
import { entrarNaLiga, naLiga, ranking } from '../game/liga.js';
import { nomeRegime, nomeLocal } from './entrada.js';

const esc = (t) => String(t ?? '').replace(/[<>&"]/g, '');
let escopo = 'turma', periodo = 'semana';
const av = (v, s) => { try { return avatarHTML(v, { s }); } catch { return avatarHTML({}, { s }); } };

function consentimento(root, go) {
  const p = estado().perfil;
  root.innerHTML = `
  <h1 style="margin:2px 0 4px">Liga da turma</h1>
  <p class="giz" style="margin:0 0 12px">Compete com os colegas de ${nomeLocal(p.local)}, ${nomeRegime(p.regime).toLowerCase()}, e com a UC toda. Ganha pontos a treinar.</p>
  <section class="painel">
    <b>O que é enviado se entrares</b>
    <ul class="lista-simples">
      <li>O teu nome, a alcunha, o regime, o local e o avatar.</li>
      <li>As respostas certas dos exercícios de treino. O servidor refaz cada exercício para conferir os pontos.</li>
    </ul>
    <b>O que os colegas veem</b>
    <ul class="lista-simples">
      <li>Só a alcunha (ou o primeiro nome), o avatar e os pontos. O teu nome completo não aparece.</li>
    </ul>
    <p class="nota" style="margin:8px 0 0">Os dados servem apenas para esta liga e para o acompanhamento da UC de Matemática I. Podes sair quando quiseres em Perfil, Definições, e os teus dados são apagados do servidor. Responsável: Paulo Carrasco, ESGHT, Universidade do Algarve.</p>
  </section>
  <label class="painel" style="margin-top:12px;display:flex;gap:12px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="aceito" style="width:26px;height:26px;margin-top:2px;accent-color:var(--ciano)"><span>Li e aceito enviar estes dados para a liga.</span></label>
  <button class="btn grande ouro" id="entrarLiga" style="margin-top:14px" disabled>Entrar na liga</button>
  <p class="nota" id="erroLiga" style="margin-top:10px;color:var(--erro)"></p>`;
  const cb = root.querySelector('#aceito'), bt = root.querySelector('#entrarLiga');
  cb.addEventListener('change', () => { bt.disabled = !cb.checked; });
  bt.addEventListener('click', async () => {
    bt.disabled = true; bt.textContent = 'A entrar...';
    const r = await entrarNaLiga();
    if (r.ok) { sfx.bau(); toast('<div><b>Estás na liga</b><br><span class="nota">Os pontos dos próximos treinos já contam.</span></div>'); liga(root, go); return; }
    bt.disabled = false; bt.textContent = 'Entrar na liga';
    root.querySelector('#erroLiga').textContent = r.erro === 'rede' ? 'Sem ligação ao servidor. Confirma a rede e tenta outra vez.' : 'Não foi possível entrar na liga agora. Tenta mais tarde.';
  });
}

const seg = (id, lista, atual) => `<div class="seg" role="radiogroup" aria-label="${id}" style="grid-template-columns:repeat(${lista.length},1fr)">${lista.map(([k, n]) => `<button type="button" role="radio" aria-checked="${atual === k}" data-${id}="${k}" style="min-height:42px;font-size:15px">${n}</button>`).join('')}</div>`;

export async function liga(root, go) {
  if (!naLiga()) return consentimento(root, go);
  const p = estado().perfil;
  const cab = `<div class="linha" style="margin:2px 0 8px"><h1>Liga</h1><span class="espaco"></span><span class="chip">${icon('liga')}${escopo === 'turma' ? nomeLocal(p.local) + ', ' + nomeRegime(p.regime).toLowerCase() : 'Geral'}</span></div>
    <div style="display:grid;gap:8px">${seg('escopo', [['turma', 'A minha turma'], ['geral', 'Todos']], escopo)}${seg('periodo', [['semana', 'Esta semana'], ['total', 'Total']], periodo)}</div>`;
  root.innerHTML = cab + '<div id="corpo" class="painel" style="margin-top:12px;text-align:center"><p class="nota">A carregar a tabela...</p></div>';
  const ligar = () => root.querySelectorAll('[data-escopo],[data-periodo]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); if (b.dataset.escopo) escopo = b.dataset.escopo; if (b.dataset.periodo) periodo = b.dataset.periodo; liga(root, go); }));
  ligar();
  const r = await ranking(escopo, periodo);
  const corpo = root.querySelector('#corpo'); if (!corpo) return;
  if (r.erro === 'auth') return consentimento(root, go);
  if (r.erro) { corpo.innerHTML = `<p class="giz">${r.erro === 'rede' ? 'Sem ligação. Os teus pontos ficam guardados e seguem quando houver rede.' : 'A liga não respondeu. Tenta outra vez daqui a pouco.'}</p><button class="btn fantasma" id="tenta" style="margin-top:8px">Tentar outra vez</button>`; corpo.querySelector('#tenta').addEventListener('click', () => liga(root, go)); return; }
  const L = r.lista; corpo.remove();
  if (!L.length) { root.insertAdjacentHTML('beforeend', `<section class="painel" style="margin-top:12px;text-align:center"><div class="giz">Ainda ninguém tem pontos ${periodo === 'semana' ? 'esta semana' : 'aqui'}.</div><p class="nota" style="margin:6px 0 12px">Sê o primeiro: um treino e já estás na tabela.</p><button class="btn ouro" data-go="treinar">${icon('treinar')} Treinar agora</button></section>`); root.querySelector('[data-go]').addEventListener('click', () => go('treinar')); return; }
  const cor = ['var(--ouro-esc)', 'var(--giz-3)', '#A8652A'], top = L.slice(0, 3), ordem = top.length >= 3 ? [1, 0, 2] : top.map((_, i) => i);
  const podio = `<div class="podio" style="${top.length < 3 ? 'grid-template-columns:repeat(' + top.length + ',1fr)' : ''}">${ordem.map((i) => { const t = top[i]; const h = [96, 128, 76][i === 0 ? 1 : i === 1 ? 0 : 2]; return `<div class="col">${i === 0 ? `<span style="width:30px;display:block">${icon('coroa')}</span>` : ''}${av(t.v, i === 0 ? 84 : 66)}<div class="nm" style="color:${t.eu ? 'var(--ciano)' : 'inherit'}">${esc(t.alc)}</div><div class="nota" style="font-size:12px">${t.xp} pts</div><div class="base" style="height:${h}px;--pc:${cor[i]}">${t.pos}</div></div>`; }).join('')}</div>`;
  const linha = (t) => `<div class="linha-liga ${t.eu ? 'eu' : ''}"><span class="pos">${t.pos}</span>${av(t.v, 42)}<span style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.alc)}</b>${t.t ? `<span class="nota" style="font-size:12px">${esc(t.t)}</span>` : ''}</span><span class="chip ouro">${icon('raio')}${t.xp}</span></div>`;
  let msg;
  if (!r.minha) msg = 'Ainda não tens pontos neste período. Um treino chega para entrares na tabela.';
  else if (r.minha.pos === 1) msg = 'Estás em primeiro lugar. Aguenta a posição.';
  else { const acima = L[r.minha.pos - 2]; msg = acima ? `Faltam ${acima.xp - r.minha.xp + 1} pontos para ultrapassares ${esc(acima.alc)}.` : 'Continua a treinar para subires na tabela.'; }
  root.insertAdjacentHTML('beforeend', `
  <section class="painel" style="text-align:center;padding-bottom:0;overflow:hidden;margin-top:12px">${podio}</section>
  <section class="painel" style="margin-top:12px"><div class="giz">${msg}</div>${r.minha ? `<p class="nota" style="margin:4px 0 0">És o ${r.minha.pos}.º de ${r.total} com pontos, com ${r.minha.xp} pontos.</p>` : ''}</section>
  <div style="margin-top:8px">${L.slice(3).map(linha).join('')}${r.minha && r.minha.fora ? `<div class="nota" style="text-align:center;margin:6px 0">...</div>${linha({ pos: r.minha.pos, alc: estado().perfil.alcunha || (estado().perfil.nome || '').split(' ')[0] || 'Tu', v: estado().avatar, xp: r.minha.xp, eu: true })}` : ''}</div>
  <p class="nota" style="margin:12px 0 0">Contam só os exercícios de treino, conferidos pelo servidor. A semana começa à segunda-feira.</p>`);
}
