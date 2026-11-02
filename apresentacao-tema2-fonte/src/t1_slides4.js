/* ===== Slides: exercícios de E, teste, plano de estudo, síntese e fecho ===== */
exSlide('Exercícios: sistemas','Exercícios recomendados: resolver, classificar e interpretar','E',[44,46,47,49,51,52,54,56,57]);
exSlide('Exercícios: parâmetros','Exercícios recomendados: discussão com parâmetros','E',[58,59,61,62,64,65,67]);
exSlide('Exercícios: gestão','Exercícios recomendados: aplicações à gestão','E',[68,70,72,73]);
/* ---- simulação de teste ---- */
slide({tone:'light',bloco:'E',nav:'Simulação de teste',title:'Simulação de teste',tmr:true,
 html:()=>hd('Teste de exemplo: 90 minutos, sem consulta','E')+'<div class="bd tight"><div class="row" style="gap:40px;align-items:flex-start"><div style="width:420px;flex:none"><div class="ctl" id="tt"></div><div class="tmr" id="tm" style="margin:26px 0 10px">90:00</div><div class="ctl"><button class="btn fill" id="t1">Começar</button><button class="btn" id="t2">Repor</button></div><p class="note" style="margin-top:20px">Resolva no papel. As resoluções detalhadas estão na Parte V da sebenta.</p></div>'+
 '<div style="flex:1"><div class="ctl" id="tq" style="margin-bottom:16px"></div><div class="card" id="tb" style="font-size:30px;min-height:600px"></div></div></div></div>',
 init(el){let T=0,Q=0,left=90*60,iv=null;
  const tests=DATA.tests;
  function draw(){$('#tt',el).innerHTML=tests.map((t,i)=>'<button class="tab'+(i===T?' on':'')+'" data-t="'+i+'">Teste '+(i+1)+'</button>').join('');
   $('#tq',el).innerHTML=tests[T].qs.map((q,i)=>'<button class="tab'+(i===Q?' on':'')+'" data-q="'+i+'">Q'+q.n+'</button>').join('');
   const q=tests[T].qs[Q];$('#tb',el).innerHTML='<div class="row" style="justify-content:space-between;margin-bottom:10px"><b class="acc" style="font-size:34px">Questão '+q.n+'</b><span class="chip">'+String(q.pts).replace('.',',')+' valores</span></div>'+blocksHTML(q.st)}
  function clock(){const m=Math.floor(left/60),s=left%60;const t=$('#tm',el);t.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');t.classList.toggle('low',left<600)}
  $('#tt',el).onclick=e=>{const b=e.target.closest('[data-t]');if(b){T=+b.dataset.t;Q=0;tmrReset();draw()}};
  $('#tq',el).onclick=e=>{const b=e.target.closest('[data-q]');if(b){Q=+b.dataset.q;tmrReset();draw()}};
  $('#t1',el).onclick=function(){if(iv){clearInterval(iv);iv=null;this.textContent='Continuar';return}this.textContent='Pausar';iv=setInterval(()=>{if(left>0){left--;clock()}else{clearInterval(iv);iv=null}},1000)};
  $('#t2',el).onclick=()=>{clearInterval(iv);iv=null;left=90*60;clock();$('#t1',el).textContent='Começar'};
  draw();clock()}});
/* ---- plano de estudo ---- */
slide({tone:'light',bloco:'F',nav:'Plano de estudo',title:'Plano de estudo',
 html:()=>hd('O seu plano: exercícios recomendados por bloco','F')+'<div class="bd tight"><div class="pl" id="pl"></div><div class="row" style="gap:40px;margin-top:40px;align-items:flex-start"><div class="card" style="flex:1"><b>Como usar</b><div style="font-size:28px;line-height:1.5;margin-top:6px" class="mut">1. Resolva primeiro no papel.<br>2. Clique no cartão do exercício para ver a solução final.<br>3. Marque como feito. O progresso fica guardado neste navegador.</div></div><div class="card" style="flex:1"><b>Depois</b><div style="font-size:28px;line-height:1.5;margin-top:6px" class="mut">Faça o teste de exemplo 1 em 90 minutos e confira com as resoluções da sebenta. Repita com os testes 2, 3 e 4.</div></div></div></div>',
 enter(el){const R=(2*Math.PI*88);$('#pl',el).innerHTML=['A','B','C','D','E'].map(b=>{const ids=[...new Set(SL.filter(s=>s.bloco===b&&s.exs).flatMap(s=>s.exs))];const n=ids.filter(i=>DONE[i]).length;const p=ids.length?n/ids.length:0;
   return '<div class="card center"><div class="ring"><svg width="210" height="210" viewBox="0 0 210 210"><circle cx="105" cy="105" r="88" fill="none" stroke="var(--bd)" stroke-width="16"/><circle cx="105" cy="105" r="88" fill="none" stroke="var(--acc)" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+R+'" stroke-dashoffset="'+(R*(1-p))+'" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/></svg><div class="v">'+Math.round(p*100)+'%</div></div><div style="font:700 28px/1.2 var(--sans);margin-top:16px">'+esc(bnome(b))+'</div><div class="note" style="font-size:24px">'+n+' de '+ids.length+' exercícios</div></div>'}).join('')}});
/* ---- síntese ---- */
slide({tone:'light',bloco:'F',nav:'Síntese',title:'Síntese',steps:5,
 html:()=>hd('Em resumo','F')+'<div class="bd tight"><div style="display:grid;gap:18px;margin-top:6px">'+[
  ['A','Matrizes',tex('AB')+' só existe se as colunas de '+tex('A')+' igualam as linhas de '+tex('B')+'. Em geral, '+tex('AB\\neq BA')+'.'],
  ['B','Característica',tex('R(A)')+' é o número de elementos redutores depois de condensar.'],
  ['C','Determinantes',tex('\\det(A)\\neq0')+' ⇔ '+tex('A')+' invertível. Jacobi não altera o determinante, a troca de linhas muda-lhe o sinal.'],
  ['D','Inversa',tex('[A\\,|\\,I]\\to[I\\,|\\,A^{-1}]')+' e '+tex('AX=B\\Rightarrow X=A^{-1}B')+'.'],
  ['E','Sistemas','SI se '+tex('R(A)\\neq R(A|B)')+'; SPD se '+tex('R(A)=n')+'; SPI caso contrário, com '+tex('GI=n-R(A)')+'.']
 ].map((r,i)=>'<div class="f card" data-s="'+(i+1)+'" style="display:grid;grid-template-columns:70px 270px 1fr;align-items:center;padding:20px 30px"><b style="font:600 48px var(--serif);color:var(--acc)">'+r[0]+'</b><b style="font:700 30px var(--sans)">'+r[1]+'</b><span style="font-size:32px">'+r[2]+'</span></div>').join('')+'</div></div>'});
/* ---- fecho ---- */
slide({tone:'dark',bloco:'F',bg:'cover',nav:'Fecho',title:'Fecho',
 html:()=>'<div class="cov"><div class="inst fadein" style="--d:0">Matemática I · Tema 1</div><h1 style="font-size:190px">'+letters('Bom estudo',1)+'</h1><div class="sub fadein" style="--d:1">Dúvidas e exercícios: sebenta, applets e atendimento.</div><div class="who fadein" style="--d:2">Paulo Carrasco<br><span>pcarras@ualg.pt · Núcleo de Métodos Quantitativos, ESGHT</span></div></div>'+
 '<div class="fadein" style="--d:3;position:absolute;right:160px;top:290px;width:400px;text-align:center;white-space:nowrap;margin-right:0"><div class="qrb" style="background:#fff;border-radius:22px;padding:22px">'+QR_SVG+'</div><div style="font:700 26px var(--sans);color:#D7E6F5;margin-top:22px">Esta apresentação</div><div style="font:400 19px var(--sans);color:#8FA6BF;margin-top:4px;margin-left:-40px;margin-right:-40px">matematica1-carrasco-esght.netlify.app/apresentacao</div><div style="font:400 19px var(--sans);color:#8FA6BF;margin-top:12px">Applets: página principal do mesmo site</div></div>'});
/* ---- arranque ---- */
function boot(){
  stage=$('#stage');buildDOM();buildTimer();buildOverview();bindKeys();startBG();fitStage();addEventListener('resize',fitStage);
  const h=parseInt(location.hash.slice(1),10);go(Number.isFinite(h)&&h>0?h-1:0);
  setTimeout(()=>hint('→ avançar · ← recuar · O índice · F ecrã inteiro'),1200);
}
document.fonts.ready.then(boot);
