// Teste da API da liga contra o servidor de desenvolvimento: node scripts/test-liga.mjs [http://localhost:8092]
import { gerar, TIPOS } from '../web/js/engine/generators.js';
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA'), m); if (!c) falhas++; };
const resp = (ex) => { const r = ex.resposta; if (r.kind === 'escalar') return String(r.valor); if (r.kind === 'matriz') return r.valor.rows ? r.valor.rows.map((l) => l.map(String)) : JSON.parse(JSON.stringify(r.valor)); return { tipo: r.valor.tipo, solucao: (r.valor.solucao || []).map(String) }; };
const jogador = (n) => ({ id: crypto.randomUUID(), sal: Math.floor(Math.random() * 1e9), contador: 0, n });
const semente = (j) => { j.contador++; return (j.sal + j.contador * 7919) >>> 0; };
const certo = (j, t = TIPOS[j.contador % TIPOS.length], nivel = 1, extra = {}) => { const s = semente(j); const ex = gerar(t, s, nivel); return { t, n: nivel, s, p: 0, e: false, r: resp(ex), ts: Date.now(), ...extra }; };
const reg = (j, regime, local, alc) => post({ a: 'registar', id: j.id, sal: j.sal, nome: 'Aluno ' + j.n, alc, regime, local, avatar: { top: 'bob', skinColor: 'edb98a', xx: 'lixo<' }, consentimento: true });

const ana = jogador('Ana'), rui = jogador('Rui'), eva = jogador('Eva');
let r = await post({ a: 'registar', id: ana.id, sal: ana.sal, nome: 'Ana', regime: 'diurno', local: 'faro' }); ok(r.s === 400, 'registar sem consentimento falha');
r = await reg(ana, 'diurno', 'faro', 'AnaF'); ok(r.s === 200 && r.chave, 'registar Ana'); ana.chave = r.chave;
r = await reg(ana, 'diurno', 'faro', 'AnaF'); ok(r.s === 409, 'registar duas vezes falha');
r = await reg(rui, 'diurno', 'faro', ''); rui.chave = r.chave; r = await reg(eva, 'noturno', 'portimao', 'Eva'); eva.chave = eva.chave = r.chave;
r = await post({ a: 'sync', id: ana.id, chave: 'errada', ev: [] }); ok(r.s === 401, 'chave errada recusada');

// Ana: 6 certas validas
let ev = []; for (let i = 0; i < 6; i++) ev.push(certo(ana));
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev }); ok(r.s === 200 && r.aceites === 6 && r.xp > 0, `Ana sync 6 certas: aceites ${r.aceites} xp ${r.xp}`);
const xpAna = r.xp;
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev }); ok(r.aceites === 0 && r.rejeitados === 6, 'repetir os mesmos eventos e rejeitado (replay)');
// resposta errada
const e1 = certo(ana); e1.r = e1.r === '0' ? '1' : Array.isArray(e1.r) ? [['999']] : typeof e1.r === 'object' ? { tipo: 'SI', solucao: [] } : '99999';
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev: [e1] }); ok(r.aceites === 0 && r.rejeitados === 1, 'resposta errada nao pontua');
// semente inventada
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev: [{ ...certo(ana), s: 12345 }] }); ok(r.aceites === 0, 'semente fora da sequencia recusada');
// tipo/nivel invalidos
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev: [{ ...certo(ana), n: 9 }, { ...certo(ana), t: 'xx' }, { ...certo(ana), ts: Date.now() + 3600e3 }] }); ok(r.aceites === 0 && r.rejeitados === 3, 'nivel, tipo e hora invalidos recusados');
// retornos decrescentes: 12 do mesmo tipo no dia
ev = []; for (let i = 0; i < 12; i++) ev.push(certo(rui, 'determinante', 2));
r = await post({ a: 'sync', id: rui.id, chave: rui.chave, ev }); ok(r.aceites === 12, 'Rui 12 certas'); const xpRui = r.xp;
ok(xpRui < 12 * 20 * 1.6, `retornos decrescentes (xp ${xpRui} < max linear)`);
// Eva noturno portimao
r = await post({ a: 'sync', id: eva.id, chave: eva.chave, ev: [certo(eva, 'produto', 3), certo(eva, 'sistema', 3, { p: 2 })] }); ok(r.aceites === 2, 'Eva 2 certas');
// ranking turma de Ana (diurno faro): Ana e Rui
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'turma', periodo: 'total' });
ok(r.lista.length === 2 && r.lista[0].alc && r.lista.some((x) => x.eu), `ranking turma tem 2 (tem ${r.lista.length}) e eu marcado`);
ok(r.lista[0].xp >= r.lista[1].xp, 'ordenado por pontos');
ok(r.lista.find((x) => x.alc === 'Aluno'), 'sem alcunha usa o primeiro nome ("Aluno")');
ok(JSON.stringify(r.lista[0].v).includes('bob') || r.lista[1] && JSON.stringify(r.lista[1].v).includes('bob'), 'avatar filtrado guardado'); ok(!JSON.stringify(r).includes('lixo'), 'campos de avatar nao permitidos descartados');
ok(r.minha.pos >= 1 && r.minha.xp === xpAna, `minha posicao ${r.minha.pos}`);
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'geral', periodo: 'semana' }); ok(r.lista.length === 3, 'ranking geral semana tem 3');
r = await post({ a: 'ranking', id: eva.id, chave: eva.chave, escopo: 'turma', periodo: 'semana' }); ok(r.lista.length === 1 && r.lista[0].alc === 'Eva', 'turma da Eva so tem a Eva');
// mudar de turma leva pontos
r = await post({ a: 'sync', id: eva.id, chave: eva.chave, ev: [], perfil: { regime: 'diurno', local: 'faro', alc: 'EvaFaro' } }); ok(r.s === 200, 'Eva muda de turma');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'turma', periodo: 'total' }); ok(r.lista.length === 3 && r.lista.some((x) => x.alc === 'EvaFaro'), 'Eva aparece na nova turma com a nova alcunha');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'geral', periodo: 'total' }); ok(r.lista.length === 3, 'geral continua com 3');
// limite diario
const lim = jogador('Lim'); r = await reg(lim, 'noturno', 'faro', 'Lim'); lim.chave = r.chave; let tot = 0, rej = 0;
for (let b = 0; b < 3; b++) { ev = []; for (let i = 0; i < 40; i++) ev.push(certo(lim, 'produto', 1)); r = await post({ a: 'sync', id: lim.id, chave: lim.chave, ev }); tot += r.aceites; rej += r.rejeitados; }
ok(tot === 80 && rej === 40, `limite de 80 por dia (aceites ${tot}, rejeitados ${rej})`);
// apagar
r = await post({ a: 'apagar', id: rui.id, chave: rui.chave }); ok(r.s === 200, 'Rui apaga os dados');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'turma', periodo: 'total' }); ok(r.lista.length === 2, 'Rui desapareceu do ranking');
r = await post({ a: 'sync', id: rui.id, chave: rui.chave, ev: [] }); ok(r.s === 401, 'Rui ja nao se autentica');
// professor
const prof = jogador('Prof'); r = await reg(prof, 'diurno', 'portimao', 'ProfAlc'); prof.chave = r.chave;
r = await post({ a: 'sync', id: prof.id, chave: prof.chave, ev: [certo(prof, 'produto', 1)] }); ok(r.aceites === 1 && r.prof === false, 'antes do codigo conta como aluno');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'geral', periodo: 'total' }); ok(r.lista.some((x) => x.alc === 'ProfAlc'), 'aluno aparece no ranking antes de ser professor');
r = await post({ a: 'professor', id: ana.id, chave: ana.chave, codigo: 'errado' }); ok(r.s === 403, 'codigo errado recusado');
r = await post({ a: 'professor', id: ana.id, chave: 'x', codigo: 'codigo-de-teste' }); ok(r.s === 401, 'sem chave do jogador nao entra');
r = await post({ a: 'painel', id: ana.id, chave: ana.chave }); ok(r.s === 403, 'aluno nao ve o painel');
r = await post({ a: 'professor', id: prof.id, chave: prof.chave, codigo: '  codigo-de-teste ' }); ok(r.s === 200, 'codigo certo reconhece o professor');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'geral', periodo: 'total' }); ok(!r.lista.some((x) => x.alc === 'ProfAlc'), 'professor sai do ranking');
r = await post({ a: 'sync', id: prof.id, chave: prof.chave, ev: [certo(prof, 'produto', 1)] }); ok(r.aceites === 1 && r.prof === true, 'professor treina e o servidor confirma o estatuto');
r = await post({ a: 'ranking', id: ana.id, chave: ana.chave, escopo: 'geral', periodo: 'total' }); ok(!r.lista.some((x) => x.alc === 'ProfAlc'), 'pontos do professor nao entram no ranking');
r = await post({ a: 'ranking', id: prof.id, chave: prof.chave, escopo: 'geral', periodo: 'total' }); ok(r.prof === true && r.minha === null, 'professor ve a tabela sem posicao');
r = await post({ a: 'painel', id: prof.id, chave: prof.chave }); ok(r.s === 200 && r.lista.length >= 4 && r.lista.some((x) => x.nome === 'Aluno Ana' || x.nome === 'Ana') && r.lista.some((x) => x.prof), `painel lista os jogadores com nome real (${r.lista?.length})`);
r = await post({ a: 'ocultar', id: ana.id, chave: ana.chave, alvo: eva.id, oculto: true }); ok(r.s === 403, 'aluno nao pode ocultar');
r = await post({ a: 'ocultar', id: prof.id, chave: prof.chave, alvo: ana.id, oculto: true }); ok(r.s === 200, 'professor oculta a alcunha da Ana');
r = await post({ a: 'ranking', id: rui.id === ana.id ? eva.id : eva.id, chave: eva.chave, escopo: 'geral', periodo: 'total' }); ok(!r.lista.some((x) => x.alc === 'AnaF') && r.lista.some((x) => x.alc === 'Aluno' && x.xp === xpAna), 'alcunha oculta aparece como Aluno');
r = await post({ a: 'sync', id: ana.id, chave: ana.chave, ev: [], perfil: { alc: 'NovaAlc' } }); r = await post({ a: 'ranking', id: eva.id, chave: eva.chave, escopo: 'geral', periodo: 'total' }); ok(!r.lista.some((x) => x.alc === 'NovaAlc'), 'mudar de alcunha nao desfaz a ocultacao');
r = await post({ a: 'ocultar', id: prof.id, chave: prof.chave, alvo: ana.id, oculto: false }); r = await post({ a: 'ranking', id: eva.id, chave: eva.chave, escopo: 'geral', periodo: 'total' }); ok(r.lista.some((x) => x.alc === 'NovaAlc'), 'professor volta a mostrar a alcunha');
r = await post({ a: 'ocultar', id: prof.id, chave: prof.chave, alvo: 'nao-existe', oculto: true }); ok(r.s === 400, 'alvo invalido recusado');
for (let i = 0; i < 9; i++) r = await post({ a: 'professor', id: eva.id, chave: eva.chave, codigo: 'tentativa' + i }); ok(r.s === 429, 'tentativas de codigo limitadas');
console.log(falhas ? `\n${falhas} FALHAS` : '\nTodos os testes passaram'); process.exit(falhas ? 1 : 0);
