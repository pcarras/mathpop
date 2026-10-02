// Perfil: compositor de avatar (itens desbloqueados por nivel), conquistas e definicoes.
import { estado, gravar, apagarTudo, AVATAR_PADRAO } from '../store.js';
import { nivelDe, NIVEIS } from '../rules.js';
import { icon } from '../ui/icons.js';
import { avatarHTML, categoria, desbloqueado, nomeNivelDoItem, RARIDADE, CABELOS, CHAPEUS, PENTEADO_INICIAL } from '../ui/avatar.js';
import { CONQUISTAS, progresso } from '../game/achievements.js';
import { sfx, alternarSom } from '../ui/sfx.js';
import { toast, festa } from '../ui/fx.js';
import { camposHTML, ligarCampos, valido } from './entrada.js';
import { naLiga, sairDaLiga, agendar, disponivelAgora, eProfessor, tornarProfessor } from '../game/liga.js';
import { conteudo as instConteudo, ligar as instLigar } from '../ui/instalar.js';
import { temConta, emailDaConta, sincronizarNuvem } from '../game/conta.js';
import { ecraCriar, ecraEntrar, ecraTrocar } from './conta.js';

let aba = 'avatar', passoId = 'quem';

export function perfil(root, go, _a, atualizarTopo) {
  const s = estado(), nv = nivelDe(s.xp);
  const cab = `<div class="tabs" role="tablist">${[['avatar', 'Avatar'], ['conq', 'Conquistas'], ['def', 'Definições']].map(([k, n]) => `<button role="tab" aria-selected="${aba === k}" data-aba="${k}">${n}</button>`).join('')}</div>`;
  const corpo = aba === 'avatar' ? vAvatar(s, nv) : aba === 'conq' ? vConq(s) : vDef(s);
  root.innerHTML = cab + corpo;
  root.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); aba = b.dataset.aba; perfil(root, go, _a, atualizarTopo); }));
  if (aba === 'avatar') ligarAvatar(root, s, nv, () => perfil(root, go, _a, atualizarTopo), atualizarTopo, go);
  if (aba === 'def') ligarDef(root, s, go, () => perfil(root, go, _a, atualizarTopo), atualizarTopo);
}

// Assistente do avatar: um passo de cada vez, por ordem. Cada passo tem uma ou mais seccoes.
const GENEROS = [{ id: 'm', nome: 'Mulher', nivel: 0 }, { id: 'h', nome: 'Homem', nivel: 0 }];
const TODOS_CHAPEUS = [...new Set([...CHAPEUS.h, ...CHAPEUS.m])];
const PASSOS = [
  { id: 'quem', nome: 'Quem és', secoes: [{ cat: 'genero' }] },
  { id: 'pele', nome: 'Pele', secoes: [{ cat: 'skinColor' }] },
  { id: 'cabelo', nome: 'Cabelo', secoes: [{ cat: 'top', titulo: 'Penteado', lista: 'cabelo' }, { cat: 'top', titulo: 'Chapéus e gorros', lista: 'chapeu' }, { cat: 'hatColor', titulo: 'Cor do chapéu', se: (a) => TODOS_CHAPEUS.includes(a.top) }] },
  { id: 'cor', nome: 'Cor do cabelo', secoes: [{ cat: 'hairColor' }], se: (a) => a.top !== 'none' },
  { id: 'barba', nome: 'Barba', secoes: [{ cat: 'facialHair' }], se: (a) => a.genero !== 'm' },
  { id: 'olhos', nome: 'Olhos', secoes: [{ cat: 'eyes' }] },
  { id: 'boca', nome: 'Boca', secoes: [{ cat: 'mouth' }] },
  { id: 'oculos', nome: 'Óculos', secoes: [{ cat: 'accessories' }, { cat: 'accessoriesColor', titulo: 'Cor dos óculos', se: (a) => a.accessories !== 'none' }] },
  { id: 'roupa', nome: 'Roupa', secoes: [{ cat: 'clothing' }, { cat: 'clothingGraphic', titulo: 'Estampa', se: (a) => a.clothing === 'graphicShirt' }, { cat: 'clothesColor', titulo: 'Cor da roupa' }] },
  { id: 'estilo', nome: 'Fundo e moldura', secoes: [{ cat: 'fundo', titulo: 'Fundo' }, { cat: 'moldura', titulo: 'Moldura' }] },
];
const passosAtivos = (a) => PASSOS.filter((p) => !p.se || p.se(a));
const catDe = (id) => (id === 'genero' ? { id: 'genero', tipo: 'genero', opcoes: GENEROS } : categoria(id));

function itemHTML(c, o, a, nv, lista) {
  const ok = desbloqueado(o, nv.indice), sel = String(a[c.id]) === String(o.id);
  let vista;
  if (c.tipo === 'cor') vista = `<span class="sw" style="background:${o.hex}"></span>`;
  else if (c.tipo === 'genero') vista = avatarHTML({ ...a, genero: o.id, top: o.id === 'm' ? PENTEADO_INICIAL.m : PENTEADO_INICIAL.h, facialHair: 'none' }, { s: 92 });
  else vista = avatarHTML({ ...a, [c.id]: o.id }, { s: 70 });
  const r = Math.min(5, o.nivel);
  return `<button class="item r${r} ${c.tipo === 'genero' ? 'grande' : ''} ${ok ? '' : 'trancado'}" data-cat="${c.id}" data-id="${o.id}" aria-pressed="${sel}" aria-label="${o.nome}${ok ? '' : ', desbloqueia em ' + nomeNivelDoItem(o)}">${vista}<span class="nome">${o.nome}</span>${ok ? '' : `<span class="lock">${icon('cadeado')}${nomeNivelDoItem(o).replace('Aluno ', '')}</span>`}</button>`;
}

function vAvatar(s, nv) {
  const a = s.avatar, g = a.genero === 'm' ? 'm' : 'h';
  const lista = passosAtivos(a);
  let i = lista.findIndex((p) => p.id === passoId); if (i < 0) { i = 0; passoId = lista[0].id; }
  const p = lista[i];
  const seccoes = p.secoes.filter((x) => !x.se || x.se(a)).map((x) => {
    const c = catDe(x.cat); let ops = c.opcoes;
    if (x.lista === 'cabelo') ops = ops.filter((o) => CABELOS[g].includes(o.id));
    if (x.lista === 'chapeu') ops = ops.filter((o) => CHAPEUS[g].includes(o.id));
    return `<section class="sec">${x.titulo ? `<h3 class="sec-t">${x.titulo}</h3>` : ''}${c.nota ? `<p class="nota" style="margin:0 0 8px">${c.nota}</p>` : ''}<div class="loja ${c.tipo === 'genero' ? 'dois' : ''}">${ops.map((o) => itemHTML(c, o, a, nv)).join('')}</div></section>`;
  }).join('');
  const ultimo = i === lista.length - 1;
  return `
  <section class="palco compacto"><div class="palco-av">${avatarHTML(a, { s: 124, nivel: nv.indice + 1, anim: true })}</div>
    <div class="palco-txt"><div class="nota">Passo ${i + 1} de ${lista.length}</div><h2 class="passo-t">${p.nome}</h2>
      <div class="linha" style="gap:8px;margin-top:8px"><button class="btn fantasma peq" id="repor">${icon('repor')} Repor</button></div></div>
  </section>
  <div class="pontos" role="group" aria-label="Passos do avatar">${lista.map((x, k) => `<button data-passo="${x.id}" aria-label="${x.nome}" aria-current="${k === i}" class="${k < i ? 'feito' : ''}"></button>`).join('')}</div>
  ${seccoes}
  <div class="nav-assist"><button class="btn fantasma" id="ant" ${i === 0 ? 'disabled' : ''}>Anterior</button><button class="btn grande" id="seg">${ultimo ? 'Concluir' : 'Seguinte'}</button></div>
  <p class="nota" style="margin-top:14px">Sobe de nível para desbloquear mais penteados, cores, molduras e fundos. Estás em ${nv.titulo}, nível ${nv.indice + 1} de ${NIVEIS.length}.</p>`;
}

function ligarAvatar(root, s, nv, redesenhar, atualizarTopo, go) {
  const a = s.avatar, topo = () => scrollTo({ top: 0, behavior: 'auto' });
  const lista = () => passosAtivos(s.avatar);
  const ir = (id) => { passoId = id; sfx.clique(); redesenhar(); topo(); };
  root.querySelectorAll('[data-passo]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.passo)));
  root.querySelector('#ant')?.addEventListener('click', () => { const l = lista(), k = l.findIndex((x) => x.id === passoId); if (k > 0) ir(l[k - 1].id); });
  root.querySelector('#seg').addEventListener('click', () => {
    const l = lista(), k = l.findIndex((x) => x.id === passoId);
    if (k < l.length - 1) return ir(l[k + 1].id);
    sfx.bau(); festa(0.5, { x: 0.5, y: 0.3 }); passoId = 'quem'; toast(`<div><b>Avatar guardado</b><br><span class="nota">Já aparece no topo e na página inicial.</span></div>`); atualizarTopo(); agendar(2000); go('home');
  });
  root.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => {
    const c = catDe(b.dataset.cat), o = c.opcoes.find((x) => String(x.id) === b.dataset.id);
    if (!desbloqueado(o, nv.indice)) { sfx.erro(); sfx.vibrar(30); toast(`<span style="width:30px">${icon('cadeado')}</span><div><b>${o.nome}</b><br><span class="nota">Desbloqueia em ${nomeNivelDoItem(o)}, ${RARIDADE[Math.min(5, o.nivel)]}.</span></div>`); return; }
    if (c.id === 'genero') {
      a.genero = o.id;
      if (![...CABELOS[o.id], ...CHAPEUS[o.id]].includes(a.top)) a.top = PENTEADO_INICIAL[o.id];
      if (o.id === 'm') a.facialHair = 'none';
    } else a[c.id] = o.id;
    if (c.id === 'hairColor') a.facialHairColor = o.id;
    gravar(); sfx.xp(); const y = scrollY; redesenhar(); scrollTo(0, y); atualizarTopo();
  }));
  root.querySelector('#repor').addEventListener('click', () => { s.avatar = { ...AVATAR_PADRAO, genero: a.genero === 'm' ? 'm' : 'h', top: PENTEADO_INICIAL[a.genero === 'm' ? 'm' : 'h'] }; gravar(); sfx.clique(); redesenhar(); atualizarTopo(); });
}

function vConq(s) {
  const feitas = CONQUISTAS.filter((c) => s.conquistas[c.id]).length;
  return `<div class="linha" style="margin:4px 0 8px"><h2 style="margin:0">Conquistas</h2><span class="espaco"></span><span class="chip ouro">${icon('coroa')}${feitas} de ${CONQUISTAS.length}</span></div>` +
    CONQUISTAS.map((c) => { const p = progresso(c), ok = !!s.conquistas[c.id]; return `<div class="painel conq r${c.r} ${ok ? '' : 'bloq'}">
      <div class="medalha">${icon(ok ? c.ico : 'cadeado')}</div>
      <div style="flex:1;min-width:0"><div class="linha" style="gap:8px"><b>${c.nome}</b><span class="rar">${RARIDADE[c.r]}</span></div>
      <div class="nota" style="margin:2px 0 6px">${c.desc}</div>
      <div class="barra-p ouro" style="height:8px"><i style="width:${Math.round((100 * p.p) / p.alvo)}%"></i></div>
      <div class="nota" style="font-size:12px;margin-top:3px">${ok ? 'Desbloqueada em ' + s.conquistas[c.id].split('-').reverse().join('/') : p.p + ' de ' + p.alvo}</div></div></div>`; }).join('');
}

function contaHTML() {
  if (temConta()) return `<p class="nota" style="margin:2px 0 10px">Conta: <b>${emailDaConta().replace(/[<>&"]/g, '')}</b>. O teu progresso é o mesmo em todos os aparelhos onde entrares com este email.</p>
    <div class="linha" style="gap:8px;flex-wrap:wrap"><button class="btn" id="sincNuvem">Sincronizar agora</button><button class="btn fantasma" id="mudaSenha">Mudar palavra-passe</button></div>
    <p class="nota" style="margin:12px 0 8px">Apagar remove do servidor a conta, o progresso guardado e os teus pontos de liga. O que está neste aparelho fica.</p>
    <button class="btn fantasma" id="sairLiga">Apagar a conta e os meus dados do servidor</button>`;
  if (naLiga()) return `<p class="nota" style="margin:2px 0 10px">Estás na liga, mas sem email. Associa um email para guardar o progresso e usá-lo noutros aparelhos.</p>
    <button class="btn ouro" id="criaConta">Associar email</button>
    <p class="nota" style="margin:12px 0 8px">Sair apaga do servidor os teus dados e os teus pontos de liga.</p><button class="btn fantasma" id="sairLiga">Sair da liga e apagar os meus dados do servidor</button>`;
  return `<p class="nota" style="margin:2px 0 10px">Ainda não tens conta. Com o email entras na liga e levas o progresso para qualquer aparelho.</p>
    <div class="linha" style="gap:8px;flex-wrap:wrap"><button class="btn ouro" id="criaConta">Criar conta</button><button class="btn fantasma" id="tenhoContaDef">Já tenho conta</button></div>`;
}

function vDef(s) {
  return `
  <h2 style="margin-top:6px">Definições</h2>
  <section class="painel">
    <b>Os teus dados</b>
    <p class="nota" style="margin:2px 0 10px">Servem para te colocar na liga da tua turma. Só são enviados para o servidor se tiveres conta.</p>
    ${camposHTML(s.perfil, 'd')}
    <button class="btn" id="gravDados" style="margin-top:14px" disabled>Guardar</button>
  </section>
  ${disponivelAgora() ? `<section class="painel" style="margin-top:12px"><b>Conta e liga</b>${contaHTML()}</section>` : ''}
  ${disponivelAgora() && naLiga() ? `<section class="painel" style="margin-top:12px"><details${eProfessor() ? ' open' : ''}><summary style="cursor:pointer;font-weight:700">Acesso do professor</summary>${eProfessor() ? `<p class="nota" style="margin:8px 0 0">Estás reconhecido como professor. Ficas fora da tabela e vês o painel na página Liga.</p>` : `<p class="nota" style="margin:8px 0 10px">Só para o professor da UC. Escreve o código para seres reconhecido.</p><input id="codProf" class="campo" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Código do professor"><button class="btn" id="okProf" style="margin-top:10px">Confirmar</button><p class="nota" id="erroProf" style="margin:8px 0 0;color:var(--erro)"></p>`}</details></section>` : ''}
  <section class="painel" style="margin-top:12px">
    <div class="linha"><div><b>Sons e vibração</b><div class="nota">Efeitos curtos ao acertar e ao subir de nível.</div></div><span class="espaco"></span><button class="btn fantasma" id="som" aria-pressed="${s.som !== false}">${icon(s.som !== false ? 'som' : 'mudo')} ${s.som !== false ? 'Ligados' : 'Desligados'}</button></div>
  </section>
  <section class="painel instalar" id="instalar" style="margin-top:12px">${instConteudo({ comDispensar: false })}</section>
  <section class="painel" style="margin-top:12px">
    <b>Apagar tudo</b>
    <p class="nota" style="margin:2px 0 10px">Apaga pontos, avatar, conquistas e dados deste aparelho. Se tens conta, o progresso continua guardado nela e volta quando entrares outra vez. Para apagar também do servidor, usa Apagar a conta, acima.</p>
    <button class="btn erro" id="apagar">Apagar os meus dados</button>
  </section>
  <section class="painel" style="margin-top:12px">
    <b>Créditos</b>
    <p class="nota" style="margin:4px 0 0">Avatares: Avataaars, de Pablo Stanley, através da biblioteca DiceBear. Fórmulas: KaTeX. Confetes: canvas-confetti. Tipos de letra Big Shoulders Display e Figtree, licença OFL. Exercícios e regras: Paulo Carrasco, ESGHT, Universidade do Algarve.</p>
  </section>`;
}

function ligarDef(root, s, go, redesenhar, atualizarTopo) {
  const ci = root.querySelector('#instalar'); if (ci) instLigar(ci, redesenhar);
  const ler = ligarCampos(root, 'd', () => { const p = ler(), o = s.perfil; root.querySelector('#gravDados').disabled = !valido(p) || (p.nome === o.nome && p.regime === o.regime && p.local === o.local && p.alcunha === (o.alcunha || '') && (p.teste || o.teste || '') === (o.teste || '')); });
  root.querySelector('#gravDados').addEventListener('click', () => { const p = ler(); if (!valido(p)) return; p.teste = p.teste || s.perfil.teste || ''; Object.assign(s.perfil, p); gravar(); sfx.xp(); agendar(1500); sincronizarNuvem(); toast(`<div><b>Dados guardados</b><br><span class="nota">${p.nome}, ${p.regime === 'diurno' ? 'diurno' : 'noturno'}, ${p.local === 'faro' ? 'Faro' : 'Portimão'}.</span></div>`); atualizarTopo(); redesenhar(); });
  const volta = () => { atualizarTopo(); redesenhar(); };
  root.querySelector('#criaConta')?.addEventListener('click', () => { sfx.clique(); ecraCriar(root, { aoFim: volta, aoVoltar: volta }); });
  root.querySelector('#tenhoContaDef')?.addEventListener('click', () => { sfx.clique(); ecraEntrar(root, { aoFim: volta, aoCriar: () => ecraCriar(root, { aoFim: volta, aoVoltar: volta }), aoVoltar: volta }); });
  root.querySelector('#mudaSenha')?.addEventListener('click', () => { sfx.clique(); ecraTrocar(root, { aoFim: volta, aoVoltar: volta }); });
  root.querySelector('#sincNuvem')?.addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true; b.textContent = 'A sincronizar...'; const r = await sincronizarNuvem({ forcar: true });
    toast(r.ok ? '<div><b>Tudo sincronizado</b><br><span class="nota">O progresso está igual em todos os aparelhos.</span></div>' : '<div><b>Sem ligação</b><br><span class="nota">Tenta outra vez quando houver rede.</span></div>'); volta();
  });
  root.querySelector('#okProf')?.addEventListener('click', async (e) => {
    const b = e.currentTarget, c = root.querySelector('#codProf').value.trim(), er = root.querySelector('#erroProf'); if (!c) { er.textContent = 'Escreve o código.'; return; }
    b.disabled = true; er.textContent = ''; const r = await tornarProfessor(c); b.disabled = false;
    if (r.ok) { sfx.bau(); toast('<div><b>Professor reconhecido</b><br><span class="nota">Ficas fora da tabela. O painel está na página Liga.</span></div>'); atualizarTopo(); redesenhar(); return; }
    er.textContent = { codigo: 'Código errado.', muitas: 'Demasiadas tentativas. Tenta daqui a uma hora.', sem_codigo: 'O código do professor ainda não está configurado.', rede: 'Sem ligação ao servidor.' }[r.erro] || 'Não foi possível confirmar agora.';
  });
  root.querySelector('#sairLiga')?.addEventListener('click', async (e) => {
    const b = e.currentTarget, rotulo = b.textContent;
    if (!b.dataset.sim) { b.dataset.sim = '1'; b.textContent = 'Toca outra vez para confirmar'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sim; b.textContent = rotulo; } }, 4000); return; }
    b.disabled = true; const ok = await sairDaLiga(); toast(ok ? '<div><b>Dados apagados do servidor</b><br><span class="nota">A conta e os pontos de liga foram removidos.</span></div>' : '<div><b>Sem ligação</b><br><span class="nota">Não foi possível apagar agora. Tenta outra vez com rede.</span></div>'); redesenhar();
  });
  root.querySelector('#som').addEventListener('click', () => { alternarSom(); sfx.clique(); redesenhar(); atualizarTopo(); });
  root.querySelector('#apagar').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.sim) { apagarTudo(); aba = 'avatar'; go('home'); location.reload(); return; }
    b.dataset.sim = '1'; b.textContent = 'Toca outra vez para confirmar';
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sim; b.textContent = 'Apagar os meus dados'; } }, 4000);
  });
}
