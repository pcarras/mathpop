// Perfil: compositor de avatar (itens desbloqueados por nivel), conquistas e definicoes.
import { estado, gravar, apagarTudo, AVATAR_PADRAO } from '../store.js';
import { nivelDe, NIVEIS } from '../rules.js';
import { icon } from '../ui/icons.js';
import { avatarHTML, CATEGORIAS, categoria, desbloqueado, avatarAleatorio, RARIDADE } from '../ui/avatar.js';
import { CONQUISTAS, progresso } from '../game/achievements.js';
import { sfx, alternarSom } from '../ui/sfx.js';
import { toast, festa } from '../ui/fx.js';

const limpar = (t) => String(t).replace(/[<>&"']/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
let aba = 'avatar', cat = 'top';

// categorias que so fazem sentido em certas combinacoes
function visivel(c, a) {
  if (c.id === 'hatColor') return /hat|Hat|turban|hijab/.test(a.top) && a.top !== 'none';
  if (c.id === 'clothingGraphic') return a.clothing === 'graphicShirt';
  if (c.id === 'accessoriesColor') return a.accessories !== 'none';
  return true;
}

export function perfil(root, go, _a, atualizarTopo) {
  const s = estado(), nv = nivelDe(s.xp);
  const cab = `<div class="tabs" role="tablist">${[['avatar', 'Avatar'], ['conq', 'Conquistas'], ['def', 'Definições']].map(([k, n]) => `<button role="tab" aria-selected="${aba === k}" data-aba="${k}">${n}</button>`).join('')}</div>`;
  const corpo = aba === 'avatar' ? vAvatar(s, nv) : aba === 'conq' ? vConq(s) : vDef(s);
  root.innerHTML = cab + corpo;
  root.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); aba = b.dataset.aba; perfil(root, go, _a, atualizarTopo); }));
  if (aba === 'avatar') ligarAvatar(root, s, nv, () => perfil(root, go, _a, atualizarTopo), atualizarTopo);
  if (aba === 'def') ligarDef(root, s, go, () => perfil(root, go, _a, atualizarTopo), atualizarTopo);
}

function vAvatar(s, nv) {
  const a = s.avatar;
  const cats = CATEGORIAS.filter((c) => visivel(c, a));
  if (!cats.find((c) => c.id === cat)) cat = cats[0].id;
  const c = categoria(cat);
  const itens = c.opcoes.map((o) => {
    const ok = desbloqueado(o, nv.indice), sel = String(a[c.id]) === String(o.id);
    let vista;
    if (c.tipo === 'cor') vista = `<span class="sw" style="background:${o.hex}"></span>`;
    else vista = avatarHTML({ ...a, [c.id]: o.id }, { s: 70 });
    const r = Math.min(5, o.nivel);
    return `<button class="item r${r} ${ok ? '' : 'trancado'}" data-id="${o.id}" aria-pressed="${sel}" aria-label="${o.nome}${ok ? '' : ', desbloqueia no nível ' + (o.nivel + 1)}">${vista}<span class="nome">${o.nome}</span>${ok ? '' : `<span class="lock">${icon('cadeado')}Nível ${o.nivel + 1}</span>`}</button>`;
  }).join('');
  return `
  <section class="palco"><div class="palco-av">${avatarHTML(a, { s: 200, nivel: nv.indice + 1 })}</div>
    <div class="linha" style="gap:8px;margin-top:8px;position:relative;z-index:1"><button class="btn fantasma" id="aleat">${icon('dado')} Aleatório</button><button class="btn fantasma" id="repor">${icon('repor')} Repor</button></div>
  </section>
  <div class="cats" role="group" aria-label="Categorias">${cats.map((k) => `<button data-cat="${k.id}" aria-pressed="${k.id === cat}">${k.nome}</button>`).join('')}</div>
  ${c.nota ? `<p class="nota" style="margin:0 0 8px">${c.nota}</p>` : ''}
  <div class="loja">${itens}</div>
  <p class="nota" style="margin-top:14px">Sobe de nível para desbloquear mais cabelos, cores, molduras e fundos. Tens ${nv.indice + 1} de ${NIVEIS.length} níveis.</p>`;
}

function ligarAvatar(root, s, nv, redesenhar, atualizarTopo) {
  root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { sfx.clique(); cat = b.dataset.cat; const y = scrollY; redesenhar(); scrollTo(0, y); }));
  root.querySelectorAll('.item').forEach((b) => b.addEventListener('click', () => {
    const c = categoria(cat), o = c.opcoes.find((x) => String(x.id) === b.dataset.id);
    if (!desbloqueado(o, nv.indice)) { sfx.erro(); sfx.vibrar(30); toast(`<span style="width:30px">${icon('cadeado')}</span><div><b>${o.nome}</b><br><span class="nota">Desbloqueia no nível ${o.nivel + 1}, ${RARIDADE[Math.min(5, o.nivel)]}.</span></div>`); return; }
    s.avatar[c.id] = typeof o.id === 'number' ? o.id : o.id; if (c.id === 'hairColor') s.avatar.facialHairColor = o.id;
    gravar(); sfx.xp(); const y = scrollY; redesenhar(); scrollTo(0, y); atualizarTopo();
  }));
  root.querySelector('#aleat').addEventListener('click', () => { s.avatar = avatarAleatorio(nv.indice); s.avatar.facialHairColor = s.avatar.hairColor; gravar(); sfx.bau(); festa(0.4, { x: 0.5, y: 0.3 }); redesenhar(); atualizarTopo(); });
  root.querySelector('#repor').addEventListener('click', () => { s.avatar = { ...AVATAR_PADRAO }; gravar(); sfx.clique(); redesenhar(); atualizarTopo(); });
}

function vConq(s) {
  const feitas = CONQUISTAS.filter((c) => s.conquistas[c.id]).length;
  return `<div class="linha" style="margin:4px 0 8px"><h2 style="margin:0">Conquistas</h2><span class="espaco"></span><span class="chip ouro">${icon('coroa')}${feitas} de ${CONQUISTAS.length}</span></div>` +
    CONQUISTAS.map((c) => { const p = progresso(c), ok = !!s.conquistas[c.id]; return `<div class="painel conq r${c.r} ${ok ? '' : 'bloq'}">
      <div class="medalha">${icon(ok ? c.ico : 'cadeado')}</div>
      <div style="flex:1;min-width:0"><div class="linha" style="gap:8px"><b>${c.nome}</b><span class="rar">${RARIDADE[c.r]}</span></div>
      <div class="nota" style="margin:2px 0 6px">${c.desc}</div>
      <div class="barra-p ouro" style="height:8px"><i style="width:${Math.round((100 * p.p) / p.alvo)}%"></i></div>
      <div class="nota" style="font-size:12px;margin-top:3px">${ok ? 'Desbloqueada em ' + s.conquistas[c.id] : p.p + ' de ' + p.alvo}</div></div></div>`; }).join('');
}

function vDef(s) {
  return `
  <h2 style="margin-top:6px">Definições</h2>
  <section class="painel">
    <label for="alc"><b>Alcunha</b></label>
    <p class="nota" style="margin:2px 0 8px">É o nome que aparece no ranking da turma. Até 16 caracteres. O teu nome verdadeiro só o professor vê.</p>
    <div class="linha"><input id="alc" maxlength="16" autocomplete="off" value="${(s.perfil.alcunha || '').replace(/"/g, '')}" placeholder="Ex.: Pivô Veloz" style="flex:1;min-width:0;padding:12px 14px;border-radius:14px;border:2px solid var(--borda-2);background:rgba(0,0,0,.35);color:var(--giz);font:700 17px var(--corpo)"><button class="btn" id="gravAlc">Guardar</button></div>
  </section>
  <section class="painel" style="margin-top:12px">
    <div class="linha"><div><b>Sons e vibração</b><div class="nota">Efeitos curtos ao acertar e ao subir de nível.</div></div><span class="espaco"></span><button class="btn fantasma" id="som" aria-pressed="${s.som !== false}">${icon(s.som !== false ? 'som' : 'mudo')} ${s.som !== false ? 'Ligados' : 'Desligados'}</button></div>
  </section>
  <section class="painel" style="margin-top:12px">
    <b>Os teus dados</b>
    <p class="nota" style="margin:2px 0 10px">Nesta versão de teste, o progresso fica só neste aparelho. Apagar remove pontos, avatar e conquistas.</p>
    <button class="btn erro" id="apagar">Apagar os meus dados</button>
  </section>
  <section class="painel" style="margin-top:12px">
    <b>Créditos</b>
    <p class="nota" style="margin:4px 0 0">Avatares: Avataaars, de Pablo Stanley, através da biblioteca DiceBear. Fórmulas: KaTeX. Confetes: canvas-confetti. Tipos de letra Big Shoulders Display, Figtree e Caveat, licença OFL. Exercícios e regras: Paulo Carrasco, ESGHT, Universidade do Algarve.</p>
  </section>`;
}

function ligarDef(root, s, go, redesenhar, atualizarTopo) {
  root.querySelector('#gravAlc').addEventListener('click', () => { s.perfil.alcunha = limpar(root.querySelector('#alc').value); gravar(); sfx.xp(); toast(`<div><b>Alcunha guardada</b><br><span class="nota">${s.perfil.alcunha || 'Sem alcunha: aparece um nome automático.'}</span></div>`); atualizarTopo(); });
  root.querySelector('#som').addEventListener('click', () => { alternarSom(); sfx.clique(); redesenhar(); atualizarTopo(); });
  root.querySelector('#apagar').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.sim) { apagarTudo(); aba = 'avatar'; go('home'); location.reload(); return; }
    b.dataset.sim = '1'; b.textContent = 'Toca outra vez para confirmar';
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sim; b.textContent = 'Apagar os meus dados'; } }, 4000);
  });
}
