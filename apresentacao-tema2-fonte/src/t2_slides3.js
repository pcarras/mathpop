/* ===== Slides do Tema 2: bloco E (dualidade), bloco F (software), teste, plano, síntese e fecho ===== */
/* ===================== BLOCO E ===================== */
opener('E','Dualidade','Cada problema tem um gémeo: o dual dá o valor de cada recurso.',['Construir o problema dual','Os preços-sombra','Primal e dual têm o mesmo ótimo'],'Bloco E · capítulo 8');
slide({tone:'light',bloco:'E',nav:'O problema dual',title:'O problema dual',steps:4,
 html:()=>hd('Do primal ao dual','E')+'<div class="bd tight"><div class="dualg">'+
 '<div class="card"><div class="lbl">PRIMAL</div>'+tex('\\begin{array}{l}\\text{Max } z=\\color{#0E8797}{30}x_1+\\color{#0E8797}{20}x_2\\\\ \\text{s.a. } 3x_1+x_2\\leq\\color{#C23A3F}{150}\\\\ \\phantom{\\text{s.a. }}x_1+2x_2\\leq\\color{#C23A3F}{100}\\\\ \\phantom{\\text{s.a. }}x_1,x_2\\geq0\\end{array}',true)+'</div>'+
 '<div class="f" data-s="1" style="text-align:center;font:700 70px var(--serif);color:var(--teal)">⇄</div>'+
 '<div class="card f" data-s="1"><div class="lbl" style="color:var(--amberD)">DUAL</div>'+tex('\\begin{array}{l}\\text{Min } w=\\color{#C23A3F}{150}y_1+\\color{#C23A3F}{100}y_2\\\\ \\text{s.a. } 3y_1+y_2\\geq\\color{#0E8797}{30}\\\\ \\phantom{\\text{s.a. }}y_1+2y_2\\geq\\color{#0E8797}{20}\\\\ \\phantom{\\text{s.a. }}y_1,y_2\\geq0\\end{array}',true)+'</div></div>'+
 '<div class="rl">'+[['Maximizar','Minimizar'],['coeficientes da função objetivo','termos independentes'],['matriz dos coeficientes $A$','matriz transposta $A^{\\mathsf T}$'],['restrições $\\leq$','restrições $\\geq$'],['$m$ restrições, $n$ variáveis','$m$ variáveis, $n$ restrições']]
  .map((r,i)=>'<div class="f" data-s="'+Math.min(i+2,4)+'">'+rich(r[0])+'</div><div class="f" data-s="'+Math.min(i+2,4)+'">→ '+rich(r[1])+'</div>').join('')+'</div></div>'});
slide({tone:'light',bloco:'E',nav:'Os preços-sombra',title:'Preços-sombra',steps:3,
 html:()=>hd('Os preços-sombra estão no quadro ótimo','E')+'<div class="bd tight"><div class="g2" style="gap:44px;grid-template-columns:1.2fr 1fr">'+
 '<div class="qwrap" id="qps"></div>'+
 '<div style="font-size:28px;line-height:1.5"><div class="card f" data-s="1">A solução ótima do dual lê-se na linha $c_j-z_j$, nas colunas das folgas, com o sinal trocado: $y_1=8$ e $y_2=6$.</div>'+
 '<div class="card f" data-s="2" style="margin-top:16px">$w^*=150\\cdot8+100\\cdot6=1800=z^*$. O primal e o dual têm sempre o mesmo valor ótimo.</div>'+
 '<div class="card f" data-s="3" style="margin-top:16px;border:3px solid var(--teal)"><b>Interpretação económica.</b> Um kg extra de matéria-prima vale $8$ € e uma hora extra vale $6$ €: é o máximo que a empresa deveria pagar por eles. Um recurso com folga tem preço-sombra $0$.</div></div></div></div>',
 onStep(s){const e=$('#qps');if(!e)return;e.innerHTML=quadroHTML(DATA.QX1[2],{sol:true});texify(e);if(s>=1)$$('tr.cz td',e).forEach((td,j)=>{if(j===4||j===5){td.style.background='rgba(229,72,77,.18)';td.style.color='var(--redD)'}})},
 enter(){this.onStep(ST.step)},init(el,o){o.onStep(0)}});
slide({tone:'light',bloco:'E',nav:'O dual de uma minimização',title:'Dual de min',steps:2,
 html:()=>hd('O dual de um problema de minimização','E')+'<div class="bd tight"><div class="dualg">'+
 '<div class="card" style="font-size:31px"><div class="lbl">PRIMAL (dieta)</div>'+tex('\\begin{array}{l}\\text{Min } z=4x_1+6x_2\\\\ \\text{s.a. } 2x_1+x_2\\geq420\\\\ \\phantom{\\text{s.a. }}x_1+2x_2\\geq500\\\\ \\phantom{\\text{s.a. }}5x_1+6x_2\\geq2100\\end{array}',true)+'</div>'+
 '<div class="f" data-s="1" style="text-align:center;font:700 70px var(--serif);color:var(--teal)">⇄</div>'+
 '<div class="card f" data-s="1" style="font-size:31px"><div class="lbl" style="color:var(--amberD)">DUAL</div>'+tex('\\begin{array}{l}\\text{Max } w=420y_1+500y_2+2100y_3\\\\ \\text{s.a. } 2y_1+y_2+5y_3\\leq4\\\\ \\phantom{\\text{s.a. }}y_1+2y_2+6y_3\\leq6\\end{array}',true)+'</div></div>'+
 '<div class="card f" data-s="2" style="margin-top:30px;font-size:28px;line-height:1.5">Leitura: um vendedor de nutrientes quer fixar preços $y_1,y_2,y_3$ por unidade de vitaminas, minerais e calorias, sem ficar mais caro do que os produtos P1 e P2. O ótimo é $y=(0;\\,1{,}5;\\,0{,}5)$ e $w^*=1800=z^*$. As vitaminas têm preço $0$ porque, no ótimo, há vitaminas a mais.</div></div>'});
exSlide('Exercícios: dualidade','Exercícios recomendados: dualidade e interpretação','E',[24,25,26,27]);
/* ===================== BLOCO F ===================== */
opener('F','Resolução com software','O que fazemos à mão, o computador faz em segundos. Mas é preciso saber ler o que ele diz.',['Excel: o Solver','Python: a função linprog','Relatórios: folgas e preços-sombra'],'Bloco F · capítulo 9');
slide({tone:'light',bloco:'F',nav:'Excel: o Solver',title:'Excel',steps:3,
 html:()=>hd('Excel: o Solver','F')+'<div class="bd tight"><div class="g2" style="gap:44px;grid-template-columns:1.1fr 1fr">'+
 '<div><table class="xl notex"><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr>'+
 '<tr><th>1</th><td class="hd2"></td><td class="hd2">x1</td><td class="hd2">x2</td><td></td><td></td><td></td></tr>'+
 '<tr><th>2</th><td class="hd2">Quantidades</td><td class="var">40</td><td class="var">30</td><td></td><td></td><td></td></tr>'+
 '<tr><th>3</th><td class="hd2">Lucro unitário</td><td>30</td><td>20</td><td class="obj">1800</td><td class="f" colspan="2">=SOMARPRODUTO(B3:C3;B$2:C$2)</td></tr>'+
 '<tr><th>4</th><td class="hd2">Matéria-prima</td><td>3</td><td>1</td><td>150</td><td>&lt;=</td><td>150</td></tr>'+
 '<tr><th>5</th><td class="hd2">Horas</td><td>1</td><td>2</td><td>100</td><td>&lt;=</td><td>100</td></tr></table>'+
 '<p class="note" style="margin-top:12px;font-size:22px">D4 e D5 têm a mesma fórmula que D3, com as suas linhas.</p>'+
 '<div class="card f" data-s="3" style="margin-top:20px;font-size:26px;line-height:1.45">No fim, em <b>Relatórios</b>, escolha <b>Sensibilidade</b>: aparecem os <b>preços-sombra</b> (8 e 6) e os intervalos em que os coeficientes podem variar sem mudar a solução.</div></div>'+
 '<div><div class="dlg f notex" data-s="1"><div class="tl">Parâmetros do Solver</div>'+
 '<div class="ln">Definir Objetivo: <span class="bx">$D$3</span></div><div class="ln">Para: <b>● Máximo</b> &nbsp;○ Mínimo</div>'+
 '<div class="ln">Alterando as Células de Variável: <span class="bx">$B$2:$C$2</span></div><div class="ln">Sujeito às Restrições: <span class="bx">$D$4:$D$5 &lt;= $F$4:$F$5</span></div>'+
 '<div class="ln">☑ variáveis sem restrições não negativas</div><div class="ln">Método de resolução: <span class="bx">LP Simplex</span></div></div>'+
 '<div class="card f" data-s="2" style="margin-top:20px;font-size:25px;line-height:1.45">O Solver está em <b>Dados</b>, grupo <b>Análise</b>. Se não aparecer, ative o suplemento Solver nas opções do Excel (Suplementos).</div></div></div></div>'});
slide({tone:'light',bloco:'F',nav:'Python: linprog',title:'Python',steps:2,
 html:()=>hd('Python: a função linprog (SciPy)','F')+'<div class="bd tight"><div class="g2" style="gap:40px;grid-template-columns:1.25fr 1fr">'+
 '<div class="code"><span class="k">from</span> scipy.optimize <span class="k">import</span> linprog\n\n'+
 'c = [<span class="n">-30</span>, <span class="n">-20</span>]   <span class="c"># linprog minimiza: troca-se o sinal</span>\n'+
 'A = [[<span class="n">3</span>, <span class="n">1</span>],\n     [<span class="n">1</span>, <span class="n">2</span>]]\n'+
 'b = [<span class="n">150</span>, <span class="n">100</span>]\n\n'+
 'res = linprog(c, A_ub=A, b_ub=b,\n              bounds=[(<span class="n">0</span>, <span class="k">None</span>)] * <span class="n">2</span>, method=<span class="s">"highs"</span>)\n\n'+
 '<span class="k">print</span>(res.x)                     <span class="c"># [40. 30.]</span>\n'+
 '<span class="k">print</span>(-res.fun)                  <span class="c"># 1800.0</span>\n'+
 '<span class="k">print</span>(res.ineqlin.residual)      <span class="c"># folgas: [0. 0.]</span>\n'+
 '<span class="k">print</span>(-res.ineqlin.marginals)   <span class="c"># preços-sombra: [8. 6.]</span></div>'+
 '<div style="font-size:27px;line-height:1.5"><div class="card f" data-s="1">O modelo escreve-se com matrizes, como no Tema 1: $c$, $A$ e $b$. As restrições $\\geq$ passam a $\\leq$ multiplicando por $-1$; as igualdades vão para <code>A_eq</code> e <code>b_eq</code>.</div>'+
 '<div class="card f" data-s="2" style="margin-top:18px">Funciona no Google Colab, sem instalar nada. Os valores impressos são os mesmos do Simplex feito à mão.</div></div></div></div>'});
exSlide('Exercícios: software','Exercícios recomendados: resolução com software','F',[28,29]);
/* ---- simulação de teste ---- */
slide({tone:'light',bloco:'F',nav:'Simulação de teste',title:'Simulação de teste',tmr:true,
 html:()=>hd('Teste de exemplo: 120 minutos, sem consulta','F')+'<div class="bd tight"><div class="row" style="gap:40px;align-items:flex-start"><div style="width:420px;flex:none"><div class="ctl" id="tt"></div><div class="tmr" id="tm" style="margin:26px 0 10px">120:00</div><div class="ctl"><button class="btn fill" id="t1">Começar</button><button class="btn" id="t2">Repor</button></div><p class="note" style="margin-top:20px">Resolva no papel. As resoluções detalhadas vão estar na sebenta do Tema 2.</p></div>'+
 '<div style="flex:1"><div class="ctl" id="tq" style="margin-bottom:16px"></div><div class="card" id="tb" style="font-size:29px;min-height:600px"></div></div></div></div>',
 init(el){let Tt=0,Q=0,left=120*60,iv=null;const tests=DATA.tests;
  function draw(){$('#tt',el).innerHTML=tests.map((t,i)=>'<button class="tab'+(i===Tt?' on':'')+'" data-t="'+i+'">Teste '+(i+1)+'</button>').join('');
   $('#tq',el).innerHTML=tests[Tt].qs.map((q,i)=>'<button class="tab'+(i===Q?' on':'')+'" data-q="'+i+'">Q'+q.n+'</button>').join('');
   const q=tests[Tt].qs[Q];$('#tb',el).innerHTML='<div class="row" style="justify-content:space-between;margin-bottom:10px"><b class="acc" style="font-size:34px">Questão '+q.n+'</b><span class="chip">'+String(q.pts).replace('.',',')+' valores</span></div>'+blocksHTML(q.st)}
  function clock(){const m=Math.floor(left/60),s=left%60;const t=$('#tm',el);t.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');t.classList.toggle('low',left<600)}
  $('#tt',el).onclick=e=>{const b=e.target.closest('[data-t]');if(b){Tt=+b.dataset.t;Q=0;tmrReset();draw()}};
  $('#tq',el).onclick=e=>{const b=e.target.closest('[data-q]');if(b){Q=+b.dataset.q;tmrReset();draw()}};
  $('#t1',el).onclick=function(){if(iv){clearInterval(iv);iv=null;this.textContent='Continuar';return}this.textContent='Pausar';iv=setInterval(()=>{if(left>0){left--;clock()}else{clearInterval(iv);iv=null}},1000)};
  $('#t2',el).onclick=()=>{clearInterval(iv);iv=null;left=120*60;clock();$('#t1',el).textContent='Começar'};
  draw();clock()}});
/* ---- plano de estudo ---- */
slide({tone:'light',bloco:'F',nav:'Plano de estudo',title:'Plano de estudo',
 html:()=>hd('O seu plano: exercícios recomendados por bloco','F')+'<div class="bd tight"><div class="pl" id="pl" style="grid-template-columns:repeat(6,1fr);gap:20px"></div><div class="row" style="gap:40px;margin-top:36px;align-items:flex-start"><div class="card" style="flex:1"><b>Como usar</b><div style="font-size:27px;line-height:1.5;margin-top:6px" class="mut">1. Resolva primeiro no papel.<br>2. Veja a solução final no slide de exercícios.<br>3. Marque como feito. O progresso fica guardado neste navegador.</div></div><div class="card" style="flex:1"><b>Depois</b><div style="font-size:27px;line-height:1.5;margin-top:6px" class="mut">Faça o teste de exemplo 1 em 120 minutos. Confirme as contas com os applets e com o Excel. Repita com os testes 2, 3 e 4.</div></div></div></div>',
 enter(el){const R=(2*Math.PI*78);$('#pl',el).innerHTML=['A','B','C','D','E','F'].map(b=>{const ids=[...new Set(SL.filter(s=>s.bloco===b&&s.exs).flatMap(s=>s.exs))];const n=ids.filter(i=>DONE[i]).length;const p=ids.length?n/ids.length:0;
   return '<div class="card center" style="padding:20px 10px"><div class="ring" style="width:190px;height:190px"><svg width="190" height="190" viewBox="0 0 190 190"><circle cx="95" cy="95" r="78" fill="none" stroke="var(--bd)" stroke-width="14"/><circle cx="95" cy="95" r="78" fill="none" stroke="var(--acc)" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+R+'" stroke-dashoffset="'+(R*(1-p))+'" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/></svg><div class="v">'+Math.round(p*100)+'%</div></div><div style="font:700 24px/1.2 var(--sans);margin-top:12px">'+esc(bnome(b))+'</div><div class="note" style="font-size:21px">'+n+' de '+ids.length+'</div></div>'}).join('')}});
/* ---- síntese ---- */
slide({tone:'light',bloco:'F',nav:'Síntese',title:'Síntese',steps:6,
 html:()=>hd('Em resumo','F')+'<div class="bd tight"><div style="display:grid;gap:14px;margin-top:4px">'+[
  ['A','Formulação','Variáveis de decisão, função objetivo, restrições técnicas e de sinal.'],
  ['B','Gráfico','O ótimo, se existir, está num vértice do CSA. Desloca-se a reta de isolucro.'],
  ['C','Forma standard','Folga $F_i$ em $\\leq$, excesso $E_i$ em $\\geq$. No máximo $C^n_m$ soluções básicas.'],
  ['D','Simplex','Entra o $c_j-z_j$ mais positivo (max) ou mais negativo (min); sai o menor rácio. M grande para as artificiais.'],
  ['E','Dualidade','Max ↔ Min, $A\\to A^{\\mathsf T}$, $b\\leftrightarrow c$. $w^*=z^*$; preços-sombra no quadro ótimo.'],
  ['F','Software','Solver (LP Simplex) e linprog: confirmar e ler folgas e preços-sombra.']
 ].map((r,i)=>'<div class="f card" data-s="'+(i+1)+'" style="display:grid;grid-template-columns:70px 260px 1fr;align-items:center;padding:16px 30px"><b style="font:600 44px var(--serif);color:var(--acc)">'+r[0]+'</b><b style="font:700 29px var(--sans)">'+r[1]+'</b><span style="font-size:29px">'+rich(r[2])+'</span></div>').join('')+'</div></div>'});
/* ---- fecho ---- */
slide({tone:'dark',bloco:'F',bg:'cover',nav:'Fecho',title:'Fecho',
 html:()=>'<div class="cov"><div class="inst fadein" style="--d:0">Matemática I · Tema 2</div><h1 style="font-size:190px">'+letters('Bom estudo',1)+'</h1><div class="sub fadein" style="--d:1">Dúvidas e exercícios: sebenta, applets e atendimento.</div><div class="who fadein" style="--d:2">Paulo Carrasco<br><span>pcarras@ualg.pt · Núcleo de Métodos Quantitativos, ESGHT</span></div></div>'+
 '<div class="fadein" style="--d:3;position:absolute;right:160px;top:290px;width:400px;text-align:center;white-space:nowrap"><div class="qrb" style="background:#fff;border-radius:22px;padding:22px">'+QR_SVG+'</div><div style="font:700 26px var(--sans);color:#D7E6F5;margin-top:22px">Esta apresentação</div><div style="font:400 19px var(--sans);color:#8FA6BF;margin-top:4px;margin-left:-40px;margin-right:-40px">matematica1-carrasco-esght.netlify.app/apresentacao-tema2</div><div style="font:400 19px var(--sans);color:#8FA6BF;margin-top:12px">Applets: página principal do mesmo site</div></div>'});
/* ---- arranque ---- */
function boot(){
  stage=$('#stage');buildDOM();buildTimer();buildOverview();bindKeys();startBG();fitStage();addEventListener('resize',fitStage);
  const h=parseInt(location.hash.slice(1),10);go(Number.isFinite(h)&&h>0?h-1:0);
  setTimeout(()=>hint('→ avançar · ← recuar · O índice · F ecrã inteiro'),1200);
}
document.fonts.ready.then(boot);
