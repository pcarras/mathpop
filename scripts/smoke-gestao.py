# Teste de ecra do modulo Economia e Gestao (telemovel): python3 scripts/smoke-gestao.py <pasta-de-capturas>   (precisa de: node scripts/dev-liga.mjs 8092)
import sys
from playwright.sync_api import sync_playwright
from smoke_lib import novo, entrar_local, estado, BASE
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
def teclar(pg, v):
    for ch in v:
        k = {'-': '−', '/': '/', ',': ','}.get(ch, ch)
        pg.click(f".teclado button:text-is('{k}')")
def escrever(pg, valores):
    for i, v in enumerate(valores):
        pg.evaluate('(i)=>document.querySelectorAll(".cel")[i].focus()', i); teclar(pg, v)
with sync_playwright() as p:
    b = p.chromium.launch(); pg, errs = novo(b)
    pg.goto(BASE + '#/home'); pg.evaluate('localStorage.clear()'); pg.reload()
    entrar_local(pg, 'Teste Gestao', 'diurno', 'faro')
    # mapa com o sexto no
    pg.goto(BASE + '#/home'); pg.wait_for_selector('.mapa .no[data-tipo=gestao]'); pg.locator('.mapa').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path=f'{OUT}/g_mapa.png', full_page=True)
    assert pg.locator('.mapa .no').count() == 7, 'seis tipos e o teste'
    # menu de treino
    pg.goto(BASE + '#/treinar'); pg.wait_for_selector('.tipo-cartao'); pg.screenshot(path=f'{OUT}/g_menu.png', full_page=True)
    assert 'Economia e Gestão' in pg.inner_text('.tipo-cartao >> nth=5') or 'Economia e Gestão' in pg.inner_text('#app, body')
    # um exercicio de cada nivel: errar, pista, certo
    for nivel in (1, 2, 3):
        pg.goto(BASE + '#/home'); pg.wait_for_selector('.mapa')
        pg.evaluate("(n)=>{const s=JSON.parse(localStorage.getItem('mat1.v2')); s.porTipo=s.porTipo||{}; s.porTipo.gestao={hist:[],nivel:n}; localStorage.setItem('mat1.v2',JSON.stringify(s))}", nivel)
        pg.reload(); pg.wait_for_selector('.mapa'); pg.goto(BASE + '#/treinar/gestao'); pg.wait_for_selector('.teclado'); pg.wait_for_selector('.vetor-l'); pg.wait_for_timeout(800)
        ex = pg.evaluate("(()=>{const e=window.__ex; return {n:e.nivel, v:e.resposta.valor.map(String), dec:e.resposta.valor.map(x=>x.n===undefined?'':'')}})()")
        assert ex['n'] == nivel, ex
        pg.screenshot(path=f'{OUT}/g_ex{nivel}.png', full_page=True)
        # errado primeiro
        escrever(pg, ['99991'] * len(ex['v'])); pg.click('#ver'); pg.wait_for_selector('.folha.erro'); pg.click('#outra')
        # pistas
        for _ in range(5): pg.click('#pista'); pg.wait_for_timeout(120)
        pg.locator('#pistas').scroll_into_view_if_needed(); pg.screenshot(path=f'{OUT}/g_pistas{nivel}.png', full_page=True)
        # certo (valores decimais com virgula)
        vals = pg.evaluate("window.__ex.resposta.valor.map(v=>v.d===1n?String(v.n):String(Number(v.n)/Number(v.d)).replace('.',','))")
        for i, v in enumerate(vals):
            pg.evaluate("(i)=>{const c=document.querySelectorAll('.cel')[i]; c.value=''; c.focus()}", i)
            teclar(pg, v)
        pg.click('#ver'); pg.wait_for_selector('.folha.certo', timeout=4000); pg.screenshot(path=f'{OUT}/g_certo{nivel}.png')
    print('erros de consola:', errs); assert not errs, errs
    print('OK smoke gestao')
