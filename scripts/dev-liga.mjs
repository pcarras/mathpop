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
  SCARD: ([k]) => (db.get(k)?.size || 0), SREM: ([k, m]) => (db.get(k)?.delete(m) ? 1 : 0), PING: () => 'PONG',
  HKEYS: ([k]) => [...(db.get(k)?.keys() || [])],
  HDEL: ([k, f]) => (db.get(k)?.delete(f) ? 1 : 0),
  HSETNX: ([k, f, v]) => { const h = H(k); if (h.has(f)) return 0; h.set(f, v); return 1; }, HLEN: ([k]) => (db.get(k)?.size || 0),
  SADD: ([k, ...m]) => { const s = H(k); let n = 0; for (const x of m) if (!s.has(x)) { s.set(x, 1); n++; } return n; }, SMEMBERS: ([k]) => [...(db.get(k)?.keys() || [])],
  SET: ([k, v, ...o]) => { if (o.includes('NX') && db.has(k)) return null; db.set(k, v); return 'OK'; },
  DEL: ([k]) => (db.delete(k) ? 1 : 0), EXISTS: ([k]) => (db.has(k) ? 1 : 0), EXPIRE: () => 1,
  INCR: ([k]) => { const v = (Number(db.get(k)) || 0) + 1; db.set(k, String(v)); return v; },
  ZINCRBY: ([k, n, m]) => { const z = Z(k); const v = (z.get(m) || 0) + Number(n); z.set(m, v); return String(v); },
  ZADD: ([k, ...r]) => { const z = Z(k); const nx = r[0] === 'NX'; if (nx) r.shift(); let n = 0; for (let i = 0; i < r.length; i += 2) { if (nx && z.has(r[i + 1])) continue; z.set(r[i + 1], Number(r[i])); n++; } return n; },
  ZREM: ([k, m]) => (db.get(k)?.delete(m) ? 1 : 0), ZSCORE: ([k, m]) => (db.get(k)?.has(m) ? String(db.get(k).get(m)) : null),
  LPUSH: ([k, ...v]) => { const l = Array.isArray(db.get(k)) ? db.get(k) : []; for (const x of v) l.unshift(x); db.set(k, l); return l.length; },
  LTRIM: ([k, a, b]) => { const l = db.get(k); if (Array.isArray(l)) db.set(k, l.slice(Number(a), Number(b) + 1)); return 'OK'; },
  LRANGE: ([k, a, b]) => (Array.isArray(db.get(k)) ? db.get(k).slice(Number(a), Number(b) + 1) : []),
  ZCARD: ([k]) => (db.get(k)?.size || 0),
  ZREVRANK: ([k, m]) => { const i = rank(k).findIndex((x) => x[0] === m); return i < 0 ? null : i; },
  ZREVRANGE: ([k, a, b, ws]) => { const l = rank(k).slice(Number(a), Number(b) + 1); return ws ? l.flatMap(([m, s]) => [m, String(s)]) : l.map((x) => x[0]); },
};
http.createServer((req, res) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { const cmds = JSON.parse(d || '[]'); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(cmds.map((c) => { try { return { result: CMD[c[0].toUpperCase()](c.slice(1)) }; } catch (e) { return { error: String(e) }; } }))); }); }).listen(REDIS);
process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${REDIS}`; process.env.UPSTASH_REDIS_REST_TOKEN = 'teste'; process.env.TEACHER_KEY = 'codigo-de-teste';
// envio de emails simulado (Resend): guarda as mensagens em memoria; GET /__mails devolve-as
process.env.RESEND_API_KEY = 'teste'; process.env.EMAIL_FROM = 'Arena <arena@teste.pt>';
const MAILS = []; const fetchReal = globalThis.fetch;
globalThis.fetch = async (u, o) => { if (String(u).startsWith('https://api.resend.com/')) { const j = JSON.parse(o.body); if (process.env.FALHA_LOTE && String(u).endsWith('/emails/batch')) return { ok: false, status: 422 }; for (const m of Array.isArray(j) ? j : [j]) MAILS.push(m); return { ok: true, status: 200 }; } return fetchReal(u, o); };
// modo Gmail (GMAIL_MODE=1): troca o Resend por um servidor SMTP falso que guarda as mensagens em MAILS (to = destinatarios aceites)
if (process.env.GMAIL_MODE) {
  delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
  Object.assign(process.env, { GMAIL_USER: 'manicmath@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop', SMTP_HOST_TESTE: '127.0.0.1', SMTP_PORTA_TESTE: String(PORTA + 200) });
  const { default: netMod } = await import('node:net');
  const dec = (h) => h.replace(/=\?UTF-8\?B\?([^?]*)\?=/g, (_, b) => Buffer.from(b, 'base64').toString('utf8'));
  netMod.createServer((sock) => {
    sock.setEncoding('utf8'); sock.write('220 smtp falso\r\n');
    let buf = '', modo = 'cmd', rcpt = [], dados = '', autenticado = false;
    sock.on('data', (d) => {
      buf += d; let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const l = buf.slice(0, i); buf = buf.slice(i + 2);
        if (modo === 'dados') {
          if (l === '.') {
            const [cab, ...resto] = dados.split('\r\n\r\n'), h = {}; for (const x of cab.split('\r\n')) { const k = x.indexOf(':'); if (k > 0) h[x.slice(0, k).toLowerCase()] = dec(x.slice(k + 1).trim()); }
            MAILS.push({ to: rcpt, subject: h.subject, text: Buffer.from(resto.join('\r\n\r\n').replace(/\r\n/g, ''), 'base64').toString('utf8'), from: h.from, toHeader: h.to, via: 'smtp' });
            sock.write('250 ok\r\n'); modo = 'cmd'; rcpt = []; dados = '';
          } else dados += (dados ? '\r\n' : '') + l;
          continue;
        }
        const c = l.toUpperCase();
        if (c.startsWith('EHLO')) sock.write('250-smtp falso\r\n250 AUTH PLAIN\r\n');
        else if (c.startsWith('AUTH PLAIN')) { autenticado = Buffer.from(l.slice(11), 'base64').toString('utf8') === '\0manicmath@gmail.com\0abcdefghijklmnop'; sock.write(autenticado ? '235 ok\r\n' : '535 credenciais\r\n'); }
        else if (c.startsWith('MAIL FROM')) sock.write(autenticado ? '250 ok\r\n' : '530 autentica primeiro\r\n');
        else if (c.startsWith('RCPT TO')) { const a = l.slice(l.indexOf('<') + 1, l.indexOf('>')); if (a.includes('rejeitado')) sock.write('550 nao existe\r\n'); else { rcpt.push(a); sock.write('250 ok\r\n'); } }
        else if (c === 'DATA') { modo = 'dados'; sock.write('354 envia\r\n'); }
        else if (c === 'QUIT') { sock.write('221 adeus\r\n'); sock.end(); }
        else sock.write('502 nao suportado\r\n');
      }
    });
    sock.on('error', () => {});
  }).listen(PORTA + 200);
}
const { default: handler } = await import(path.join(raiz, 'api/liga.js'));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__mails') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(MAILS)); }
  if (u.pathname === '/api/liga') { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { req.body = d ? JSON.parse(d) : undefined; } catch { req.body = d; } res.status = (c) => { res.statusCode = c; return res; }; res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); }; handler(req, res); }); return; }
  let f = path.join(raiz, 'web', u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
  if (!f.startsWith(path.join(raiz, 'web')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', TIPOS[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(PORTA, () => console.log('liga dev em http://localhost:' + PORTA));
