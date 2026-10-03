// Teste da confirmacao do email e da recuperacao da palavra-passe (envio simulado). Requer: node scripts/dev-liga.mjs 8092
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
const mails = async () => (await fetch(BASE + '/__mails')).json();
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA'), m); if (!c) falhas++; };
const suf = Math.random().toString(36).slice(2, 8), em = `bia.${suf}@exemplo.pt`;
const cod = async (para) => { const l = (await mails()).filter((m) => m.to[0] === para); const m = l[l.length - 1]; return m ? (m.text.match(/\n(\d{6})\n/) || [])[1] : null; };
let r = await (await fetch(BASE + '/api/liga')).json(); ok(r.email === true, 'GET indica que o envio de emails esta ativo');
const id = crypto.randomUUID(), sal = Math.floor(Math.random() * 1e9);
r = await post({ a: 'conta', id, email: em, senha: 'palavra1', consentimento: true, sal, nome: 'Bia Costa', regime: 'diurno', local: 'faro' }); ok(r.s === 200, 'conta criada'); const bia = { id, chave: r.chave };
// confirmar o email
r = await post({ a: 'verif_pedir', ...bia }); ok(r.s === 200, 'pedido de confirmacao aceite');
let c = await cod(em); ok(/^\d{6}$/.test(c || ''), 'email com codigo de 6 digitos enviado para o email da conta');
r = await post({ a: 'verif_confirmar', ...bia, codigo: '000000' }); ok(r.s === 403 && r.erro === 'codigo', 'codigo errado recusado');
r = await post({ a: 'verif_confirmar', ...{ id, chave: 'x'.repeat(32) }, codigo: c }); ok(r.s === 401, 'sem sessao nao confirma');
r = await post({ a: 'verif_confirmar', ...bia, codigo: c }); ok(r.s === 200, 'codigo certo confirma o email');
r = await post({ a: 'verif_confirmar', ...bia, codigo: c }); ok(r.s === 403, 'o codigo so serve uma vez');
r = await post({ a: 'verif_pedir', ...bia }); ok(r.s === 200 && r.ja === 1, 'ja confirmado: nao envia outra vez');
r = await post({ a: 'nuvem', ...bia, ver: 0 }); ok(r.s === 200 && r.ev === true, 'nuvem indica email confirmado');
// 5 tentativas erradas invalidam o codigo
const id2 = crypto.randomUUID(), em2 = `leo.${suf}@exemplo.pt`; r = await post({ a: 'conta', id: id2, email: em2, senha: 'palavra2', consentimento: true, sal: 5, nome: 'Leo Dias', regime: 'noturno', local: 'portimao' }); const leo = { id: id2, chave: r.chave };
await post({ a: 'verif_pedir', ...leo }); const cl = await cod(em2); for (let i = 0; i < 5; i++) await post({ a: 'verif_confirmar', ...leo, codigo: '111111' });
r = await post({ a: 'verif_confirmar', ...leo, codigo: cl }); ok(r.s === 403, 'depois de 5 erros o codigo certo ja nao serve');
// recuperar a palavra-passe
const antes = (await mails()).length;
r = await post({ a: 'rec_pedir', email: `ninguem.${suf}@exemplo.pt` }); ok(r.s === 200 && r.ok === 1, 'email sem conta: mesma resposta');
ok((await mails()).length === antes, 'e nao se envia nada');
r = await post({ a: 'rec_pedir', email: em }); ok(r.s === 200, 'pedido de recuperacao aceite'); const cr = await cod(em);
ok(/^\d{6}$/.test(cr || '') && cr !== c, 'novo codigo enviado');
r = await post({ a: 'rec_confirmar', email: em, codigo: '999999', nova: 'novissima1' }); ok(r.s === 403, 'codigo errado nao muda a palavra-passe');
r = await post({ a: 'rec_confirmar', email: em, codigo: cr, nova: '123' }); ok(r.s === 400, 'palavra-passe curta recusada');
r = await post({ a: 'rec_confirmar', email: em, codigo: cr, nova: 'novissima1' }); ok(r.s === 200, 'codigo certo define nova palavra-passe');
r = await post({ a: 'entrar', email: em, senha: 'palavra1', sal: 7 }); ok(r.s === 403, 'a antiga deixou de servir');
r = await post({ a: 'entrar', email: em, senha: 'novissima1', sal: 8 }); ok(r.s === 200 && r.id === id && r.ev === true && r.trocar === false, 'entra com a nova, mesma conta, email confirmado');
r = await post({ a: 'rec_confirmar', email: em, codigo: cr, nova: 'outraqualquer1' }); ok(r.s === 403, 'o codigo de recuperacao so serve uma vez');
// limite de pedidos
let limite = 0; for (let i = 0; i < 6; i++) { r = await post({ a: 'rec_pedir', email: em }); if (r.s === 429) limite++; } ok(limite > 0, 'limite de pedidos por hora');
// painel mostra confirmado
console.log(falhas ? `\n${falhas} FALHAS` : '\nTodos os testes de email passaram'); process.exit(falhas ? 1 : 0);
