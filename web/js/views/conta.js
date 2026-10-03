// Ecrãs da conta: criar, entrar (outro aparelho) e mudar a palavra-passe.
import { sfx } from '../ui/sfx.js';
import { toast } from '../ui/fx.js';
import { criarConta, entrarConta, mudarSenha, validarEmail, emailDaConta, pedirConfirmacao, confirmarEmail, pedirRecuperacao, recuperarConta, definirAvisos, avisosAtivos } from '../game/conta.js';
import { estado } from '../store.js';
import { emailDisponivel } from '../game/liga.js';
import { nomeLocal, nomeRegime } from './entrada.js';

const ERROS = {
  email: 'O email não parece válido.', senha: 'A palavra-passe precisa de pelo menos 6 caracteres.', iguais: 'As duas palavras-passe não são iguais.',
  email_existe: 'Este email já tem conta. Toca em «Já tenho conta» para entrar.', ja_tem_conta: 'Este aparelho já tem email associado.',
  credenciais: 'Email ou palavra-passe errados.', muitas_tentativas: 'Demasiadas tentativas. Tenta daqui a uma hora.', muitos_pedidos: 'Demasiadas tentativas. Tenta daqui a uma hora.',
  rede: 'Sem ligação ao servidor. Confirma a rede e tenta outra vez.', atual: 'A palavra-passe atual está errada.', servidor: 'Não foi possível agora. Tenta daqui a pouco.',
  codigo: 'Código errado ou expirado. Pede outro e tenta de novo.', sem_email: 'O envio de emails ainda não está ativo.', envio: 'Não foi possível enviar o email agora. Tenta daqui a pouco.',
  ja_na_liga: 'Este aparelho já está na liga sem email. Se a conta ainda não existe, cria-a aqui. Para entrares numa conta que já existe, sai primeiro da liga em Perfil, Definições (o resto do progresso fica).',
  outra_conta: 'Este aparelho já está ligado a outro email.', dados: 'Escreve o email e a palavra-passe.',
};
export const textoErro = (e) => ERROS[e] || ERROS.servidor;
const campoSenha = (id, rotulo, auto) => `<label class="campo-t" for="${id}">${rotulo}</label><div class="campo-senha"><input class="campo" id="${id}" type="password" autocomplete="${auto}" autocapitalize="off" spellcheck="false" maxlength="64"><button type="button" class="btn fantasma peq" data-ver="${id}" aria-pressed="false">Mostrar</button></div>`;
const ligarVer = (root) => root.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => { const i = root.querySelector('#' + b.dataset.ver), v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.textContent = v ? 'Esconder' : 'Mostrar'; b.setAttribute('aria-pressed', String(v)); }));
const fim = (root, id) => root.querySelector(id);

// criar conta (e entrar na liga)
export function ecraCriar(root, { aoFim, aoEntrar, aoVoltar }) {
  const s = estado(), p = s.perfil, ligado = !!s.liga.chave;
  root.innerHTML = `
  <h1 style="margin:2px 0 4px">${ligado ? 'Associa o teu email' : 'Cria a tua conta'}</h1>
  <p class="giz" style="margin:0 0 12px">${ligado ? 'Já estás na liga. Com o email, o teu progresso fica seguro e podes usar a app no telemóvel, no tablet e no computador.' : `Com a conta entras na liga de ${nomeLocal(p.local)}, ${nomeRegime(p.regime).toLowerCase()}, e podes usar a app em vários aparelhos com o mesmo progresso.`}</p>
  <section class="painel">
    <label class="campo-t" for="c-email">Email</label>
    <input class="campo" id="c-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="90" placeholder="o.teu.email@exemplo.pt">
    ${campoSenha('c-s1', 'Palavra-passe', 'new-password')}
    ${campoSenha('c-s2', 'Repete a palavra-passe', 'new-password')}
    <p class="nota" style="margin:8px 0 0">Escolhe uma palavra-passe que não uses noutros sítios. Se a esqueceres, o professor repõe o teu acesso.</p>
  </section>
  <section class="painel" style="margin-top:12px">
    <b>O que fica guardado no servidor</b>
    <ul class="lista-simples">
      <li>O email, o nome, a alcunha, o regime, o local, o dia do teste e o avatar.</li>
      <li>O teu progresso (pontos, níveis, conquistas), para o teres em todos os aparelhos.</li>
      <li>As respostas certas dos treinos. O servidor refaz cada exercício para conferir os pontos.</li>
      <li>O tipo de aparelho, se a app está instalada e quando a usaste pela última vez.</li>
      <li>A palavra-passe, só de forma cifrada. Nunca fica em texto.</li>
    </ul>
    <b>Quem vê o quê</b>
    <ul class="lista-simples"><li>Os colegas veem apenas a alcunha (ou o primeiro nome), o avatar e os pontos.</li><li>O professor vê os dados todos, incluindo o email, para acompanhar a UC e repor acessos.</li></ul>
    <p class="nota" style="margin:8px 0 0">Responsável: Paulo Carrasco, ESGHT, Universidade do Algarve. Podes apagar a conta e os dados do servidor quando quiseres, em Perfil, Definições.</p>
  </section>
  <label class="painel" style="margin-top:12px;display:flex;gap:12px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="c-ok" style="width:26px;height:26px;margin-top:2px;accent-color:var(--ciano)"><span>Li e aceito guardar estes dados no servidor.</span></label>
  <button class="btn grande ouro" id="c-criar" style="margin-top:14px" disabled>${ligado ? 'Associar email' : 'Criar conta e entrar na liga'}</button>
  <p class="nota" id="c-erro" style="margin-top:10px;color:var(--erro)" role="alert"></p>
  <div class="linha" style="gap:8px;margin-top:6px"><button class="btn fantasma" id="c-tenho">Já tenho conta</button>${aoVoltar ? '<button class="btn fantasma" id="c-volta">Voltar</button>' : ''}</div>`;
  ligarVer(root);
  const bt = fim(root, '#c-criar'), er = fim(root, '#c-erro'), cb = fim(root, '#c-ok');
  cb.addEventListener('change', () => { bt.disabled = !cb.checked; });
  fim(root, '#c-tenho').addEventListener('click', () => { sfx.clique(); ecraEntrar(root, { aoFim, aoCriar: () => ecraCriar(root, { aoFim, aoEntrar, aoVoltar }), aoVoltar }); aoEntrar?.(); });
  fim(root, '#c-volta')?.addEventListener('click', () => { sfx.clique(); aoVoltar(); });
  bt.addEventListener('click', async () => {
    const email = fim(root, '#c-email').value, s1 = fim(root, '#c-s1').value, s2 = fim(root, '#c-s2').value; er.textContent = '';
    if (!validarEmail(email)) { er.textContent = ERROS.email; return; }
    if (s1.length < 6) { er.textContent = ERROS.senha; return; }
    if (s1 !== s2) { er.textContent = ERROS.iguais; return; }
    bt.disabled = true; bt.textContent = 'A criar...';
    const r = await criarConta(email, s1);
    if (r.ok) { sfx.bau(); toast('<div><b>Conta criada</b><br><span class="nota">O teu progresso já fica guardado.</span></div>'); aoFim(); return; }
    bt.disabled = !cb.checked; bt.textContent = ligado ? 'Associar email' : 'Criar conta e entrar na liga'; er.textContent = textoErro(r.erro);
  });
}

// entrar numa conta existente
export function ecraEntrar(root, { aoFim, aoCriar, aoVoltar }) {
  root.innerHTML = `
  <h1 style="margin:2px 0 4px">Entrar na tua conta</h1>
  <p class="giz" style="margin:0 0 12px">Usa o email e a palavra-passe da conta. O progresso deste aparelho junta-se ao da conta, sem perder nada.</p>
  <section class="painel">
    <label class="campo-t" for="l-email">Email</label>
    <input class="campo" id="l-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="90" placeholder="o.teu.email@exemplo.pt">
    ${campoSenha('l-s', 'Palavra-passe', 'current-password')}
  </section>
  <button class="btn grande ouro" id="l-entrar" style="margin-top:14px">Entrar</button>
  <p class="nota" id="l-erro" style="margin-top:10px;color:var(--erro)" role="alert"></p>
  <p class="nota">${emailDisponivel() ? '<button type="button" class="btn fantasma peq" id="l-esqueci">Esqueci a palavra-passe</button>' : 'Esqueceste a palavra-passe? Pede ao professor que reponha o teu acesso.'}</p>
  <div class="linha" style="gap:8px;margin-top:6px">${aoCriar ? '<button class="btn fantasma" id="l-criar">Criar conta</button>' : ''}${aoVoltar ? '<button class="btn fantasma" id="l-volta">Voltar</button>' : ''}</div>`;
  ligarVer(root);
  const bt = fim(root, '#l-entrar'), er = fim(root, '#l-erro');
  fim(root, '#l-criar')?.addEventListener('click', () => { sfx.clique(); aoCriar(); });
  fim(root, '#l-esqueci')?.addEventListener('click', () => { sfx.clique(); ecraRecuperar(root, { aoFim, aoVoltar: () => ecraEntrar(root, { aoFim, aoCriar, aoVoltar }), email: fim(root, '#l-email').value }); });
  fim(root, '#l-volta')?.addEventListener('click', () => { sfx.clique(); aoVoltar(); });
  const entrar = async () => {
    const email = fim(root, '#l-email').value, senha = fim(root, '#l-s').value; er.textContent = '';
    if (!validarEmail(email) || !senha) { er.textContent = ERROS.dados; return; }
    bt.disabled = true; bt.textContent = 'A entrar...';
    const r = await entrarConta(email, senha);
    if (r.ok) { sfx.bau(); if (r.trocar) { ecraTrocar(root, { obrigatoria: true, aoFim }); return; } toast('<div><b>Bem-vindo de volta</b><br><span class="nota">O teu progresso foi atualizado.</span></div>'); aoFim(); return; }
    bt.disabled = false; bt.textContent = 'Entrar'; er.textContent = textoErro(r.erro);
  };
  bt.addEventListener('click', entrar);
  root.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); }));
}

// mudar a palavra-passe (obrigatoria quando o professor repôs o acesso)
export function ecraTrocar(root, { obrigatoria = false, aoFim, aoVoltar }) {
  root.innerHTML = `
  <h1 style="margin:2px 0 4px">${obrigatoria ? 'Escolhe a tua palavra-passe' : 'Mudar a palavra-passe'}</h1>
  <p class="giz" style="margin:0 0 12px">${obrigatoria ? 'Entraste com uma palavra-passe temporária. Escolhe agora a tua.' : `Conta: ${emailDaConta()}`}</p>
  <section class="painel">
    ${campoSenha('t-a', obrigatoria ? 'Palavra-passe temporária' : 'Palavra-passe atual', 'current-password')}
    ${campoSenha('t-1', 'Nova palavra-passe', 'new-password')}
    ${campoSenha('t-2', 'Repete a nova palavra-passe', 'new-password')}
  </section>
  <button class="btn grande ouro" id="t-ok" style="margin-top:14px">Guardar</button>
  <p class="nota" id="t-erro" style="margin-top:10px;color:var(--erro)" role="alert"></p>
  ${!obrigatoria && aoVoltar ? '<button class="btn fantasma" id="t-volta" style="margin-top:6px">Voltar</button>' : ''}`;
  ligarVer(root);
  const bt = fim(root, '#t-ok'), er = fim(root, '#t-erro');
  fim(root, '#t-volta')?.addEventListener('click', () => { sfx.clique(); aoVoltar(); });
  bt.addEventListener('click', async () => {
    const a = fim(root, '#t-a').value, n1 = fim(root, '#t-1').value, n2 = fim(root, '#t-2').value; er.textContent = '';
    if (n1.length < 6) { er.textContent = ERROS.senha; return; }
    if (n1 !== n2) { er.textContent = ERROS.iguais; return; }
    bt.disabled = true; const r = await mudarSenha(a, n1); bt.disabled = false;
    if (r.ok) { sfx.bau(); toast('<div><b>Palavra-passe guardada</b></div>'); aoFim(); return; }
    er.textContent = textoErro(r.erro);
  });
}

// confirmar o email com um codigo enviado para a caixa do aluno (so aparece quando o servidor consegue enviar emails)
export const confirmacaoHTML = () => `<div id="cfBox"><p class="nota" style="margin:0 0 8px"><b>Email por confirmar.</b> Confirma o email para poderes recuperar a palavra-passe sozinho e receber avisos quando houver novos conteúdos.</p>
  <label style="display:flex;gap:12px;align-items:flex-start;margin:0 0 10px;cursor:pointer"><input type="checkbox" id="cfAv" style="width:24px;height:24px;margin-top:1px;flex:none;accent-color:var(--ciano)"><span class="nota" style="margin:0">Quero receber avisos de novos conteúdos por email. Posso desligar quando quiser.</span></label>
  <button class="btn" id="cfEnviar">Enviar código para o meu email</button>
  <div id="cfForm" hidden style="margin-top:10px"><label class="campo-t" for="cfCodigo">Código recebido (6 números)</label><div class="campo-senha"><input class="campo" id="cfCodigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><button class="btn ouro peq" id="cfOk">Confirmar</button></div></div>
  <p class="nota" id="cfMsg" role="status" style="margin:8px 0 0"></p></div>`;
// opcao dos avisos para quem ja tem o email confirmado
export const avisosHTML = () => `<label style="display:flex;gap:12px;align-items:flex-start;margin:0 0 12px;cursor:pointer"><input type="checkbox" id="avOpcao" style="width:24px;height:24px;margin-top:1px;flex:none;accent-color:var(--ciano)"${avisosAtivos() ? ' checked' : ''}><span class="nota" style="margin:0">Receber avisos de novos conteúdos por email. Só o professor envia e podes desligar quando quiseres.</span></label>`;
export function ligarAvisos(root) {
  const c = root.querySelector('#avOpcao'); if (!c) return;
  c.addEventListener('change', async () => {
    const quer = c.checked; c.disabled = true; const r = await definirAvisos(quer); c.disabled = false;
    if (r.ok) toast(`<div><b>${quer ? 'Avisos ligados' : 'Avisos desligados'}</b></div>`); else { c.checked = !quer; toast('<div><b>Não foi possível alterar</b><br><span class="nota">Tenta outra vez.</span></div>'); }
  });
}
export function ligarConfirmacao(root, aoFim) {
  const env = root.querySelector('#cfEnviar'), form = root.querySelector('#cfForm'), msg = root.querySelector('#cfMsg'), cod = root.querySelector('#cfCodigo'), ok = root.querySelector('#cfOk');
  if (!env) return;
  env.addEventListener('click', async () => {
    sfx.clique(); env.disabled = true; msg.textContent = 'A enviar...'; const r = await pedirConfirmacao(); env.disabled = false;
    if (r.ok && r.ja) { aoFim(); return; }
    if (!r.ok) { msg.textContent = textoErro(r.erro); return; }
    form.hidden = false; env.textContent = 'Enviar outro código'; msg.textContent = 'Enviámos um código para ' + emailDaConta() + '. Vale 15 minutos.'; cod.focus();
  });
  ok.addEventListener('click', async () => {
    if (!/^\d{6}$/.test(cod.value.trim())) { msg.textContent = 'O código tem 6 números.'; return; }
    ok.disabled = true; const r = await confirmarEmail(cod.value); ok.disabled = false;
    if (r.ok) { sfx.bau(); const av = root.querySelector('#cfAv'); if (av && av.checked) await definirAvisos(true); toast(`<div><b>Email confirmado</b>${av && av.checked ? '<br><span class="nota">Avisos de novos conteúdos ligados.</span>' : ''}</div>`); aoFim(); return; }
    msg.textContent = textoErro(r.erro);
  });
}

// esqueci a palavra-passe: codigo por email e nova palavra-passe
export function ecraRecuperar(root, { aoFim, aoVoltar, email = '' }) {
  root.innerHTML = `
  <h1 style="margin:2px 0 4px">Nova palavra-passe</h1>
  <p class="giz" style="margin:0 0 12px">Escreve o email da tua conta. Enviamos um código que vale 15 minutos.</p>
  <section class="painel">
    <label class="campo-t" for="r-email">Email</label>
    <input class="campo" id="r-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="90" value="${String(email).replace(/[<>&"]/g, '')}">
    <button class="btn" id="r-env" style="margin-top:10px">Enviar código</button>
    <div id="r-form" hidden>
      <label class="campo-t" for="r-cod">Código recebido (6 números)</label>
      <input class="campo" id="r-cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">
      ${campoSenha('r-s1', 'Nova palavra-passe', 'new-password')}
      ${campoSenha('r-s2', 'Repete a nova palavra-passe', 'new-password')}
    </div>
  </section>
  <button class="btn grande ouro" id="r-ok" style="margin-top:14px" hidden>Guardar e entrar</button>
  <p class="nota" id="r-erro" style="margin-top:10px" role="status"></p>
  <button class="btn fantasma" id="r-volta" style="margin-top:6px">Voltar</button>`;
  ligarVer(root);
  const er = fim(root, '#r-erro'), env = fim(root, '#r-env'), ok = fim(root, '#r-ok'), form = fim(root, '#r-form');
  fim(root, '#r-volta').addEventListener('click', () => { sfx.clique(); aoVoltar(); });
  env.addEventListener('click', async () => {
    const e = fim(root, '#r-email').value; if (!validarEmail(e)) { er.textContent = ERROS.email; return; }
    env.disabled = true; er.textContent = 'A enviar...'; const r = await pedirRecuperacao(e); env.disabled = false;
    if (!r.ok) { er.textContent = textoErro(r.erro); return; }
    form.hidden = false; ok.hidden = false; env.textContent = 'Enviar outro código'; er.textContent = 'Se existir conta com este email, enviámos-lhe um código. Confirma também a pasta de spam.';
  });
  ok.addEventListener('click', async () => {
    const e = fim(root, '#r-email').value, c = fim(root, '#r-cod').value, s1 = fim(root, '#r-s1').value, s2 = fim(root, '#r-s2').value; er.textContent = '';
    if (!/^\d{6}$/.test(c.trim())) { er.textContent = 'O código tem 6 números.'; return; }
    if (s1.length < 6) { er.textContent = ERROS.senha; return; }
    if (s1 !== s2) { er.textContent = ERROS.iguais; return; }
    ok.disabled = true; const r = await recuperarConta(e, c, s1); ok.disabled = false;
    if (r.ok) { sfx.bau(); toast('<div><b>Palavra-passe guardada</b><br><span class="nota">Já estás dentro da tua conta.</span></div>'); aoFim(); return; }
    er.textContent = textoErro(r.erro);
  });
}
