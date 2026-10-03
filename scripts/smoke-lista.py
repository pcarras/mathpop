# Liga: lista completa, pódio com faíscas, cartão da posição, pesquisa, filtro "perto de mim". Precisa de: node scripts/dev-liga.mjs 8092 e node scripts/seed-demo.mjs
import sys, os
from playwright.sync_api import sync_playwright
from smoke_lib import novo, jogador, treino, BASE
OUT = os.path.join(os.path.dirname(__file__), '..')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg, errs = jogador(b, 'Paulo Teste', 'diurno', 'portimao', 'Teste', f'lista{__import__("time").time_ns()}@teste.pt')
    treino(pg, 5)
    pg.goto(BASE + '#/liga'); pg.wait_for_selector('.podio', timeout=8000); pg.wait_for_timeout(1800)
    print('PODIO:', pg.inner_text('.podio').replace('\n', ' | '))
    print('FAISCAS:', pg.locator('.podio .fq i').count(), '| LINHAS:', pg.locator('#lista .linha-liga').count(), '| HERO:', pg.inner_text('.hero-pos').replace('\n', ' | ')[:200])
    pg.screenshot(path=os.path.join(OUT, 'liga_a.png'))
    pg.evaluate('window.scrollTo(0, 1500)'); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(OUT, 'liga_b.png'))
    print('BARRA fixa visivel:', pg.is_visible('#minhaBarra'))
    pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(300)
    if pg.locator('#irEu').count(): pg.click('#irEu'); pg.wait_for_timeout(1200); print('Ir para mim: linha eu visivel', pg.is_visible('#lista .linha-liga.eu')); pg.screenshot(path=os.path.join(OUT, 'liga_c.png'))
    pg.click('[data-filtro=perto]'); pg.wait_for_timeout(300); print('PERTO linhas:', pg.locator('#lista .linha-liga').count(), pg.inner_text('#lista p.nota').replace('\n', ' ') if pg.locator('#lista p.nota').count() else '')
    pg.fill('#busca', 'zzzz'); print('BUSCA vazia:', pg.inner_text('#lista').replace('\n', ' '))
    pg.fill('#busca', 'Gau'); print('BUSCA Gau:', pg.locator('#lista .linha-liga').count())
    pg.fill('#busca', ''); pg.click('[data-escopo=geral]'); pg.wait_for_selector('.podio'); pg.wait_for_timeout(1500); print('GERAL linhas:', pg.locator('#lista .linha-liga').count()); pg.screenshot(path=os.path.join(OUT, 'liga_d.png'))
    print('ERROS:', errs); b.close()
