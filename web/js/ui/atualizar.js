// Atualizacoes automaticas: a app pergunta ao servidor se ha versao nova (ao abrir, ao voltar ao primeiro plano
// e de 10 em 10 minutos). Se houver, avisa o aluno e atualiza, sem interromper um exercicio a meio.
import { VERSAO } from '../versao.js';
import { toast } from './fx.js';

const build = () => (typeof window !== 'undefined' && window.__BUILD) || {};
export const versaoTexto = () => `v${VERSAO}`;
export const buildCurto = () => (build().sha || '').slice(0, 7);

const LS = 'mat1.atu';
const lerTent = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
const gravarTent = (o) => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch { /* sem armazenamento */ } };
let pendente = null, aplicando = false, banner = null, espera = null;

async function remota() {
  const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('sem versao');
  return r.json();
}
const naSessao = () => document.body.classList.contains('imersivo');

async function aplicar() {
  if (aplicando) return; aplicando = true;
  try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch { /* sem service worker */ }
  const t = lerTent(); gravarTent({ sha: pendente.sha, n: t.sha === pendente.sha ? (t.n || 0) + 1 : 1 });
  location.reload();
}
function mostrarAviso(j, auto) {
  if (!banner) {
    banner = document.createElement('div'); banner.className = 'aviso-versao'; banner.setAttribute('role', 'status'); document.body.appendChild(banner);
  }
  banner.innerHTML = `<div><b>Nova versão v${j.v}</b><span>${auto ? 'A atualizar a app…' : 'Toca para atualizar.'}</span></div><button class="btn ouro" type="button">${auto ? 'Agora' : 'Atualizar'}</button>`;
  banner.querySelector('button').addEventListener('click', aplicar);
}
function novaVersao(j) {
  pendente = j;
  const t = lerTent(); const tentou = t.sha === j.sha && (t.n || 0) >= 2; // nunca entra em ciclo de recarregamentos
  if (tentou) { mostrarAviso(j, false); return; }
  if (naSessao()) { // espera que o aluno acabe o exercicio ou a sessao
    mostrarAviso(j, false); banner.querySelector('span').textContent = 'Atualizo quando acabares esta sessão.';
    if (!espera) espera = setInterval(() => { if (!naSessao()) { clearInterval(espera); espera = null; mostrarAviso(j, true); setTimeout(aplicar, 2500); } }, 1500);
    return;
  }
  mostrarAviso(j, true); setTimeout(aplicar, 2500);
}
export async function procurar(manual = false) {
  try {
    const b = build(); if (!b.sha) { if (manual) toast('Esta cópia da app não se atualiza sozinha.'); return false; }
    const j = await remota();
    if (j.sha && j.sha !== b.sha) { if (!pendente || pendente.sha !== j.sha) novaVersao(j); else if (manual) novaVersao(j); return true; }
    if (manual) toast(`Já tens a versão mais recente (${versaoTexto()}).`);
  } catch { if (manual) toast('Não consegui verificar agora. Confirma a ligação à internet.'); }
  return false;
}
export function iniciarAtualizacoes() {
  if (!build().sha) return;
  setTimeout(() => procurar(), 4000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') procurar(); });
  setInterval(() => { if (document.visibilityState === 'visible') procurar(); }, 10 * 60 * 1000);
}
