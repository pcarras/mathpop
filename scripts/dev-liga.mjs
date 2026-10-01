// Servidor local de teste: serve a pasta web e a API /api/liga, com um Redis falso em memoria (so para testes).
// Uso: node scripts/dev-liga.mjs [porta]  (PORT 8092 por omissao)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const PORTA = Number(process.argv[2]) || 8092; const REDIS = PORTA + 100;
const db = new Map();
const H = (k) => { if (!db.has(k)) db.set(k, new Map()); return db.get(k); };
const Z = (k) => H(k);
const rank = (k) => [...Z(k).entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));
const CMD = {
  HGETALL: ([k]) => { const o = []; for (const [f, v] of db.get(k) || []) o.push(f, v); return o; },
  HSET: ([k, ...r]) => { const h = H(k); for (let i = 0; i < r.length; i += 2) h.set(r[i], r[i + 1]); return r.length / 2; },
  HGET: ([k, f]) => (db.get(k)?.get(f) ?? null), HMGET: ([k, ...f]) => f.map((x) => db.get(k)?.get(x) ?? null),
  HINCRBY: ([k, f, n]) => { const h = H(k); const v = (Number(h.get(f)) || 0) + Number(n); h.set(f, String(v)); return v; },
  HDEL: ([k, f]) => (db.get(k)?.delete(f) ? 1 : 0),
  SADD: ([k, ...m]) => { const s = H(k); let n = 0; for (const x of m) if (!s.has(x)) { s.set(x, 1); n++; } return n; }, SMEMBERS: ([k]) => [...(db.get(k)?.keys() || [])],
  SET: ([k, v, ...o]) => { if (o.includes('NX') && db.has(k)) return null; db.set(k, v); return 'OK'; },
  DEL: ([k]) => (db.delete(k) ? 1 : 0), EXISTS: ([k]) => (db.has(k) ? 1 : 0), EXPIRE: () => 1,
  INCR: ([k]) => { const v = (Number(db.get(k)) || 0) + 1; db.set(k, String(v)); return v; },
  ZINCRBY: ([k, n, m]) => { const z = Z(k); const v = (z.get(m) || 0) + Number(n); z.set(m, v); return String(v); },
  ZADD: ([k, ...r]) => { const z = Z(k); const nx = r[0] === 'NX'; if (nx) r.shift(); let n = 0; for (let i = 0; i < r.length; i += 2) { if (nx && z.has(r[i + 1])) continue; z.set(r[i + 1], Number(r[i])); n++; } return n; },
  ZREM: ([k, m]) => (db.get(k)?.delete(m) ? 1 : 0), ZSCORE: ([k, m]) => (db.get(k)?.has(m) ? String(db.get(k).get(m)) : null),
  ZCARD: ([k]) => (db.get(k)?.size || 0),
  ZREVRANK: ([k, m]) => { const i = rank(k).findIndex((x) => x[0] === m); return i < 0 ? null : i; },
  ZREVRANGE: ([k, a, b, ws]) => { const l = rank(k).slice(Number(a), Number(b) + 1); return ws ? l.flatMap(([m, s]) => [m, String(s)]) : l.map((x) => x[0]); },
};
http.createServer((req, res) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { const cmds = JSON.parse(d || '[]'); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(cmds.map((c) => { try { return { result: CMD[c[0].toUpperCase()](c.slice(1)) }; } catch (e) { return { error: String(e) }; } }))); }); }).listen(REDIS);
process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${REDIS}`; process.env.UPSTASH_REDIS_REST_TOKEN = 'teste';
const { default: handler } = await import(path.join(raiz, 'api/liga.js'));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/liga') { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { req.body = d ? JSON.parse(d) : undefined; } catch { req.body = d; } res.status = (c) => { res.statusCode = c; return res; }; res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); }; handler(req, res); }); return; }
  let f = path.join(raiz, 'web', u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
  if (!f.startsWith(path.join(raiz, 'web')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', TIPOS[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(PORTA, () => console.log('liga dev em http://localhost:' + PORTA));
