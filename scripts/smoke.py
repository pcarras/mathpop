# Teste de fumo da interface (Playwright, ecra de telemovel): python3 scripts/smoke.py <pasta-de-capturas>
import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
base = 'http://localhost:8092/index.html?debug'
def S(v): return str(v)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PE ' + str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    # entrada: sem dados, aparece o ecra de entrada; botao desativado ate estar completo
    pg.goto(base + '#/home'); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_selector('.entrada')
    assert pg.is_disabled('#entrar'); pg.screenshot(path=f'{OUT}/entrada_vazia.png')
    pg.fill('#e-nome', 'Ana Silva'); pg.click('[data-seg=regime][data-v=noturno]'); assert pg.is_disabled('#entrar'); pg.click('[data-seg=local][data-v=faro]'); assert pg.is_disabled('#entrar'); pg.fill('#e-teste', '2026-12-10')
    assert not pg.is_disabled('#entrar'); pg.screenshot(path=f'{OUT}/entrada_cheia.png'); pg.click('#entrar'); pg.wait_for_selector('h1')
    print('ENTRADA ok:', pg.evaluate("JSON.stringify((JSON.parse(localStorage.getItem('mat1.v2')).perfil))")[:120])
    # rotas principais sem erros
    for r in ['home', 'treinar', 'perfil']:
        pg.goto(base + '#/' + r); pg.reload(); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/rota_{r}.png')
    # treinar determinante: certo pelo teclado
    pg.goto(base + '#/treinar/determinante'); pg.reload(); pg.wait_for_selector('.teclado')
    ans = pg.evaluate('String(window.__ex.resposta.valor)')
    for ch in ans: pg.click(f".teclado button:text-is('{'−' if ch == '-' else ch}')")
    pg.click('#ver'); pg.wait_for_selector('.folha.certo'); pg.screenshot(path=f'{OUT}/sessao_certo.png'); print('TREINAR CERTO ok, resposta', ans)
    # perfil: alcunha e avatar
    pg.goto(base + '#/perfil'); pg.reload(); pg.click('[data-aba=def]'); pg.fill('#d-alc', 'Matriz Curiosa'); pg.click('#gravDados')
    pg.click('[data-aba=avatar]'); [pg.click('#seg') for _ in range(3)]; pg.click('.item:not(.trancado) >> nth=2'); pg.screenshot(path=f'{OUT}/perfil_editado.png')
    pg.goto(base + '#/home'); pg.wait_for_selector('h1'); print('NOME NO TOPO:', pg.inner_text('.topo-nome b'))
    # animacao do avatar e opcoes livres
    pg.goto(base + '#/home'); pg.wait_for_selector('.av.anima .av-olhos'); print('ANIM: olhos', pg.locator('.av.anima .av-olhos').count(), 'sobr', pg.locator('.av.anima .av-sobr').count())
    pg.goto(base + '#/perfil'); pg.reload(); print('ALEATORIO existe:', pg.locator('#aleat').count())
    from collections import Counter
    tot = {}
    for passo in ['cabelo', 'olhos', 'boca', 'oculos', 'roupa']:
        pg.click(f'[data-passo={passo}]'); tot[passo] = (pg.locator('.item:not(.trancado)').count(), pg.locator('.item').count())
    print('LIVRES/TOTAL:', tot)
    print('ERROS JS:', errs); b.close()
