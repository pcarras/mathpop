# Fluxo da liga no ecra: dois alunos, consentimento, treino, tabela. Requer: node scripts/dev-liga.mjs 8092
import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
base = 'http://localhost:8092/index.html?debug'
def aluno(browser, nome, regime, local, alc):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PE ' + str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(base + '#/home'); pg.wait_for_selector('.entrada')
    pg.fill('#e-nome', nome); pg.click(f'[data-seg=regime][data-v={regime}]'); pg.click(f'[data-seg=local][data-v={local}]')
    if alc: pg.fill('#e-alc', alc)
    pg.fill('#e-teste', '2026-12-10')
    pg.click('#entrar'); pg.wait_for_selector('h1')
    return pg, errs
def treinar(pg, tipo, n=1):
    for _ in range(n):
        pg.goto(base + '#/treinar/' + tipo); pg.reload(); pg.wait_for_selector('.teclado')
        ans = pg.evaluate('JSON.stringify(window.__ex.resposta.valor)')
        v = pg.evaluate('String(window.__ex.resposta.valor)')
        for ch in v:
            pg.click(f".teclado button:text-is('{'−' if ch == '-' else ch}')")
        pg.click('#ver'); pg.wait_for_selector('.folha.certo')
with sync_playwright() as p:
    b = p.chromium.launch()
    a, ea = aluno(b, 'Ana Silva', 'noturno', 'faro', 'AnaFaro')
    r, er = aluno(b, 'Rui Costa', 'noturno', 'faro', '')
    o, eo = aluno(b, 'Zé Diurno', 'diurno', 'portimao', 'ZeD')
    print('NAV com liga:', a.locator('#barra [data-go=liga]').count())
    for pg, tipo, n in [(a, 'ana', 3), (r, 'rui', 1), (o, 'ze', 2)]:
        pg.goto(base + '#/liga'); pg.wait_for_selector('#c-email'); pg.screenshot(path=f'{OUT}/liga_consent.png') if pg is a else None
        pg.fill('#c-email', f'{tipo}@teste.pt'); pg.fill('#c-s1', 'segredo1'); pg.fill('#c-s2', 'segredo1')
        assert pg.is_disabled('#c-criar'); pg.check('#c-ok'); pg.click('#c-criar'); pg.wait_for_selector('.seg [data-escopo]', timeout=10000)
    # escalares: so determinante. Usa o teclado
    for pg, n in [(a, 3), (r, 1), (o, 2)]:
        for _ in range(n):
            pg.goto(base + '#/treinar/determinante'); pg.wait_for_selector('.teclado')
            v = pg.evaluate('String(window.__ex.resposta.valor)')
            for ch in v: pg.click(f".teclado button:text-is('{'−' if ch == '-' else ch}')")
            pg.click('#ver'); pg.wait_for_selector('.folha.certo'); pg.click('#cont'); pg.wait_for_timeout(300)
    print('FILA Ana antes:', a.evaluate("JSON.parse(localStorage.getItem('mat1.v2')).liga.fila.length"))
    a.goto(base + '#/liga'); a.wait_for_selector('.podio', timeout=8000); a.wait_for_timeout(600)
    print('FILA Ana depois:', a.evaluate("JSON.parse(localStorage.getItem('mat1.v2')).liga.fila.length"))
    print('LINHAS turma:', a.inner_text('.podio').replace('\n', ' | ')); a.screenshot(path=f'{OUT}/liga_turma.png')
    a.click('[data-escopo=geral]'); a.wait_for_selector('.podio'); a.wait_for_timeout(400); print('GERAL:', a.inner_text('.podio').replace('\n', ' | ')); a.screenshot(path=f'{OUT}/liga_geral.png')
    # sair da liga
    a.goto(base + '#/perfil'); a.reload(); a.click('[data-aba=def]'); a.click('#sairLiga'); a.click('#sairLiga'); a.wait_for_selector('#criaConta', timeout=8000); print('SAIU da liga ok')
    print('ERROS:', ea, er, eo); b.close()
