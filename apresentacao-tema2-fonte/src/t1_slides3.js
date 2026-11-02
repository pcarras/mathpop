/* ===== Slides: blocos D (inversa) e E (sistemas) ===== */
const fr=x=>{x=x instanceof Fr?x:new Fr(x);return x.d===1?String(x.n):(x.n<0?'-':'')+'\\frac{'+Math.abs(x.n)+'}{'+x.d+'}'};
opener('D','Matriz inversa','A matriz que desfaz o que A faz, quando existe.',['Quando existe','Gauss-Jordan','Equações matriciais'],'Bloco D · capítulos 6 e 7');
/* ---- inversa 2x2 interativa ---- */
slide({tone:'light',bloco:'D',nav:'Existência da inversa',title:'Existência da inversa',
 html:()=>hd('Uma matriz tem inversa quando o determinante não é zero','D')+'<div class="bd tight"><div class="row" style="gap:70px;align-items:flex-start"><div style="width:700px;flex:none"><div class="card"><div class="note">Escolha os elementos de '+tex('A')+'</div>'+
 [['a',2],['b',1],['c',5],['d',3]].map(([n,v])=>'<div class="row" style="gap:20px;margin-top:14px"><b style="width:40px;font:italic 400 40px KaTeX_Math">'+n+'</b><input type="range" id="i'+n+'" min="-5" max="5" step="1" value="'+v+'"><b id="v'+n+'" class="acc" style="width:70px;text-align:right;font-size:38px"></b></div>').join('')+'</div>'+
 '<div class="card" style="margin-top:24px;font-size:28px">Existe '+tex('A^{-1}')+' ⇔ '+tex('\\det(A)\\neq0')+' ⇔ '+tex('R(A)=n')+'.<br><span class="mut">Uma matriz sem inversa diz-se singular.</span></div></div>'+
 '<div style="flex:1"><div id="o1" style="font-size:52px"></div><div id="o2" style="font-size:44px;margin:16px 0"></div><div id="o3" style="font-size:50px;min-height:180px"></div><div id="o4" class="note" style="margin-top:14px"></div></div></div></div>',
 init(el){const g=n=>+$('#i'+n,el).value;function up(){const a=g('a'),b=g('b'),c=g('c'),d=g('d');['a','b','c','d'].forEach(n=>$('#v'+n,el).textContent=num(g(n)));
  const dt=a*d-b*c;$('#o1',el).innerHTML=tex('A='+pm([[a,b],[c,d]]));
  $('#o2',el).innerHTML='<b class="'+(dt?'acc':'red')+'">'+tex('\\det(A)='+a+'\\cdot'+(d<0?'('+d+')':d)+'-'+(b<0?'('+b+')':b)+'\\cdot'+(c<0?'('+c+')':c)+'='+dt)+'</b>';
  if(dt){const k=new Fr(1,dt);$('#o3',el).innerHTML=tex('A^{-1}='+(Math.abs(dt)===1?(dt<0?'-':''):'\\frac{1}{'+dt+'}')+pm([[d,-b],[-c,a]])+'='+pm([[fr(k.mul(new Fr(d))),fr(k.mul(new Fr(-b)))],[fr(k.mul(new Fr(-c))),fr(k.mul(new Fr(a)))]]));
   $('#o4',el).textContent='Troca-se a diagonal principal, muda-se o sinal da secundária e divide-se pelo determinante.'}
  else{$('#o3',el).innerHTML='<span class="tag si" style="font-size:36px">A é singular</span>';$('#o4',el).textContent='Com determinante nulo as linhas são dependentes: não existe matriz inversa.'}}
  $$('input',el).forEach(i=>i.oninput=up);up()}});
/* ---- Gauss-Jordan ---- */
slide({tone:'light',bloco:'D',nav:'Inversa por Gauss-Jordan',title:'Gauss-Jordan',
 html:()=>hd('Inversa por Gauss-Jordan: de [A | I] para [I | A⁻¹]','D')+'<div class="bd tight"><div id="sp3"></div></div>',
 init(el,o){o.api=mountStepper($('#sp3',el),{A:[[1,2,1,1,0,0],[1,3,2,0,1,0],[0,1,2,0,0,1]],mode:'rref',ncoef:3,aug:3,fs:44,
  first:'Escreve-se a matriz ampliada [A | I]. Vamos transformar o lado esquerdo na identidade.',
  final:st=>{const R=st[st.length-1].A;const inv=R.map(r=>r.slice(3).map(x=>fr(x)));return '<div class="card" style="border-color:var(--acc)">'+tex('A^{-1}='+pm(inv))+'</div>'}});
  o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
/* ---- equações matriciais ---- */
slide({tone:'light',bloco:'D',nav:'Equações matriciais',title:'Equações matriciais',steps:6,
 html:()=>hd('Equações matriciais: multiplicar do mesmo lado','D')+'<div class="bd tight"><div class="row" style="gap:70px;align-items:flex-start"><div style="flex:1.1;font-size:46px;line-height:1.9">'+
 '<div class="f" data-s="1">'+tex('AX=B')+'</div><div class="f" data-s="2">'+tex('A^{-1}\\,AX=A^{-1}\\,B')+' <span class="note">pela esquerda, nos dois membros</span></div>'+
 '<div class="f" data-s="3">'+tex('IX=A^{-1}B')+'</div><div class="f" data-s="4"><b class="acc">'+tex('X=A^{-1}B')+'</b></div></div>'+
 '<div style="flex:1;display:grid;gap:18px;font-size:34px">'+[
  ['XA=B','X=BA^{-1}','pela direita'],['AXB=C','X=A^{-1}CB^{-1}','um de cada lado'],['AX+B=C','X=A^{-1}(C-B)','isolar primeiro'],['X^{\\mathsf T}A=B','X=(BA^{-1})^{\\mathsf T}','depois transpor']
 ].map((r,i)=>'<div class="f card" data-s="5" style="padding:14px 24px;display:flex;justify-content:space-between;align-items:center"><span>'+tex(r[0])+'</span><span class="acc">'+tex(r[1])+'</span><span class="note" style="font-size:22px;width:190px;text-align:right">'+r[2]+'</span></div>').join('')+
  '<div class="f" data-s="6"><div class="card" style="border-color:var(--red)"><b class="red">Cuidado:</b> '+tex('AB\\neq BA')+', por isso '+tex('A^{-1}B')+' e '+tex('BA^{-1}')+' são resultados diferentes.</div></div></div></div></div>'});
exSlide('Exercícios recomendados','Exercícios recomendados: inversa e equações matriciais','D',[30,31,33,34,37,38,39,40,42]);
/* ===================== BLOCO E ===================== */
opener('E','Sistemas de equações lineares','Resolver, classificar e discutir: onde tudo o que vimos se junta.',['Forma matricial','Rouché-Capelli','Gauss','Parâmetros','Gestão'],'Bloco E · capítulos 8 a 10');
/* ---- forma matricial ---- */
slide({tone:'light',bloco:'E',nav:'Forma matricial',title:'Forma matricial',steps:4,
 html:()=>hd('Um sistema é uma equação entre matrizes','E')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><div style="font-size:46px;flex:none;min-width:520px"><div class="note">Sistema de 3 equações a 3 incógnitas</div>'+tex('\\left\\{\\begin{array}{rrrl}x&+y&+z&=6\\\\2x&-y&+z&=3\\\\x&+2y&-z&=2\\end{array}\\right.',true)+'</div>'+
 '<div style="flex:1;font-size:44px"><div class="f" data-s="1"><div class="note">Matriz dos coeficientes, incógnitas e termos independentes</div>'+tex('A='+pm([[1,1,1],[2,-1,1],[1,2,-1]])+',\\;X='+pm([['x'],['y'],['z']])+',\\;B='+pm([[6],[3],[2]]))+'</div>'+
 '<div class="f" data-s="2" style="margin-top:24px"><div class="note">Forma matricial</div><b class="acc">'+tex('AX=B')+'</b></div>'+
 '<div class="f" data-s="3" style="margin-top:24px"><div class="note">Matriz ampliada</div>'+tex('[A\\,|\\,B]=\\left[\\begin{array}{ccc|c}1&1&1&6\\\\2&-1&1&3\\\\1&2&-1&2\\end{array}\\right]')+'</div>'+
 '<div class="f" data-s="4" style="margin-top:24px"><div class="card" style="font-size:30px">Resolver o sistema é procurar todas as matrizes '+tex('X')+' que verificam '+tex('AX=B')+'.</div></div></div></div></div>'});
/* ---- geometria 3D ---- */
(function(){
 const SYS={
  SPD:{A:[[1,1,1,3],[1,-1,1,1],[1,1,-1,1]],txt:'Três planos que se cruzam num só ponto.'},
  SPI:{A:[[1,1,1,3],[1,-1,1,1],[2,0,2,4]],txt:'Três planos que partilham uma reta: o terceiro contém a reta comum aos outros dois.'},
  SI:{A:[[1,1,1,3],[1,-1,1,1],[2,0,2,5]],txt:'Os planos cruzam-se dois a dois, em retas paralelas, mas não há ponto comum aos três.'}};
 const COL=['#0E8797','#E9A537','#2E9E6F'];
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const LO=-1,HI=3;
 function polyPlane(n,d){ // interseção do plano com o cubo [LO,HI]^3
  const V=[];const C=[];for(let i=0;i<8;i++)C.push([i&1?HI:LO,i&2?HI:LO,i&4?HI:LO]);
  const E=[];for(let i=0;i<8;i++)for(let b=0;b<3;b++)if(!(i&(1<<b)))E.push([i,i|(1<<b)]);
  E.forEach(([i,j])=>{const p=C[i],q=C[j];const fp=dot(n,p)-d,fq=dot(n,q)-d;if(fp===0&&fq===0)return;if(fp*fq<=0&&(fp!==fq)){const t=fp/(fp-fq);const r=[0,1,2].map(k=>p[k]+t*(q[k]-p[k]));if(!V.some(v=>Math.hypot(v[0]-r[0],v[1]-r[1],v[2]-r[2])<1e-6))V.push(r)}});
  if(V.length<3)return [];
  const c=[0,1,2].map(k=>V.reduce((s,v)=>s+v[k],0)/V.length);
  const nn=n;let u=cross(nn,[1,0,0]);if(Math.hypot(...u)<1e-6)u=cross(nn,[0,1,0]);const w=cross(nn,u);
  V.sort((p,q)=>Math.atan2(dot([p[0]-c[0],p[1]-c[1],p[2]-c[2]],w),dot([p[0]-c[0],p[1]-c[1],p[2]-c[2]],u))-Math.atan2(dot([q[0]-c[0],q[1]-c[1],q[2]-c[2]],w),dot([q[0]-c[0],q[1]-c[1],q[2]-c[2]],u)));
  return V}
 function lineBox(p0,dir){let t0=-1e9,t1=1e9;for(let k=0;k<3;k++){if(Math.abs(dir[k])<1e-9){if(p0[k]<LO-1e-9||p0[k]>HI+1e-9)return null;continue}let a=(LO-p0[k])/dir[k],b=(HI-p0[k])/dir[k];if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b)}if(t0>t1)return null;return [[0,1,2].map(k=>p0[k]+t0*dir[k]),[0,1,2].map(k=>p0[k]+t1*dir[k])]}
 function pairLine(n1,d1,n2,d2){const dir=cross(n1,n2);if(Math.hypot(...dir)<1e-9)return null;
  // ponto: resolver n1.p=d1, n2.p=d2, dir.p=0
  const Am=[n1,n2,dir],b=[d1,d2,0];const det=(m)=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const D=det(Am);const p=[0,1,2].map(k=>{const m=Am.map((r,i)=>r.map((x,j)=>j===k?b[i]:x));return det(m)/D});return lineBox(p,dir)}
 slide({tone:'light',bloco:'E',nav:'Geometria: retas e planos',title:'Geometria dos sistemas',
  html:()=>hd('Geometria: cada equação é um plano','E')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><canvas id="c3" class="cv3" width="1260" height="1100" style="width:840px;height:733px"></canvas>'+
  '<div style="flex:1"><div class="ctl" id="b3"><button class="tab on" data-k="SPD">SPD</button><button class="tab" data-k="SPI">SPI</button><button class="tab" data-k="SI">SI</button></div>'+
  '<div id="s3" class="sys" style="margin:20px 0 6px"></div><div id="r3" style="margin:8px 0"></div><div id="t3" style="font-size:29px;line-height:1.4" class="mut"></div><div class="note" style="margin-top:12px">Arraste para rodar o modelo.</div></div></div></div>',
  init(el,o){
   const cv=$('#c3',el),g=cv.getContext('2d');let key='SPD',yaw=.75,pit=.52,drag=null,vel=0,raf=null;
   const PL=()=>SYS[key].A.map(r=>({n:[r[0],r[1],r[2]],d:r[3]}));
   function proj(p){const x=p[0]-1,y=p[1]-1,z=p[2]-1;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit);
    const x1=x*cy-y*sy,y1=x*sy+y*cy;const y2=y1*cp-z*sp,z2=y1*sp+z*cp;const s=1/(1+z2*.12);return [630+x1*118*s,560-(z*cp+y1*sp)*118*s*(1)+0,z2]}
   // projeção (Z para cima): x1,y1 no plano horizontal; profundidade = y1
   function P3(p){const x=p[0]-1,y=p[1]-1,z=p[2]-1;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit);
    const x1=x*cy-y*sy,y1=x*sy+y*cy;const u=x1,v=z*cp+y1*sp,dep=y1*cp-z*sp;const s=1/(1-dep*.07);return [630+u*185*s,560-v*185*s,dep]}
   function draw(){
    g.clearRect(0,0,1260,1100);const pl=PL();
    // cubo
    const cs=[];for(let i=0;i<8;i++)cs.push([i&1?HI:LO,i&2?HI:LO,i&4?HI:LO]);
    g.strokeStyle='rgba(120,140,165,.55)';g.lineWidth=2;
    [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>{const p=P3(cs[a]),q=P3(cs[b]);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()});
    // eixos
    g.lineWidth=3;[['x',[LO,LO,LO],[HI,LO,LO]],['y',[LO,LO,LO],[LO,HI,LO]],['z',[LO,LO,LO],[LO,LO,HI]]].forEach(([n,a,b])=>{const p=P3(a),q=P3(b);g.strokeStyle='rgba(90,107,128,.9)';g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();g.fillStyle='#5A6B80';g.font='italic 40px KaTeX_Math,serif';g.fillText(n,q[0]+8,q[1]-8)});
    // planos ordenados por profundidade
    const polys=pl.map((p,i)=>({i,v:polyPlane(p.n,p.d).map(P3)})).filter(o=>o.v.length>2);
    polys.sort((a,b)=>b.v.reduce((s,p)=>s+p[2],0)/b.v.length-a.v.reduce((s,p)=>s+p[2],0)/a.v.length);
    polys.forEach(o=>{g.beginPath();o.v.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=COL[o.i]+'55';g.fill();g.strokeStyle=COL[o.i];g.lineWidth=3;g.stroke()});
    // interseções
    const pairs=[[0,1],[0,2],[1,2]];
    if(key==='SPD'){g.setLineDash([10,8]);g.lineWidth=2.5;g.strokeStyle='#E5484D';pairs.forEach(([a,b])=>{const L=pairLine(pl[a].n,pl[a].d,pl[b].n,pl[b].d);if(!L)return;const p=P3(L[0]),q=P3(L[1]);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()});g.setLineDash([]);
      const c=P3([1,1,1]);g.fillStyle='#E5484D';g.beginPath();g.arc(c[0],c[1],15,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=4;g.stroke()}
    else if(key==='SPI'){const L=pairLine(pl[0].n,pl[0].d,pl[1].n,pl[1].d);const p=P3(L[0]),q=P3(L[1]);g.strokeStyle='#E5484D';g.lineWidth=9;g.lineCap='round';g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()}
    else{g.strokeStyle='#E5484D';g.lineWidth=7;g.lineCap='round';pairs.forEach(([a,b])=>{const L=pairLine(pl[a].n,pl[a].d,pl[b].n,pl[b].d);if(!L)return;const p=P3(L[0]),q=P3(L[1]);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()})}
   }
   function info(){const A=I(SYS[key].A);const c=classify(A);
    const rows=SYS[key].A.map(r=>{const t=[];['x','y','z'].forEach((v,j)=>{const a=r[j];if(a===0)return;t.push((a<0?'-':(t.length?'+':''))+(Math.abs(a)===1?'':Math.abs(a))+v)});return t.join('')+'&='+r[3]});
    $('#s3',el).innerHTML=tex('\\left\\{\\begin{array}{rl}'+rows.join('\\\\')+'\\end{array}\\right.');
    $('#r3',el).innerHTML='<span class="tag '+key.toLowerCase()+'">'+key+'</span> &nbsp;<span style="font-size:32px">'+tex('R(A)='+c.rA+',\\; R(A|B)='+c.rAB+',\\; n=3')+'</span>';
    $('#t3',el).textContent=SYS[key].txt;$$('#b3 .tab',el).forEach(b=>b.classList.toggle('on',b.dataset.k===key))}
   $('#b3',el).onclick=e=>{const b=e.target.closest('.tab');if(!b)return;key=b.dataset.k;info();draw()};
   cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
   cv.addEventListener('pointermove',e=>{if(!drag)return;const k=1/(innerWidth/1920)*.006;yaw+=(e.clientX-drag.x)*k;pit=Math.max(.05,Math.min(1.45,pit+(e.clientY-drag.y)*k));drag={x:e.clientX,y:e.clientY};draw()});
   cv.addEventListener('pointerup',()=>drag=null);
   o.enter=()=>{cancelAnimationFrame(raf);const loop=()=>{if(ST.i!==SL.indexOf(o))return;if(!drag){yaw+=.004;draw()}raf=requestAnimationFrame(loop)};loop()};
   o.leave=()=>cancelAnimationFrame(raf);
   info();draw();o.enter()}});
})();
/* ---- Rouché-Capelli ---- */
slide({tone:'light',bloco:'E',nav:'Teorema de Rouché-Capelli',title:'Rouché-Capelli',steps:5,
 html:()=>hd('Rouché-Capelli: duas características decidem tudo','E')+'<div class="bd tight"><div class="tree" style="margin-top:0">'+
 '<svg viewBox="0 0 1640 640"><g fill="none" stroke="var(--mut)" stroke-width="4" stroke-linecap="round">'+
 '<path class="f fx dr" data-s="2" pathLength="1" d="M820 120 L820 120 L420 250"/><path class="f fx dr" data-s="3" pathLength="1" d="M820 120 L1220 250"/>'+
 '<path class="f fx dr" data-s="4" pathLength="1" d="M1220 360 L960 500"/><path class="f fx dr" data-s="5" pathLength="1" d="M1220 360 L1480 500"/></g></svg>'+
 '<div class="nd q f" data-s="1" style="left:820px;top:70px;min-width:540px">'+tex('R(A)\\neq R(A\\,|\\,B)')+'?<small>comparar as duas características</small></div>'+
 '<div class="lb f" data-s="2" style="left:560px;top:160px">sim</div><div class="lb f" data-s="3" style="left:1100px;top:160px">não</div>'+
 '<div class="nd f" data-s="2" style="left:420px;top:310px;border-color:var(--red)"><span class="tag si">SI</span><small>sistema impossível,<br>sem solução</small></div>'+
 '<div class="nd q f" data-s="3" style="left:1220px;top:310px;min-width:400px">'+tex('R(A)=n')+'?<small>n = número de incógnitas</small></div>'+
 '<div class="lb f" data-s="4" style="left:1060px;top:420px">sim</div><div class="lb f" data-s="5" style="left:1400px;top:420px">não</div>'+
 '<div class="nd f" data-s="4" style="left:940px;top:560px;border-color:var(--green)"><span class="tag spd">SPD</span><small>uma única solução</small></div>'+
 '<div class="nd f" data-s="5" style="left:1470px;top:560px;border-color:var(--acc2)"><span class="tag spi">SPI</span><small>infinitas soluções<br>'+tex('GI=n-R(A)')+'</small></div>'+
 '<div class="f" data-s="1" style="position:absolute;left:0;top:0;width:520px;font-size:28px"><div class="card">Sistema <b>possível</b> quando as duas características são iguais. O <b>grau de indeterminação</b> é o número de incógnitas livres.</div></div>'+
 '</div></div>'});
/* ---- Gauss SPD ---- */
slide({tone:'light',bloco:'E',nav:'Método de Gauss',title:'Método de Gauss',
 html:()=>hd('Método de Gauss: condensar a matriz ampliada','E')+'<div class="bd tight"><div id="sp4"></div></div>',
 init(el,o){o.api=mountStepper($('#sp4',el),{A:[[1,1,1,6],[2,-1,1,3],[1,2,-1,2]],mode:'ref',ncoef:3,aug:3,fs:54,
  first:'Sistema x + y + z = 6, 2x − y + z = 3, x + 2y − z = 2. Matriz ampliada [A | B].',
  final:st=>{const A=I([[1,1,1,6],[2,-1,1,3],[1,2,-1,2]]);const c=classify(A);return '<div class="card" style="border-color:var(--acc)"><span class="tag spd">SPD</span> &nbsp; '+tex('R(A)=R(A|B)=3=n')+' &nbsp; Substituição inversa: '+solutionHTML(A)+'</div>'}});
  o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
/* ---- SPI ou SI ---- */
slide({tone:'light',bloco:'E',nav:'SPI ou SI?',title:'SPI ou SI',
 html:()=>hd('SPI ou SI? Decide o termo independente','E')+'<div class="bd tight"><div class="ctl" style="margin-bottom:6px"><span class="note">Último termo independente:</span><button class="tab on" data-b="17">b = 17</button><button class="tab" data-b="18">b = 18</button></div><div id="sp5"></div></div>',
 init(el,o){function mk(b){if(o.api)o.api.stop();o.api=mountStepper($('#sp5',el),{A:[[1,1,1,6],[2,1,3,11],[3,2,4,b]],mode:'ref',ncoef:3,aug:3,fs:50,
   first:'Nas três equações, o primeiro membro da terceira é a soma dos das duas primeiras.',
   final:st=>{const A=I([[1,1,1,6],[2,1,3,11],[3,2,4,b]]);const c=classify(A);
    return c.kind==='SI'?'<div class="card" style="border-color:var(--red)"><span class="tag si">SI</span> &nbsp; '+tex('R(A)='+c.rA+'<R(A|B)='+c.rAB)+': a última linha diz '+tex('0=1')+'. Não há solução.</div>':'<div class="card" style="border-color:var(--acc2)"><span class="tag spi">SPI</span> &nbsp; '+tex('R(A)=R(A|B)='+c.rA+'<3')+', '+tex('GI=1')+'. '+solutionHTML(A)+'</div>'}})}
  $('.ctl',el).onclick=e=>{const t=e.target.closest('.tab');if(!t)return;$$('.tab',el).forEach(x=>x.classList.toggle('on',x===t));mk(+t.dataset.b)};
  mk(17);o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
/* ---- Cramer ---- */
slide({tone:'light',bloco:'E',nav:'Regra de Cramer',title:'Regra de Cramer',steps:4,
 html:()=>hd('Regra de Cramer: só para sistemas quadrados com det ≠ 0','E')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><div style="flex:1;font-size:40px"><div class="note">Mercado: procura '+tex('q=100-8p')+' e oferta '+tex('q=-20+12p')+'</div>'+tex('\\left\\{\\begin{array}{rl}q+8p&=100\\\\q-12p&=-20\\end{array}\\right.',true)+
 '<div class="f" data-s="1">'+tex('\\det(A)='+'\\begin{vmatrix}1&8\\\\1&-12\\end{vmatrix}=-20\\neq0')+'</div>'+
 '<div class="f" data-s="2" style="margin-top:10px">'+tex('q=\\dfrac{\\begin{vmatrix}\\color{#E9A537}{100}&8\\\\\\color{#E9A537}{-20}&-12\\end{vmatrix}}{-20}=\\dfrac{-1040}{-20}=52')+'</div>'+
 '<div class="f" data-s="3" style="margin-top:10px">'+tex('p=\\dfrac{\\begin{vmatrix}1&\\color{#E9A537}{100}\\\\1&\\color{#E9A537}{-20}\\end{vmatrix}}{-20}=\\dfrac{-120}{-20}=6')+'</div></div>'+
 '<div style="width:640px;font-size:30px"><div class="f card" data-s="1"><b>Regra</b><br>'+tex('x_i=\\dfrac{\\det(A_i)}{\\det(A)}')+'<br><span class="mut" style="font-size:26px">'+tex('A_i')+' é a matriz '+tex('A')+' com a coluna '+tex('i')+' trocada por '+tex('B')+'.</span></div>'+
 '<div class="f card" data-s="4" style="margin-top:20px;border-color:var(--acc)"><b class="acc">Preço de equilíbrio 6, quantidade 52.</b><br><span class="mut">Com mais de 3 incógnitas, Gauss é bem mais rápido.</span></div></div></div></div>'});
/* ---- discussão com parâmetro ---- */
slide({tone:'light',bloco:'E',nav:'Discussão com parâmetro',title:'Discussão com parâmetro',
 html:()=>hd('Discussão: o que muda quando o parâmetro muda','E')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><div style="flex:1.1"><div class="sys" id="ds0" style="font-size:40px"></div><div class="card" style="margin-top:18px"><div class="row" style="gap:22px"><b style="font:italic 400 48px KaTeX_Math">a</b><input type="range" id="da" min="-8" max="8" step="1" value="0"><b id="dav" class="acc" style="font-size:44px;min-width:100px;text-align:right"></b></div>'+
 '<svg viewBox="0 0 800 110" style="margin-top:8px;width:100%"><line x1="40" y1="60" x2="760" y2="60" stroke="var(--mut)" stroke-width="4"/>'+[-4,-2,0,1,4].map(v=>'<g><line x1="'+(400+v*85)+'" y1="48" x2="'+(400+v*85)+'" y2="72" stroke="var(--mut)" stroke-width="3"/><text x="'+(400+v*85)+'" y="100" text-anchor="middle" font-size="26" fill="var(--mut)">'+num(v)+'</text></g>').join('')+'<circle cx="'+(400-2*85)+'" cy="60" r="11" fill="var(--red)"/><circle cx="'+(400+85)+'" cy="60" r="11" fill="var(--acc2)"/><circle id="dk" cx="400" cy="60" r="16" fill="var(--acc)" stroke="var(--sur)" stroke-width="5"/></svg></div></div>'+
 '<div style="flex:.9"><div id="dt" style="font-size:40px;margin-bottom:12px"></div><div id="de" style="font-size:36px" class="math"></div><div id="dr" style="font-size:30px;margin-top:14px;line-height:1.45"></div><div class="note" style="margin-top:10px">'+tex('\\det(A)=-(a-1)^2(a+2)')+': zero em '+tex('a=1')+' e '+tex('a=-2')+'.</div></div></div></div>',
 init(el){const r=$('#da',el);function up(){const a=new Fr(+r.value,2);$('#dav',el).textContent=a.str();$('#dk',el).setAttribute('cx',400+a.val()*85);
   const av=a.str().replace('−','-');const Ar=[[Fr.ONE,Fr.ONE,a,Fr.ONE],[Fr.ONE,a,Fr.ONE,Fr.ONE],[a,Fr.ONE,Fr.ONE,Fr.ONE]];
   const aa='('+av+')';const s=x=>x==='a'?a.str().replace('−','-'):x;
   $('#ds0',el).innerHTML=tex('\\left\\{\\begin{array}{rrrl}x&+y&+az&=1\\\\x&+ay&+z&=1\\\\ax&+y&+z&=1\\end{array}\\right.');
   const c=classify(Ar);const st=gaussSteps(Ar,'ref',3);const E=st[st.length-1];
   $('#dt',el).innerHTML='<span class="tag '+c.kind.toLowerCase()+'">'+c.kind+'</span> &nbsp;<span style="font-size:32px">'+tex('R(A)='+c.rA+',\\;R(A|B)='+c.rAB)+'</span>';
   $('#de',el).innerHTML=matHTML(E.A,{aug:3,piv:E.piv});
   $('#dr',el).innerHTML=c.kind==='SPD'?'Solução única: '+solutionHTML(Ar):c.kind==='SPI'?'Infinitas soluções, '+tex('GI='+c.grau)+': '+solutionHTML(Ar):'Sem solução: aparece uma linha '+tex('0=k')+' com '+tex('k\\neq0')+'.'}
  r.oninput=up;up()}});
/* ---- equilíbrio de mercado ---- */
slide({tone:'light',bloco:'E',nav:'Aplicação: equilíbrio de mercado',title:'Equilíbrio de mercado',
 html:()=>hd('Gestão: o equilíbrio é a solução de um sistema','E')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><svg id="mk" viewBox="0 0 860 760" width="860" height="760" style="flex:none;background:var(--sur);border:1px solid var(--bd);border-radius:22px"></svg>'+
 '<div style="flex:1"><div class="card" style="font-size:28px">'+[['D','Procura, ordenada na origem',60,140,100],['e','Procura, inclinação',4,12,8],['c','Oferta, ordenada na origem',-60,0,-20],['s','Oferta, inclinação',6,16,12]].map(([k,t,lo,hi,v])=>'<div class="row" style="gap:16px;margin-bottom:6px"><span style="width:230px;font-size:24px">'+t+'</span><input type="range" id="m'+k+'" min="'+lo+'" max="'+hi+'" value="'+v+'"><b id="mv'+k+'" class="acc" style="width:70px;text-align:right"></b></div>').join('')+'</div>'+
 '<div id="mt" style="font-size:38px;margin:18px 0"></div><div id="mr" class="card" style="font-size:30px"></div></div></div></div>',
 init(el){const g=k=>+$('#m'+k,el).value;const X0=90,Y0=620,SX=56,SY=4.6;const svg=$('#mk',el);
  function up(){const D=g('D'),e=g('e'),c=g('c'),s=g('s');['D','e','c','s'].forEach(k=>$('#mv'+k,el).textContent=num(g(k)));
   const det=-s-e;const q=(D*(-s)-e*c)/det,p=(1*c-1*D)/det; // q+ep=D ; q-sp=c
   const P=(pp,qq)=>[X0+pp*SX,Y0-qq*SY];let h='';
   for(let i=0;i<=14;i+=2){h+='<line x1="'+(X0+i*SX)+'" y1="40" x2="'+(X0+i*SX)+'" y2="'+Y0+'" stroke="var(--bd)"/><text x="'+(X0+i*SX)+'" y="'+(Y0+36)+'" text-anchor="middle" font-size="24" fill="var(--mut)">'+i+'</text>'}
   for(let j=0;j<=120;j+=20){h+='<line x1="'+X0+'" y1="'+(Y0-j*SY)+'" x2="820" y2="'+(Y0-j*SY)+'" stroke="var(--bd)"/><text x="'+(X0-14)+'" y="'+(Y0-j*SY+8)+'" text-anchor="end" font-size="24" fill="var(--mut)">'+j+'</text>'}
   h+='<text x="'+(X0+420)+'" y="'+(Y0+70)+'" text-anchor="middle" font-size="28" fill="var(--fg)">preço p</text><text x="30" y="24" font-size="28" fill="var(--fg)">quantidade q</text>';
   const seg=(f,col,lab)=>{let a=0,b=14;const qa=f(a),qb=f(b);const pts=[];for(let pp=0;pp<=14;pp+=.25){const qq=f(pp);if(qq>=0&&qq<=125)pts.push(P(pp,qq))}return '<polyline points="'+pts.map(x=>x.join(',')).join(' ')+'" fill="none" stroke="'+col+'" stroke-width="6" stroke-linecap="round"/>'};
   h+=seg(pp=>D-e*pp,'var(--teal)')+seg(pp=>c+s*pp,'var(--acc2)');
   h+='<text x="'+(X0+10)+'" y="'+(Y0-D*SY-14)+'" font-size="28" font-weight="700" fill="var(--teal)">procura</text><text x="700" y="'+(Y0-(c+s*12.2)*SY-16)+'" font-size="28" font-weight="700" fill="var(--acc2)" text-anchor="middle">oferta</text>';
   const ok=p>0&&q>0&&p<=14&&q<=125;
   if(ok){const [px,py]=P(p,q);h+='<line x1="'+px+'" y1="'+py+'" x2="'+px+'" y2="'+Y0+'" stroke="var(--red)" stroke-dasharray="8 8" stroke-width="3"/><line x1="'+px+'" y1="'+py+'" x2="'+X0+'" y2="'+py+'" stroke="var(--red)" stroke-dasharray="8 8" stroke-width="3"/><circle cx="'+px+'" cy="'+py+'" r="15" fill="var(--red)" stroke="var(--sur)" stroke-width="5"/>'}
   svg.innerHTML=h;
   $('#mt',el).innerHTML=tex('\\left\\{\\begin{array}{rl}q+'+e+'p&='+D+'\\\\q-'+s+'p&='+c+'\\end{array}\\right.');
   const f1=x=>Math.round(x*100)/100;
   $('#mr',el).innerHTML='<b class="acc">p* = '+String(f1(p)).replace('.',',')+' &nbsp; q* = '+String(f1(q)).replace('.',',')+'</b><br><span class="mut" style="font-size:25px">'+(ok?'Sistema possível e determinado: '+tex('\\det(A)='+det)+'.':'Solução sem significado económico: preço e quantidade têm de ser positivos.')+'</span>'}
  $$('input',el).forEach(i=>i.oninput=up);up()}});

