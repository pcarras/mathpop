/* ===== Slides: blocos B (condensação) e C (determinantes) ===== */
const onNextOf=(nav,f)=>{SL.find(s=>s.nav===nav).onNext=f};
const onPrevOf=(nav,f)=>{SL.find(s=>s.nav===nav).onPrev=f};
const I=A=>M.fromInts(A);
opener('B','Característica e condensação','Anular, coluna a coluna, os elementos abaixo do elemento redutor, sem perder informação.',['Três operações elementares','Elemento redutor','Forma de escada','Característica'],'Bloco B · capítulo 4');
/* ---- operações elementares e notação ---- */
slide({tone:'light',bloco:'B',nav:'Operações elementares e a notação',title:'Operações elementares',steps:3,
 html:()=>hd('Três operações, três maneiras de as escrever','B')+'<div class="bd tight"><div class="opx">'+
 '<div class="f" data-s="1"><div class="card"><h4>Troca de duas linhas</h4><div class="m math">'+matHTML(I([[1,2],[3,4]]),{swap:[0,1]})+'<span class="arr">→</span>'+matHTML(I([[3,4],[1,2]]))+'</div><p>Uma seta curva à esquerda liga as duas linhas que trocam de lugar.</p></div></div>'+
 '<div class="f" data-s="2"><div class="card"><h4>Multiplicar ou dividir uma linha</h4><div class="m math">'+matHTML(I([[2,4],[1,3]]),{right:{0:':2'}})+'<span class="arr">→</span>'+matHTML(I([[1,2],[1,3]]))+'</div><p>Escreve-se <b>×3</b> ou <b>:4</b> à direita da linha, fora da matriz.</p></div></div>'+
 '<div class="f" data-s="3"><div class="card"><h4>Operação de Jacobi</h4><div class="m math">'+matHTML(I([[1,2,1],[3,1,0],[2,0,4]]),{left:{1:new Fr(-3),2:new Fr(-2)},piv:new Set(['0,0'])})+'<span class="arr">→</span>'+matHTML(I([[1,2,1],[0,-5,-3],[0,-4,2]]))+'</div><p>Só o multiplicador, à esquerda da linha que muda: multiplica-se a linha do <b>elemento redutor</b> por ele e soma-se.</p></div></div>'+
 '</div></div>'});
/* ---- elemento redutor ---- */
slide({tone:'light',bloco:'B',nav:'Elemento redutor',title:'Elemento redutor',steps:4,
 html:()=>hd('O elemento redutor anula o que está abaixo dele','B')+'<div class="bd tight"><div class="row" style="gap:80px;margin-top:30px;align-items:center"><div style="font-size:54px;min-width:830px"><div class="math" id="er"></div></div>'+
 '<div style="flex:1;font-size:32px"><div class="f" data-s="1"><p><b class="red">Elemento redutor</b>: o elemento que se usa para reduzir a zero os elementos abaixo dele, na mesma coluna.</p></div>'+
 '<div class="f" data-s="2"><p>Se for nulo, troca-se a linha com outra mais abaixo.</p></div>'+
 '<div class="f" data-s="3"><div class="card">'+'Multiplicador = '+tex('-\\dfrac{\\text{elemento a anular}}{\\text{elemento redutor}}')+'<br><span class="mut" style="font-size:27px">Aqui: '+tex('-\\tfrac31=-3')+' e '+tex('-\\tfrac21=-2')+'.</span></div></div></div></div></div>',
 init(el){const A=I([[1,2,1],[3,1,0],[2,0,4]]),R=I([[1,2,1],[0,-5,-3],[0,-4,2]]);
  this.draw=s=>{const b=$('#er',el);const piv=new Set(['0,0']);
   if(s===0)b.innerHTML=matHTML(A,{});
   else if(s===1)b.innerHTML=matHTML(A,{piv});
   else if(s===2)b.innerHTML=matHTML(A,{piv,hl:new Set(['1,0','2,0'])});
   else if(s===3)b.innerHTML=matHTML(A,{piv,left:{1:new Fr(-3),2:new Fr(-2)}});
   else b.innerHTML=matHTML(A,{piv,left:{1:new Fr(-3),2:new Fr(-2)}})+'<span class="arr">→</span>'+matHTML(R,{hl:new Set(['1,0','2,0','1,1','1,2','2,1','2,2'])});
  };this.draw(0)},
 onStep(s){this.draw(s)}});
/* ---- condensação passo a passo ---- */
slide({tone:'light',bloco:'B',nav:'Condensação passo a passo',title:'Condensação',
 html:()=>hd('Condensação passo a passo','B')+'<div class="bd tight"><div id="sp1"></div></div>',
 init(el,o){o.api=mountStepper($('#sp1',el),{A:[[1,2,3],[2,1,0],[4,5,6]],mode:'ref',fs:54,
  first:'Matriz '+'A dos coeficientes. Vamos condensá-la: zeros abaixo de cada elemento redutor.',
  final:st=>'<div class="card" style="border-color:var(--acc)"><b class="acc">R(A) = 2</b>: dois elementos redutores. A linha nula mostra que as linhas são dependentes: '+tex('L_3=2L_1+L_2')+'.</div>'});
  o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
/* ---- característica e dependência linear ---- */
slide({tone:'light',bloco:'B',nav:'Característica e dependência linear',title:'Característica',
 html:()=>hd('A característica mede as linhas realmente independentes','B')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start;margin-top:10px"><div style="min-width:880px"><div style="font-size:54px;text-align:center" class="math" id="cA"></div>'+
 '<div class="card" style="margin-top:30px"><div class="note">Mova o valor de '+tex('k')+'</div><div class="row" style="gap:26px;margin-top:10px"><input type="range" id="ck" min="-2" max="10" step="1" value="3"><b id="ckv" style="font-size:54px;min-width:90px;text-align:right" class="acc">3</b></div></div></div>'+
 '<div style="flex:1"><div class="note">Forma de escada</div><div style="font-size:44px;margin:10px 0 20px" class="math" id="cE"></div><div class="big" id="cR"></div><p id="cT" style="font-size:30px;margin-top:16px"></p></div></div></div>',
 init(el){const k=$('#ck',el);function up(){const K=+k.value;$('#ckv',el).textContent=num(K);
   const A=I([[1,2,3],[2,4,K],[1,1,1]]);const st=gaussSteps(A,'ref');const E=st[st.length-1];const r=E.pivs.length;
   $('#cA',el).innerHTML=tex('A='+pm([['1','2','3'],['2','4',String(K)],['1','1','1']]));
   $('#cE',el).innerHTML=matHTML(E.A,{piv:E.piv});
   $('#cR',el).innerHTML=tex('R(A)='+r)+(r===3?' <span class="tag spd">independentes</span>':' <span class="tag spi">dependentes</span>');
   $('#cT',el).innerHTML=r===3?'Os três elementos redutores mostram que nenhuma linha é combinação das outras.':'Há uma linha nula: uma das linhas é combinação linear das outras. Acontece para '+tex('k=6')+', porque '+tex('L_2=2L_1')+'.'}
  k.oninput=up;up()}});
exSlide('Exercícios recomendados','Exercícios recomendados: característica','B',[16,17,18,19]);
/* ===================== BLOCO C ===================== */
opener('C','Determinantes','Um só número que diz se a matriz é invertível e quanto deforma a área.',['Ordem 2 e a área','Regra de Sarrus','Teorema de Laplace','Condensação'],'Bloco C · capítulo 5');
/* ---- determinante e área ---- */
slide({tone:'light',bloco:'C',nav:'Determinante de ordem 2 e a área',title:'Determinante e área',
 html:()=>hd('Determinante de ordem 2: a área do paralelogramo','C')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><svg id="ds" viewBox="-330 -330 660 660" width="660" height="660" style="touch-action:none;flex:none;background:var(--sur);border-radius:20px;border:1px solid var(--bd)"></svg>'+
 '<div style="flex:1"><div class="note">Arraste as pontas dos vetores (linhas da matriz)</div><div id="dm" style="font-size:54px;margin:10px 0"></div><div id="dd" style="font-size:40px;margin-bottom:16px"></div><div class="card" id="dc" style="font-size:29px"></div></div></div></div>',
 init(el){
  const svg=$('#ds',el),U=64;let a=3,b=1,c=1,d=3;const NS='http://www.w3.org/2000/svg';
  let g='';for(let i=-5;i<=5;i++){g+='<line x1="'+(i*U)+'" y1="-320" x2="'+(i*U)+'" y2="320" stroke="var(--bd)" stroke-width="'+(i?1:3)+'" opacity="'+(i?.6:.9)+'"/><line y1="'+(i*U)+'" x1="-320" y2="'+(i*U)+'" x2="320" stroke="var(--bd)" stroke-width="'+(i?1:3)+'" opacity="'+(i?.6:.9)+'"/>'}
  svg.innerHTML=g+'<polygon id="pp" points="" stroke-width="3"/><line id="lu" stroke="var(--acc2)" stroke-width="7" stroke-linecap="round"/><line id="lv" stroke="var(--teal)" stroke-width="7" stroke-linecap="round"/><circle id="hu" r="20" fill="var(--acc2)" style="cursor:grab"/><circle id="hv" r="20" fill="var(--teal)" style="cursor:grab"/><text id="tu" font-size="26" font-weight="700" fill="var(--acc2)"></text><text id="tv" font-size="26" font-weight="700" fill="var(--teal)"></text>';
  const P=(x,y)=>[x*U,-y*U];
  function up(){const dt=a*d-b*c;const [ux,uy]=P(a,b),[vx,vy]=P(c,d);
   const pp=$('#pp',svg);pp.setAttribute('points','0,0 '+ux+','+uy+' '+(ux+vx)+','+(uy+vy)+' '+vx+','+vy);
   pp.setAttribute('fill',dt>0?'rgba(14,135,151,.28)':dt<0?'rgba(233,165,55,.35)':'rgba(229,72,77,.25)');pp.setAttribute('stroke',dt>0?'var(--teal)':dt<0?'var(--acc2)':'var(--red)');
   [['lu',ux,uy],['lv',vx,vy]].forEach(([i,x,y])=>{const l=$('#'+i,svg);l.setAttribute('x1',0);l.setAttribute('y1',0);l.setAttribute('x2',x);l.setAttribute('y2',y)});
   $('#hu',svg).setAttribute('cx',ux);$('#hu',svg).setAttribute('cy',uy);$('#hv',svg).setAttribute('cx',vx);$('#hv',svg).setAttribute('cy',vy);
   const tu=$('#tu',svg);tu.setAttribute('x',ux+26);tu.setAttribute('y',uy-14);tu.textContent='L₁ = ('+num(a)+', '+num(b)+')';
   const tv=$('#tv',svg);tv.setAttribute('x',vx+26);tv.setAttribute('y',vy-14);tv.textContent='L₂ = ('+num(c)+', '+num(d)+')';
   $('#dm',el).innerHTML=tex('\\begin{vmatrix}'+a+'&'+b+'\\\\'+c+'&'+d+'\\end{vmatrix}='+a+'\\cdot'+(d<0?'('+d+')':d)+'-'+(b<0?'('+b+')':b)+'\\cdot'+(c<0?'('+c+')':c));
   $('#dd',el).innerHTML='<b class="'+(dt===0?'red':'acc')+'">'+tex('\\det(A)='+dt)+'</b>';
   $('#dc',el).innerHTML=dt===0?'Os dois vetores ficam na mesma reta: a área é <b>nula</b> e a matriz <b>não é invertível</b>.':'A área do paralelogramo é '+tex('|\\det(A)|='+Math.abs(dt))+'. '+(dt>0?'Sinal positivo: da primeira linha para a segunda roda-se no sentido contrário ao dos ponteiros do relógio.':'Sinal negativo: a orientação inverteu-se.');}
  function pt(ev){const r=svg.getScreenCTM().inverse();const p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(r);return [Math.max(-4,Math.min(4,Math.round(p.x/U))),Math.max(-4,Math.min(4,Math.round(-p.y/U)))]}
  let drag=null;['hu','hv'].forEach(id=>{const h=$('#'+id,svg);h.addEventListener('pointerdown',e=>{drag=id;h.setPointerCapture(e.pointerId);e.preventDefault()});
   h.addEventListener('pointermove',e=>{if(drag!==id)return;const [x,y]=pt(e);if(id==='hu'){a=x;b=y}else{c=x;d=y}up()});h.addEventListener('pointerup',()=>drag=null)});
  up()}});
/* ---- Sarrus ---- */
(function(){
 const A=[[2,1,3],[0,4,1],[5,2,1]];const W=150,H=110,X0=40,Y0=50;
 const cx=j=>X0+j*W+W/2,cy=i=>Y0+i*H+H/2;
 const prod=(i,j,s)=>A[0][(j)%3]*0; 
 const dp=[0,1,2].map(s=>[0,1,2].map(i=>A[i][(i+s)%3]));      // principais
 const ds=[0,1,2].map(s=>[0,1,2].map(i=>A[i][((2-i)+s)%3]));   // secundárias
 const pr=a=>a[0]*a[1]*a[2];
 const P=dp.map(pr),Q=ds.map(pr);
 let svg='';A.forEach((r,i)=>{for(let j=0;j<5;j++){const v=A[i][j%3];svg+='<text x="'+cx(j)+'" y="'+(cy(i)+16)+'" text-anchor="middle" font-size="50" font-family="KaTeX_Main" fill="var(--fg)" opacity="'+(j>2?.45:1)+'">'+num(v)+'</text>'}});
 // diagonais principais: começam na coluna s, linha 0
 const line=(s,sec,col)=>{const x1=cx(sec?s+2:s),y1=cy(0),x2=cx(sec?s:s+2),y2=cy(2);return '<line class="f fx dr" data-s="'+(sec?4+s:1+s)+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="7" stroke-linecap="round" opacity=".75" pathLength="1"/>'};
 let ls='';for(let s=0;s<3;s++)ls+=line(s,false,'var(--teal)');for(let s=0;s<3;s++)ls+=line(s,true,'var(--red)');
 slide({tone:'light',bloco:'C',nav:'Regra de Sarrus',title:'Regra de Sarrus',steps:7,
  html:()=>hd('Regra de Sarrus: só para ordem 3','C')+'<div class="bd tight"><div class="row" style="gap:40px;align-items:flex-start"><div style="flex:none"><svg viewBox="0 0 '+(X0*2+W*5)+' '+(Y0*2+H*3)+'" width="900" height="'+(900*(Y0*2+H*3)/(X0*2+W*5))+'"><path d="M'+(X0+8)+' '+(Y0-8)+'h-26v'+(H*3+16)+'h26M'+(X0+W*3-8)+' '+(Y0-8)+'h26v'+(H*3+16)+'h-26" fill="none" stroke="var(--fg)" stroke-width="5"/><line x1="'+(X0+W*3+36)+'" y1="'+(Y0-10)+'" x2="'+(X0+W*3+36)+'" y2="'+(Y0+H*3+10)+'" stroke="var(--mut)" stroke-width="3" stroke-dasharray="10 8"/>'+svg+ls+'</svg>'+
  '<div class="note" style="margin-top:8px;text-align:center">Repetem-se as duas primeiras colunas à direita.</div></div>'+
  '<div style="flex:1;font-size:32px;line-height:1.55"><div class="f" data-s="3"><b style="color:var(--teal)">Diagonais principais</b> (somam)<br>'+tex(dp.map(d=>d.join('\\cdot')).map((s,i)=>s+'='+P[i]).join('\\quad '))+'<br>'+tex('\\Sigma_1='+P.reduce((x,y)=>x+y)+'')+'</div>'+
  '<div class="f" data-s="6" style="margin-top:18px"><b class="red">Diagonais secundárias</b> (subtraem)<br>'+tex(ds.map(d=>d.join('\\cdot')).map((s,i)=>s+'='+Q[i]).join('\\quad '))+'<br>'+tex('\\Sigma_2='+Q.reduce((x,y)=>x+y)+'')+'</div>'+
  '<div class="f" data-s="7" style="margin-top:22px"><div class="card" style="border-color:var(--acc)"><span class="big">'+tex('\\det(A)='+P.reduce((x,y)=>x+y)+'-'+Q.reduce((x,y)=>x+y)+'='+(P.reduce((x,y)=>x+y)-Q.reduce((x,y)=>x+y)))+'</span></div></div></div></div></div>'});
})();
/* ---- Laplace ---- */
slide({tone:'light',bloco:'C',nav:'Teorema de Laplace',title:'Teorema de Laplace',
 html:()=>hd('Laplace: desenvolver por uma linha ou coluna','C')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><div style="flex:none"><div id="lp" class="cmx" style="grid-template-columns:repeat(3,auto);font-size:54px"></div>'+
 '<div class="ctl" style="margin-top:26px" id="lb"></div><p class="note" style="margin-top:14px">Escolha uma linha ou coluna. O melhor é a que tem mais zeros.</p></div>'+
 '<div style="flex:1"><div id="lt" style="font-size:36px;line-height:1.6"></div></div></div></div>',
 init(el){const A=[[2,1,3],[0,4,1],[5,2,1]];let sel={t:'L',k:1};
  const btn=[];for(let i=0;i<3;i++)btn.push(['L',i]);for(let j=0;j<3;j++)btn.push(['C',j]);
  $('#lb',el).innerHTML=btn.map(([t,k])=>'<button class="btn sm" data-t="'+t+'" data-k="'+k+'">'+t+(k+1)+'</button>').join('');
  const minor=(i,j)=>A.filter((_,r)=>r!==i).map(r=>r.filter((_,c)=>c!==j));
  const d2=m=>m[0][0]*m[1][1]-m[0][1]*m[1][0];
  function up(){let h='';for(let i=0;i<3;i++)for(let j=0;j<3;j++){const on=sel.t==='L'?i===sel.k:j===sel.k;h+='<div class="e '+(on?'row':'')+'" data-i="'+i+'" data-j="'+j+'" style="position:relative;min-width:110px;height:100px">'+num(A[i][j])+'<small style="position:absolute;right:8px;top:4px;font:700 20px var(--sans);color:'+((i+j)%2?'var(--red)':'var(--teal)')+'">'+((i+j)%2?'−':'+')+'</small></div>'}
   $('#lp',el).innerHTML=h;$$('#lb .btn',el).forEach(b=>b.classList.toggle('fill',b.dataset.t===sel.t&&+b.dataset.k===sel.k));
   const cells=[0,1,2].map(m=>sel.t==='L'?[sel.k,m]:[m,sel.k]);let tot=0;const terms=[];
   cells.forEach(([i,j])=>{const s=((i+j)%2?-1:1),a=A[i][j],mn=minor(i,j),dm=d2(mn);tot+=s*a*dm;
     terms.push({s,a,mn,dm,i,j})});
   let t='<div class="note">Desenvolvimento pela '+(sel.t==='L'?'linha ':'coluna ')+(sel.k+1)+'</div>';
   t+='<div>'+tex('\\det(A)='+terms.map((x,n)=>(x.s<0?'-':(n?'+':''))+(x.a<0?'('+x.a+')':x.a)+'\\cdot\\begin{vmatrix}'+x.mn[0].join('&')+'\\\\'+x.mn[1].join('&')+'\\end{vmatrix}').join(' '))+'</div>';
   t+='<div>'+tex('='+terms.map((x,n)=>(x.s<0?'-':(n?'+':''))+(x.a<0?'('+x.a+')':x.a)+'\\cdot('+x.dm+')').join(' '))+'</div>';
   t+='<div style="margin-top:10px"><b class="acc" style="font-size:46px">'+tex('\\det(A)='+tot)+'</b></div>';
   const nz=terms.filter(x=>x.a===0).length;
   if(nz)t+='<div class="note" style="margin-top:14px">Com '+nz+' zero'+(nz>1?'s':'')+', há '+(nz>1?'menos':'menos')+' parcela'+(nz>1?'s':'')+' para calcular.</div>';
   $('#lt',el).innerHTML=t;}
  $('#lb',el).onclick=e=>{const b=e.target.closest('.btn');if(!b)return;sel={t:b.dataset.t,k:+b.dataset.k};up()};
  $('#lp',el).onclick=e=>{const c=e.target.closest('.e');if(!c)return;sel={t:sel.t==='L'?'L':'C',k:sel.t==='L'?+c.dataset.i:+c.dataset.j};up()};
  up()}});
/* ---- propriedades ---- */
slide({tone:'light',bloco:'C',nav:'Propriedades dos determinantes',title:'Propriedades',steps:5,
 html:()=>hd('O que cada operação faz ao determinante','C')+'<div class="bd tight"><div style="display:grid;grid-template-columns:1fr 1fr;gap:26px 50px;margin-top:10px">'+[
  ['Trocar duas linhas','o determinante muda de sinal','\\det(A)\\to-\\det(A)'],
  ['Multiplicar uma linha por '+tex('k'),'o determinante fica multiplicado por '+tex('k'),'\\det(A)\\to k\\det(A)'],
  ['Operação de Jacobi','o determinante não se altera','\\det(A)\\to\\det(A)'],
  ['Linha nula, ou duas linhas iguais','o determinante é zero','\\det(A)=0'],
  ['Matriz triangular','o determinante é o produto da diagonal','\\det(A)=a_{11}a_{22}\\cdots a_{nn}']
 ].map((r,i)=>'<div class="f card" data-s="'+(i+1)+'" style="'+(i===4?'grid-column:1/3':'')+'"><div style="font:700 30px var(--sans)">'+r[0]+'</div><div class="row" style="justify-content:space-between;margin-top:6px"><span style="font-size:28px;color:var(--mut)">'+r[1]+'</span><span style="font-size:36px">'+tex(r[2])+'</span></div></div>').join('')+'</div></div>'});
/* ---- determinante por condensação ---- */
slide({tone:'light',bloco:'C',nav:'Cálculo por condensação',title:'Determinante por condensação',
 html:()=>hd('Calcular por condensação: triangular e multiplicar','C')+'<div class="bd tight"><div id="sp2"></div></div>',
 init(el,o){o.api=mountStepper($('#sp2',el),{A:[[0,1,2],[1,2,1],[2,1,0]],mode:'ref',fs:54,
  first:'Matriz A. A troca de linhas muda o sinal do determinante; as operações de Jacobi não o alteram.',
  final:st=>{const fin=st[st.length-1];const sw=st.filter(s=>s.nxt&&s.nxt.swap).length;const dg=fin.A.map((r,i)=>r[i]);const p=dg.reduce((x,y)=>x.mul(y),Fr.ONE);const v=sw%2?p.neg():p;
   return '<div class="card" style="border-color:var(--acc)">'+tex('\\det(A)=(-1)^{'+sw+'}\\cdot'+dg.map(x=>x.str().replace('−','-')).join('\\cdot')+'='+v.str().replace('−','-'))+' &nbsp; <span class="mut" style="font-size:26px">(uma troca de linhas, diagonal 1, 1, 4)</span></div>'}});
  o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
exSlide('Exercícios recomendados','Exercícios recomendados: determinantes','C',[22,23,25,26,27,28]);

