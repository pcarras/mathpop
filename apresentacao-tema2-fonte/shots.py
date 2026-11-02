import sys
from playwright.sync_api import sync_playwright
U='file:///home/claude/t2deck/out/Matematica1_Tema2_Apresentacao.html'
only=[int(x) for x in sys.argv[1].split(',')] if len(sys.argv)>1 else None
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox']);pg=b.new_page(viewport={'width':1920,'height':1080})
    errs=[];pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append('PE '+str(e)))
    pg.goto(U);pg.wait_for_timeout(1500)
    n=pg.evaluate('SL.length');print('slides',n)
    for i in range(n):
        if only and i+1 not in only: continue
        pg.evaluate('(i)=>go(i,{last:true})',i);pg.wait_for_timeout(1100)
        o=pg.evaluate('(i)=>({nav:SL[i].nav,steps:SL[i].steps})',i)
        # forcar onStep com o ultimo passo
        pg.evaluate('(i)=>{const o=SL[i];if(o.onStep)o.onStep(o.steps,1)}',i);pg.wait_for_timeout(300)
        pg.screenshot(path='shots/s%02d.png'%(i+1))
        red=pg.evaluate("document.querySelectorAll('.slide.on .katex-error, .slide.on span.red[title]').length")
        print(i+1,o['nav'],o['steps'],'katexerr',red)
    print('ERROS',errs[:10])
