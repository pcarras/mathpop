// API da liga da Arena Mat I. Uma unica funcao: GET devolve o estado, POST executa uma acao (registar, sync, ranking, apagar).
// Os pontos so contam depois de o servidor regenerar cada exercicio a partir da semente e conferir a resposta.
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gerar, verificar, xpTreino, diaChave, TIPOS } from './_motor.js';
import { pipe, cmd, obj, ligado } from './_redis.js';

const sha = (f) => { try { return createHash('sha256').update(readFileSync(new URL(f, import.meta.url))).digest('hex').slice(0, 12); } catch { return null; } };
const REGIMES = ['diurno', 'noturno'], LOCAIS = ['portimao', 'faro'];
const CHAVES_AV = ['genero', 'top', 'hairColor', 'hatColor', 'accessories', 'accessoriesColor', 'facialHair', 'facialHairColor', 'clothing', 'clothesColor', 'clothingGraphic', 'eyebrows', 'eyes', 'mouth', 'skinColor', 'fundo', 'moldura'];
const MAX_POR_DIA = 80, MAX_EVENTOS = 50, JANELA_SEMENTES = 3000;
const DIA_MS = 86400000;

const limpa = (t, n) => String(t ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const idOk = (id) => typeof id === 'string' && /^[0-9a-fA-F-]{20,40}$/.test(id);
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const avatarLimpo = (av) => { const o = {}; if (av && typeof av === 'object') for (const k of CHAVES_AV) { const v = av[k]; if ((typeof v === 'string' || typeof v === 'number') && /^[A-Za-z0-9]{1,24}$/.test(String(v))) o[k] = String(v); } return o; };
const primeiro = (nome) => String(nome || '').split(' ')[0];
const segunda = (dia) => { const d = new Date(dia + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const ontem = (dia) => new Date(new Date(dia + 'T00:00:00Z').getTime() - DIA_MS).toISOString().slice(0, 10);
const chaveG = (per) => `rk:g:${per}`;
const chaveT = (regime, local, per) => `rk:t:${regime}:${local}:${per}`;

async function autenticar(b) {
  if (!idOk(b.id) || typeof b.chave !== 'string') return null;
  const p = obj(await cmd('HGETALL', 'p:' + b.id));
  return p.chave && igual(p.chave, b.chave) ? p : null;
}
const cartao = (p, av) => JSON.stringify({ a: p.alc || primeiro(p.nome) || 'Aluno', v: av, r: p.regime, l: p.local });

async function registar(b, req) {
  if (!idOk(b.id)) return [400, { erro: 'id' }];
  const nome = limpa(b.nome, 40), alc = limpa(b.alc, 16), regime = String(b.regime), local = String(b.local), sal = Number(b.sal);
  if (nome.length < 2 || !REGIMES.includes(regime) || !LOCAIS.includes(local) || !Number.isInteger(sal) || sal < 0 || sal > 4294967295) return [400, { erro: 'dados' }];
  if (b.consentimento !== true) return [400, { erro: 'consentimento' }];
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim().slice(0, 45);
  const n = await cmd('INCR', `rl:r:${ip}:${Math.floor(Date.now() / 3600000)}`);
  if (n === 1) await cmd('EXPIRE', `rl:r:${ip}:${Math.floor(Date.now() / 3600000)}`, 7200);
  if (n > 300) return [429, { erro: 'muitos_pedidos' }];
  if (await cmd('EXISTS', 'p:' + b.id)) return [409, { erro: 'existe' }];
  const chave = randomBytes(16).toString('hex'), av = avatarLimpo(b.avatar);
  const p = { nome, alc, regime, local };
  await pipe([
    ['HSET', 'p:' + b.id, 'nome', nome, 'alc', alc, 'regime', regime, 'local', local, 'sal', sal, 'chave', chave, 'xp', 0, 'certas', 0, 'ctr', 0, 'criado', Date.now()],
    ['HSET', 'cards', b.id, cartao(p, av)],
  ]);
  return [200, { ok: 1, chave }];
}

async function sync(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const bloqueio = await cmd('SET', 'lock:' + b.id, '1', 'NX', 'EX', 15);
  if (!bloqueio) return [429, { erro: 'ocupado' }];
  try {
    const cmds = [];
    let regime = p.regime, local = p.local, nome = p.nome, alc = p.alc;
    const pf = b.perfil || {};
    let av = null, mudouCartao = false;
    if (pf.nome !== undefined) { const v = limpa(pf.nome, 40); if (v.length >= 2 && v !== nome) { nome = v; mudouCartao = true; cmds.push(['HSET', 'p:' + b.id, 'nome', nome]); } }
    if (pf.alc !== undefined) { const v = limpa(pf.alc, 16); if (v !== alc) { alc = v; mudouCartao = true; cmds.push(['HSET', 'p:' + b.id, 'alc', alc]); } }
    if (pf.avatar !== undefined) { av = avatarLimpo(pf.avatar); mudouCartao = true; }
    // mudanca de turma: leva os pontos consigo
    const novoRegime = REGIMES.includes(pf.regime) ? pf.regime : regime, novoLocal = LOCAIS.includes(pf.local) ? pf.local : local;
    if (novoRegime !== regime || novoLocal !== local) {
      const dias = await cmd('SMEMBERS', 'dias:' + b.id), semanas = [...new Set((dias || []).map(segunda))];
      const pers = ['tot', ...semanas];
      const sc = await pipe(pers.map((per) => ['ZSCORE', chaveT(regime, local, per), b.id]));
      pers.forEach((per, i) => { cmds.push(['ZREM', chaveT(regime, local, per), b.id]); if (sc[i] !== null && Number(sc[i]) > 0) cmds.push(['ZADD', chaveT(novoRegime, novoLocal, per), sc[i], b.id]); });
      regime = novoRegime; local = novoLocal; mudouCartao = true; cmds.push(['HSET', 'p:' + b.id, 'regime', regime, 'local', local]);
    }
    if (mudouCartao) {
      if (av === null) { try { av = JSON.parse((await cmd('HGET', 'cards', b.id)) || '{}').v || {}; } catch { av = {}; } }
      cmds.push(['HSET', 'cards', b.id, cartao({ nome, alc, regime, local }, av)]);
    }

    // eventos
    const agora = Date.now(); let aceites = 0, rejeitados = 0, somaXP = 0, ctr = Number(p.ctr) || 0;
    const evs = (Array.isArray(b.ev) ? b.ev : []).slice(0, MAX_EVENTOS).filter((e) => e && typeof e === 'object').sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0) || (Number(x.s) || 0) - (Number(y.s) || 0));
    if (evs.length) {
      const sal = Number(p.sal), diasSet = new Set((await cmd('SMEMBERS', 'dias:' + b.id)) || []);
      const contDia = {}; const porDiaTipo = {}; const porSemana = {}; const novosDias = new Set();
      for (const e of evs) {
        const ts = Number(e.ts), t = String(e.t), n = Number(e.n), pistas = Number(e.p), s = Number(e.s);
        if (!TIPOS.includes(t) || ![1, 2, 3].includes(n) || !Number.isInteger(pistas) || pistas < 0 || pistas > 5 || !Number.isInteger(s) || s < 0 || s > 4294967295 || !Number.isFinite(ts) || ts < agora - 3 * DIA_MS || ts > agora + 5 * 60000) { rejeitados++; continue; }
        // a semente tem de ser a seguinte da sequencia do aluno (nao se repete nem se escolhe)
        let c = 0; for (let k = ctr + 1; k <= ctr + JANELA_SEMENTES; k++) if (((sal + k * 7919) >>> 0) === s) { c = k; break; }
        if (!c) { rejeitados++; continue; }
        let ok = false; try { ok = verificar(gerar(t, s, n), e.r); } catch { ok = false; }
        if (!ok) { rejeitados++; ctr = c; continue; }
        const dia = diaChave(new Date(ts));
        if (!contDia[dia]) { const h = obj(await cmd('HGETALL', `d:${b.id}:${dia}`)); contDia[dia] = {}; for (const k of Object.keys(h)) contDia[dia][k] = Number(h[k]); }
        const cd = contDia[dia]; const totalDia = Object.values(cd).reduce((a, x) => a + x, 0);
        if (totalDia >= MAX_POR_DIA) { rejeitados++; ctr = c; continue; }
        diasSet.add(dia); novosDias.add(dia);
        let streak = 1, d = dia; while (diasSet.has(ontem(d))) { streak++; d = ontem(d); if (streak > 40) break; }
        let xp = xpTreino({ nivel: n, pistas, nHoje: cd[t] || 0, dias: streak }); if (e.e) xp = Math.round(xp * 0.5);
        cd[t] = (cd[t] || 0) + 1; (porDiaTipo[dia] ||= {})[t] = (porDiaTipo[dia][t] || 0) + 1;
        const wk = segunda(dia); porSemana[wk] = (porSemana[wk] || 0) + xp; somaXP += xp; aceites++; ctr = c;
      }
      if (ctr !== (Number(p.ctr) || 0)) cmds.push(['HSET', 'p:' + b.id, 'ctr', ctr]);
      if (aceites) {
        cmds.push(['HINCRBY', 'p:' + b.id, 'certas', aceites]);
        for (const dia of Object.keys(porDiaTipo)) { for (const t of Object.keys(porDiaTipo[dia])) cmds.push(['HINCRBY', `d:${b.id}:${dia}`, t, porDiaTipo[dia][t]]); cmds.push(['EXPIRE', `d:${b.id}:${dia}`, 3456000]); }
        cmds.push(['SADD', 'dias:' + b.id, ...novosDias]);
        if (somaXP > 0) {
          cmds.push(['ZINCRBY', chaveG('tot'), somaXP, b.id], ['ZINCRBY', chaveT(regime, local, 'tot'), somaXP, b.id]);
          for (const wk of Object.keys(porSemana)) if (porSemana[wk] > 0) for (const k of [chaveG(wk), chaveT(regime, local, wk)]) cmds.push(['ZINCRBY', k, porSemana[wk], b.id], ['EXPIRE', k, 7776000]);
        }
      }
    }
    cmds.push(['HINCRBY', 'p:' + b.id, 'xp', somaXP]);
    const res = await pipe(cmds);
    return [200, { ok: 1, aceites, rejeitados, xp: Number(res[res.length - 1]) }];
  } finally { await cmd('DEL', 'lock:' + b.id).catch(() => {}); }
}

async function ranking(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const wk = segunda(diaChave()), per = b.periodo === 'total' ? 'tot' : wk;
  const geral = b.escopo === 'geral', key = geral ? chaveG(per) : chaveT(p.regime, p.local, per);
  const [topo, pos, pts, total] = await pipe([['ZREVRANGE', key, 0, 29, 'WITHSCORES'], ['ZREVRANK', key, b.id], ['ZSCORE', key, b.id], ['ZCARD', key]]);
  const lista = []; for (let i = 0; i + 1 < topo.length; i += 2) lista.push([topo[i], Number(topo[i + 1])]);
  const ids = lista.map((x) => x[0]); const eu = lista.some((x) => x[0] === b.id);
  const cartoes = ids.length ? await cmd('HMGET', 'cards', ...ids) : [];
  const out = lista.map(([id, xp], i) => { let c = {}; try { c = JSON.parse(cartoes[i] || '{}'); } catch { /* sem cartao */ } return { pos: i + 1, alc: c.a || 'Aluno', v: c.v || {}, xp, eu: id === b.id, t: geral ? `${c.l === 'faro' ? 'Faro' : 'Portimão'} ${c.r === 'noturno' ? 'noturno' : 'diurno'}` : undefined }; });
  return [200, { ok: 1, lista: out.filter((x) => x.xp > 0), minha: pos === null ? null : { pos: Number(pos) + 1, xp: Number(pts), fora: !eu }, total: Number(total), turma: { regime: p.regime, local: p.local }, semana: wk }];
}

async function apagar(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const dias = (await cmd('SMEMBERS', 'dias:' + b.id)) || [], semanas = [...new Set(dias.map(segunda))], pers = ['tot', ...semanas];
  const cmds = [];
  for (const per of pers) cmds.push(['ZREM', chaveG(per), b.id], ['ZREM', chaveT(p.regime, p.local, per), b.id]);
  for (const d of dias) cmds.push(['DEL', `d:${b.id}:${d}`]);
  cmds.push(['DEL', 'dias:' + b.id], ['HDEL', 'cards', b.id], ['DEL', 'p:' + b.id]);
  await pipe(cmds);
  return [200, { ok: 1 }];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ligado: ligado(), v: { liga: sha('./liga.js'), motor: sha('./_motor.js'), redis: sha('./_redis.js') } });
  if (req.method !== 'POST') return res.status(405).json({ erro: 'metodo' });
  if (!ligado()) return res.status(503).json({ erro: 'sem_base' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ erro: 'corpo' });
  try {
    const fn = { registar: (x) => registar(x, req), sync, ranking, apagar }[b.a];
    if (!fn) return res.status(400).json({ erro: 'acao' });
    const [codigo, corpo] = await fn(b);
    return res.status(codigo).json(corpo);
  } catch (e) { console.error('liga', e && e.message); return res.status(500).json({ erro: 'servidor' }); }
}
