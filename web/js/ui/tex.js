import katex from '../../vendor/katex/katex.mjs';
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// texto com $...$ -> HTML (as quebras de linha viram <br>)
export function tex(texto) {
  return String(texto).split(/(\$[^$]+\$)/g).map((p) => {
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      try { return katex.renderToString(p.slice(1, -1), { throwOnError: false, output: 'html' }); } catch { return esc(p); }
    }
    return esc(p).replace(/\n/g, '<br>');
  }).join('');
}
export function texBloco(latex) { try { return katex.renderToString(latex, { displayMode: true, throwOnError: false, output: 'html' }); } catch { return esc(latex); } }
