import { icon } from './icons.js';
import { sfx } from './sfx.js';
export const usarTeclado = () => matchMedia('(hover: none)').matches || innerWidth < 640;
// Teclado de jogo: escreve na celula ativa (.cel) dentro de `escopo`. Nao tira o foco das celulas.
export function teclado(escopo, { onOk, rotuloOk = 'Verificar' } = {}) {
  const el = document.createElement('div'); el.className = 'teclado';
  const teclas = [['7'], ['8'], ['9'], ['apaga'], ['4'], ['5'], ['6'], ['-'], ['1'], ['2'], ['3'], ['/'], ['0'], ['esq'], ['dir'], ['ok']];
  el.innerHTML = teclas.map(([k]) => k === 'apaga' ? `<button type="button" class="t-apaga" data-k="apaga" aria-label="Apagar">⌫</button>` : k === 'ok' ? `<button type="button" class="t-acao" data-k="ok" aria-label="${rotuloOk}">${icon('check')}</button>`
    : k === 'esq' ? `<button type="button" data-k="esq" aria-label="Célula anterior">◀</button>` : k === 'dir' ? `<button type="button" data-k="dir" aria-label="Célula seguinte">▶</button>` : `<button type="button" data-k="${k}">${k === '-' ? '−' : k}</button>`).join('');
  el.querySelectorAll('button').forEach((b) => b.style.display = 'grid');
  el.querySelectorAll('button').forEach((b) => { b.style.placeItems = 'center'; b.querySelector('svg') && (b.querySelector('svg').style.cssText = 'width:30px;height:30px'); });
  let ativa = null;
  escopo.addEventListener('focusin', (e) => { if (e.target.classList?.contains('cel')) ativa = e.target; });
  const celulas = () => [...escopo.querySelectorAll('.cel:not([disabled])')];
  const mover = (d) => { const c = celulas(); const i = c.indexOf(ativa); const t = c[Math.min(c.length - 1, Math.max(0, (i < 0 ? 0 : i + d)))]; if (t) { t.focus(); t.select?.(); } };
  el.addEventListener('mousedown', (e) => e.preventDefault());
  el.addEventListener('pointerdown', (e) => e.preventDefault());
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; sfx.clique(); sfx.vibrar(8);
    if (k === 'ok') { onOk && onOk(); return; } if (k === 'esq') return mover(-1); if (k === 'dir') return mover(1);
    if (!ativa || !ativa.isConnected) { mover(0); if (!ativa) return; }
    if (k === 'apaga') ativa.value = ativa.value.slice(0, -1); else ativa.value += k;
    ativa.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return el;
}
