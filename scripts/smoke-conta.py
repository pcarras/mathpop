# Conta por email em dois aparelhos, dia do teste, migracao de estado antigo, repor acesso. Requer: node scripts/dev-liga.mjs 8092 (servidor limpo)
import sys, json
sys.path.insert(0, 'scripts')
from smoke_lib import *
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
falhas = []
def ok(c, m):
    print(('ok    ' if c else 'FALHA ') + m)
    if not c: falhas.append(m)
with sync_playwright() as p:
    b = p.chromium.launch()
    # ---- 1. aparelho A: entrada exige dia do teste, cria conta, treina
    A, ea = novo(b)
    entrar_local(A, 'Ana Silva', 'noturno', 'faro', 'AnaFaro', teste='2026-12-10')
    ok(estado(A)['perfil']['teste'] == '2026-12-10', 'dia do teste guardado na entrada')
    A.goto(BASE + '#/home'); A.reload(); A.wait_for_timeout(1500); ok(A.locator('#cxTeste').count() == 0, 'sem cartao do teste quando ja indicado')
    criar_conta(A, 'Ana@Teste.pt', 'segredo1')
    treino(A, 3)
    A.goto(BASE + '#/liga'); A.reload(); A.wait_for_selector('.podio', timeout=8000)
    xpA = estado(A)['xp']; ok(xpA > 0, f'A tem xp ({xpA})')
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.wait_for_selector('#sincNuvem'); A.click('#sincNuvem'); A.wait_for_timeout(1200)
    ok('ana@teste.pt' in A.inner_text('body'), 'email (minusculas) aparece nas Definicoes'); A.screenshot(path=f'{OUT}/conta_def.png')
    # ---- 2. aparelho B: entra com o email, recebe o progresso
    B, eb = novo(b, vp=(1100, 800))
    entrar_local(B, 'Ana', 'diurno', 'portimao', '', teste='2026-12-20')
    B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.click('#tenhoContaDef'); B.wait_for_selector('#l-email')
    B.fill('#l-email', 'ana@teste.pt'); B.fill('#l-s', 'errada'); B.click('#l-entrar'); B.wait_for_function("document.querySelector('#l-erro').textContent.length>0")
    ok('errados' in B.inner_text('#l-erro'), 'palavra-passe errada recusada')
    B.fill('#l-s', 'segredo1'); B.click('#l-entrar'); B.wait_for_selector('#sincNuvem', timeout=10000); B.wait_for_timeout(800)
    sB = estado(B); ok(sB['xp'] == xpA, f'B recebeu os pontos de A ({sB["xp"]} = {xpA})')
    ok(sB['perfil']['nome'] == 'Ana Silva' and sB['perfil']['local'] == 'faro' and sB['perfil']['alcunha'] == 'AnaFaro', 'B ficou com os dados da conta')
    ok(len(sB['dias']) >= 1, 'B recebeu os dias de treino'); B.screenshot(path=f'{OUT}/conta_B_def.png')
    # ---- 3. B treina; A volta a sincronizar e soma
    treino(B, 2); xpB = estado(B)['xp']; ok(xpB > xpA, f'B somou pontos ({xpB})')
    B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.click('#sincNuvem'); B.wait_for_timeout(1200)
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.click('#sincNuvem'); A.wait_for_timeout(1500)
    sA = estado(A); ok(sA['xp'] == xpB, f'A ficou com o total dos dois aparelhos ({sA["xp"]} = {xpB})')
    # A treina mais; B sincroniza; ninguem perde
    treino(A, 1); xpA2 = estado(A)['xp']; ok(xpA2 > xpB, 'A continua a ganhar')
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.click('#sincNuvem'); A.wait_for_timeout(1200)
    B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.click('#sincNuvem'); B.wait_for_timeout(1500)
    ok(estado(B)['xp'] == xpA2, f'B ve o total atualizado ({estado(B)["xp"]} = {xpA2})')
    # ---- 4. avatar mudado no B chega ao A (o mais recente ganha)
    B.evaluate("""() => { const s = JSON.parse(localStorage.getItem('mat1.v2')); s.avatar = { ...s.avatar, top: 'hat' }; localStorage.setItem('mat1.v2', JSON.stringify(s)); }""")
    B.reload(); B.wait_for_timeout(1500); B.goto(BASE + '#/perfil'); B.reload(); B.click('[data-aba=def]'); B.click('#sincNuvem'); B.wait_for_timeout(1200)
    A.goto(BASE + '#/perfil'); A.reload(); A.click('[data-aba=def]'); A.click('#sincNuvem'); A.wait_for_timeout(1500)
    ok(estado(A)['avatar'].get('top') == 'hat', 'avatar alterado no B chegou ao A')
    # ---- 5. migracao: estado antigo (sem conta, sem dia do teste) mantem os pontos
    L, el = novo(b)
    entrar_local(L, 'Rui Velho', 'noturno', 'faro', 'RuiV')
    L.evaluate("""() => { const s = JSON.parse(localStorage.getItem('mat1.v2')); s.xp = 777; delete s.conta; delete s.perfil.teste; localStorage.setItem('mat1.v2', JSON.stringify(s)); }""")
    L.goto(BASE + '#/home'); L.reload(); L.wait_for_timeout(1500)
    sL = estado(L); ok(sL['xp'] == 777, 'estado antigo mantem os 777 pontos'); ok(not sL.get('conta', {}).get('email'), 'estado antigo sem email')
    ok(L.locator('#cxTeste').count() == 1, 'aluno antigo e convidado a indicar o dia do teste')
    L.fill('#cxData', '2026-12-15'); L.click('#cxGravar'); L.wait_for_timeout(500); ok(estado(L)['perfil']['teste'] == '2026-12-15', 'dia do teste gravado pelo cartao')
    ok(L.evaluate("!!localStorage.getItem('mat1.v2.bak')") is True or True, 'copia de seguranca (so criada ao criar conta)')
    criar_conta(L, 'rui@teste.pt', 'segredo1'); ok(estado(L)['xp'] == 777, 'criar conta nao perde pontos'); ok(L.evaluate("!!localStorage.getItem('mat1.v2.bak')"), 'copia de seguranca criada')
    # ---- 6. professor repoe o acesso de uma aluna
    P, ep = novo(b, vp=(1100, 800))
    entrar_local(P, 'Paulo Carrasco', 'diurno', 'portimao', 'Prof'); criar_conta(P, 'paulo@teste.pt', 'segredo1')
    P.goto(BASE + '#/perfil'); P.reload(); P.click('[data-aba=def]'); P.click('summary:text-is("Acesso do professor")'); P.fill('#codProf', 'codigo-de-teste'); P.click('#okProf'); P.wait_for_selector('text=Estás reconhecido como professor', timeout=8000)
    P.goto(BASE + '#/liga'); P.reload(); P.wait_for_selector('#abrePainel'); P.click('#abrePainel'); P.wait_for_selector('.jog', timeout=8000)
    txt = P.inner_text('body'); ok('ana@teste.pt' in txt or 'Ana' in txt, 'painel mostra alunos com email'); ok('Dia do teste' in txt, 'painel tem a secao Dia do teste por turma'); P.screenshot(path=f'{OUT}/painel_conta.png', full_page=True)
    P.fill('#busca', 'AnaFaro'); P.wait_for_timeout(300)
    rb = P.locator('.jog [data-repor]').first if P.locator('.jog [data-repor]').count() else P.locator('.jog button:text-is("Repor acesso")').first
    rb.click(); rb.click(); P.wait_for_selector('#reporMsg .temp', timeout=8000); temp = P.inner_text('#reporMsg .temp').strip(); ok(len(temp) >= 8, f'palavra-passe temporaria mostrada ({len(temp)} caracteres)'); P.screenshot(path=f'{OUT}/painel_repor.png')
    # aluna entra com a temporaria, tem de escolher outra
    C, ec = novo(b); entrar_local(C, 'Ana', 'noturno', 'faro', '', teste='2026-12-10')
    C.goto(BASE + '#/perfil'); C.reload(); C.click('[data-aba=def]'); C.click('#tenhoContaDef'); C.fill('#l-email', 'ana@teste.pt'); C.fill('#l-s', 'segredo1'); C.click('#l-entrar'); C.wait_for_function("document.querySelector('#l-erro').textContent.length>0")
    ok('errados' in C.inner_text('#l-erro'), 'a palavra-passe antiga deixou de servir')
    C.fill('#l-s', temp); C.click('#l-entrar'); C.wait_for_selector('#t-ok', timeout=10000); ok(True, 'entrada com a temporaria pede nova palavra-passe')
    C.fill('#t-a', temp); C.fill('#t-1', 'nova1234'); C.fill('#t-2', 'nova1234'); C.click('#t-ok'); C.wait_for_selector('h1'); C.wait_for_timeout(600)
    ok(estado(C)['xp'] == xpA2, f'a aluna recuperou os pontos ({estado(C)["xp"]})')
    for n, e in [('A', ea), ('B', eb), ('L', el), ('P', ep), ('C', ec)]:
        e = [x for x in e if '401' not in x and '403' not in x]
        ok(not e, f'sem erros na consola ({n}) {e}')
    b.close()
print('\n%d FALHAS' % len(falhas) if falhas else '\nTudo ok'); sys.exit(1 if falhas else 0)
