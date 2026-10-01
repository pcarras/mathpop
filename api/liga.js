// API da liga da Arena Mat I. Uma unica funcao: GET devolve o estado, POST executa uma acao (registar, sync, ranking, apagar, professor, painel, ocultar).
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
const PLAT = ['ios', 'android', 'windows', 'mac', 'linux', 'outro'];
const dispLimpo = (d) => ({ pl: d && PLAT.includes(d.pl) ? d.pl : 'outro', inst: d && d.inst === true ? 1 : 0 });
const horaLx = (ts) => Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Lisbon' }).format(ts));
const chaveG = (per) => `rk:g:${per}`;
const chaveT = (regime, local, per) => `rk:t:${regime}:${local}:${per}`;

async function autenticar(b) {
  if (!idOk(b.id) || typeof b.chave !== 'string') return null;
  const p = obj(await cmd('HGETALL', 'p:' + b.id));
  return p.chave && igual(p.chave, b.chave) ? p : null;
}
const nomeCartao = (p) => (p.oc === '1' ? 'Aluno' : (p.alc || primeiro(p.nome) || 'Aluno'));
const cartao = (p, av) => JSON.stringify({ a: nomeCartao(p), v: av, r: p.regime, l: p.local });
const sha256 = (t) => createHash('sha256').update(String(t)).digest('hex');
const ehProf = (p) => p && p.prof === '1';
// tira o jogador de todas as tabelas (usado ao sair da liga e ao ser reconhecido como professor)
async function tirarDoRanking(id, p) {
  const dias = (await cmd('SMEMBERS', 'dias:' + id)) || [], pers = ['tot', ...new Set(dias.map(segunda))], cmds = [];
  for (const per of pers) cmds.push(['ZREM', chaveG(per), id], ['ZREM', chaveT(p.regime, p.local, per), id]);
  if (cmds.length) await pipe(cmds);
  return dias;
}

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
  const chave = randomBytes(16).toString('hex'), av = avatarLimpo(b.avatar), dp = dispLimpo(b.disp);
  const p = { nome, alc, regime, local };
  await pipe([
    ['HSET', 'p:' + b.id, 'nome', nome, 'alc', alc, 'regime', regime, 'local', local, 'sal', sal, 'chave', chave, 'xp', 0, 'certas', 0, 'ctr', 0, 'criado', Date.now(), 'vis', Date.now(), 'pl', dp.pl, 'inst', dp.inst],
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
    if (pf.disp) { const dp = dispLimpo(pf.disp); cmds.push(['HSET', 'p:' + b.id, 'pl', dp.pl, 'inst', dp.inst]); }
    cmds.push(['HSET', 'p:' + b.id, 'vis', Date.now()]);
    if (ehProf(p)) cmds.push(['SADD', 'profs', b.id]);
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
      cmds.push(['HSET', 'cards', b.id, cartao({ nome, alc, regime, local, oc: p.oc }, av)]);
    }

    // eventos
    const agora = Date.now(); let aceites = 0, rejeitados = 0, somaXP = 0, ctr = Number(p.ctr) || 0;
    const evs = (Array.isArray(b.ev) ? b.ev : []).slice(0, MAX_EVENTOS).filter((e) => e && typeof e === 'object').sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0) || (Number(x.s) || 0) - (Number(y.s) || 0));
    if (evs.length) {
      const sal = Number(p.sal), diasSet = new Set((await cmd('SMEMBERS', 'dias:' + b.id)) || []);
      const contDia = {}; const porDiaTipo = {}; const porSemana = {}; const novosDias = new Set(); const est = { dias: {}, horas: {}, tipos: {} };
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
        est.dias[dia] = (est.dias[dia] || 0) + 1; const hr = horaLx(ts); est.horas[hr] = (est.horas[hr] || 0) + 1;
        const te = (est.tipos[t] ||= { n: 0, e: 0, p: 0 }); te.n++; if (e.e) te.e++; if (pistas > 0) te.p++;
      }
      if (ctr !== (Number(p.ctr) || 0)) cmds.push(['HSET', 'p:' + b.id, 'ctr', ctr]);
      if (aceites) {
        cmds.push(['HINCRBY', 'p:' + b.id, 'certas', aceites]);
        for (const dia of Object.keys(porDiaTipo)) { for (const t of Object.keys(porDiaTipo[dia])) cmds.push(['HINCRBY', `d:${b.id}:${dia}`, t, porDiaTipo[dia][t]]); cmds.push(['EXPIRE', `d:${b.id}:${dia}`, 3456000]); }
        cmds.push(['SADD', 'dias:' + b.id, ...novosDias]);
        if (!ehProf(p)) { // estatisticas agregadas para o painel do professor (o professor nao conta)
          for (const dia of Object.keys(est.dias)) cmds.push(['HINCRBY', 'st:d:' + dia, 'c', est.dias[dia]], ['EXPIRE', 'st:d:' + dia, 8000000], ['SADD', 'st:a:' + dia, b.id], ['EXPIRE', 'st:a:' + dia, 8000000]);
          for (const hr of Object.keys(est.horas)) cmds.push(['HINCRBY', 'st:h', hr, est.horas[hr]]);
          for (const t of Object.keys(est.tipos)) { const x = est.tipos[t]; cmds.push(['HINCRBY', 'st:t', t + ':n', x.n]); if (x.e) cmds.push(['HINCRBY', 'st:t', t + ':e', x.e]); if (x.p) cmds.push(['HINCRBY', 'st:t', t + ':p', x.p]); }
        }
        if (somaXP > 0 && !ehProf(p)) {
          cmds.push(['ZINCRBY', chaveG('tot'), somaXP, b.id], ['ZINCRBY', chaveT(regime, local, 'tot'), somaXP, b.id]);
          for (const wk of Object.keys(porSemana)) if (porSemana[wk] > 0) for (const k of [chaveG(wk), chaveT(regime, local, wk)]) cmds.push(['ZINCRBY', k, porSemana[wk], b.id], ['EXPIRE', k, 7776000]);
        }
      }
    }
    cmds.push(['HINCRBY', 'p:' + b.id, 'xp', somaXP]);
    const res = await pipe(cmds);
    return [200, { ok: 1, aceites, rejeitados, xp: Number(res[res.length - 1]), prof: ehProf(p) }];
  } finally { await cmd('DEL', 'lock:' + b.id).catch(() => {}); }
}

async function ranking(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const wk = segunda(diaChave()), per = b.periodo === 'semana' ? wk : 'tot';
  const geral = b.escopo === 'geral', key = geral ? chaveG(per) : chaveT(p.regime, p.local, per);
  const [topo, pos, pts, total, ps] = await pipe([['ZREVRANGE', key, 0, 29, 'WITHSCORES'], ['ZREVRANK', key, b.id], ['ZSCORE', key, b.id], ['ZCARD', key], ['SMEMBERS', 'profs']]);
  const lista = []; for (let i = 0; i + 1 < topo.length; i += 2) lista.push([topo[i], Number(topo[i + 1])]);
  const ids = lista.map((x) => x[0]); const eu = lista.some((x) => x[0] === b.id), pids = (ps || []).slice(0, 5);
  const cartoes = ids.length || pids.length ? await cmd('HMGET', 'cards', ...ids, ...pids) : [];
  const out = lista.map(([id, xp], i) => { let c = {}; try { c = JSON.parse(cartoes[i] || '{}'); } catch { /* sem cartao */ } return { pos: i + 1, alc: c.a || 'Aluno', v: c.v || {}, xp, eu: id === b.id, t: geral ? `${c.l === 'faro' ? 'Faro' : 'Portimão'} ${c.r === 'noturno' ? 'noturno' : 'diurno'}` : undefined }; });
  const profs = pids.map((id, j) => { let c = {}; try { c = JSON.parse(cartoes[ids.length + j] || '{}'); } catch { /* sem cartao */ } return c.a ? { alc: c.a, v: c.v || {} } : null; }).filter(Boolean);
  return [200, { ok: 1, lista: out.filter((x) => x.xp > 0), minha: pos === null ? null : { pos: Number(pos) + 1, xp: Number(pts), fora: !eu }, total: Number(total), turma: { regime: p.regime, local: p.local }, semana: wk, prof: ehProf(p), profs }];
}

async function apagar(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const dias = await tirarDoRanking(b.id, p), cmds = [];
  for (const d of dias) cmds.push(['DEL', `d:${b.id}:${d}`]);
  cmds.push(['DEL', 'dias:' + b.id], ['HDEL', 'cards', b.id], ['SREM', 'profs', b.id], ['DEL', 'p:' + b.id]);
  await pipe(cmds);
  return [200, { ok: 1 }];
}

// o professor prova que o e com um codigo que so existe no servidor (variavel TEACHER_KEY)
async function professor(b, req) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  const segredo = process.env.TEACHER_KEY;
  if (!segredo || segredo.length < 6) return [503, { erro: 'sem_codigo' }];
  const hora = Math.floor(Date.now() / 3600000), ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim().slice(0, 45);
  const [n1, n2] = await pipe([['INCR', `rl:p:${b.id}:${hora}`], ['INCR', `rl:pi:${ip}:${hora}`]]);
  if (n1 === 1) await cmd('EXPIRE', `rl:p:${b.id}:${hora}`, 7200);
  if (n2 === 1) await cmd('EXPIRE', `rl:pi:${ip}:${hora}`, 7200);
  if (n1 > 8 || n2 > 40) return [429, { erro: 'muitos_pedidos' }];
  if (typeof b.codigo !== 'string' || !igual(sha256(b.codigo.trim()), sha256(segredo))) return [403, { erro: 'codigo' }];
  await tirarDoRanking(b.id, p);
  await pipe([['HSET', 'p:' + b.id, 'prof', 1], ['SADD', 'profs', b.id]]);
  return [200, { ok: 1 }];
}

async function autenticarProf(b) { const p = await autenticar(b); return ehProf(p) ? p : null; }

// painel do professor: todos os jogadores com nome real, avatar, aparelho e estatisticas agregadas
async function painel(b) {
  const p = await autenticarProf(b); if (!p) return [403, { erro: 'prof' }];
  const ids = ((await cmd('HKEYS', 'cards')) || []).filter(idOk).slice(0, 400);
  const dias = Array.from({ length: 14 }, (_, k) => diaChave(new Date(Date.now() - (13 - k) * DIA_MS)));
  const cmds = [...ids.map((id) => ['HGETALL', 'p:' + id]), ids.length ? ['HMGET', 'cards', ...ids] : ['PING'], ...dias.flatMap((d) => [['HGETALL', 'st:d:' + d], ['SCARD', 'st:a:' + d]]), ['HGETALL', 'st:h'], ['HGETALL', 'st:t']];
  const rs = await pipe(cmds), n = ids.length, cart = ids.length ? rs[n] : [];
  const lista = ids.map((id, i) => {
    const o = obj(rs[i]); if (!o.nome) return null;
    let c = {}; try { c = JSON.parse(cart[i] || '{}'); } catch { c = {}; }
    return { id, nome: o.nome, alc: o.alc || '', regime: o.regime, local: o.local, xp: Number(o.xp) || 0, certas: Number(o.certas) || 0, criado: Number(o.criado) || 0, vis: Number(o.vis) || Number(o.criado) || 0, pl: o.pl || 'outro', inst: o.inst === '1', oc: o.oc === '1', prof: o.prof === '1', v: c.v || {} };
  }).filter(Boolean).sort((x, y) => y.xp - x.xp);
  const serie = dias.map((d, k) => ({ d, c: Number(obj(rs[n + 1 + 2 * k]).c) || 0, a: Number(rs[n + 2 + 2 * k]) || 0 }));
  const hh = obj(rs[n + 1 + 28]), horas = Array.from({ length: 24 }, (_, h) => Number(hh[h]) || 0);
  const tt = obj(rs[n + 2 + 28]), tipos = {};
  for (const t of TIPOS) tipos[t] = { n: Number(tt[t + ':n']) || 0, e: Number(tt[t + ':e']) || 0, p: Number(tt[t + ':p']) || 0 };
  return [200, { ok: 1, lista, dias: serie, horas, tipos, agora: Date.now() }];
}

async function ocultar(b) {
  const p = await autenticarProf(b); if (!p) return [403, { erro: 'prof' }];
  if (!idOk(b.alvo)) return [400, { erro: 'alvo' }];
  const q = obj(await cmd('HGETALL', 'p:' + b.alvo)); if (!q.nome) return [404, { erro: 'alvo' }];
  q.oc = b.oculto === true ? '1' : '0';
  let c = {}; try { c = JSON.parse((await cmd('HGET', 'cards', b.alvo)) || '{}'); } catch { c = {}; }
  c.a = nomeCartao(q);
  await pipe([[q.oc === '1' ? 'HSET' : 'HDEL', 'p:' + b.alvo, 'oc', ...(q.oc === '1' ? [1] : [])], ['HSET', 'cards', b.alvo, JSON.stringify(c)]]);
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
    const fn = { registar: (x) => registar(x, req), sync, ranking, apagar, professor: (x) => professor(x, req), painel, ocultar }[b.a];
    if (!fn) return res.status(400).json({ erro: 'acao' });
    const [codigo, corpo] = await fn(b);
    return res.status(codigo).json(corpo);
  } catch (e) { console.error('liga', e && e.message); return res.status(500).json({ erro: 'servidor' }); }
}
