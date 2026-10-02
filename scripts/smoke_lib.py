# Ajudas comuns dos testes de ecra (precisam de: node scripts/dev-liga.mjs 8092)
BASE = 'http://localhost:8092/index.html?debug'
TESTE = '2026-12-10'
def novo(browser, ua=None, vp=(390, 844)):
    ctx = browser.new_context(viewport={'width': vp[0], 'height': vp[1]}, device_scale_factor=2, has_touch=True, is_mobile=vp[0] < 600)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PE ' + str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    return pg, errs
def entrar_local(pg, nome, regime, local, alc='', teste=TESTE):
    pg.goto(BASE + '#/home'); pg.wait_for_selector('.entrada')
    pg.fill('#e-nome', nome); pg.click(f'[data-seg=regime][data-v={regime}]'); pg.click(f'[data-seg=local][data-v={local}]')
    if alc: pg.fill('#e-alc', alc)
    if teste:
        assert pg.is_disabled('#entrar'), 'entrar devia estar bloqueado sem dia do teste'
        pg.fill('#e-teste', teste)
    pg.click('#entrar'); pg.wait_for_selector('h1')
def criar_conta(pg, email, senha='segredo1'):
    pg.goto(BASE + '#/liga'); pg.wait_for_selector('#c-email')
    pg.fill('#c-email', email); pg.fill('#c-s1', senha); pg.fill('#c-s2', senha)
    assert pg.is_disabled('#c-criar'); pg.check('#c-ok'); pg.click('#c-criar'); pg.wait_for_selector('.seg [data-escopo]', timeout=10000)
def jogador(browser, nome, regime, local, alc, email, senha='segredo1'):
    pg, errs = novo(browser); entrar_local(pg, nome, regime, local, alc); criar_conta(pg, email, senha); return pg, errs
def treino(pg, n, tipo='determinante'):
    for _ in range(n):
        pg.goto(BASE + '#/treinar/' + tipo); pg.wait_for_selector('.teclado')
        v = pg.evaluate('String(window.__ex.resposta.valor)')
        for ch in v: pg.click(f".teclado button:text-is('{'−' if ch == '-' else ch}')")
        pg.click('#ver'); pg.wait_for_selector('.folha.certo'); pg.click('#cont'); pg.wait_for_timeout(250)
def estado(pg): return pg.evaluate("JSON.parse(localStorage.getItem('mat1.v2'))")
