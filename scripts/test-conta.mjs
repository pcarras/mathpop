// Teste das contas por email, aparelhos, nuvem, palavra-passe e data do teste. Requer: node scripts/dev-liga.mjs 8092
import { gerar, TIPOS } from '../web/js/engine/generators.js';
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA'), m); if (!c) falhas++; };
const resp = (ex) => { const r = ex.resposta; if (r.kind === 'escalar') return String(r.valor); if (r.kind === 'matriz') return r.valor.rows.map((l) => l.map(String)); return { tipo: r.valor.tipo, solucao: (r.valor.solucao || []).map(String) }; };
const jog = (n) => ({ id: crypto.randomUUID(), sal: Math.floor(Math.random() * 1e9), contador: 0, n, dev: undefined });
const sem = (j) => { j.contador++; return (j.sal + j.contador * 7919) >>> 0; };
const certo = (j, t = TIPOS[j.contador % TIPOS.length], nivel = 1) => { const s = sem(j); return { t, n: nivel, s, p: 0, e: false, r: resp(gerar(t, s, nivel)), ts: Date.now() }; };
const sync = (j, ev = [], perfil) => post({ a: 'sync', id: j.id, chave: j.chave, dev: j.dev, ev, ...(perfil ? { perfil } : {}) });
const sufixo = Math.random().toString(36).slice(2, 8);
const mail = (x) => `${x}.${sufixo}@exemplo.pt`;

// 1. jogador antigo (sem email) liga o email sem perder pontos
const ana = jog('Ana'); let r = await post({ a: 'registar', id: ana.id, sal: ana.sal, nome: 'Ana Conta', alc: 'AnaC', regime: 'diurno', local: 'faro', avatar: { top: 'bob' }, consentimento: true }); ana.chave = r.chave;
r = await sync(ana, [certo(ana), certo(ana), certo(ana)]); const xp0 = r.xp; ok(r.aceites === 3 && xp0 > 0, 'Ana (sem conta) treina 3');
r = await post({ a: 'conta', id: ana.id, chave: ana.chave, email: 'isto nao e email', senha: 'abcdef', consentimento: true }); ok(r.s === 400 && r.erro === 'email', 'email invalido recusado');
r = await post({ a: 'conta', id: ana.id, chave: ana.chave, email: mail('ana'), senha: '123', consentimento: true }); ok(r.s === 400 && r.erro === 'senha', 'palavra-passe curta recusada');
r = await post({ a: 'conta', id: ana.id, chave: ana.chave, email: mail('ana'), senha: 'abcdef' }); ok(r.s === 400 && r.erro === 'consentimento', 'sem consentimento recusado');
r = await post({ a: 'conta', id: ana.id, chave: 'errada', email: mail('ana'), senha: 'abcdef', consentimento: true }); ok(r.s === 401, 'ligar email sem a chave certa recusado');
r = await post({ a: 'conta', id: ana.id, chave: ana.chave, email: mail('ana'), senha: 'segredo1', consentimento: true, teste: '2026-11-04' }); ok(r.s === 200 && r.dev === '0', 'Ana liga o email à conta existente');
r = await post({ a: 'conta', id: ana.id, chave: ana.chave, email: mail('ana2'), senha: 'segredo1', consentimento: true }); ok(r.s === 409 && r.erro === 'ja_tem_conta', 'conta que já tem email não liga outro');
r = await sync(ana, []); ok(r.xp === xp0, 'pontos da Ana intactos depois de ligar o email');

// 2. conta nova (jogador que ainda não existia)
const rui = jog('Rui'); r = await post({ a: 'conta', id: rui.id, email: mail('rui'), senha: 'rui12345', consentimento: true, sal: rui.sal, nome: 'Rui Novo', alc: 'RuiN', regime: 'noturno', local: 'portimao', avatar: { top: 'curly' }, teste: '2026-10-28' });
ok(r.s === 200 && r.chave, 'conta nova cria jogador e conta'); rui.chave = r.chave;
r = await post({ a: 'conta', id: crypto.randomUUID(), email: mail('RUI').toUpperCase(), senha: 'outra123', consentimento: true, sal: 5, nome: 'Outro', regime: 'diurno', local: 'faro' }); ok(r.s === 409 && r.erro === 'email_existe', 'email repetido (mesmo em maiúsculas) recusado');

// 3. entrar noutro aparelho
r = await post({ a: 'entrar', email: mail('ana'), senha: 'errada1', sal: 1 }); const e1 = r; ok(r.s === 403 && r.erro === 'credenciais', 'palavra-passe errada recusada');
r = await post({ a: 'entrar', email: mail('ninguem'), senha: 'errada1', sal: 1 }); ok(r.s === 403 && r.erro === e1.erro, 'email desconhecido dá a mesma resposta');
const anaB = { ...jog('AnaB'), id: ana.id }; r = await post({ a: 'entrar', email: mail('ana').toUpperCase(), senha: 'segredo1', sal: anaB.sal, disp: { pl: 'windows', fm: 'pc', inst: true } });
ok(r.s === 200 && r.id === ana.id && r.dev && r.chave && r.perfil.nome === 'Ana Conta' && r.perfil.teste === '2026-11-04' && JSON.stringify(r.avatar).includes('bob'), 'Ana entra no desktop e recebe perfil, avatar e dia do teste');
anaB.chave = r.chave; anaB.dev = r.dev;
r = await sync(anaB, [certo(anaB), certo(anaB)]); ok(r.aceites === 2 && r.xp > xp0, `desktop soma pontos na mesma conta (xp ${r.xp} > ${xp0})`);
r = await sync(ana, [certo(ana)]); ok(r.aceites === 1, 'telemóvel continua a somar com a sua própria sequência');
const xpTotal = r.xp;
const inter = { ...anaB, contador: anaB.contador }; const ev = certo(inter); r = await sync(ana, [ev]); ok(r.aceites === 0, 'evento do desktop não vale no telemóvel (sementes por aparelho)');
r = await sync(anaB, [ev]); ok(r.aceites === 1, 'mas vale no desktop');
r = await post({ a: 'sync', id: ana.id, chave: anaB.chave, dev: 'abcdefabcdef', ev: [] }); ok(r.s === 401, 'aparelho desconhecido recusado');
r = await post({ a: 'sync', id: ana.id, chave: 'x'.repeat(32), dev: anaB.dev, ev: [] }); ok(r.s === 401, 'chave errada no aparelho recusada');
r = await post({ a: 'ranking', id: ana.id, chave: anaB.chave, dev: anaB.dev, escopo: 'turma', periodo: 'total' }); ok(r.s === 200 && r.lista.filter((x) => x.eu).length === 1 && r.lista.filter((x) => x.eu)[0].xp > xpTotal, 'uma só linha da Ana na tabela, com os pontos dos dois aparelhos');

// 4. nuvem
r = await post({ a: 'nuvem', id: ana.id, chave: ana.chave }); ok(r.s === 200 && r.ver === 0 && !r.est, 'nuvem vazia');
const est1 = { d: { '0': { xp: 120, st: { certas: 12, erradas: 3, semPistas: 4, desafios: 1, perfeitos: 0 }, tipo: { produto: 5, inversa: 7, xx: 99 }, lixo: 1 } }, dias: ['2026-10-01', 'nao-data', '2026-10-02'], conq: { primeiro: '2026-10-01', '<x>': '2026-10-01' }, pt: { inversa: 2, produto: 9 }, hoje: { dia: '2026-10-02', n: { produto: 2 }, certas: 2, semPistas: 1, desafios: 0, rec: ['certas5', '<b>'] }, av: { top: 'bob', xx: 'lixo<' }, avT: 5, pf: { nome: 'Ana <b>Conta', alc: 'AnaC', regime: 'diurno', local: 'faro', teste: '2026-11-04' }, pfT: 7 };
r = await post({ a: 'nuvem', id: ana.id, chave: ana.chave, base: 0, est: est1 }); ok(r.s === 200 && r.ver === 1, 'Ana guarda o estado na nuvem (versão 1)');
r = await post({ a: 'nuvem', id: anaB.id, chave: anaB.chave, dev: anaB.dev, base: 0, est: est1 }); ok(r.s === 409 && r.erro === 'versao' && r.ver === 1 && r.est, 'versão antiga recusada, devolve o estado atual para fundir');
r = await post({ a: 'nuvem', id: anaB.id, chave: anaB.chave, dev: anaB.dev, ver: 0 }); const g = r.est;
ok(r.s === 200 && g && g.d['0'].xp === 120 && g.d['0'].tipo.xx === undefined && g.d['0'].tipo.inversa === 7 && g.d['0'].lixo === undefined && g.dias.length === 2 && !g.conq['<x>'] && g.pt.produto === undefined && g.pt.inversa === 2 && !g.hoje.rec.includes('<b>') && !JSON.stringify(g.av).includes('lixo') && g.pf.nome === 'Ana bConta', 'desktop lê o estado, já limpo de campos inválidos');
r = await post({ a: 'nuvem', id: anaB.id, chave: anaB.chave, dev: anaB.dev, ver: 1 }); ok(r.s === 200 && r.igual === 1 && !r.est, 'sem novidades: não reenvia o estado');
r = await post({ a: 'nuvem', id: anaB.id, chave: anaB.chave, dev: anaB.dev, base: 1, est: { ...g, d: { ...g.d, [anaB.dev]: { xp: 30, st: { certas: 3 }, tipo: {} } } } }); ok(r.s === 200 && r.ver === 2, 'desktop acrescenta os seus contadores (versão 2)');
const sem2 = jog('SemConta'); r = await post({ a: 'registar', id: sem2.id, sal: sem2.sal, nome: 'Sem Conta', regime: 'diurno', local: 'faro', consentimento: true }); sem2.chave = r.chave;
r = await post({ a: 'nuvem', id: sem2.id, chave: sem2.chave }); ok(r.s === 403 && r.erro === 'sem_conta', 'sem email não há nuvem');

// 5. palavra-passe
r = await post({ a: 'senha', id: ana.id, chave: ana.chave, atual: 'errada', nova: 'novasenha1' }); ok(r.s === 403 && r.erro === 'atual', 'mudar com a palavra-passe atual errada recusado');
r = await post({ a: 'senha', id: ana.id, chave: ana.chave, atual: 'segredo1', nova: 'abc' }); ok(r.s === 400, 'nova palavra-passe curta recusada');
r = await post({ a: 'senha', id: ana.id, chave: ana.chave, atual: 'segredo1', nova: 'novasenha1' }); ok(r.s === 200, 'palavra-passe mudada');
r = await post({ a: 'entrar', email: mail('ana'), senha: 'segredo1', sal: 2 }); ok(r.s === 403, 'a antiga já não entra');
r = await post({ a: 'entrar', email: mail('ana'), senha: 'novasenha1', sal: 3 }); ok(r.s === 200 && !r.trocar, 'a nova entra'); const anaC = { ...jog('AnaC'), id: ana.id, chave: r.chave, dev: r.dev };

// 6. professor repõe o acesso
const prof = jog('Prof'); r = await post({ a: 'registar', id: prof.id, sal: prof.sal, nome: 'Prof Teste', alc: 'ProfT', regime: 'diurno', local: 'portimao', consentimento: true }); prof.chave = r.chave;
r = await post({ a: 'professor', id: prof.id, chave: prof.chave, codigo: 'codigo-de-teste' }); ok(r.s === 200, 'professor reconhecido');
r = await post({ a: 'repor', id: ana.id, chave: ana.chave, alvo: rui.id }); ok(r.s === 403, 'aluno não repõe acessos');
r = await post({ a: 'repor', id: prof.id, chave: prof.chave, alvo: sem2.id }); ok(r.s === 404, 'sem conta, não há acesso a repor');
r = await post({ a: 'repor', id: prof.id, chave: prof.chave, alvo: rui.id }); const temp = r.temp; ok(r.s === 200 && /^[A-Z2-9]{8}$/.test(temp) && r.email === mail('rui'), 'professor repõe o acesso do Rui e vê a palavra-passe temporária');
r = await post({ a: 'entrar', email: mail('rui'), senha: 'rui12345', sal: 4 }); ok(r.s === 403, 'a palavra-passe antiga do Rui deixou de servir');
r = await post({ a: 'entrar', email: mail('rui'), senha: temp, sal: 5 }); ok(r.s === 200 && r.trocar === true, 'Rui entra com a temporária e é mandado trocar'); const ruiB = { id: rui.id, chave: r.chave, dev: r.dev };
r = await post({ a: 'senha', id: ruiB.id, chave: ruiB.chave, dev: ruiB.dev, atual: temp, nova: 'minha-nova-1' }); ok(r.s === 200, 'Rui define a sua palavra-passe');
r = await post({ a: 'entrar', email: mail('rui'), senha: 'minha-nova-1', sal: 6 }); ok(r.s === 200 && !r.trocar, 'e já não é mandado trocar');

// 7. data do teste e painel
r = await sync(ana, [], { teste: '2026-12-01' }); ok(r.s === 200, 'sync com data do teste');
r = await sync(ana, [], { teste: '1999-01-01' }); ok(r.s === 200, 'sync com data absurda não parte nada');
r = await post({ a: 'painel', id: prof.id, chave: prof.chave }); const pa = r.lista.find((x) => x.id === ana.id), pr = r.lista.find((x) => x.id === rui.id), ps = r.lista.find((x) => x.id === sem2.id);
ok(pa && pa.email === mail('ana') && pa.teste === '2026-12-01' && pa.ap >= 3, `painel: email, data do teste e nº de aparelhos (${pa && pa.ap})`);
ok(pr && pr.teste === '2026-10-28' && ps && ps.email === '' && ps.ap === 1, 'painel: Rui com teste, aluno sem conta sem email');

// 8. limite de tentativas
let limite = 0; for (let i = 0; i < 20; i++) { r = await post({ a: 'entrar', email: mail('tentativas'), senha: 'x' + i, sal: 1 }); if (r.s === 429) { limite = i; break; } } ok(limite > 0 && limite <= 16, `tentativas de entrada limitadas (parou à ${limite + 1}.ª)`);

// 9. aparelhos: o mais antigo sai quando passa de 12
const logins = []; for (let i = 0; i < 12; i++) { r = await post({ a: 'entrar', email: mail('rui'), senha: 'minha-nova-1', sal: 100 + i }); if (r.s !== 200) break; logins.push({ id: rui.id, chave: r.chave, dev: r.dev }); }
ok(logins.length === 12, 'Rui faz 12 entradas'); r = await sync(logins[logins.length - 1]); ok(r.s === 200, 'o mais recente funciona');
r = await sync(ruiB); ok(r.s === 401, 'o aparelho mais antigo foi retirado ao passar o limite');

// 10. apagar conta liberta o email e os aparelhos
r = await post({ a: 'apagar', id: ana.id, chave: anaC.chave, dev: anaC.dev }); ok(r.s === 200, 'Ana apaga a conta a partir do desktop');
r = await sync(ana); ok(r.s === 401, 'telemóvel original já não tem acesso'); r = await sync(anaB); ok(r.s === 401, 'nem o desktop');
r = await post({ a: 'entrar', email: mail('ana'), senha: 'novasenha1', sal: 9 }); ok(r.s === 403, 'não se entra numa conta apagada');
const outra = jog('Outra'); r = await post({ a: 'conta', id: outra.id, email: mail('ana'), senha: 'outra-senha', consentimento: true, sal: outra.sal, nome: 'Outra Ana', regime: 'diurno', local: 'faro' }); ok(r.s === 200, 'o email apagado pode ser usado outra vez');
console.log(falhas ? `\n${falhas} FALHAS` : '\nTodos os testes de conta passaram'); process.exit(falhas ? 1 : 0);
