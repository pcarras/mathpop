# Gera a pasta deploy/out com os 4 ficheiros que ficam no Vercel (mesma origem): index.html, manifest, sw.js e icones.
# O resto da app e servido pelo jsDelivr, fixo ao commit SHA. Uso: python3 scripts/make_deploy.py <sha-do-commit>
import sys, os, json, shutil, pathlib
sha = sys.argv[1]; root = pathlib.Path(__file__).resolve().parent.parent; out = root / 'deploy' / 'out'
shutil.rmtree(out, ignore_errors=True); (out / 'icons').mkdir(parents=True)
CDN = f'https://cdn.jsdelivr.net/gh/pcarras/mathpop@{sha}/web/'
for f in (root / 'deploy' / 'icons').glob('*.png'): shutil.copy(f, out / 'icons' / f.name)
files = sorted(str(p.relative_to(root / 'web')) for p in (root / 'web').rglob('*') if p.is_file() and p.name not in ('index.html', 'liga.js') and not p.name.endswith('.map'))
manifest = {"id": "/", "name": "Arena Mat I", "short_name": "Arena Mat I", "description": "Treino de Matemática I: matrizes e sistemas de equações lineares", "lang": "pt-PT", "start_url": "/", "scope": "/",
  "display": "standalone", "display_override": ["standalone", "minimal-ui"], "orientation": "portrait", "background_color": "#0A1226", "theme_color": "#0A1226",
  "icons": [{"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"}, {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}, {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
(out / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
sw = f"""// Service worker da Arena Mat I. Guarda a app no aparelho para abrir depressa e funcionar sem rede. Versao {sha[:7]}.
const CACHE = 'mat1-{sha[:10]}';
const CDN = '{CDN}';
const FICHEIROS = {json.dumps(files)};
self.addEventListener('install', (e) => {{
  e.waitUntil((async () => {{
    const c = await caches.open(CACHE);
    await Promise.all(FICHEIROS.map(async (f) => {{ try {{ const r = await fetch(CDN + f, {{ mode: 'cors' }}); if (r.ok) await c.put(CDN + f, r); }} catch (_) {{ /* tenta de novo ao usar */ }} }}));
    await self.skipWaiting();
  }})());
}});
self.addEventListener('activate', (e) => {{
  e.waitUntil((async () => {{ for (const k of await caches.keys()) if (k !== CACHE && k !== 'mat1-pagina') await caches.delete(k); await self.clients.claim(); }})());
}});
self.addEventListener('fetch', (e) => {{
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.url.startsWith(CDN)) {{
    e.respondWith((async () => {{ const c = await caches.open(CACHE); const h = await c.match(r.url); if (h) return h; const n = await fetch(r); if (n.ok) c.put(r.url, n.clone()); return n; }})());
  }} else if (u.origin === location.origin && r.mode === 'navigate') {{
    e.respondWith((async () => {{ const c = await caches.open('mat1-pagina'); try {{ const n = await fetch(r); if (n.ok) c.put('/', n.clone()); return n; }} catch (_) {{ return (await c.match('/')) || Response.error(); }} }})());
  }}
}});
"""
(out / 'sw.js').write_text(sw, encoding='utf-8')
head = f'''<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Treino de Matemática I: matrizes e sistemas de equações lineares">
<meta name="theme-color" content="#0A1226">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="/icons/icon-192.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Arena Mat I">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<title>Arena Mat I</title>
'''
for css in ['vendor/katex/katex.min.css', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/views.css']: head += f'<link rel="stylesheet" href="{CDN}{css}">\n'
body = (root / 'deploy' / 'body.html').read_text(encoding='utf-8')
(out / 'index.html').write_text(head + '</head>\n<body>\n' + body + f'\n<script type="module" src="{CDN}js/main.js"></script>\n</body>\n</html>\n', encoding='utf-8')
print('ok', len(files), 'ficheiros em cache;', sum(p.stat().st_size for p in out.rglob('*') if p.is_file()), 'bytes na origem')
