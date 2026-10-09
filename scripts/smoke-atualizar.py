# Teste das atualizacoes automaticas e da versao visivel (precisa de: node scripts/dev-liga.mjs 8092)
import sys, json
from playwright.sync_api import sync_playwright
from smoke_lib import novo, entrar_local, BASE
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
with sync_playwright() as p:
    b = p.chromium.launch(); pg, errs = novo(b)
    pg.add_init_script("window.__BUILD={v:'0.13',sha:'aaaaaaa1111'}")
    estado = {'sha': 'aaaaaaa1111', 'v': '0.13', 'n': 0}
    def rota(route):
        estado['n'] += 1; route.fulfill(status=200, content_type='application/json', body=json.dumps({'v': estado['v'], 'sha': estado['sha']}))
    pg.route('**/version.json*', rota)
    pg.goto(BASE + '#/home'); pg.evaluate('localStorage.clear()'); pg.reload(); entrar_local(pg, 'Teste Versao', 'diurno', 'faro')
    pg.goto(BASE + '#/home'); pg.wait_for_selector('.versao-rodape'); assert 'v0.14' in pg.inner_text('.versao-rodape'), pg.inner_text('.versao-rodape')
    # definicoes mostram a versao e o botao
    pg.goto(BASE + '#/perfil'); pg.click('[data-aba=def]'); pg.wait_for_selector('#procurarAtu'); assert 'v0.14 (aaaaaaa)' in pg.inner_text('#procurarAtu >> xpath=..').replace('\n', ' ') or 'v0.14' in pg.inner_text('main'), 'versao nas definicoes'
    # igual: botao diz que ja esta atualizado e nao ha aviso
    pg.click('#procurarAtu'); pg.wait_for_selector('.toast'); assert 'mais recente' in pg.inner_text('.toast'); assert pg.locator('.aviso-versao').count() == 0
    # versao nova a meio de uma sessao: espera e so atualiza depois
    pg.goto(BASE + '#/treinar/determinante'); pg.wait_for_selector('.teclado'); estado['sha'] = 'bbbbbbb2222'; estado['v'] = '0.15'
    pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    pg.wait_for_selector('.aviso-versao'); assert 'Atualizo quando acabares' in pg.inner_text('.aviso-versao'), pg.inner_text('.aviso-versao')
    pg.screenshot(path=f'{OUT}/v_espera.png'); pg.wait_for_timeout(3500); assert 'treinar' in pg.url, 'nao devia recarregar a meio da sessao'
    # fora da sessao: avisa e recarrega (o init_script repoe a versao antiga, por isso so tenta 2 vezes)
    pg.goto(BASE + '#/home'); pg.wait_for_selector('.mapa')
    with pg.expect_navigation(timeout=8000): pass
    pg.wait_for_selector('.aviso-versao'); pg.screenshot(path=f'{OUT}/v_aviso.png')
    pg.wait_for_timeout(6000); t = pg.evaluate("JSON.parse(localStorage.getItem('mat1.atu')||'{}')"); print('tentativas', t); assert t.get('sha') == 'bbbbbbb2222' and 1 <= t.get('n', 0) <= 2
    pg.wait_for_timeout(7000); t2 = pg.evaluate("JSON.parse(localStorage.getItem('mat1.atu')||'{}')"); assert t2['n'] <= 2, 'nao pode entrar em ciclo'
    print('erros:', errs); print('OK smoke atualizar')
