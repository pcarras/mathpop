// Teste do envio de emails por Gmail (SMTP): codigos, avisos em copia oculta, lotes de 50, falha de destinatario. Requer: GMAIL_MODE=1 node scripts/dev-liga.mjs 8092
const BASE = process.argv[2] || 'http://localhost:8092';
const post = async (b) => { const r = await fetch(BASE + '/api/liga', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, ...(await r.json()) }; };
const mails = async () => (await fetch(BASE + '/__mails')).json();
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA'), m); if (!c) falhas++; };
const suf = Math.random().toString(36).slice(2, 8);
const cod = async (para) => { const l = (await mails()).filter((m) => m.to.includes(para) && /\n(\d{6})\n/.test(m.text)); const m = l[l.length - 1]; return m ? m.text.match(/\n(\d{6})\n/)[1] : null; };
async function aluno(nome, email, confirmar = true, avisos = true) {
  const id = crypto.randomUUID(); const r = await post({ a: 'conta', id, email, senha: 'palavra1', consentimento: true, sal: Math.floor(Math.random() * 1e9), nome, regime: 'diurno', local: 'faro' });
  const x = { id, chave: r.chave, email };
  if (confirmar) { await post({ a: 'verif_pedir', ...x }); await post({ a: 'verif_confirmar', ...x, codigo: await cod(email) }); if (avisos) await post({ a: 'avisos', ...x, ativo: true }); }
  return x;
}
let r = await (await fetch(BASE + '/api/liga')).json(); ok(r.email === true && r.via === 'gmail', 'GET indica envio ativo por Gmail');
const A = await aluno('Ana Aviso', `ana.${suf}@exemplo.pt`), P = await aluno('Prof Teste', `prof.${suf}@exemplo.pt`, true, false);
let ms = await mails(); const mc = ms.find((m) => m.to.includes(A.email));
ok(mc && mc.to.length === 1 && mc.via === 'smtp', 'codigo de confirmacao enviado por SMTP a um so destinatario');
ok(mc.subject === 'Confirma o teu email na Arena Mat I' && mc.text.includes('código vale 15 minutos'), 'assunto e texto com acentos chegam bem (UTF-8)');
ok(mc.from.endsWith('<manicmath@gmail.com>') && mc.from.startsWith('Arena Mat I'), 'remetente: Arena Mat I <manicmath@gmail.com>');
ok(mc.toHeader === A.email, 'cabecalho Para e o proprio aluno nos codigos');
// destinatario recusado pelo servidor: o pedido falha com erro claro
r = await post({ a: 'conta', id: crypto.randomUUID(), email: `rejeitado.${suf}@exemplo.pt`, senha: 'palavra1', consentimento: true, sal: 3, nome: 'Rita Rejeitada', regime: 'diurno', local: 'faro' }); const R = { id: r.id };
{ const id = crypto.randomUUID(); const c = await post({ a: 'conta', id, email: `rejeitado2.${suf}@exemplo.pt`, senha: 'palavra1', consentimento: true, sal: 4, nome: 'Rui Rejeitado', regime: 'diurno', local: 'faro' }); r = await post({ a: 'verif_pedir', id, chave: c.chave }); ok(r.s === 502 && r.erro === 'envio', 'destinatario recusado pelo servidor: erro de envio'); }
// professor
r = await post({ a: 'professor', ...P, codigo: 'codigo-de-teste' }); ok(r.s === 200, 'professor reconhecido');
let antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'teste', assunto: 'Novos exercícios de matrizes', texto: 'Já estão disponíveis novos exercícios.\n\nBom treino!' }); ok(r.s === 200 && r.enviados === 1, 'teste enviado ao professor');
ms = (await mails()).slice(antes); ok(ms.length === 1 && ms[0].to[0] === P.email && ms[0].subject === '[Arena Mat I] Novos exercícios de matrizes' && ms[0].text.includes('Bom treino!') && ms[0].text.includes('desliga os avisos'), 'teste: so para o professor, com prefixo, texto e rodape');
// aviso a 1 aluno em copia oculta
antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'Aviso curto', texto: 'Mensagem para todos os que aceitaram.' }); ok(r.s === 200 && r.enviados === 1 && r.falhas === 0, 'aviso enviado a 1 aluno');
ms = (await mails()).slice(antes); ok(ms.length === 1 && ms[0].to.length === 1 && ms[0].to[0] === A.email && ms[0].toHeader.includes('manicmath@gmail.com'), 'em copia oculta: o cabecalho Para e o remetente, o aluno vai por RCPT');
// muitos alunos: lotes de 50
const extra = []; for (let i = 0; i < 53; i++) extra.push(await aluno('Aluno ' + i + ' Teste', `a${i}.${suf}@exemplo.pt`));
r = await post({ a: 'aviso', ...P, modo: 'contar' }); ok(r.n === 54, 'contagem: 54 destinatarios (Ana e 53)');
antes = (await mails()).length;
r = await post({ a: 'aviso', ...P, modo: 'enviar', assunto: 'Aviso para a turma', texto: 'Mensagem de teste para a turma inteira.' }); ok(r.s === 200 && r.enviados === 54 && r.falhas === 0, 'enviados 54, falhas 0');
ms = (await mails()).slice(antes); ok(ms.length === 2 && ms[0].to.length === 50 && ms[1].to.length === 4, 'duas mensagens: lote de 50 e lote de 4');
ok(ms.every((m) => !m.toHeader.includes('exemplo.pt')), 'nenhum aluno aparece nos cabecalhos (copia oculta)');
const painel = await post({ a: 'painel', ...P }); ok(painel.avisos && painel.avisos[0].n === 54 && painel.avisos[0].a === 'Aviso para a turma', 'painel regista o ultimo aviso');
console.log(falhas ? `\n${falhas} FALHAS` : '\nTodos os testes de Gmail passaram'); process.exit(falhas ? 1 : 0);
