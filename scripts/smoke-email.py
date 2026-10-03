# Confirmar email e recuperar palavra-passe no ecra, e copia JSON do painel. Requer: node scripts/dev-liga.mjs 8092 (servidor limpo; envio de emails simulado)
import sys, json, re
sys.path.insert(0, 'scripts')
from smoke_lib import *
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
falhas = []
def ok(c, m):
    print(('ok    ' if c else 'FALHA ') + m)
    if not c: falhas.append(m)
def codigo(pg, para):
    ms = [m for m in json.loads(pg.evaluate("fetch('/__mails').then(r => r.text())")) if m['to'][0] == para]
    return re.search(r'\n(\d{6})\n', ms[-1]['text']).group(1) if ms else None
with sync_playwright() as p:
    b = p.chromium.launch()
    A, ea = jogador(b, 'Bia Costa', 'diurno', 'faro', 'BiaF', 'bia@teste.pt', 'segredo1')
    # cartao na pagina inicial
    A.goto(BASE + '#/home'); A.reload(); A.wait_for_selector('#cxEmail', timeout=8000); ok(True, 'cartao Confirmar email na pagina inicial'); A.screenshot(path=f'{OUT}/email_home.png')
    A.click('#cfEnviar'); A.wait_for_selector('#cfCodigo', state='visible', timeout=8000)
    A.fill('#cfCodigo', '000000'); A.click('#cfOk'); A.wait_for_function("document.querySelector('#cfMsg').textContent.includes('errado')"); ok(True, 'codigo errado mostra erro')
    A.fill('#cfCodigo', codigo(A, 'bia@teste.pt')); A.click('#cfOk'); A.wait_for_function("!document.querySelector('#cxEmail')", timeout=8000); ok(estado(A)['conta']['ev'] is True, 'email confirmado, cartao desaparece')
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.wait_for_selector('#sincNuvem'); ok('Email confirmado' in A.inner_text('body') and A.locator('#cfEnviar').count() == 0, 'Definicoes mostram email confirmado')
    # recuperar a palavra-passe noutro aparelho
    B, eb = novo(b); entrar_local(B, 'Bia', 'diurno', 'faro', '', teste='2026-12-20')
    B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.click('#tenhoContaDef'); B.wait_for_selector('#l-esqueci'); B.fill('#l-email', 'bia@teste.pt'); B.click('#l-esqueci'); B.wait_for_selector('#r-env')
    ok(B.input_value('#r-email') == 'bia@teste.pt', 'o email ja escrito passa para o ecra de recuperar'); B.screenshot(path=f'{OUT}/email_recuperar.png')
    B.click('#r-env'); B.wait_for_selector('#r-cod', state='visible', timeout=8000)
    B.fill('#r-cod', codigo(B, 'bia@teste.pt')); B.fill('#r-s1', 'palavra-nova1'); B.fill('#r-s2', 'diferente'); B.click('#r-ok'); B.wait_for_function("document.querySelector('#r-erro').textContent.includes('iguais')"); ok(True, 'palavras-passe diferentes recusadas')
    B.fill('#r-s2', 'palavra-nova1'); B.click('#r-ok'); B.wait_for_selector('#sincNuvem', timeout=10000); B.wait_for_timeout(600)
    sB = estado(B); ok(sB['conta']['email'] == 'bia@teste.pt' and sB['perfil']['nome'] == 'Bia Costa' and sB['conta']['ev'] is True, 'B ficou ligado a conta, com os dados e email confirmado')
    C, ec = novo(b); entrar_local(C, 'Bia', 'diurno', 'faro', '', teste='2026-12-20'); C.goto(BASE + '#/perfil'); C.reload(); C.click('[data-aba=def]'); C.click('#tenhoContaDef'); C.fill('#l-email', 'bia@teste.pt'); C.fill('#l-s', 'segredo1'); C.click('#l-entrar')
    C.wait_for_function("document.querySelector('#l-erro').textContent.length>0"); ok(True, 'a palavra-passe antiga deixou de servir')
    # painel: copia JSON
    P, ep = novo(b, vp=(1100, 800)); entrar_local(P, 'Paulo Carrasco', 'diurno', 'portimao', 'Prof'); criar_conta(P, 'paulo@teste.pt', 'segredo1')
    P.goto(BASE + '#/perfil'); P.reload(); P.click('[data-aba=def]'); P.click('summary:text-is("Acesso do professor")'); P.fill('#codProf', 'codigo-de-teste'); P.click('#okProf'); P.wait_for_selector('text=Estás reconhecido como professor', timeout=8000)
    P.goto(BASE + '#/liga'); P.reload(); P.wait_for_timeout(1500); P.screenshot(path=f'{OUT}/dbgP.png'); P.wait_for_selector('#abrePainel'); P.click('#abrePainel'); P.wait_for_selector('.jog', timeout=8000)
    ok('(confirmado)' in P.inner_text('#lista'), 'painel mostra email confirmado')
    with P.expect_download() as dl: P.click('#baixaJson')
    f = dl.value.path(); d = json.load(open(f)); ok(dl.value.suggested_filename.startswith('arena-mat1-copia-') and len(d['jogadores']) >= 1 and all('chave' not in j and 'pw' not in j for j in d['jogadores']) and 'dias' in d, f'copia JSON com {len(d["jogadores"])} jogadores, sem segredos')
    for n, e in [('A', ea), ('B', eb), ('C', ec), ('P', ep)]:
        e = [x for x in e if '401' not in x and '403' not in x]; ok(not e, f'sem erros na consola ({n}) {e}')
    b.close()
print('\n%d FALHAS' % len(falhas) if falhas else '\nTudo ok'); sys.exit(1 if falhas else 0)
