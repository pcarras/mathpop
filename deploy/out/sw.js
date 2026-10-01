// Service worker da Arena Mat I. Guarda a app no aparelho para abrir depressa e funcionar sem rede. Versao b4d0ca0.
const CACHE = 'mat1-b4d0ca07ec';
const CDN = 'https://cdn.jsdelivr.net/gh/pcarras/mathpop@b4d0ca07ec7ef5ae6e75ac9e2b4a22471432ee7c/web/';
const FICHEIROS = ["css/base.css", "css/components.css", "css/tokens.css", "css/views.css", "js/engine/fraction.js", "js/engine/generators.js", "js/engine/index.js", "js/engine/matrix.js", "js/engine/rng.js", "js/engine/steps.js", "js/game/achievements.js", "js/game/liga.js", "js/game/missions.js", "js/main.js", "js/rules.js", "js/store.js", "js/ui/answer.js", "js/ui/avatar.js", "js/ui/fx.js", "js/ui/grid.js", "js/ui/icons.js", "js/ui/instalar.js", "js/ui/keypad.js", "js/ui/sfx.js", "js/ui/tex.js", "js/views/entrada.js", "js/views/home.js", "js/views/liga.js", "js/views/painel.js", "js/views/perfil.js", "js/views/treinar.js", "vendor/confetti.js", "vendor/dicebear.js", "vendor/fonts/big-shoulders-display-latin-700-normal.woff2", "vendor/fonts/big-shoulders-display-latin-800-normal.woff2", "vendor/fonts/big-shoulders-display-latin-900-normal.woff2", "vendor/fonts/figtree-latin-500-normal.woff2", "vendor/fonts/figtree-latin-700-normal.woff2", "vendor/fonts/figtree-latin-800-normal.woff2", "vendor/katex/fonts/KaTeX_AMS-Regular.woff2", "vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2", "vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2", "vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2", "vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2", "vendor/katex/fonts/KaTeX_Main-Bold.woff2", "vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2", "vendor/katex/fonts/KaTeX_Main-Italic.woff2", "vendor/katex/fonts/KaTeX_Main-Regular.woff2", "vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2", "vendor/katex/fonts/KaTeX_Math-Italic.woff2", "vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2", "vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2", "vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2", "vendor/katex/fonts/KaTeX_Script-Regular.woff2", "vendor/katex/fonts/KaTeX_Size1-Regular.woff2", "vendor/katex/fonts/KaTeX_Size2-Regular.woff2", "vendor/katex/fonts/KaTeX_Size3-Regular.woff2", "vendor/katex/fonts/KaTeX_Size4-Regular.woff2", "vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2", "vendor/katex/katex.min.css", "vendor/katex/katex.mjs"];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(FICHEIROS.map(async (f) => { try { const r = await fetch(CDN + f, { mode: 'cors' }); if (r.ok) await c.put(CDN + f, r); } catch (_) { /* tenta de novo ao usar */ } }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE && k !== 'mat1-pagina') await caches.delete(k); await self.clients.claim(); })());
});
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.url.startsWith(CDN)) {
    e.respondWith((async () => { const c = await caches.open(CACHE); const h = await c.match(r.url); if (h) return h; const n = await fetch(r); if (n.ok) c.put(r.url, n.clone()); return n; })());
  } else if (u.origin === location.origin && r.mode === 'navigate') {
    e.respondWith((async () => { const c = await caches.open('mat1-pagina'); try { const n = await fetch(r); if (n.ok) c.put('/', n.clone()); return n; } catch (_) { return (await c.match('/')) || Response.error(); } })());
  }
});
