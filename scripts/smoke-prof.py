# Professor no ecra: aluno e professor na liga, codigo errado e certo, painel, esconder alcunha. Requer: node scripts/dev-liga.mjs 8092
import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
base = 'http://localhost:8092/index.html?debug'
def jog(browser, nome, regime, local, alc):
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PE ' + str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto(base + '#/home'); pg.wait_for_selector('.entrada')
    pg.fill('#e-nome', nome); pg.click(f'[data-seg=regime][data-v={regime}]'); pg.click(f'[data-seg=local][data-v={local}]')
    if alc: pg.fill('#e-alc', alc)
    pg.click('#entrar'); pg.wait_for_selector('h1')
    pg.goto(base + '#/liga'); pg.wait_for_selector('#aceito'); pg.check('#aceito'); pg.click('#entrarLiga'); pg.wait_for_selector('.seg [data-escopo]')
    return pg, errs
def treino(pg, n):
    for _ in range(n):
        pg.goto(base + '#/treinar/determinante'); pg.wait_for_selector('.teclado')
        v = pg.evaluate('String(window.__ex.resposta.valor)')
        for ch in v: pg.click(f".teclado button:text-is('{'−' if ch == '-' else ch}')")
        pg.click('#ver'); pg.wait_for_selector('.folha.certo'); pg.click('#cont'); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b = p.chromium.launch()
    al, ea = jog(b, 'Ana Silva', 'diurno', 'portimao', 'AnaPor')
    pr, ep = jog(b, 'Paulo Carrasco', 'diurno', 'portimao', 'Prof')
    treino(al, 2); treino(pr, 2)
    # aluno nao ve botao Painel
    al.goto(base + '#/liga'); al.wait_for_selector('.podio', timeout=8000); print('Aluno ve Painel:', al.locator('#abrePainel').count())
    print('Aluno ve topo:', al.inner_text('.topo-nome').replace('\n', ' '))
    # professor: Definicoes
    pr.goto(base + '#/perfil'); pr.reload(); pr.click('[data-aba=def]'); pr.click('summary:text-is("Acesso do professor")')
    pr.fill('#codProf', 'errado'); pr.click('#okProf'); pr.wait_for_function("document.querySelector('#erroProf').textContent.length>0"); print('Erro codigo errado:', pr.inner_text('#erroProf'))
    pr.screenshot(path=f'{OUT}/prof_def.png')
    pr.fill('#codProf', 'codigo-de-teste'); pr.click('#okProf'); pr.wait_for_selector('text=Estás reconhecido como professor', timeout=8000); print('Reconhecido; topo:', pr.inner_text('.topo-nome').replace('\n', ' '))
    pr.goto(base + '#/liga'); pr.wait_for_selector('#abrePainel'); pr.wait_for_selector('.podio', timeout=8000); print('Podio do prof:', pr.inner_text('.podio').replace('\n', ' | ')); print('Msg:', pr.inner_text('section.painel >> nth=1').replace('\n', ' ')); pr.screenshot(path=f'{OUT}/prof_liga.png')
    pr.click('#abrePainel'); pr.wait_for_selector('[data-oc]', timeout=8000); print('Painel:', pr.inner_text('#corpo').replace('\n', ' ')); pr.screenshot(path=f'{OUT}/prof_painel.png')
    pr.click('[data-oc="1"]'); pr.wait_for_selector('[data-oc="0"]'); print('Botao agora:', pr.inner_text('[data-oc="0"]'))
    al.goto(base + '#/liga'); al.wait_for_selector('.podio', timeout=8000); print('Aluno ve o seu nome na tabela:', al.inner_text('.podio').replace('\n', ' | '))
    print('ERROS:', ea, ep); b.close()
