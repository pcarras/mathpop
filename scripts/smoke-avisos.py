# Avisos de novos conteudos no ecra: opcao do aluno, caixa de envio no painel, lembrete da copia no dia do teste. Requer: node scripts/dev-liga.mjs 8092 (servidor limpo)
import sys, json, re, datetime
sys.path.insert(0, 'scripts')
from smoke_lib import *
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
falhas = []
def ok(c, m):
    print(('ok    ' if c else 'FALHA ') + m)
    if not c: falhas.append(m)
def mails(pg): return json.loads(pg.evaluate("fetch('/__mails').then(r => r.text())"))
def codigo(pg, para):
    ms = [m for m in mails(pg) if m['to'][0] == para and re.search(r'\n\d{6}\n', m['text'])]
    return re.search(r'\n(\d{6})\n', ms[-1]['text']).group(1) if ms else None
amanha = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
with sync_playwright() as p:
    b = p.chromium.launch(); erros = {}
    # A: marca a opcao ao confirmar o email
    A, erros['A'] = novo(b); entrar_local(A, 'Ana Aviso', 'diurno', 'faro', 'AnaA', teste=amanha); criar_conta(A, 'ana@teste.pt')
    A.goto(BASE + '#/home'); A.reload(); A.wait_for_selector('#cxEmail', timeout=8000)
    ok(A.locator('#cfAv').count() == 1 and not A.is_checked('#cfAv'), 'convite a confirmar com a opcao de avisos desligada por omissao')
    ok('novos conteúdos' in A.inner_text('#cxEmail'), 'o texto explica o motivo: avisos de novos conteudos'); A.screenshot(path=f'{OUT}/avisos_convite.png')
    A.check('#cfAv'); A.click('#cfEnviar'); A.wait_for_selector('#cfCodigo', state='visible', timeout=8000); A.fill('#cfCodigo', codigo(A, 'ana@teste.pt')); A.click('#cfOk')
    A.wait_for_function("!document.querySelector('#cxEmail')", timeout=8000); A.wait_for_timeout(400)
    sA = estado(A); ok(sA['conta']['ev'] is True and sA['conta']['av'] is True, 'email confirmado e avisos ligados')
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.wait_for_selector('#avOpcao'); ok(A.is_checked('#avOpcao'), 'Definicoes mostra a opcao ligada'); A.screenshot(path=f'{OUT}/avisos_perfil.png')
    # B: confirma sem marcar e liga depois no perfil
    B, erros['B'] = jogador(b, 'Rui Recusa', 'noturno', 'portimao', 'RuiB', 'rui@teste.pt')
    B.goto(BASE + '#/home'); B.reload(); B.wait_for_selector('#cxEmail', timeout=8000); B.click('#cfEnviar'); B.wait_for_selector('#cfCodigo', state='visible', timeout=8000); B.fill('#cfCodigo', codigo(B, 'rui@teste.pt')); B.click('#cfOk')
    B.wait_for_function("!document.querySelector('#cxEmail')", timeout=8000); B.wait_for_timeout(300); ok(estado(B)['conta']['av'] is False, 'sem marcar, os avisos ficam desligados')
    B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.wait_for_selector('#avOpcao'); ok(not B.is_checked('#avOpcao'), 'e a opcao aparece desligada no perfil')
    B.check('#avOpcao'); B.wait_for_function("JSON.parse(localStorage.getItem('mat1.v2')).conta.av === true", timeout=8000); ok(True, 'B liga os avisos no perfil')
    B.uncheck('#avOpcao'); B.wait_for_function("JSON.parse(localStorage.getItem('mat1.v2')).conta.av === false", timeout=8000); B.check('#avOpcao'); B.wait_for_function("JSON.parse(localStorage.getItem('mat1.v2')).conta.av === true", timeout=8000); ok(True, 'desliga e volta a ligar')
    # outro aparelho de A entra e fica com a opcao igual
    A2, erros['A2'] = novo(b); entrar_local(A2, 'Ana', 'diurno', 'faro', '', teste=amanha); A2.goto(BASE + '#/perfil'); A2.reload(); A2.click('[data-aba=def]'); A2.click('#tenhoContaDef'); A2.fill('#l-email', 'ana@teste.pt'); A2.fill('#l-s', 'segredo1'); A2.click('#l-entrar')
    A2.wait_for_selector('#avOpcao', timeout=10000); ok(A2.is_checked('#avOpcao'), 'noutro aparelho a opcao vem igual')
    # C: sem confirmar, nunca recebe
    C, erros['C'] = jogador(b, 'Cris Cinco', 'diurno', 'faro', 'CrisC', 'cris@teste.pt')
    # professor
    P, erros['P'] = novo(b, vp=(1100, 800)); entrar_local(P, 'Paulo Carrasco', 'diurno', 'portimao', 'Prof', teste=amanha); criar_conta(P, 'paulo@teste.pt')
    P.goto(BASE + '#/home'); P.reload(); P.wait_for_selector('#cxEmail', timeout=8000); P.click('#cfEnviar'); P.wait_for_selector('#cfCodigo', state='visible', timeout=8000); P.fill('#cfCodigo', codigo(P, 'paulo@teste.pt')); P.click('#cfOk'); P.wait_for_function("!document.querySelector('#cxEmail')", timeout=8000)
    P.goto(BASE + '#/perfil'); P.reload(); P.click('[data-aba=def]'); P.click('summary:text-is("Acesso do professor")'); P.fill('#codProf', 'codigo-de-teste'); P.click('#okProf'); P.wait_for_selector('text=Estás reconhecido como professor', timeout=8000)
    P.goto(BASE + '#/liga'); P.reload(); P.wait_for_timeout(1500); P.wait_for_selector('#abrePainel'); P.click('#abrePainel'); P.wait_for_selector('.jog', timeout=8000)
    ok(P.locator('#lembCopia').count() == 1, 'lembrete da copia aparece quando ha teste amanha'); P.screenshot(path=f'{OUT}/avisos_painel_topo.png')
    ok(P.inner_text('#avN') == '2', 'a caixa diz que 2 alunos aceitam (Ana e Rui)')
    P.locator('#avAssunto').scroll_into_view_if_needed(); P.screenshot(path=f'{OUT}/avisos_painel_caixa.png')
    P.click('#avTeste'); P.wait_for_function("document.querySelector('#avMsg').textContent.length>0"); ok('Escreve o assunto' in P.inner_text('#avMsg'), 'teste sem assunto pede o assunto')
    P.fill('#avAssunto', 'Novos exercícios de matrizes'); P.fill('#avTexto', 'Já estão disponíveis novos exercícios resolvidos.\n\nBom treino!')
    P.click('#avTeste'); P.wait_for_function("document.querySelector('#avMsg').textContent.includes('Teste enviado')", timeout=8000)
    ms = [m for m in mails(P) if m['subject'].startswith('[Arena Mat I] Novos')]; ok(len(ms) == 1 and ms[0]['to'] == ['paulo@teste.pt'], 'teste chegou so ao professor')
    P.click('#avEnviar'); ok('outra vez' in P.inner_text('#avEnviar'), 'primeiro toque pede confirmacao'); P.click('#avEnviar'); P.wait_for_function("document.querySelector('#avMsg').textContent.includes('Enviado a')", timeout=8000)
    ms = [m for m in mails(P) if m['subject'].startswith('[Arena Mat I] Novos')][1:]; ok(sorted(m['to'][0] for m in ms) == ['ana@teste.pt', 'rui@teste.pt'], 'aviso chegou a Ana e Rui, e a mais ninguem')
    ok(P.inner_text('#avMsg').startswith('Enviado a 2 alunos') and P.input_value('#avAssunto') == '', 'resultado mostrado e campos limpos'); P.screenshot(path=f'{OUT}/avisos_painel_enviado.png')
    # copia JSON esconde o lembrete e nao volta
    with P.expect_download() as dl: P.click('#baixaJson')
    ok(P.locator('#lembCopia').count() == 0, 'depois de descarregar a copia o lembrete desaparece')
    P.goto(BASE + '#/liga'); P.reload(); P.wait_for_selector('#abrePainel'); P.click('#abrePainel'); P.wait_for_selector('.jog', timeout=8000); ok(P.locator('#lembCopia').count() == 0, 'e nao volta a aparecer nas 12 horas seguintes')
    for n, e in erros.items():
        e = [x for x in e if '401' not in x and '403' not in x]; ok(not e, f'sem erros na consola ({n}) {e}')
    b.close()
print('\n%d FALHAS' % len(falhas) if falhas else '\nTudo ok'); sys.exit(1 if falhas else 0)
