// Ecrã de entrada: nome, regime e local. Serve para agrupar a liga por turma. Fica só neste aparelho até existir servidor.
import { estado, gravar } from '../store.js';
import { avatarHTML } from '../ui/avatar.js';
import { sfx } from '../ui/sfx.js';
import { festa } from '../ui/fx.js';
import { ecraEntrar } from './conta.js';

export const REGIMES = [['diurno', 'Diurno'], ['noturno', 'Noturno']];
export const LOCAIS = [['portimao', 'Portimão'], ['faro', 'Faro']];
export const nomeRegime = (id) => (REGIMES.find((r) => r[0] === id) || [, ''])[1];
export const nomeLocal = (id) => (LOCAIS.find((r) => r[0] === id) || [, ''])[1];
export const perfilCompleto = (p) => !!(p && p.nome && p.regime && p.local);
const limpar = (t, n) => String(t).replace(/[<>&"']/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t || '').replace(/[<>&"]/g, '');
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const hojeISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

// campos partilhados com as Definições
export function camposHTML(p, pref = 'e') {
  const seg = (nome, lista, atual) => `<div class="seg" role="radiogroup" aria-label="${nome}">${lista.map(([id, n]) => `<button type="button" role="radio" aria-checked="${atual === id}" data-seg="${nome}" data-v="${id}">${n}</button>`).join('')}</div>`;
  return `
    <label class="campo-t" for="${pref}-nome">Nome</label>
    <input class="campo" id="${pref}-nome" maxlength="40" autocomplete="name" value="${esc(p.nome)}" placeholder="Nome e apelido">
    <div class="campo-t">Regime</div>${seg('regime', REGIMES, p.regime)}
    <div class="campo-t">Local</div>${seg('local', LOCAIS, p.local)}
    <label class="campo-t" for="${pref}-alc">Alcunha <span class="nota" style="font-weight:500">(opcional, é a que aparece na liga)</span></label>
    <input class="campo" id="${pref}-alc" maxlength="16" autocomplete="off" value="${esc(p.alcunha)}" placeholder="Ex.: Pivô Veloz">
    <label class="campo-t" for="${pref}-teste">Dia do teste da tua turma</label>
    <input class="campo" id="${pref}-teste" type="date" min="${hojeISO()}" max="2027-06-30" value="${DATA_RE.test(p.teste || '') ? p.teste : ''}">`;
}
export function ligarCampos(root, pref, aoMudar) {
  const v = { regime: root.querySelector('[data-seg=regime][aria-checked=true]')?.dataset.v || '', local: root.querySelector('[data-seg=local][aria-checked=true]')?.dataset.v || '' };
  root.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => {
    v[b.dataset.seg] = b.dataset.v; sfx.clique();
    root.querySelectorAll(`[data-seg=${b.dataset.seg}]`).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    aoMudar?.();
  }));
  const ler = () => ({ nome: limpar(root.querySelector(`#${pref}-nome`).value, 40), regime: v.regime, local: v.local, alcunha: limpar(root.querySelector(`#${pref}-alc`).value, 16), teste: DATA_RE.test(root.querySelector(`#${pref}-teste`).value) ? root.querySelector(`#${pref}-teste`).value : '' });
  root.querySelectorAll('.campo').forEach((i) => { i.addEventListener('input', () => aoMudar?.()); i.addEventListener('change', () => aoMudar?.()); });
  return ler;
}
export const valido = (p, exigeTeste = false) => p.nome.length >= 2 && !!p.regime && !!p.local && (!exigeTeste || DATA_RE.test(p.teste || ''));

export function entrada(root, go, _t, atualizarTopo) {
  const s = estado(); document.body.classList.add('imersivo');
  root.innerHTML = `
  <section class="entrada">
    <div class="entrada-av">${avatarHTML(s.avatar, { s: 132, anim: true })}</div>
    <h1 class="entrada-t">Arena Mat I</h1>
    <p class="entrada-p">Antes de entrares, diz-nos quem és. Assim podes competir na liga da tua turma.</p>
    <div class="painel entrada-f">${camposHTML(s.perfil)}</div>
    <button class="btn grande ouro" id="entrar" disabled>Entrar na Arena</button>
    <button class="btn fantasma" id="tenhoConta" style="margin-top:10px">Já tenho conta (email)</button>
    <p class="nota" style="margin:12px 4px 0">Estes dados ficam neste aparelho. Só seguem para o servidor se criares conta e entrares na liga, e aí os colegas veem apenas a alcunha (ou o primeiro nome). Podes mudá-los em Perfil, Definições.</p>
  </section>`;
  const ler = ligarCampos(root, 'e', () => { root.querySelector('#entrar').disabled = !valido(ler(), true); });
  root.querySelector('#entrar').disabled = !valido(ler(), true);
  root.querySelector('#tenhoConta').addEventListener('click', () => { sfx.clique(); const volta = () => entrada(root, go, _t, atualizarTopo); ecraEntrar(root, { aoFim: () => { document.body.classList.remove('imersivo'); atualizarTopo(); go('home'); }, aoVoltar: volta }); });
  root.querySelector('#entrar').addEventListener('click', () => {
    const p = ler(); if (!valido(p, true)) return;
    Object.assign(s.perfil, p, { id: s.perfil.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)), criado: s.perfil.criado || Date.now() });
    gravar(); sfx.bau(); festa(0.6, { x: 0.5, y: 0.3 });
    document.body.classList.remove('imersivo'); atualizarTopo(); go('home');
  });
}

// alunos que ja usavam a app antes do dia do teste ser pedido: nao avancam sem o indicar (a data pode ser diferente por turma)
export const falta_teste = (p) => perfilCompleto(p) && !DATA_RE.test(p.teste || '');
export function pedirTeste(root, go, atualizarTopo, sincronizar) {
  const s = estado(); document.body.classList.add('imersivo');
  root.innerHTML = `
  <section class="entrada">
    <div class="entrada-av">${avatarHTML(s.avatar, { s: 112, anim: true })}</div>
    <h1 class="entrada-t">Falta uma coisa</h1>
    <p class="entrada-p">Indica o dia do teste da tua turma. Serve para a contagem decrescente e para o professor saber quando é o teste de cada turma. Os pontos que já ganhaste ficam como estão.</p>
    <div class="painel entrada-f">
      <label class="campo-t" for="pt-teste">Dia do teste da tua turma</label>
      <input class="campo" id="pt-teste" type="date" min="${hojeISO()}" max="2027-06-30">
    </div>
    <button class="btn grande ouro" id="pt-ok" disabled>Continuar</button>
    <p class="nota" style="margin:12px 4px 0">Podes mudar o dia em Perfil, Definições.</p>
  </section>`;
  const inp = root.querySelector('#pt-teste'), bt = root.querySelector('#pt-ok'), ok = () => DATA_RE.test(inp.value) && inp.value >= hojeISO();
  const f = () => { bt.disabled = !ok(); };
  inp.addEventListener('input', f); inp.addEventListener('change', f);
  bt.addEventListener('click', () => { if (!ok()) return; s.perfil.teste = inp.value; gravar(); sfx.bau(); sincronizar?.(); document.body.classList.remove('imersivo'); atualizarTopo(); go('home'); });
}
