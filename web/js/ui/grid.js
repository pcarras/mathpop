import { usarTeclado } from './keypad.js';
// Grelha de matriz; aug = colunas antes da barra de ampliacao (-1 = nenhuma)
export function grid(m, n, { aug = -1, valores = null, onChange = null } = {}) {
  const wrap = document.createElement('div'); wrap.className = 'mx';
  const g = document.createElement('div'); g.className = 'mx-g'; g.style.gridTemplateColumns = `repeat(${n}, auto)`;
  const ins = [], sem = usarTeclado();
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'cel'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false; inp.inputMode = sem ? 'none' : 'text';
    inp.setAttribute('aria-label', `linha ${i + 1}, coluna ${j + 1}`);
    if (aug > 0 && j === aug) inp.classList.add('aug-l');
    if (valores) inp.value = valores[i][j];
    inp.addEventListener('input', () => { inp.classList.remove('errado', 'certo'); onChange && onChange(); });
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', (e) => {
      const k = ins.indexOf(inp); const go = (d) => { const t = ins[k + d]; if (t) { e.preventDefault(); t.focus(); } };
      if (e.key === 'Enter' || e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowDown') go(n); else if (e.key === 'ArrowUp') go(-n);
    });
    ins.push(inp); g.appendChild(inp);
  }
  wrap.appendChild(g);
  return { el: wrap, inputs: ins, valores: () => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => ins[i * n + j].value)),
    marcar(ok) { ins.forEach((x, k) => { const i = Math.floor(k / n), j = k % n; x.classList.toggle('errado', !ok[i][j]); x.classList.toggle('certo', ok[i][j]); }); } };
}
