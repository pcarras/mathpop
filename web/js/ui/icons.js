// Icones SVG proprios (24x24). Gradientes definidos em index.html (#gOuro, #gChama, #gCiano).
const P = {
  home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>',
  treinar: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  liga: '<path d="M7 3h10v5a5 5 0 0 1-10 0zM4 4h3v3a2 2 0 0 1-2 2H4zM17 4h3v4a2 2 0 0 1-2 2h-1zM11 13h2v3h3v3H8v-3h3z" fill="currentColor"/>',
  perfil: '<circle cx="12" cy="8" r="4.2" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"/>',
  chama: '<path d="M12 2c1 3.4 5.4 5.6 5.4 11a5.4 5.4 0 0 1-10.8 0c0-2 .9-3.4 2-4.5.2 1.6 1 2.3 1.8 2.6C9.6 8.3 10.6 4.6 12 2z" fill="url(#gChama)"/><path d="M12 12.5c.8 1.3 2.2 2 2.2 3.6a2.2 2.2 0 0 1-4.4 0c0-1.3 1.2-2 2.2-3.6z" fill="#FFE9A6"/>',
  estrela: '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="url(#gOuro)" stroke="#B97F08" stroke-width="1" stroke-linejoin="round"/>',
  estrelaVazia: '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.3)" stroke-width="1.2" stroke-linejoin="round"/>',
  raio: '<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" fill="url(#gOuro)" stroke="#B97F08" stroke-width="1" stroke-linejoin="round"/>',
  coroa: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="url(#gOuro)" stroke="#B97F08" stroke-width="1" stroke-linejoin="round"/>',
  cadeado: '<rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  bau: '<path d="M3 11a9 7 0 0 1 18 0v2H3z" fill="#B97F08"/><rect x="3" y="12" width="18" height="9" rx="1.5" fill="#E2A412"/><rect x="10" y="11" width="4" height="6" rx="1" fill="#FFF1B0" stroke="#7A5204"/><path d="M3 12h18" stroke="#7A5204" stroke-width="1.2"/>',
  som: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mudo: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  fechar: '<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  lampada: '<path d="M12 2a6.5 6.5 0 0 0-3.6 11.9c.7.5 1.1 1.2 1.1 2v.6h5v-.6c0-.8.4-1.5 1.1-2A6.5 6.5 0 0 0 12 2z" fill="url(#gOuro)"/><rect x="9.5" y="18" width="5" height="2" rx="1" fill="currentColor"/><rect x="10.5" y="21" width="3" height="1.6" rx=".8" fill="currentColor"/>',
  check: '<path d="m4.5 12.5 5 5L19.5 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
  mapa: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" fill="currentColor" opacity=".9"/><path d="M9 4v13.5M15 6.5V20" stroke="#0A1226" stroke-width="1.6"/>',
  seta: '<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  dado: '<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="currentColor"/><g fill="#0A1226"><circle cx="8.5" cy="8.5" r="1.7"/><circle cx="15.5" cy="8.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="8.5" cy="15.5" r="1.7"/><circle cx="15.5" cy="15.5" r="1.7"/></g>',
  repor: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
};
export const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
export const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gOuro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".55" stop-color="#FFC23D"/><stop offset="1" stop-color="#E08F0A"/></linearGradient>
<linearGradient id="gChama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD166"/><stop offset=".5" stop-color="#FF8A3D"/><stop offset="1" stop-color="#F0323C"/></linearGradient>
<linearGradient id="gCiano" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CF5FA"/><stop offset="1" stop-color="#0FB6BF"/></linearGradient></defs></svg>`;
