// Painel do professor: resumo da adesao, aparelhos, pontos, estatisticas e lista de jogadores com avatar.
// Os dados vem do servidor (so o professor os pode pedir). Os graficos sao barras simples em HTML, sem bibliotecas.
import { icon } from '../ui/icons.js';
import { avatarHTML } from '../ui/avatar.js';
import { sfx } from '../ui/sfx.js';
import { toast } from '../ui/fx.js';
import { nivelDe, NIVEIS, NOMES, diaChave, diasAteTeste } from '../rules.js';
import { painelProf, ocultarAluno } from '../game/liga.js';
import { nomeRegime, nomeLocal } from './entrada.js';

const esc = (t) => String(t ?? '').replace(/[<>&"']/g, '');
const PLAT = { ios: 'iPhone ou iPad', android: 'Android', windows: 'Windows', mac: 'Mac', linux: 'Linux', outro: 'Outro' };
const turma = (t) => `${nomeLocal(t.local)}, ${nomeRegime(t.regime).toLowerCase()}`;
const soma = (a) => a.reduce((x, y) => x + y, 0);
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const av = (v, s) => { try { return avatarHTML(v, { s }); } catch { return avatarHTML({}, { s }); } };
function ha(ms, agora) {
  const m = Math.max(0, Math.round((agora - ms) / 60000));
  if (m < 2) return 'agora'; if (m < 60) return `há ${m} min`; if (m < 1440) return `há ${Math.round(m / 60)} h`; return `há ${Math.round(m / 1440)} d`;
}

// ---------- graficos ----------
const barrasH = (itens, cor = 'var(--ciano)') => {
  const max = Math.max(1, ...itens.map((i) => i.v));
  return itens.map((i) => `<div class="bh"><span class="bh-t" title="${esc(i.r)}">${esc(i.r)}</span><span class="bh-b"><i style="width:${Math.max(i.v ? 3 : 0, Math.round((100 * i.v) / max))}%;background:${i.cor || cor}"></i></span><b>${i.txt ?? i.v}</b></div>`).join('');
};
const colunas = (itens, { cor = 'var(--ciano)', valores = true, rot = (i) => i.r } = {}) => {
  const max = Math.max(1, ...itens.map((i) => i.v));
  return `<div class="cols" role="img" aria-label="Gráfico de colunas">${itens.map((i) => `<div class="c" title="${esc(i.dica || i.r)}: ${i.v}">${valores && i.v ? `<em>${i.v}</em>` : ''}<i style="height:${i.v ? Math.max(3, Math.round((100 * i.v) / max)) : 0}%;background:${i.cor || cor}"></i></div>`).join('')}</div><div class="cols-l">${itens.map((i, k) => `<span>${rot(i, k)}</span>`).join('')}</div>`;
};
const empilhada = (partes) => {
  const tot = Math.max(1, soma(partes.map((p) => p.v)));
  return `<div class="emp">${partes.map((p) => (p.v ? `<i style="width:${(100 * p.v) / tot}%;background:${p.cor}" title="${esc(p.r)}: ${p.v}"></i>` : '')).join('')}</div><div class="leg">${partes.map((p) => `<span><i style="background:${p.cor}"></i>${esc(p.r)}: <b>${p.v}</b> (${pct(p.v, tot)}%)</span>`).join('')}</div>`;
};
const kpi = (n, r, nota = '') => `<div class="kpi"><b>${n}</b><span>${r}</span>${nota ? `<small>${nota}</small>` : ''}</div>`;
const secao = (t, corpo, nota = '') => `<section class="painel grafico"><h3>${t}</h3>${nota ? `<p class="nota" style="margin:2px 0 8px">${nota}</p>` : ''}${corpo}</section>`;

// ---------- csv ----------
function csv(alunos) {
  const c = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const linhas = [['nome', 'alcunha', 'regime', 'local', 'pontos', 'respostas_certas', 'nivel', 'aparelho', 'app_instalada', 'ultima_atividade', 'inscrito_em'].map(c).join(';')];
  for (const t of alunos) linhas.push([t.nome, t.alc, t.regime, t.local, t.xp, t.certas, NIVEIS[nivelDe(t.xp).indice][1], PLAT[t.pl] || t.pl, t.inst ? 'sim' : 'nao', new Date(t.vis).toISOString(), new Date(t.criado).toISOString()].map(c).join(';'));
  const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'arena-mat1-alunos.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function painelProfessor(root, voltar) {
  root.innerHTML = `<div class="linha" style="margin:2px 0 8px"><h1 style="font-size:34px">Painel do professor</h1><span class="espaco"></span><button class="btn fantasma" id="voltaLiga" style="min-height:42px">Voltar</button></div><div id="corpo" class="painel" style="text-align:center"><p class="nota">A carregar o painel...</p></div>`;
  root.querySelector('#voltaLiga').addEventListener('click', voltar);
  const r = await painelProf(); const corpo = root.querySelector('#corpo'); if (!corpo) return;
  if (r.erro) { corpo.innerHTML = `<p class="giz">${r.erro === 'rede' ? 'Sem ligação ao servidor.' : 'Não foi possível abrir o painel.'}</p>`; return; }
  corpo.remove();
  const agora = r.agora || Date.now(), todos = r.lista, alunos = todos.filter((t) => !t.prof), n = alunos.length;

  // resumo
  const ativos24 = alunos.filter((t) => agora - t.vis < 86400000).length, ativos7 = alunos.filter((t) => agora - t.vis < 7 * 86400000).length;
  const inst = alunos.filter((t) => t.inst).length, pts = soma(alunos.map((t) => t.xp)), certas = soma(alunos.map((t) => t.certas)), semTreino = alunos.filter((t) => !t.certas).length;
  const d = diasAteTeste();
  let h = `<div class="kpis">${kpi(n, n === 1 ? 'jogador na liga' : 'jogadores na liga', d > 0 ? `${d} dias até ao teste` : '')}${kpi(ativos24, 'ativos nas últimas 24 h', `${ativos7} nos últimos 7 dias`)}${kpi(`${inst}`, 'com a app instalada', n ? `${pct(inst, n)}% dos jogadores` : '')}${kpi(certas, 'respostas certas', `${semTreino} ainda sem treinar`)}${kpi(pts, 'pontos de liga', n ? `média de ${Math.round(pts / n)} por jogador` : '')}${kpi(r.dias.reduce((m, x) => Math.max(m, x.c), 0), 'recorde diário de respostas', 'nos últimos 14 dias')}</div>`;
  h += `<p class="nota" style="margin:8px 2px 0">Só entram aqui os alunos que aceitaram entrar na liga. Quem usa a app sem entrar na liga não é contado.</p>`;

  // atividade
  const dl = (x) => { const dt = new Date(x.d + 'T12:00:00Z'); return `${'DSTQQSS'[dt.getUTCDay()]}<br>${dt.getUTCDate()}`; };
  h += secao('Respostas certas por dia', colunas(r.dias.map((x) => ({ r: x.d, v: x.c })), { rot: (i, k) => dl(r.dias[k]) }), 'Últimos 14 dias, só exercícios de treino conferidos pelo servidor.');
  h += secao('Alunos ativos por dia', colunas(r.dias.map((x) => ({ r: x.d, v: x.a })), { cor: 'var(--ouro)', rot: (i, k) => dl(r.dias[k]) }), 'Quantos alunos diferentes treinaram em cada dia.');
  const dias14 = r.dias.map((x) => x.d), insc = dias14.map((dia) => ({ r: dia, v: alunos.filter((t) => diaChave(new Date(t.criado)) <= dia).length }));
  h += secao('Inscritos acumulados', colunas(insc, { cor: 'var(--violeta)', rot: (i, k) => dl(r.dias[k]) }), 'Quantos jogadores já tinham entrado na liga, dia a dia.');

  // turmas e niveis
  const grupos = {}; for (const t of alunos) { const k = turma(t); (grupos[k] ||= []).push(t); }
  h += secao('Jogadores por turma', Object.keys(grupos).length ? barrasH(Object.entries(grupos).sort((a, b) => b[1].length - a[1].length).map(([k, l]) => ({ r: k, v: l.length, txt: `${l.length} (média ${Math.round(soma(l.map((t) => t.xp)) / l.length)} pts)` }))) : '<p class="nota">Ainda ninguém entrou.</p>');
  const nivs = NIVEIS.map(([, nome], i) => ({ r: nome.replace('Aluno ', ''), v: alunos.filter((t) => nivelDe(t.xp).indice === i).length }));
  h += secao('Jogadores por nível', barrasH(nivs, 'var(--certo)'), 'Os níveis mostram quanto cada aluno já treinou.');

  // aparelhos
  const pl = {}; for (const t of alunos) pl[t.pl] = (pl[t.pl] || 0) + 1;
  h += secao('Aparelhos', `${barrasH(Object.entries(pl).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ r: PLAT[k] || k, v, txt: `${v} (${pct(v, n)}%)` })), 'var(--violeta)') || '<p class="nota">Sem dados.</p>'}<p class="nota" style="margin:10px 0 0">App instalada no ecrã inicial ou aberta no browser</p>${empilhada([{ r: 'Instalada', v: inst, cor: 'var(--certo)' }, { r: 'No browser', v: n - inst, cor: 'var(--giz-3)' }])}`, 'Cada aluno só aparece uma vez, no último aparelho que usou.');

  // quando estudam
  const pico = r.horas.indexOf(Math.max(...r.horas));
  h += secao('Quando estudam', colunas(r.horas.map((v, i) => ({ r: `${i} h`, v })), { valores: false, rot: (i, k) => (k % 3 === 0 ? k : '') }), soma(r.horas) ? `Horas do dia em Lisboa. O pico é às ${pico} h.` : 'Ainda sem dados.');

  // tipos de exercicio
  const tipos = Object.entries(r.tipos).map(([t, x]) => ({ t, ...x, e100: pct(x.e, x.n), p100: pct(x.p, x.n) }));
  const dificeis = tipos.filter((x) => x.n >= 5).sort((a, b) => b.e100 + b.p100 - (a.e100 + a.p100));
  h += secao('Tipos de exercício', `${barrasH(tipos.map((x) => ({ r: NOMES[x.t] || x.t, v: x.n, txt: `${x.n} certas` })), 'var(--ciano)')}<div class="tabela-t">${tipos.filter((x) => x.n).map((x) => `<div><b>${esc(NOMES[x.t] || x.t)}</b><span>${x.e100}% erraram antes de acertar</span><span>${x.p100}% usaram pistas</span></div>`).join('')}</div>`, dificeis.length ? `O tipo que mais custa é ${esc(NOMES[dificeis[0].t] || dificeis[0].t)}, com ${dificeis[0].e100}% de acertos depois de um erro e ${dificeis[0].p100}% com pistas.` : 'Ainda poucos dados para comparar os tipos.');

  // lista
  h += `<section class="painel grafico"><h3>Jogadores</h3><div class="filtros"><input id="busca" class="campo" type="search" placeholder="Procurar por nome ou alcunha" autocomplete="off"><select id="fTurma" class="campo"><option value="">Todas as turmas</option>${Object.keys(grupos).map((k) => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}</select><select id="ordem" class="campo"><option value="xp">Ordenar por pontos</option><option value="nome">Ordenar por nome</option><option value="vis">Ordenar por atividade recente</option><option value="criado">Ordenar por inscrição</option></select></div><div id="lista"></div><button class="btn fantasma" id="baixaCsv" style="margin-top:10px">Descarregar lista em CSV</button></section>`;
  root.insertAdjacentHTML('beforeend', h);

  const lista = root.querySelector('#lista');
  const linha = (t) => `<div class="jog" data-id="${esc(t.id)}">${av(t.v, 46)}<div class="jog-c"><b>${esc(t.nome)}${t.prof ? ' (professor)' : ''}</b><span class="nota">${t.alc ? `Alcunha: ${esc(t.alc)}${t.oc ? ' (escondida)' : ''}. ` : ''}${esc(turma(t))}</span><span class="nota">${esc(NIVEIS[nivelDe(t.xp).indice][1])}. ${esc(PLAT[t.pl] || t.pl)}${t.inst ? ', app instalada' : ', no browser'}. Ativo ${ha(t.vis, agora)}.</span></div><div class="jog-d"><span class="chip ouro">${icon('raio')}${t.xp}</span><span class="nota">${t.certas} certas</span></div>${t.prof ? '' : `<button class="btn fantasma" data-oc="${t.oc ? 0 : 1}">${t.oc ? 'Mostrar alcunha' : 'Esconder alcunha'}</button>`}</div>`;
  const filtrada = () => {
    const q = root.querySelector('#busca').value.trim().toLowerCase(), f = root.querySelector('#fTurma').value, o = root.querySelector('#ordem').value;
    const l = alunos.filter((t) => (!q || t.nome.toLowerCase().includes(q) || t.alc.toLowerCase().includes(q)) && (!f || turma(t) === f));
    l.sort((a, b) => (o === 'nome' ? a.nome.localeCompare(b.nome, 'pt') : o === 'vis' ? b.vis - a.vis : o === 'criado' ? b.criado - a.criado : b.xp - a.xp));
    return l;
  };
  const desenha = () => { const l = filtrada(); lista.innerHTML = l.length ? l.map(linha).join('') : '<p class="nota">Nenhum jogador encontrado.</p>'; };
  desenha();
  ['#busca', '#fTurma', '#ordem'].forEach((s) => root.querySelector(s).addEventListener('input', desenha));
  root.querySelector('#baixaCsv').addEventListener('click', () => { sfx.clique(); csv(filtrada()); });
  lista.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-oc]'); if (!b) return;
    const quer = b.dataset.oc === '1', id = b.closest('[data-id]').dataset.id; b.disabled = true;
    const ok = await ocultarAluno(id, quer); b.disabled = false;
    if (ok) { const t = alunos.find((x) => x.id === id); if (t) t.oc = quer; desenha(); toast(`<div><b>${quer ? 'Alcunha escondida' : 'Alcunha visível'}</b><br><span class="nota">${quer ? 'Passa a aparecer como "Aluno".' : 'Voltou a aparecer nas tabelas.'}</span></div>`); } else toast('<div><b>Não foi possível alterar</b><br><span class="nota">Tenta outra vez.</span></div>');
  });
}
