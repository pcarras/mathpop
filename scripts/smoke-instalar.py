# Cartao de instalar em varios aparelhos simulados. Requer: node scripts/dev-liga.mjs 8092
import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
base = 'http://localhost:8092/index.html?debug'
CASOS = {
 'desktop_chrome': dict(ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', vp=(1280, 800), touch=False, evento=True),
 'desktop_chrome_sem_evento': dict(ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', vp=(1280, 800), touch=False, evento=False),
 'desktop_edge': dict(ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0', vp=(1280, 800), touch=False, evento=False),
 'mac_safari': dict(ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', vp=(1280, 800), touch=False, evento=False),
 'desktop_firefox': dict(ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0', vp=(1280, 800), touch=False, evento=False),
 'ipad_safari': dict(ua='Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', vp=(820, 1180), touch=True, evento=False),
 'android_tablet_chrome': dict(ua='Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', vp=(800, 1280), touch=True, evento=True),
 'android_telemovel': dict(ua='Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', vp=(390, 844), touch=True, evento=True),
}
with sync_playwright() as p:
    b = p.chromium.launch()
    for nome, c in CASOS.items():
        ctx = b.new_context(user_agent=c['ua'], viewport={'width': c['vp'][0], 'height': c['vp'][1]}, has_touch=c['touch'])
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(base + '#/home'); pg.wait_for_selector('.entrada')
        pg.fill('#e-nome', 'Teste Aparelho'); pg.click('[data-seg=regime][data-v=diurno]'); pg.click('[data-seg=local][data-v=portimao]'); pg.fill('#e-teste', '2026-12-10'); pg.click('#entrar'); pg.wait_for_selector('h1')
        if c['evento']:
            pg.evaluate("() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompt = 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); }")
        pg.goto(base + '#/perfil'); pg.wait_for_selector('[data-aba=def]'); pg.click('[data-aba=def]'); pg.wait_for_selector('#instalar'); pg.wait_for_timeout(300)
        txt = pg.inner_text('#instalar').replace('\n', ' | ')
        btn = pg.locator('#instalar [data-inst=sim]').count()
        if btn:
            pg.click('#instalar [data-inst=sim]'); pg.wait_for_timeout(200)
        print(f"{nome}: botao={btn} prompt={pg.evaluate('window.__prompt||0')} erros={errs}\n   {txt[:230]}")
        # cartao tambem na pagina inicial (se nao instalada e nao dispensada)
        pg.goto(base + '#/home'); pg.wait_for_timeout(300)
        print('   home tem cartao:', pg.locator('#instalar').count())
        if nome in ('desktop_chrome', 'mac_safari', 'ipad_safari'): pg.goto(base + '#/perfil'); pg.wait_for_selector('[data-aba=def]'); pg.click('[data-aba=def]'); pg.wait_for_selector('#instalar'); pg.locator('#instalar').screenshot(path=f'{OUT}/inst_{nome}.png')
        ctx.close()
