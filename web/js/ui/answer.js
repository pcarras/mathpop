import { grid } from './grid.js';
import { usarTeclado } from './keypad.js';
// Widget de resposta conforme o tipo: get() devolve o formato de verificar() do motor.
export function answerWidget(ex) {
  const r = ex.resposta, el = document.createElement('div'); const sem = usarTeclado();
  const cel = (ph, aria) => { const i = document.createElement('input'); i.type = 'text'; i.className = 'cel'; i.placeholder = ph; i.setAttribute('aria-label', aria); i.autocomplete = 'off'; i.inputMode = sem ? 'none' : 'text'; i.addEventListener('focus', () => i.select()); i.addEventListener('input', () => i.classList.remove('errado', 'certo')); return i; };
  if (r.kind === 'matriz') {
    const g = grid(r.valor.m, r.valor.n); el.appendChild(g.el);
    return { el, alvo: g.el, get: () => g.valores(), focus: () => g.inputs[0].focus(), marcar: (ok) => g.inputs.forEach((x) => { x.classList.toggle('errado', !ok); x.classList.toggle('certo', ok); }) };
  }
  if (r.kind === 'escalar') {
    const i = cel('?', 'Resposta'); const rot = ex.tipo === 'caracteristica' ? 'R(A) =' : ex.tipo === 'determinante' ? '|A| =' : 'Resposta =';
    el.innerHTML = `<div class="linha" style="gap:12px"><span class="num" style="font-size:30px">${rot}</span><div class="mx" style="padding:0;margin:0"><span></span></div></div>`;
    const box = el.querySelector('.mx'); box.innerHTML = ''; box.style.cssText = 'display:inline-block;padding:0;margin:0'; box.classList.add('sem-par'); box.appendChild(i);
    const st = document.createElement('style'); st.textContent = '.mx.sem-par:before,.mx.sem-par:after{display:none}.mx.sem-par input{width:112px}'; if (!document.getElementById('sp')) { st.id = 'sp'; document.head.appendChild(st); }
    return { el, alvo: box, get: () => i.value, focus: () => i.focus(), marcar: (ok) => { i.classList.toggle('errado', !ok); i.classList.toggle('certo', ok); } };
  }
  // sistema: SPD / SPI / SI e solucao
  el.innerHTML = `<div class="linha" role="radiogroup" aria-label="Classificação" style="margin-bottom:10px"></div><div class="linha sol" style="display:none;gap:12px"></div>`;
  const grp = el.firstElementChild, sol = el.querySelector('.sol'); let tipo = '';
  for (const t of ['SPD', 'SPI', 'SI']) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn fantasma'; b.textContent = t; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.style.minHeight = '48px';
    b.addEventListener('click', () => { tipo = t; grp.querySelectorAll('button').forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.classList.toggle('ouro', on); x.classList.toggle('fantasma', !on); }); sol.style.display = t === 'SPD' ? 'flex' : 'none'; if (t === 'SPD') xs[0].focus(); });
    grp.appendChild(b); }
  const xs = ['x', 'y', 'z'].map((v) => { const c = cel('', v); const w = document.createElement('div'); w.className = 'linha'; w.style.gap = '6px'; w.innerHTML = `<span class="num" style="font-size:26px">${v} =</span>`; const m = document.createElement('div'); m.className = 'mx sem-par'; m.style.cssText = 'padding:0;margin:0'; m.appendChild(c); w.appendChild(m); sol.appendChild(w); return c; });
  const st = document.createElement('style'); st.textContent = '.mx.sem-par:before,.mx.sem-par:after{display:none}.mx.sem-par input{width:84px}'; if (!document.getElementById('sp2')) { st.id = 'sp2'; document.head.appendChild(st); }
  return { el, alvo: el, get: () => ({ tipo, solucao: xs.map((x) => x.value) }), focus: () => grp.firstElementChild.focus(), marcar: (ok) => { xs.forEach((x) => { x.classList.toggle('errado', !ok); x.classList.toggle('certo', ok); }); } };
}
