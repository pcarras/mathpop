// Teste dos avisos de novos conteudos: opcao do aluno, envio pelo professor, destinatarios certos, limites. Requer: node scripts/dev-liga.mjs 8092
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
const mails = async () => (await fetch(BASE + '/__mails')).json();
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA'), m); if (!c) falhas++; };
const suf = Math.random().toString(36).slice(2, 8);
const cod = async (para) => { const l = (await mails()).filter((m) => m.to[0] === para && /\n(\d{6})\n/.test(m.text)); const m = l[l.length - 1]; return m ? m.text.match(/\n(\d{6})\n/)[1] : null; };
async function aluno(nome, email, confirmar) {
  const id = crypto.randomUUID(); let r = await post({ a: 'conta', id, email, senha: 'palavra1', consentimento: true, sal: Math.floor(Math.random() * 1e9), nome, regime: 'diurno', local: 'faro' });
  const x = { id, chave: r.chave, email };
  if (confirmar) { await post({ a: 'verif_pedir', ...x }); await post({ a: 'verif_confirmar', ...x, codigo: await cod(email) }); }
  return x;
}
const A = await aluno('Ana Aviso', `ana.${suf}@exemplo.pt`, true), B = await aluno('Rui Recusa', `rui.${suf}@exemplo.pt`, true), C = await aluno('Cris Cinco', `cris.${suf}@exemplo.pt`, false), P = await aluno('Prof Teste', `prof.${suf}@exemplo.pt`, true);
let r = await post({ a: 'professor', ...P, codigo: 'codigo-de-teste' }); ok(r.s === 200, 'professor reconhecido');
await post({ a: 'avisos', ...P, ativo: true });

// opcao do aluno
r = await post({ a: 'avisos', ...C, ativo: true }); ok(r.s === 403 && r.erro === 'sem_confirmacao', 'sem email confirmado nao se ligam os avisos');
r = await post({ a: 'avisos', ...{ id: A.id, chave: 'x'.repeat(32) }, ativo: true }); ok(r.s === 401, 'sem sessao nao muda a opcao');
r = await post({ a: 'avisos', ...A, ativo: true }); ok(r.s === 200 && r.av === true, 'aluno com email confirmado liga os avisos');
r = await post({ a: 'avisos', ...B, ativo: true }); ok(r.s === 200, 'outro aluno liga');
r = await post({ a: 'avisos', ...B, ativo: false }); ok(r.s === 200 && r.av === false, 'e desliga');
r = await post({ a: 'nuvem', ...A, ver: 0 }); ok(r.s === 200 && r.av === true, 'a nuvem devolve a opcao (outro aparelho fica igual)');
r = await post({ a: 'nuvem', ...B, ver: 0 }); ok(r.s === 200 && r.av === false, 'e devolve desligada a quem desligou');
r = await post({ a: 'entrar', email: A.email, senha: 'palavra1', sal: 9 }); ok(r.s === 200 && r.av === true, 'entrar noutro aparelho traz a opcao');

// envio pelo professor
r = await post({ a: 'aviso', ...A, modo: 'contar' }); ok(r.s === 403, 'aluno nao pode usar os avisos');
r = await post({ a: 'aviso', ...P, modo: 'contar' }); ok(r.s === 200 && r.n === 1, 'conta 1 destinatario (so confirmado e com avisos ligados)');
r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'ab', texto: 'curto' }); ok(r.s === 400 && r.erro === 'conteudo', 'assunto e texto demasiado curtos recusados');
r = await post({ a: 'aviso', ...P, modo: 'xx' }); ok(r.s === 400, 'modo invalido recusado');
let antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'teste', assunto: 'Novos exercícios de matrizes', texto: 'Já estão disponíveis novos exercícios.\n\nBom treino!' }); ok(r.s === 200 && r.enviados === 1, 'teste enviado');
let ms = (await mails()).slice(antes); ok(ms.length === 1 && ms[0].to[0] === P.email, 'o teste vai so para o professor');
antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'Novos exercícios de matrizes', texto: 'Já estão disponíveis novos exercícios.\n\nBom treino!' }); ok(r.s === 200 && r.enviados === 1 && r.falhas === 0, 'aviso enviado a 1 aluno');
ms = (await mails()).slice(antes);
ok(ms.length === 1 && ms[0].to.length === 1 && ms[0].to[0] === A.email, 'recebe so quem confirmou e aceitou (nem B, nem C, nem o professor)');
ok(ms[0].subject === '[Arena Mat I] Novos exercícios de matrizes', 'assunto com prefixo da app');
ok(ms[0].text.includes('Bom treino!') && ms[0].text.includes('desliga os avisos'), 'texto com instrucao para deixar de receber');
ok(ms[0].text.includes('\n\n'), 'paragrafos preservados');
r = await post({ a: 'painel', ...P }); ok(r.s === 200 && r.avisos.length === 1 && r.avisos[0].n === 1 && r.avisos[0].a === 'Novos exercícios de matrizes', 'painel regista o ultimo aviso');
ok(r.lista.find((x) => x.id === A.id).av === true && r.lista.find((x) => x.id === B.id).av === false, 'painel mostra quem aceitou');
// B volta a ligar: passa a receber
await post({ a: 'avisos', ...B, ativo: true }); antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'Teste de turma', texto: 'Segunda mensagem para duas pessoas.' }); ok(r.s === 200 && r.enviados === 2, 'com B a aceitar, vao 2');
ms = (await mails()).slice(antes); ok(ms.length === 2 && ms.every((m) => m.to.length === 1), 'cada pessoa recebe a sua mensagem, sem ver os outros');
// limite por hora
let lim = 0; for (let i = 0; i < 6; i++) { r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'Repeticao', texto: 'Mensagem repetida para testar o limite.' }); if (r.s === 429) lim++; } ok(lim > 0, 'limite de envios por hora');
console.log(falhas ? `\n${falhas} FALHAS` : '\nTodos os testes de avisos passaram'); process.exit(falhas ? 1 : 0);
