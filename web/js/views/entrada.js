// Ecrã de entrada: nome, regime e local. Serve para agrupar a liga por turma. Fica só neste aparelho até existir servidor.
import { estado, gravar } from '../store.js';
import { avatarHTML } from '../ui/avatar.js';
import { sfx } from '../ui/sfx.js';
import { festa } from '../ui/fx.js';

export const REGIMES = [['diurno', 'Diurno'], ['noturno', 'Noturno']];
export const LOCAIS = [['portimao', 'Portimão'], ['faro', 'Faro']];
export const nomeRegime = (id) => (REGIMES.find((r) => r[0] === id) || [, ''])[1];
export const nomeLocal = (id) => (LOCAIS.find((r) => r[0] === id) || [, ''])[1];
export const perfilCompleto = (p) => !!(p && p.nome && p.regime && p.local);
const limpar = (t, n) => String(t).replace(/[<>&"']/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t || '').replace(/[<>&"]/g, '');

// campos partilhados com as Definições
export function camposHTML(p, pref = 'e') {
  const seg = (nome, lista, atual) => `<div class="seg" role="radiogroup" aria-label="${nome}">${lista.map(([id, n]) => `<button type="button" role="radio" aria-checked="${atual === id}" data-seg="${nome}" data-v="${id}">${n}</button>`).join('')}</div>`;
  return `
    <label class="campo-t" for="${pref}-nome">Nome</label>
    <input class="campo" id="${pref}-nome" maxlength="40" autocomplete="name" value="${esc(p.nome)}" placeholder="Nome e apelido">
    <div class="campo-t">Regime</div>${seg('regime', REGIMES, p.regime)}
    <div class="campo-t">Local</div>${seg('local', LOCAIS, p.local)}
    <label class="campo-t" for="${pref}-alc">Alcunha <span class="nota" style="font-weight:500">(opcional, é a que aparece na liga)</span></label>
    <input class="campo" id="${pref}-alc" maxlength="16" autocomplete="off" value="${esc(p.alcunha)}" placeholder="Ex.: Pivô Veloz">`;
}
export function ligarCampos(root, pref, aoMudar) {
  const v = { regime: root.querySelector('[data-seg=regime][aria-checked=true]')?.dataset.v || '', local: root.querySelector('[data-seg=local][aria-checked=true]')?.dataset.v || '' };
  root.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => {
    v[b.dataset.seg] = b.dataset.v; sfx.clique();
    root.querySelectorAll(`[data-seg=${b.dataset.seg}]`).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    aoMudar?.();
  }));
  const ler = () => ({ nome: limpar(root.querySelector(`#${pref}-nome`).value, 40), regime: v.regime, local: v.local, alcunha: limpar(root.querySelector(`#${pref}-alc`).value, 16) });
  root.querySelectorAll('.campo').forEach((i) => i.addEventListener('input', () => aoMudar?.()));
  return ler;
}
export const valido = (p) => p.nome.length >= 2 && !!p.regime && !!p.local;

export function entrada(root, go, _t, atualizarTopo) {
  const s = estado(); document.body.classList.add('imersivo');
  root.innerHTML = `
  <section class="entrada">
    <div class="entrada-av">${avatarHTML(s.avatar, { s: 132, anim: true })}</div>
    <h1 class="entrada-t">Arena Mat I</h1>
    <p class="entrada-p">Antes de entrares, diz-nos quem és. Assim podes aparecer na liga da tua turma.</p>
    <div class="painel entrada-f">${camposHTML(s.perfil)}</div>
    <button class="btn grande ouro" id="entrar" disabled>Entrar na Arena</button>
    <p class="nota" style="margin:12px 4px 0">O nome serve para o professor te reconhecer. Na liga aparece apenas a alcunha ou o teu primeiro nome. Por agora estes dados ficam só neste aparelho, e podes mudá-los em Perfil, Definições.</p>
  </section>`;
  const ler = ligarCampos(root, 'e', () => { root.querySelector('#entrar').disabled = !valido(ler()); });
  root.querySelector('#entrar').disabled = !valido(ler());
  root.querySelector('#entrar').addEventListener('click', () => {
    const p = ler(); if (!valido(p)) return;
    Object.assign(s.perfil, p, { id: s.perfil.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)), criado: s.perfil.criado || Date.now() });
    gravar(); sfx.bau(); festa(0.6, { x: 0.5, y: 0.3 });
    document.body.classList.remove('imersivo'); atualizarTopo(); go('home');
  });
}
