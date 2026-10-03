// API da liga da Arena Mat I. Uma unica funcao: GET devolve o estado, POST executa uma acao (registar, conta, entrar, nuvem, senha, sync, ranking, apagar, professor, painel, ocultar, repor, verif_pedir, verif_confirmar, rec_pedir, rec_confirmar).
// Os pontos so contam depois de o servidor regenerar cada exercicio a partir da semente e conferir a resposta.
import { randomBytes, randomInt, timingSafeEqual, createHash, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import tls from 'node:tls';
import net from 'node:net';
import { gerar, verificar, xpTreino, diaChave, TIPOS } from './_motor.js';
import { pipe, cmd, obj, ligado } from './_redis.js';

const sha = (f) => { try { return createHash('sha256').update(readFileSync(new URL(f, import.meta.url))).digest('hex').slice(0, 12); } catch { return null; } };
const REGIMES = ['diurno', 'noturno'], LOCAIS = ['portimao', 'faro'];
const CHAVES_AV = ['genero', 'top', 'hairColor', 'hatColor', 'accessories', 'accessoriesColor', 'facialHair', 'facialHairColor', 'clothing', 'clothesColor', 'clothingGraphic', 'eyebrows', 'eyes', 'mouth', 'skinColor', 'fundo', 'moldura'];
const MAX_POR_DIA = 80, MAX_EVENTOS = 50, JANELA_SEMENTES = 3000;
const DIA_MS = 86400000;
const MAX_APARELHOS = 12;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const testeOk = (t) => (typeof t === 'string' && DATA_RE.test(t) && t >= '2026-10-01' && t <= '2027-06-30' && !Number.isNaN(Date.parse(t)) ? t : '');
const EMAIL_RE = /^[^\s@<>"'`\\]{1,64}@[^\s@<>"'`\\]{1,200}\.[A-Za-z]{2,24}$/;
const emailLimpo = (e) => { const t = String(e ?? '').normalize('NFC').trim().toLowerCase(); return t.length <= 90 && EMAIL_RE.test(t) ? t : null; };
const hEmail = (e) => createHash('sha256').update('mat1|' + e).digest('hex').slice(0, 32);
const hashSenha = (t) => { const sal = randomBytes(16).toString('hex'); return sal + ':' + scryptSync(String(t), sal, 32).toString('hex'); };
const senhaOk = (t, h) => { const [sal, hx] = String(h || '').split(':'); return !!(sal && hx) && igual(scryptSync(String(t), sal, 32).toString('hex'), hx); };
const SENHA_FALSA = hashSenha('falsa');
const senhaValida = (t) => typeof t === 'string' && t.length >= 6 && t.length <= 64;
const ipDe = (req) => String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim().slice(0, 45);
// contador por hora; devolve true se passou do limite
async function excede(chave, max) { const n = await cmd('INCR', chave); if (n === 1) await cmd('EXPIRE', chave, 7200); return n > max; }

const limpa = (t, n) => String(t ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const idOk = (id) => typeof id === 'string' && /^[0-9a-fA-F-]{20,40}$/.test(id);
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const avatarLimpo = (av) => { const o = {}; if (av && typeof av === 'object') for (const k of CHAVES_AV) { const v = av[k]; if ((typeof v === 'string' || typeof v === 'number') && /^[A-Za-z0-9]{1,24}$/.test(String(v))) o[k] = String(v); } return o; };
const primeiro = (nome) => String(nome || '').split(' ')[0];
const segunda = (dia) => { const d = new Date(dia + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const ontem = (dia) => new Date(new Date(dia + 'T00:00:00Z').getTime() - DIA_MS).toISOString().slice(0, 10);
const PLAT = ['ios', 'android', 'windows', 'mac', 'linux', 'outro'];
const FORMAS = ['tel', 'tab', 'pc'];
const dispLimpo = (d) => ({ pl: d && PLAT.includes(d.pl) ? d.pl : 'outro', fm: d && FORMAS.includes(d.fm) ? d.fm : 'pc', inst: d && d.inst === true ? 1 : 0 });
const horaLx = (ts) => Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Lisbon' }).format(ts));
const chaveG = (per) => `rk:g:${per}`;
const chaveT = (regime, local, per) => `rk:t:${regime}:${local}:${per}`;

// cada aparelho tem a sua chave, a sua semente (sal) e o seu contador. O aparelho "0" e o original (campos do proprio perfil).
async function autenticar(b) {
  if (!idOk(b.id) || typeof b.chave !== 'string') return null;
  const p = obj(await cmd('HGETALL', 'p:' + b.id));
  if (!p.chave) return null;
  const dev = typeof b.dev === 'string' && /^[0-9a-f]{12}$/.test(b.dev) ? b.dev : '0';
  if (dev === '0') { if (!igual(p.chave, b.chave)) return null; p._d = { dev, sal: Number(p.sal), ctr: Number(p.ctr) || 0 }; return p; }
  let d = null; try { d = JSON.parse((await cmd('HGET', 'v:' + b.id, dev)) || 'null'); } catch { d = null; }
  if (!d || !igual(d.k, b.chave)) return null;
  p._d = { dev, sal: Number(d.s), ctr: Number(d.c) || 0 }; return p;
}
const gravarCtr = (b, p, ctr) => (p._d.dev === '0' ? ['HSET', 'p:' + b.id, 'ctr', ctr] : ['HSET', 'v:' + b.id, p._d.dev, JSON.stringify({ s: p._d.sal, k: b.chave, c: ctr, t: Date.now() })]);
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
  const chave = await criarJogador(b.id, { nome, alc, regime, local, sal }, b.avatar, b.disp, testeOk(b.teste), '', b.c0);
  return [200, { ok: 1, chave }];
}
async function criarJogador(id, d, avatar, disp, teste, email, ctr0 = 0) {
  const chave = randomBytes(16).toString('hex'), av = avatarLimpo(avatar), dp = dispLimpo(disp);
  await pipe([
    ['HSET', 'p:' + id, 'nome', d.nome, 'alc', d.alc, 'regime', d.regime, 'local', d.local, 'sal', d.sal, 'chave', chave, 'xp', 0, 'certas', 0, 'ctr', nn(ctr0, 1e6), 'criado', Date.now(), 'vis', Date.now(), 'pl', dp.pl, 'fm', dp.fm, 'inst', dp.inst, ...(teste ? ['teste', teste] : []), ...(email ? ['email', email] : [])],
    ['HSET', 'cards', id, cartao(d, av)],
  ]);
  return chave;
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
    if (pf.teste !== undefined) { const t = testeOk(pf.teste); if (t) cmds.push(['HSET', 'p:' + b.id, 'teste', t]); }
    if (pf.disp) { const dp = dispLimpo(pf.disp); cmds.push(['HSET', 'p:' + b.id, 'pl', dp.pl, 'fm', dp.fm, 'inst', dp.inst]); }
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
    const agora = Date.now(); let aceites = 0, rejeitados = 0, somaXP = 0, ctr = p._d.ctr;
    const evs = (Array.isArray(b.ev) ? b.ev : []).slice(0, MAX_EVENTOS).filter((e) => e && typeof e === 'object').sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0) || (Number(x.s) || 0) - (Number(y.s) || 0));
    if (evs.length) {
      const sal = p._d.sal, diasSet = new Set((await cmd('SMEMBERS', 'dias:' + b.id)) || []);
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
      if (ctr !== p._d.ctr) cmds.push(gravarCtr(b, p, ctr));
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
  if (p.email) cmds.push(['DEL', 'u:' + hEmail(p.email)]);
  cmds.push(['DEL', 'dias:' + b.id], ['DEL', 'ec:v:' + b.id], ['DEL', 'v:' + b.id], ['DEL', 's:' + b.id], ['HDEL', 'cards', b.id], ['SREM', 'profs', b.id], ['DEL', 'p:' + b.id]);
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
  const cmds = [...ids.map((id) => ['HGETALL', 'p:' + id]), ids.length ? ['HMGET', 'cards', ...ids] : ['PING'], ...dias.flatMap((d) => [['HGETALL', 'st:d:' + d], ['SCARD', 'st:a:' + d]]), ['HGETALL', 'st:h'], ['HGETALL', 'st:t'], ...ids.map((id) => ['HLEN', 'v:' + id]), ['LRANGE', 'avl', 0, 4]];
  const rs = await pipe(cmds), n = ids.length, cart = ids.length ? rs[n] : [];
  const lista = ids.map((id, i) => {
    const o = obj(rs[i]); if (!o.nome) return null;
    const ap = 1 + (Number(rs[n + 31 + i]) || 0);
    let c = {}; try { c = JSON.parse(cart[i] || '{}'); } catch { c = {}; }
    return { id, nome: o.nome, alc: o.alc || '', regime: o.regime, local: o.local, xp: Number(o.xp) || 0, certas: Number(o.certas) || 0, criado: Number(o.criado) || 0, vis: Number(o.vis) || Number(o.criado) || 0, pl: o.pl || 'outro', fm: o.fm || '', email: o.email || '', ev: o.ev === '1', av: o.av === '1', teste: o.teste || '', ap, inst: o.inst === '1', oc: o.oc === '1', prof: o.prof === '1', v: c.v || {} };
  }).filter(Boolean).sort((x, y) => y.xp - x.xp);
  const serie = dias.map((d, k) => ({ d, c: Number(obj(rs[n + 1 + 2 * k]).c) || 0, a: Number(rs[n + 2 + 2 * k]) || 0 }));
  const hh = obj(rs[n + 1 + 28]), horas = Array.from({ length: 24 }, (_, h) => Number(hh[h]) || 0);
  const tt = obj(rs[n + 2 + 28]), tipos = {};
  for (const t of TIPOS) tipos[t] = { n: Number(tt[t + ':n']) || 0, e: Number(tt[t + ':e']) || 0, p: Number(tt[t + ':p']) || 0 };
  const avisos = (rs[2 * n + 31] || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
  return [200, { ok: 1, lista, dias: serie, horas, tipos, avisos, agora: Date.now() }];
}

// ---------- contas por email: o mesmo aluno em varios aparelhos ----------
// criar conta: liga um email e uma palavra-passe a um jogador (novo, ou ja existente neste aparelho)
async function conta(b, req) {
  const email = emailLimpo(b.email);
  if (!email) return [400, { erro: 'email' }];
  if (!senhaValida(b.senha)) return [400, { erro: 'senha' }];
  if (b.consentimento !== true) return [400, { erro: 'consentimento' }];
  if (!idOk(b.id)) return [400, { erro: 'id' }];
  if (await excede(`rl:r:${ipDe(req)}:${Math.floor(Date.now() / 3600000)}`, 300)) return [429, { erro: 'muitos_pedidos' }];
  const h = hEmail(email), existe = obj(await cmd('HGETALL', 'p:' + b.id));
  let novo = null;
  if (existe.chave) {
    const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
    if (p.email) return [409, { erro: 'ja_tem_conta' }];
  } else {
    const nome = limpa(b.nome, 40), alc = limpa(b.alc, 16), regime = String(b.regime), local = String(b.local), sal = Number(b.sal);
    if (nome.length < 2 || !REGIMES.includes(regime) || !LOCAIS.includes(local) || !Number.isInteger(sal) || sal < 0 || sal > 4294967295) return [400, { erro: 'dados' }];
    novo = { nome, alc, regime, local, sal };
  }
  if (!(await cmd('HSETNX', 'u:' + h, 'id', b.id))) return [409, { erro: 'email_existe' }];
  try {
    let chave = null;
    if (novo) chave = await criarJogador(b.id, novo, b.avatar, b.disp, testeOk(b.teste), email, b.c0);
    await pipe([['HSET', 'u:' + h, 'pw', hashSenha(b.senha), 'e', email, 'criado', Date.now()], ['HSET', 'p:' + b.id, 'email', email, ...(testeOk(b.teste) ? ['teste', testeOk(b.teste)] : [])]]);
    return [200, { ok: 1, chave, dev: '0' }];
  } catch (e) { await cmd('DEL', 'u:' + h).catch(() => {}); throw e; }
}

// entrar com email e palavra-passe num aparelho novo: recebe a sua propria chave e semente
async function entrar(b, req) {
  const email = emailLimpo(b.email), sal = Number(b.sal);
  if (!email || typeof b.senha !== 'string' || b.senha.length > 64 || !Number.isInteger(sal) || sal < 0 || sal > 4294967295) return [400, { erro: 'dados' }];
  const h = hEmail(email), hora = Math.floor(Date.now() / 3600000);
  if ((await excede(`rl:li:${ipDe(req)}:${hora}`, 60)) || (await excede(`rl:le:${h}:${hora}`, 15))) return [429, { erro: 'muitas_tentativas' }];
  const u = obj(await cmd('HGETALL', 'u:' + h));
  const certa = senhaOk(b.senha, u.pw || SENHA_FALSA) && !!u.pw && idOk(u.id);
  if (!certa) return [403, { erro: 'credenciais' }];
  const p = obj(await cmd('HGETALL', 'p:' + u.id)); if (!p.nome) return [403, { erro: 'credenciais' }];
  const dev = randomBytes(6).toString('hex'), chave = randomBytes(16).toString('hex'), dp = dispLimpo(b.disp), cmds = [];
  const devs = obj(await cmd('HGETALL', 'v:' + u.id)), ids = Object.keys(devs);
  if (ids.length >= MAX_APARELHOS - 1) { // tira o aparelho mais antigo
    const ant = ids.map((k) => { let d = {}; try { d = JSON.parse(devs[k]); } catch { d = {}; } return [k, Number(d.t) || 0]; }).sort((x, y) => x[1] - y[1])[0];
    cmds.push(['HDEL', 'v:' + u.id, ant[0]]);
  }
  cmds.push(['HSET', 'v:' + u.id, dev, JSON.stringify({ s: sal, k: chave, c: nn(b.c0, 1e6), t: Date.now() })], ['HSET', 'p:' + u.id, 'vis', Date.now(), 'pl', dp.pl, 'fm', dp.fm, 'inst', dp.inst], ['HGET', 'cards', u.id]);
  const rs = await pipe(cmds); let av = {}; try { av = JSON.parse(rs[rs.length - 1] || '{}').v || {}; } catch { av = {}; }
  return [200, { ok: 1, id: u.id, chave, dev, perfil: { nome: p.nome, alc: p.alc || '', regime: p.regime, local: p.local, teste: p.teste || '' }, avatar: av, xp: Number(p.xp) || 0, trocar: p.pwtmp === '1', prof: ehProf(p), ev: p.ev === '1', av: p.av === '1' }];
}

// estado do aluno na nuvem (progresso, avatar, conquistas...). O cliente funde e devolve; o servidor so guarda e nunca apaga por conta propria.
const nn = (x, max = 1e9) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : 0; };
const ST = ['certas', 'erradas', 'semPistas', 'desafios', 'perfeitos'];
function limparEst(e) {
  if (!e || typeof e !== 'object') return null;
  const o = { d: {}, dias: [], conq: {}, pt: {}, hoje: null, av: avatarLimpo(e.av), avT: nn(e.avT, 1e15), pf: null, pfT: nn(e.pfT, 1e15) };
  for (const [k, v] of Object.entries(e.d && typeof e.d === 'object' ? e.d : {}).slice(0, 16)) {
    if (!/^[0-9a-f]{1,12}$/.test(k) || !v || typeof v !== 'object') continue;
    const st = v.st && typeof v.st === 'object' ? v.st : {}, x = { xp: nn(v.xp), st: {}, tipo: {} };
    for (const c of ST) x.st[c] = nn(st[c]);
    for (const t of TIPOS) x.tipo[t] = nn(v.tipo && v.tipo[t]);
    o.d[k] = x;
  }
  o.dias = (Array.isArray(e.dias) ? e.dias : []).filter((x) => typeof x === 'string' && DATA_RE.test(x)).sort().slice(-400);
  for (const [k, v] of Object.entries(e.conq && typeof e.conq === 'object' ? e.conq : {}).slice(0, 60)) if (/^[A-Za-z0-9]{1,16}$/.test(k) && typeof v === 'string' && DATA_RE.test(v)) o.conq[k] = v;
  for (const t of TIPOS) { const n = nn(e.pt && e.pt[t]); if (n >= 1 && n <= 3) o.pt[t] = n; }
  if (e.hoje && typeof e.hoje === 'object' && typeof e.hoje.dia === 'string' && DATA_RE.test(e.hoje.dia)) {
    const h = { dia: e.hoje.dia, n: {}, certas: nn(e.hoje.certas), semPistas: nn(e.hoje.semPistas), desafios: nn(e.hoje.desafios), rec: [] };
    for (const t of TIPOS) h.n[t] = nn(e.hoje.n && e.hoje.n[t]);
    h.rec = (Array.isArray(e.hoje.rec) ? e.hoje.rec : []).filter((x) => typeof x === 'string' && /^[A-Za-z0-9:]{1,24}$/.test(x)).slice(0, 8);
    o.hoje = h;
  }
  if (e.pf && typeof e.pf === 'object') {
    const regime = REGIMES.includes(e.pf.regime) ? e.pf.regime : '', local = LOCAIS.includes(e.pf.local) ? e.pf.local : '';
    o.pf = { nome: limpa(e.pf.nome, 40), alc: limpa(e.pf.alc, 16), regime, local, teste: testeOk(e.pf.teste) };
  }
  return o;
}
async function nuvem(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  if (!p.email) return [403, { erro: 'sem_conta' }];
  const ler = async () => { const c = obj(await cmd('HGETALL', 's:' + b.id)); let est = null; try { est = c.est ? JSON.parse(c.est) : null; } catch { est = null; } return { ver: Number(c.ver) || 0, est }; };
  if (b.est === undefined) { // so ler
    const c = await ler();
    return [200, Number(b.ver) === c.ver && c.ver > 0 ? { ok: 1, ver: c.ver, igual: 1, ev: p.ev === '1', av: p.av === '1' } : { ok: 1, ver: c.ver, est: c.est, ev: p.ev === '1', av: p.av === '1' }];
  }
  const est = limparEst(b.est); if (!est) return [400, { erro: 'est' }];
  const txt = JSON.stringify(est); if (txt.length > 24000) return [413, { erro: 'grande' }];
  if (!(await cmd('SET', 'nl:' + b.id, '1', 'NX', 'EX', 10))) return [429, { erro: 'ocupado' }];
  try {
    const c = await ler();
    if (Number(b.base) !== c.ver) return [409, { erro: 'versao', ver: c.ver, est: c.est }];
    await cmd('HSET', 's:' + b.id, 'ver', c.ver + 1, 'est', txt);
    return [200, { ok: 1, ver: c.ver + 1 }];
  } finally { await cmd('DEL', 'nl:' + b.id).catch(() => {}); }
}

// mudar a palavra-passe (tambem serve para sair da palavra-passe temporaria que o professor define)
async function senha(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  if (!p.email) return [403, { erro: 'sem_conta' }];
  if (!senhaValida(b.nova)) return [400, { erro: 'senha' }];
  if (await excede(`rl:s:${b.id}:${Math.floor(Date.now() / 3600000)}`, 8)) return [429, { erro: 'muitos_pedidos' }];
  const h = hEmail(p.email), u = obj(await cmd('HGETALL', 'u:' + h));
  if (typeof b.atual !== 'string' || !senhaOk(b.atual, u.pw)) return [403, { erro: 'atual' }];
  await pipe([['HSET', 'u:' + h, 'pw', hashSenha(b.nova)], ['HDEL', 'p:' + b.id, 'pwtmp']]);
  return [200, { ok: 1 }];
}

// o professor repoe o acesso de um aluno: palavra-passe temporaria que so ele ve (o aluno muda-a ao entrar)
async function repor(b) {
  const p = await autenticarProf(b); if (!p) return [403, { erro: 'prof' }];
  if (!idOk(b.alvo)) return [400, { erro: 'alvo' }];
  const q = obj(await cmd('HGETALL', 'p:' + b.alvo)); if (!q.email) return [404, { erro: 'sem_conta' }];
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rb = randomBytes(8); let temp = ''; for (let i = 0; i < 8; i++) temp += A[rb[i] % A.length];
  const h = hEmail(q.email);
  await pipe([['HSET', 'u:' + h, 'pw', hashSenha(temp)], ['HSET', 'p:' + b.alvo, 'pwtmp', 1], ['DEL', `rl:le:${h}:${Math.floor(Date.now() / 3600000)}`]]);
  return [200, { ok: 1, temp, email: q.email }];
}

// ---------- confirmar o email e recuperar a palavra-passe (so ativo se o envio de emails estiver configurado) ----------
// envio de emails: Gmail (SMTP com palavra-passe de aplicacao) ou Resend. Sem nenhum configurado, as funcoes de email ficam desligadas.
const usaGmail = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
const usaResend = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
const emailAtivo = () => usaGmail() || usaResend();
const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
const cab64 = (t) => '=?UTF-8?B?' + b64(t) + '?=';
// cliente SMTP minimo (ligacao segura na porta 465). Devolve quantos destinatarios o servidor aceitou.
// oculto: a mensagem vai para o proprio remetente e os alunos entram em copia oculta (ninguem ve os outros)
function smtpEnviar(destinos, assunto, texto, oculto) {
  const user = String(process.env.GMAIL_USER).trim(), pass = String(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '');
  const teste = !!process.env.SMTP_HOST_TESTE, host = teste ? process.env.SMTP_HOST_TESTE : 'smtp.gmail.com', porta = teste ? Number(process.env.SMTP_PORTA_TESTE) : 465;
  const nome = limpa(process.env.EMAIL_NOME || 'Arena Mat I', 40) || 'Arena Mat I';
  return new Promise((resolve) => {
    let fim = false, buf = '', esperando = null, aceites = 0; const respostas = [];
    const s = teste ? net.connect(porta, host) : tls.connect({ host, port: porta, servername: host });
    const acabar = (n) => { if (fim) return; fim = true; clearTimeout(tempo); try { s.destroy(); } catch { /* ja fechada */ } resolve(n); };
    const tempo = setTimeout(() => acabar(0), 25000);
    s.setEncoding('utf8');
    s.on('error', () => acabar(0)); s.on('close', () => acabar(0));
    s.on('data', (d) => {
      buf += d; let m;
      while ((m = buf.match(/^(?:\d{3}-[^\n]*\n)*\d{3}[ \r\n][^\n]*\n/))) { buf = buf.slice(m[0].length); const c = Number(m[0].slice(0, 3)); if (esperando) { const f = esperando; esperando = null; f(c); } else respostas.push(c); }
    });
    const ler = () => new Promise((res) => { if (respostas.length) res(respostas.shift()); else esperando = res; });
    const passo = async (linha, ok) => { if (linha !== null) s.write(linha + '\r\n'); const c = await ler(); if (!ok.includes(c)) throw new Error('smtp ' + c); return c; };
    (async () => {
      await passo(null, [220]);
      await passo('EHLO arena-mat1', [250]);
      await passo('AUTH PLAIN ' + b64('\0' + user + '\0' + pass), [235]);
      await passo(`MAIL FROM:<${user}>`, [250]);
      for (const d of destinos) { s.write(`RCPT TO:<${d}>\r\n`); const c = await ler(); if (c === 250 || c === 251) aceites++; }
      if (!aceites) throw new Error('smtp sem destinatarios');
      await passo('DATA', [354]);
      const de = `${cab64(nome)} <${user}>`;
      const msg = [`From: ${de}`, `To: ${oculto ? de : destinos[0]}`, `Subject: ${cab64(assunto)}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${randomBytes(12).toString('hex')}@gmail.com>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', b64(texto).replace(/.{1,76}/g, '$&\r\n')].join('\r\n');
      await passo(msg + '\r\n.', [250]);
      s.write('QUIT\r\n'); acabar(aceites);
    })().catch(() => acabar(0));
  });
}
async function enviarEmail(para, assunto, texto) {
  try {
    if (usaGmail()) return (await smtpEnviar([para], assunto, texto, false)) > 0;
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [para], subject: assunto, text: texto }) });
    return r.ok;
  } catch { return false; }
}
const codigoHash = (chave, codigo) => createHash('sha256').update('mat1c|' + chave + '|' + codigo).digest('hex');
const CODIGO_MS = 15 * 60000;
// cria um codigo de 6 digitos para a chave dada e envia-o por email
async function emitirCodigo(chave, tipo, email) {
  const codigo = String(randomInt(0, 1000000)).padStart(6, '0');
  await pipe([['DEL', 'ec:' + chave], ['HSET', 'ec:' + chave, 't', tipo, 'h', codigoHash(chave, codigo), 'exp', Date.now() + CODIGO_MS, 'n', 0], ['EXPIRE', 'ec:' + chave, 1800]]);
  const o = tipo === 'v' ? 'Confirma o teu email na Arena Mat I' : 'Recuperar a palavra-passe da Arena Mat I';
  const frase = tipo === 'v' ? 'Para confirmares o teu email, escreve este código na app:' : 'Para escolheres uma nova palavra-passe, escreve este código na app:';
  return enviarEmail(email, o, `${frase}\n\n${codigo}\n\nO código vale 15 minutos. Se não pediste isto, ignora este email e a tua conta fica como está.\n\nArena Mat I, Matemática I, ESGHT, Universidade do Algarve`);
}
// confere o codigo (no maximo 5 tentativas); apaga-o quando certo ou esgotado
async function conferirCodigo(chave, tipo, codigo) {
  const c = obj(await cmd('HGETALL', 'ec:' + chave));
  if (!c.h || c.t !== tipo) return false;
  if (Number(c.exp) < Date.now() || Number(c.n) >= 5) { await cmd('DEL', 'ec:' + chave); return false; }
  if (typeof codigo !== 'string' || !/^\d{6}$/.test(codigo)) return false;
  if (!igual(codigoHash(chave, codigo), c.h)) { await cmd('HINCRBY', 'ec:' + chave, 'n', 1); return false; }
  await cmd('DEL', 'ec:' + chave); return true;
}
async function verifPedir(b) {
  if (!emailAtivo()) return [503, { erro: 'sem_email' }];
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  if (!p.email) return [403, { erro: 'sem_conta' }];
  if (p.ev === '1') return [200, { ok: 1, ja: 1 }];
  if (await excede(`rl:vp:${b.id}:${Math.floor(Date.now() / 3600000)}`, 5)) return [429, { erro: 'muitos_pedidos' }];
  const ok = await emitirCodigo('v:' + b.id, 'v', p.email);
  return ok ? [200, { ok: 1 }] : [502, { erro: 'envio' }];
}
async function verifConfirmar(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  if (!p.email) return [403, { erro: 'sem_conta' }];
  if (await excede(`rl:vc:${b.id}:${Math.floor(Date.now() / 3600000)}`, 20)) return [429, { erro: 'muitos_pedidos' }];
  if (!(await conferirCodigo('v:' + b.id, 'v', b.codigo))) return [403, { erro: 'codigo' }];
  await cmd('HSET', 'p:' + b.id, 'ev', 1);
  return [200, { ok: 1 }];
}
// recuperar: sem sessao. Responde sempre da mesma maneira, exista ou nao a conta (nao revela quem tem conta)
async function recPedir(b, req) {
  if (!emailAtivo()) return [503, { erro: 'sem_email' }];
  const email = emailLimpo(b.email); if (!email) return [400, { erro: 'email' }];
  const h = hEmail(email), hora = Math.floor(Date.now() / 3600000);
  if ((await excede(`rl:ri:${ipDe(req)}:${hora}`, 20)) || (await excede(`rl:re:${h}:${hora}`, 4))) return [429, { erro: 'muitos_pedidos' }];
  const u = obj(await cmd('HGETALL', 'u:' + h));
  if (u.pw && idOk(u.id)) await emitirCodigo('r:' + h, 'r', email);
  return [200, { ok: 1 }];
}
async function recConfirmar(b, req) {
  const email = emailLimpo(b.email); if (!email) return [400, { erro: 'email' }];
  if (!senhaValida(b.nova)) return [400, { erro: 'senha' }];
  const h = hEmail(email), hora = Math.floor(Date.now() / 3600000);
  if ((await excede(`rl:ci:${ipDe(req)}:${hora}`, 40)) || (await excede(`rl:ce:${h}:${hora}`, 12))) return [429, { erro: 'muitos_pedidos' }];
  const u = obj(await cmd('HGETALL', 'u:' + h)); if (!u.pw || !idOk(u.id)) return [403, { erro: 'codigo' }];
  if (!(await conferirCodigo('r:' + h, 'r', b.codigo))) return [403, { erro: 'codigo' }];
  await pipe([['HSET', 'u:' + h, 'pw', hashSenha(b.nova)], ['HDEL', 'p:' + u.id, 'pwtmp'], ['HSET', 'p:' + u.id, 'ev', 1]]);
  return [200, { ok: 1 }];
}

// ---------- avisos de novos conteudos (so para quem confirmou o email e aceitou receber) ----------
// o aluno liga ou desliga os avisos. Para ligar tem de ter o email confirmado.
async function avisos(b) {
  const p = await autenticar(b); if (!p) return [401, { erro: 'auth' }];
  if (!p.email) return [403, { erro: 'sem_conta' }];
  if (b.ativo === true) {
    if (p.ev !== '1') return [403, { erro: 'sem_confirmacao' }];
    await cmd('HSET', 'p:' + b.id, 'av', 1);
    return [200, { ok: 1, av: true }];
  }
  await cmd('HDEL', 'p:' + b.id, 'av');
  return [200, { ok: 1, av: false }];
}
// envio de um aviso a muitos alunos: cada um recebe a sua mensagem e nao ve os outros. Devolve quantos foram enviados e quantos falharam.
async function enviarMuitos(dest, assunto, texto) {
  let enviados = 0, falhas = 0;
  if (usaGmail()) { // lotes de 50 em copia oculta (o Gmail aceita ate 100 destinatarios por mensagem e 500 por dia)
    for (let i = 0; i < dest.length; i += 50) { const lote = dest.slice(i, i + 50); const n = await smtpEnviar(lote, assunto, texto, true).catch(() => 0); enviados += n; falhas += lote.length - n; }
    return { enviados, falhas };
  }
  for (let i = 0; i < dest.length; i += 100) { // Resend: uma mensagem por aluno, ate 100 por chamada
    const lote = dest.slice(i, i + 100); let ok = false;
    try { const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(lote.map((para) => ({ from: process.env.EMAIL_FROM, to: [para], subject: assunto, text: texto }))) }); ok = r.ok; } catch { ok = false; }
    if (ok) enviados += lote.length; else falhas += lote.length;
  }
  return { enviados, falhas };
}
const textoAviso = (t) => String(t ?? '').normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
const RODAPE = '\n\n--\nArena Mat I, Matemática I, ESGHT, Universidade do Algarve.\nRecebes este email porque ativaste os avisos de novos conteúdos. Para deixares de os receber, abre a app, vai a Perfil, Definições, e desliga os avisos.';
// o professor escreve um aviso. modo: contar (quantos recebem), teste (so para ele) ou enviar
async function aviso(b) {
  const p = await autenticarProf(b); if (!p) return [403, { erro: 'prof' }];
  if (!emailAtivo()) return [503, { erro: 'sem_email' }];
  const modo = ['contar', 'teste', 'enviar'].includes(b.modo) ? b.modo : null; if (!modo) return [400, { erro: 'modo' }];
  const ids = ((await cmd('HKEYS', 'cards')) || []).filter(idOk).slice(0, 400);
  const rs = ids.length ? await pipe(ids.map((id) => ['HMGET', 'p:' + id, 'email', 'ev', 'av', 'prof'])) : [];
  const dest = ids.map((id, i) => ({ email: (rs[i] || [])[0], ev: (rs[i] || [])[1], av: (rs[i] || [])[2], prof: (rs[i] || [])[3] })).filter((x) => x.email && x.ev === '1' && x.av === '1' && x.prof !== '1').map((x) => x.email);
  if (modo === 'contar') return [200, { ok: 1, n: dest.length }];
  const assunto = limpa(b.assunto, 90), texto = textoAviso(b.texto).slice(0, 4000);
  if (assunto.length < 3 || texto.length < 10) return [400, { erro: 'conteudo' }];
  const hora = Math.floor(Date.now() / 3600000);
  if (await excede(`rl:av:${hora}`, modo === 'teste' ? 20 : 5)) return [429, { erro: 'muitos_pedidos' }];
  const assuntoFinal = '[Arena Mat I] ' + assunto, corpoFinal = texto + RODAPE;
  if (modo === 'teste') {
    if (!p.email) return [400, { erro: 'sem_email_prof' }];
    return (await enviarEmail(p.email, assuntoFinal, corpoFinal)) ? [200, { ok: 1, enviados: 1 }] : [502, { erro: 'envio' }];
  }
  if (!dest.length) return [400, { erro: 'sem_destinatarios' }];
  const { enviados, falhas } = await enviarMuitos(dest, assuntoFinal, corpoFinal);
  await pipe([['LPUSH', 'avl', JSON.stringify({ t: Date.now(), a: assunto, n: enviados, f: falhas })], ['LTRIM', 'avl', 0, 19]]);
  return [200, { ok: 1, enviados, falhas }];
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
  if (req.method === 'GET') return res.status(200).json({ ligado: ligado(), email: emailAtivo(), via: usaGmail() ? 'gmail' : usaResend() ? 'resend' : null, v: { liga: sha('./liga.js'), motor: sha('./_motor.js'), redis: sha('./_redis.js') } });
  if (req.method !== 'POST') return res.status(405).json({ erro: 'metodo' });
  if (!ligado()) return res.status(503).json({ erro: 'sem_base' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ erro: 'corpo' });
  try {
    const fn = { registar: (x) => registar(x, req), sync, ranking, apagar, professor: (x) => professor(x, req), painel, ocultar, conta: (x) => conta(x, req), entrar: (x) => entrar(x, req), nuvem, senha, repor, verif_pedir: verifPedir, verif_confirmar: verifConfirmar, rec_pedir: (x) => recPedir(x, req), rec_confirmar: (x) => recConfirmar(x, req), avisos, aviso }[b.a];
    if (!fn) return res.status(400).json({ erro: 'acao' });
    const [codigo, corpo] = await fn(b);
    return res.status(codigo).json(corpo);
  } catch (e) { console.error('liga', e && e.message); return res.status(500).json({ erro: 'servidor' }); }
}
