/* ===== Slides: capa, roteiro, bloco A (matrizes) ===== */
const num=x=>String(x).replace('-','−');
function cm(rows,o={}){return '<span class="mat math"'+(o.id?' id="'+o.id+'"':'')+'><table>'+rows.map((r,i)=>'<tr>'+r.map((x,j)=>'<td data-i="'+i+'" data-j="'+j+'"'+(o.aug!==undefined&&j===o.aug?' class="aug"':'')+'>'+x+'</td>').join('')+'</tr>').join('')+'</table></span>'}
const letters=(s,d0)=>[...s].map((c,i)=>c===' '?' ':'<span class="lt" style="--d:'+(i+(d0||0))+'">'+c+'</span>').join('');
function opener(b,title,line,items,ref){
  return slide({tone:'dark',bloco:b,bg:'open',nav:title,title,
   html:'<div class="open stg"><div class="bk" style="--d:0">'+esc(ref)+'</div><h2 style="--d:1">'+title+'</h2><p style="--d:3">'+line+'</p><ul style="--d:5">'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>'});
}
/* ---------- capa ---------- */
slide({tone:'dark',bloco:'A',bg:'cover',nav:'Capa',title:'Capa',
 html:'<div class="cov"><div class="inst fadein" style="--d:0">Universidade do Algarve<br>Escola Superior de Gestão, Hotelaria e Turismo</div>'+
 '<h1>'+letters('Matemática I',2)+'</h1>'+
 '<div class="sub fadein" style="--d:1">Tema 1: <em>Matrizes</em> e Sistemas de Equações Lineares</div>'+
 '<div class="who fadein" style="--d:3">Paulo Carrasco<br><span>Núcleo de Métodos Quantitativos · Licenciatura em Gestão, Portimão · 2026/27</span></div></div>'});
/* ---------- roteiro ---------- */
slide({tone:'light',bloco:'A',nav:'Roteiro',title:'Roteiro',
 html:()=>hd('Cinco blocos, da tabela ao sistema','A')+'<div class="bd tight"><div class="rot stg">'+[
  ['A','Matrizes','Notação, tipos, soma e produto.','Sebenta, capítulos 1 a 3',[1,15]],
  ['B','Característica e condensação','Operações elementares e elemento redutor.','Sebenta, capítulo 4',[16,21]],
  ['C','Determinantes','Sarrus, Laplace e condensação.','Sebenta, capítulo 5',[22,29]],
  ['D','Matriz inversa','Gauss-Jordan e equações matriciais.','Sebenta, capítulos 6 e 7',[30,43]],
  ['E','Sistemas de equações','Rouché-Capelli, Gauss, parâmetros e gestão.','Sebenta, capítulos 8 a 10',[44,73]]
 ].map((c,i)=>'<div class="c" style="--d:'+i+'" data-b="'+c[0]+'"><div class="k">'+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[2]+'</p><div class="ft">Exercícios '+c[4][0]+' a '+c[4][1]+'<small>'+c[3]+'</small></div></div>').join('')+'</div></div>',
 init(el){$$('.c',el).forEach(c=>c.onclick=()=>go(SL.findIndex(s=>s.bloco===c.dataset.b&&s.tone==='dark'&&s.bg==='open')))}});
/* ===================== BLOCO A ===================== */
opener('A','Matrizes','Uma tabela de números que se deixa somar, multiplicar e inverter.',['Notação e tipos','Soma e produto por escalar','Produto de matrizes','Propriedades'],'Bloco A · capítulos 1 a 3');
/* ---- porquê matrizes ---- */
const VEND=[['Empresa A',70,72,45],['Empresa B',84,80,32],['Empresa C',67,65,39],['Empresa D',55,59,54],['Empresa E',60,63,28]];
slide({tone:'light',bloco:'A',nav:'Porquê matrizes?',title:'Porquê matrizes?',steps:3,
 html:()=>hd('Uma tabela já é uma matriz','A')+'<div class="bd tight"><div class="row" style="gap:90px;align-items:flex-start;margin-top:30px">'+
 '<div><div class="tbm" id="tbm"><div class="lab"></div>'+['Lisboa','Porto','Faro'].map(h=>'<div class="lab" style="text-align:center">'+h+'</div>').join('')+
 VEND.map((r,i)=>'<div class="lab c0">'+r[0]+'</div>'+r.slice(1).map((v,j)=>'<div class="v" data-i="'+i+'" data-j="'+j+'">'+v+'</div>').join('')).join('')+'</div>'+
 '<div class="note" style="margin-top:14px">Unidades vendidas por cinco empresas em três cidades.</div></div>'+
 '<div style="flex:1"><div class="f" data-s="1"><p class="big">Retirados os cabeçalhos, fica uma <b class="acc">matriz</b> de 5 linhas e 3 colunas: uma matriz do tipo $5\\times3$.</p></div>'+
 '<div class="f" data-s="2"><p style="margin-top:26px">Cada linha continua a ser uma empresa e cada coluna uma cidade. Agora podemos <b>operar</b> com a tabela inteira, como se fosse um só número.</p></div>'+
 '<div class="f" data-s="3"><div class="card" style="margin-top:20px;font-size:30px">Quantas unidades vendeu a empresa C em Faro?<br><b class="acc">$a_{35}$ não existe</b>: a matriz só tem 3 colunas, por isso é $a_{33}=39$.</div></div></div></div></div>',
 onStep(s){const t=$('#tbm');t.classList.toggle('m',s>=1);$$('.v',t).forEach(v=>v.classList.toggle('sel',s>=3&&v.dataset.i==='2'&&v.dataset.j==='2'))}});
/* ---- notação: explorador ---- */
slide({tone:'light',bloco:'A',nav:'Definição e notação',title:'Definição e notação',
 html:()=>hd('Cada elemento tem morada: linha e coluna','A')+'<div class="bd tight"><div class="row" style="gap:70px;align-items:flex-start;margin-top:10px">'+
 '<div><div id="cx"></div><div class="ctl" style="margin-top:30px;gap:26px"><div class="ctl"><span class="note">linhas</span><button class="ico" data-d="m-">−</button><button class="ico" data-d="m+">+</button></div><div class="ctl"><span class="note">colunas</span><button class="ico" data-d="n-">−</button><button class="ico" data-d="n+">+</button></div></div></div>'+
 '<div style="flex:1"><div class="card" style="min-height:330px"><div class="note">Elemento selecionado</div><div id="inf1" style="font-size:54px;margin:8px 0 14px"></div><div id="inf2" style="font-size:32px;line-height:1.5"></div></div>'+
 '<div class="card" style="margin-top:22px"><div class="note">Regra de formação</div><div style="font-size:40px;margin-top:6px">'+tex('a_{ij}=2i-j')+'</div></div></div></div></div>',
 init(el){
  const S={m:3,n:4,i:1,j:2};const box=$('#cx',el);
  const v=(i,j)=>2*(i+1)-(j+1);
  function draw(){
    S.i=Math.min(S.i,S.m-1);S.j=Math.min(S.j,S.n-1);
    box.className='cmx';box.style.gridTemplateColumns='repeat('+S.n+',auto)';
    let h='';for(let i=0;i<S.m;i++)for(let j=0;j<S.n;j++){const c=[i===S.i&&j===S.j?'sel':(i===S.i?'row':(j===S.j?'col':''))];h+='<div class="e '+c+'" data-i="'+i+'" data-j="'+j+'">'+num(v(i,j))+'</div>'}
    box.innerHTML=h;
    const i=S.i+1,j=S.j+1;
    $('#inf1',el).innerHTML=tex('a_{'+i+j+'}='+num(v(S.i,S.j)));
    $('#inf2',el).innerHTML='Linha <b class="acc2">'+i+'</b>, coluna <b style="color:var(--acc)">'+j+'</b>.<br>'+tex('a_{'+i+j+'}=2\\cdot'+i+(j===1?'-1':'-'+j)+'='+num(v(S.i,S.j)))+'<br>A matriz é do tipo '+tex(S.m+'\\times'+S.n)+' ('+S.m+' linhas, '+S.n+' colunas).';
  }
  box.onclick=e=>{const c=e.target.closest('.e');if(!c)return;S.i=+c.dataset.i;S.j=+c.dataset.j;draw()};
  el.onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const d=b.dataset.d;
    if(d==='m+'&&S.m<5)S.m++;if(d==='m-'&&S.m>1)S.m--;if(d==='n+'&&S.n<6)S.n++;if(d==='n-'&&S.n>1)S.n--;draw()};
  draw();}});
/* ---- tipos especiais ---- */
(function(){
 const z='\\color{#E9A537}0';
 const T=[
  ['Quadrada',pm([['1','2','3'],['4','5','6'],['7','8','9']]),'linhas = colunas ($m=n$)'],
  ['Diagonal',pm([['2',z,z],[z,'5',z],[z,z,'-1']]),'$a_{ij}=0$ se $i\\neq j$'],
  ['Identidade',pm([['1',z,z],[z,'1',z],[z,z,'1']]),'diagonal com uns: $AI=IA=A$'],
  ['Triangular superior',pm([['1','2','3'],[z,'4','5'],[z,z,'6']]),'$a_{ij}=0$ se $i>j$'],
  ['Triangular inferior',pm([['1',z,z],['2','3',z],['4','5','6']]),'$a_{ij}=0$ se $i<j$'],
  ['Simétrica',pm([['1','7','3'],['7','2','5'],['3','5','4']]),'$A=A^{\\mathsf T}$: espelhada na diagonal']];
 slide({tone:'light',bloco:'A',nav:'Tipos especiais',title:'Tipos especiais',
  html:()=>hd('Seis famílias que vamos reencontrar','A')+'<div class="bd tight"><div class="tp stg">'+T.map((t,i)=>'<div class="card" style="--d:'+i+'"><h4>'+t[0]+'</h4><div class="mx">'+tex(t[1])+'</div><div class="pr">'+rich(t[2])+'</div></div>').join('')+'</div></div>'});
})();
/* ---- soma e escalar ---- */
(function(){
 const A=[[1,0,-2],[3,1,4]],B=[[2,1,0],[-1,5,3]];
 slide({tone:'light',bloco:'A',nav:'Soma e produto por escalar',title:'Soma e escalar',steps:0,
  html:()=>hd('Soma: elemento a elemento. Escalar: tudo de uma vez','A')+'<div class="bd tight"><div class="row" style="justify-content:center;gap:30px;margin-top:14px;font-size:44px"><span id="sA">'+cm(A.map(r=>r.map(num)))+'</span><span class="math">+</span><span id="sB">'+cm(B.map(r=>r.map(num)))+'</span><span class="math">=</span><span id="sC">'+cm(A.map(r=>r.map(()=>'&nbsp;')))+'</span></div>'+
  '<div class="ctl" style="justify-content:center;margin-top:26px"><button class="btn" id="sbt">Somar o próximo elemento</button><button class="btn" id="sr">Recomeçar</button></div>'+
  '<div class="card" style="margin-top:38px;display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:center"><div><div class="note">Produto por escalar</div><div style="font-size:40px;margin-top:4px">'+tex('k=')+' <b id="kv" class="acc">2</b></div><input type="range" id="kr" min="-3" max="4" step="1" value="2" style="width:380px;margin-top:14px"></div>'+
  '<div class="row" style="justify-content:center;font-size:40px"><b class="math" id="kl" style="min-width:60px;text-align:right">2</b><span class="math">·</span><span id="kA">'+cm(A.map(r=>r.map(num)))+'</span><span class="math">=</span><span id="kC"></span></div></div></div>',
  init(el){
   let k=0;const order=[];for(let i=0;i<2;i++)for(let j=0;j<3;j++)order.push([i,j]);
   const sC=$('#sC',el);
   const cell=(w,i,j)=>$('td[data-i="'+i+'"][data-j="'+j+'"]',$(w,el));
   function reset(){k=0;sC.innerHTML=cm(A.map(r=>r.map(()=>'&nbsp;')));$$('td',el).forEach(t=>t.classList.remove('hl','hl2'))}
   function step(){if(k>=6)return false;const [i,j]=order[k];
     $$('#sA td,#sB td',el).forEach(t=>t.classList.remove('hl','hl2'));
     cell('#sA',i,j).classList.add('hl');cell('#sB',i,j).classList.add('hl');
     const t=$('td[data-i="'+i+'"][data-j="'+j+'"]',sC);t.innerHTML=num(A[i][j]+B[i][j]);t.classList.add('pop','hl2');k++;
     $('#sbt',el).textContent=k>=6?'Soma completa':'Somar o próximo elemento';return true}
   $('#sbt',el).onclick=step;$('#sr',el).onclick=reset;
   SL.find(s=>s.nav==='Soma e produto por escalar').onNext=()=>step();
   const rk=$('#kr',el);function sc(){const c=+rk.value;$('#kv',el).textContent=num(c);$('#kl',el).textContent=num(c);$('#kC',el).innerHTML=cm(A.map(r=>r.map(x=>num(c*x))))}
   rk.oninput=sc;sc();}});
})();
/* ---- produto linha por coluna ---- */
(function(){
 const A=[[1,2,0],[3,-1,4]],B=[[2,1],[0,3],[1,-1]];
 const C=A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0)));
 slide({tone:'light',bloco:'A',nav:'Produto de matrizes',title:'Produto de matrizes',
  html:()=>hd('Produto: cada elemento é linha por coluna','A')+'<div class="bd tight"><div class="row" style="justify-content:center;gap:26px;margin-top:10px;font-size:46px"><span id="pA">'+cm(A.map(r=>r.map(num)))+'</span><span id="pB">'+cm(B.map(r=>r.map(num)))+'</span><span class="math">=</span><span id="pC">'+cm(C.map(r=>r.map(()=>'&nbsp;')))+'</span></div>'+
  '<div class="card" style="margin-top:34px;min-height:230px"><div class="note" id="pn">Clique num elemento do resultado, ou use a tecla seta para a direita.</div><div id="pe" style="font-size:44px;margin-top:10px"></div><div id="pt" style="font-size:30px;margin-top:14px" class="mut"></div></div></div>',
  init(el){
   let k=-1;const done=new Set();
   function show(i,j){
     $$('#pA td,#pB td,#pC td',el).forEach(t=>t.classList.remove('hl','hl2','sel'));
     $$('#pA td[data-i="'+i+'"]',el).forEach(t=>t.classList.add('hl'));
     $$('#pB td[data-j="'+j+'"]',el).forEach(t=>t.classList.add('hl2'));
     const t=$('#pC td[data-i="'+i+'"][data-j="'+j+'"]',el);t.innerHTML=num(C[i][j]);t.classList.add('sel','pop');done.add(i+','+j);
     $('#pn',el).textContent='Linha '+(i+1)+' de A com coluna '+(j+1)+' de B:';
     $('#pe',el).innerHTML=tex('c_{'+(i+1)+(j+1)+'}='+A[i].map((x,m)=>'('+x+')\\cdot('+B[m][j]+')').join('+')+'='+C[i][j]);
     $('#pt',el).innerHTML='Multiplicam-se os elementos em pares e somam-se os resultados. O número de colunas de '+tex('A')+' (3) tem de ser igual ao número de linhas de '+tex('B')+' (3).';
   }
   $('#pC',el).onclick=e=>{const t=e.target.closest('td');if(t){k=+t.dataset.i*2+ +t.dataset.j;show(+t.dataset.i,+t.dataset.j)}};
   SL.find(s=>s.nav==='Produto de matrizes').onNext=()=>{if(k>=3)return false;k++;show(k>>1,k&1);return true};
   SL.find(s=>s.nav==='Produto de matrizes').onPrev=()=>{if(k<0)return false;
     $$('#pC td',el).forEach(t=>t.classList.remove('sel'));const t=$('#pC td[data-i="'+(k>>1)+'"][data-j="'+(k&1)+'"]',el);t.innerHTML='&nbsp;';k--;if(k>=0)show(k>>1,k&1);else{$$('#pA td,#pB td',el).forEach(t=>t.classList.remove('hl','hl2'))}return true};
  }});
})();
/* ---- propriedades ---- */
slide({tone:'light',bloco:'A',nav:'Propriedades do produto',title:'Propriedades do produto',steps:3,
 html:()=>hd('O produto não é comutativo','A')+'<div class="bd tight"><div class="g2" style="gap:60px;margin-top:10px">'+
 '<div><div class="f" data-s="0" style="opacity:1;transform:none"><div class="row" style="gap:14px;justify-content:center;margin-top:20px">'+
   '<div style="border:4px solid var(--fg);border-radius:10px;padding:18px 30px;font:700 44px KaTeX_Main">'+tex('m\\times \\color{#E5484D}{n}')+'</div><span style="font-size:50px">·</span><div style="border:4px solid var(--fg);border-radius:10px;padding:18px 30px;font:700 44px KaTeX_Main">'+tex('\\color{#E5484D}{n}\\times p')+'</div><span style="font-size:50px">=</span><div style="border:4px solid var(--acc);border-radius:10px;padding:18px 30px;font:700 44px KaTeX_Main;color:var(--acc)">'+tex('m\\times p')+'</div></div>'+
   '<p class="note" style="text-align:center;margin-top:14px">As dimensões interiores têm de coincidir; as exteriores dão o tipo do resultado.</p></div>'+
   '<div class="f" data-s="3" style="margin-top:34px"><div class="card"><b>Outras regras úteis</b><div style="font-size:32px;line-height:1.75;margin-top:6px">'+tex('(AB)C=A(BC)')+'<br>'+tex('A(B+C)=AB+AC')+'<br>'+tex('(AB)^{\\mathsf T}=B^{\\mathsf T}A^{\\mathsf T}')+'<br>'+tex('AI=IA=A')+'</div></div></div></div>'+
 '<div><div class="f" data-s="1"><div class="note">Sejam</div><div style="font-size:44px">'+tex('A='+pm([['1','2'],['0','1']])+',\\; B='+pm([['1','0'],['3','1']]))+'</div></div>'+
   '<div class="f" data-s="1" style="margin-top:20px"><div class="card"><div style="font-size:44px">'+tex('AB='+pm([['7','2'],['3','1']]))+'</div></div></div>'+
   '<div class="f" data-s="2" style="margin-top:20px"><div class="card" style="border-color:var(--red)"><div style="font-size:44px">'+tex('BA='+pm([['1','2'],['3','7']]))+'</div></div></div>'+
   '<div class="f" data-s="2" style="margin-top:20px"><div class="big"><b class="red">'+tex('AB\\neq BA')+'</b>: a ordem dos fatores altera o produto.</div></div></div></div></div>'});
/* ---- exercícios A ---- */
exSlide('Exercícios recomendados','Exercícios recomendados: matrizes','A',[1,3,5,6,8,9,11,12]);

