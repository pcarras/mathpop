/* ===== Ficha prática: o modelo input-output de Leontief =====
 * Todos os números vêm de P (src/lt_data.js), gerado e verificado em gen.py com frações exatas. */
const num=x=>String(x).replace('-','−');
function cm(rows,o={}){return '<span class="mat math"'+(o.id?' id="'+o.id+'"':'')+'><table>'+rows.map((r,i)=>'<tr>'+r.map((x,j)=>'<td data-i="'+i+'" data-j="'+j+'"'+(o.aug!==undefined&&j===o.aug?' class="aug"':'')+'>'+x+'</td>').join('')+'</tr>').join('')+'</table></span>'}
const letters=(s,d0)=>[...s].map((c,i)=>c===' '?' ':'<span class="lt" style="--d:'+(i+(d0||0))+'">'+c+'</span>').join('');
function opener(b,title,line,items,ref){
  return slide({tone:'dark',bloco:b,bg:'open',nav:title,title,
   html:'<div class="open stg"><div class="bk" style="--d:0">'+esc(ref)+'</div><h2 style="--d:1">'+title+'</h2><p style="--d:3">'+line+'</p><ul style="--d:5">'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>'});
}
/* ---------- utilitários ---------- */
const frT=s=>{const f=parseFr(s);return f.d===1?String(f.n):(f.n<0?'-':'')+'\\frac{'+Math.abs(f.n)+'}{'+f.d+'}'};
const dT=s=>String(s).replace('−','-').replace(',','{,}');
const SC=['var(--s1)','var(--s2)','var(--s3)'];
const ALERT='<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A86F12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.6v.2"/></svg>';
const CLOCK='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.6M9.5 2.8h5"/></svg>';
const onlyFirst=s=>'<div class="warn">'+ALERT+'<span>Tente primeiro sozinho. A resolução aparece passo a passo, com a tecla →.</span></div>';
/* converte os passos gerados em Python para o formato do motor (stepHTML) */
function ltSteps(p){
  const n=p.n;
  return p.steps.map((s,k)=>{
    const A=s.dec?s.A.map(r=>r.slice()):s.A.map(r=>r.map(x=>parseFr(x)));
    let nxt;
    if(s.nxt){nxt={};
      if(s.nxt.left){nxt.left={};for(const i in s.nxt.left)nxt.left[i]=parseFr(s.nxt.left[i])}
      if(s.nxt.right)nxt.right=s.nxt.right;if(s.nxt.swap)nxt.swap=s.nxt.swap;if(s.nxt.piv)nxt.piv=s.nxt.piv}
    const prev=k?p.steps[k-1].nxt||{}:{};
    const rows=new Set([...Object.keys(prev.left||{}),...Object.keys(prev.right||{}),...(prev.swap||[])].map(Number));
    const hl=new Set();rows.forEach(i=>{for(let j=0;j<2*n;j++)hl.add(i+','+j)});
    const piv=new Set();if(s.final)for(let i=0;i<n;i++)piv.add(i+','+i);
    return {desc:s.desc||'',A,nxt,hl,piv,final:!!s.final};
  });
}
/* quadro de fluxos intersetoriais */
function iot(p,o={}){
  const n=p.n;
  let h='<table class="iot'+(o.sm?' sm':'')+'"'+(o.id?' id="'+o.id+'"':'')+'><tr><th class="rh"><small>vende ↓ · compra →</small></th>'+p.names.map((nm,j)=>'<th>'+esc(o.short?p.short[j]:nm)+'</th>').join('')+'<th class="sep">Procura<br>final</th><th>Produção<br>total</th></tr>';
  for(let i=0;i<n;i++)h+='<tr><td class="rh"><span class="dot" style="background:'+SC[i]+'"></span>'+esc(o.short?p.short[i]:p.names[i])+'</td>'+p.flows[i].map((x,j)=>'<td data-i="'+i+'" data-j="'+j+'">'+x+'</td>').join('')+'<td class="sep" data-i="'+i+'" data-j="d">'+(o.hideD?'?':p.D[i])+'</td><td class="tot" data-i="'+i+'" data-j="x">'+p.X[i]+'</td></tr>';
  if(o.va)h+='<tr class="va f" data-s="'+o.va+'"><td class="rh">Valor acrescentado</td>'+p.VA.map((v,j)=>'<td data-i="v" data-j="'+j+'">'+v+'</td>').join('')+'<td class="sep"></td><td></td></tr>';
  if(o.xrow)h+='<tr><td class="rh">Produção total</td>'+p.X.map((v,j)=>'<td class="tot" data-i="x" data-j="'+j+'">'+v+'</td>').join('')+'<td class="sep"></td><td></td></tr>';
  return h+'</table>';
}
const cols=v=>'\\begin{bmatrix}'+v.join('\\\\')+'\\end{bmatrix}';
const sectorsTxt=p=>p.names.slice(0,-1).map(x=>x.toLowerCase()).join(', ')+' e '+p.names[p.n-1].toLowerCase();
/* frases dos enunciados */
function questions(p,q){
  const L=['a','b','c','d','e','f'];
  const it=[
   'Determine a matriz $A$ dos coeficientes técnicos e verifique que a economia é produtiva.',
   'Calcule a inversa de Leontief, $(I-A)^{-1}$.',
   q.c,
   'Calcule o valor acrescentado de cada setor no quadro dado.',
   q.e,
   q.f];
  return '<div class="ql">'+it.map((t,k)=>'<div><b class="k">'+L[k]+')</b><span>'+rich(t)+'</span></div>').join('')+'</div>';
}
function statement(p,ctx,q){
  if(p.n===3)return '<div class="ctx">'+rich(ctx)+'</div><div class="row" style="gap:40px;align-items:flex-end"><div style="flex:none">'+iot(p,{sm:true})+'</div><div class="unit">Valores em milhões<br>de euros (M€).</div></div><div style="margin-top:24px">'+questions(p,q).replace('class="ql"','class="ql q2"')+'</div>';
  return '<div class="ctx">'+rich(ctx)+'</div><div class="row" style="gap:50px;align-items:flex-start"><div style="flex:none">'+iot(p,{})+'<div class="unit">Valores em milhões de euros (M€).</div></div><div style="flex:1">'+questions(p,q)+'</div></div>';
}
/* cartão final do stepper */
const finL=(p,extra)=>st=>'<div class="card" style="border-color:var(--acc);display:flex;align-items:center;gap:50px;padding:12px 30px"><span class="fm">'+tex('(I-A)^{-1}='+p.tex.L)+'</span><span style="font-size:24px"><span class="note" style="font-size:22px">Verificação</span><br>'+tex(p.tex.IA+p.tex.L+'='+p.tex.I)+' <span class="ok">✓</span></span></div>';
/* slide de Gauss-Jordan (opcionalmente precedido por passos .f com a matriz A) */
function gjSlide(o){
  const p=o.p;
  return slide({tone:'light',bloco:o.bloco,nav:o.nav,title:o.nav,steps:o.pre||0,
   html:()=>hd(o.title,o.bloco)+'<div class="bd tight">'+(o.top||'')+'<div class="gjw n'+p.n+' '+(o.pre?'f':'')+'" data-s="'+(o.pre||0)+'"><div id="'+o.id+'"></div></div></div>',
   init(el,so){
    const root=$('#'+o.id,el);
    so.api=mountStepper(root,{steps:ltSteps(p),aug:p.n,fs:o.fs||44,first:o.first||'Escrevemos a matriz ampliada $[I-A\\,|\\,I]$. Queremos chegar a $[I\\,|\\,(I-A)^{-1}]$.',final:finL(p,o.finTxt),onShow:()=>texify(root)});
    texify(root);
    so.onNext=()=>{if(ST.step<(o.pre||0))return false;return so.api.next()};
    so.onPrev=()=>{if(ST.step>=(o.pre||0)&&so.api.k>0)return so.api.prev();return false};
   }});
}

/* ======================================================================= */
/* ---------- capa ---------- */
slide({tone:'dark',bloco:'A',bg:'cover',nav:'Capa',title:'Capa',
 html:'<div class="cov"><div class="inst fadein" style="--d:0">Universidade do Algarve<br>Escola Superior de Gestão, Hotelaria e Turismo</div>'+
 '<h1>'+letters('Ficha prática',2)+'</h1>'+
 '<div class="sub fadein" style="--d:1">O modelo <em>input-output</em> de Leontief</div>'+
 '<div class="who fadein" style="--d:3">Matemática I · Paulo Carrasco<br><span>Núcleo de Métodos Quantitativos · Licenciatura em Gestão, Portimão · 2026/27</span></div></div>'});
/* ---------- roteiro ---------- */
slide({tone:'light',bloco:'A',nav:'Roteiro',title:'Roteiro',
 html:()=>hd('Quatro blocos, do quadro de fluxos à decisão','A')+'<div class="bd tight"><div class="rot stg" style="grid-template-columns:repeat(4,1fr)">'+[
  ['A','O modelo','Quadro de fluxos, coeficientes técnicos, equação de Leontief e inversa.','Teoria e simulador'],
  ['B','Exemplos resolvidos','Dois setores e três setores, do quadro à interpretação.','Resolução passo a passo'],
  ['C','Exercícios','Dois exercícios para resolver em aula, com cronómetro.','Resolução detalhada'],
  ['D','Síntese','O essencial numa página e o endereço da apresentação.','Para rever em casa']
 ].map((c,i)=>'<div class="c" style="--d:'+i+';min-height:440px" data-b="'+c[0]+'"><div class="k">'+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[2]+'</p><div class="ft">'+c[3]+'</div></div>').join('')+'</div>'+
 '<p class="note" style="margin-top:34px">A ficha prática vale 20 % da nota final. Tudo o que é preciso está no Tema 1: produto de matrizes e inversa por Gauss-Jordan.</p></div>',
 init(el){$$('.c',el).forEach(c=>c.onclick=()=>go(SL.findIndex(s=>s.bloco===c.dataset.b&&s.nav!=='Roteiro'&&s.nav!=='Capa')))}});

/* ===================== BLOCO A · TEORIA ===================== */
opener('A','O modelo de Leontief','Cada setor vende aos outros e compra-lhes. Quanto tem de produzir cada um para satisfazer a procura?',['Quadro de fluxos','Coeficientes técnicos','X = AX + D','Inversa de Leontief','Valor acrescentado'],'Bloco A · teoria');
/* ---- a economia como rede ---- */
(function(){
 const p=P.T;
 const arrow=(id,d,c,val,lx,ly,s)=>'<g class="f" data-s="'+s+'"><path id="'+id+'" d="'+d+'" fill="none" stroke="'+c+'" stroke-width="5" marker-end="url(#ah'+(c===SC[0]?1:2)+')" opacity=".85"/>'+
   [0,1,2].map(k=>'<circle r="8" fill="'+c+'"><animateMotion dur="2.4s" begin="'+(k*0.8)+'s" repeatCount="indefinite"><mpath href="#'+id+'"/></animateMotion></circle>').join('')+
   '<rect x="'+(lx-38)+'" y="'+(ly-28)+'" width="76" height="46" rx="10" fill="var(--sur)" stroke="'+c+'" stroke-width="2"/><text class="lbl" x="'+lx+'" y="'+(ly+6)+'" text-anchor="middle" fill="var(--fg)">'+val+'</text></g>';
 const node=(x,y,c,nm,X)=>'<g class="nd"><circle cx="'+x+'" cy="'+y+'" r="92" fill="var(--sur)" stroke="'+c+'"/><text x="'+x+'" y="'+(y-8)+'" text-anchor="middle" style="font:700 30px var(--sans)" fill="var(--fg)">'+nm+'</text><text x="'+x+'" y="'+(y+32)+'" text-anchor="middle" style="font:400 24px var(--sans)" fill="var(--mut)">produz '+X+'</text></g>';
 const f=p.flows;
 const svg='<svg class="net" viewBox="0 0 960 720" width="960" height="720"><defs>'+
  [1,2].map(k=>'<marker id="ah'+k+'" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+SC[k-1]+'"/></marker>').join('')+'</defs>'+
  arrow('pe1','M 205 285 C 120 120, 400 120, 315 285',SC[0],f[0][0],260,150,1)+
  arrow('pa1','M 645 285 C 560 120, 840 120, 755 285',SC[1],f[1][1],700,150,1)+
  arrow('pea','M 352 330 Q 480 270 606 330',SC[0],f[0][1],480,292,1)+
  arrow('pae','M 608 392 Q 480 452 354 392',SC[1],f[1][0],480,452,1)+
  arrow('ped','M 250 452 Q 262 580 362 618',SC[0],p.D[0],262,560,2)+
  arrow('pad','M 710 452 Q 698 580 598 618',SC[1],p.D[1],698,560,2)+
  '<g class="f" data-s="2"><rect x="320" y="590" width="320" height="84" rx="18" fill="#1F3A5F"/><text x="480" y="626" text-anchor="middle" style="font:700 26px var(--sans)" fill="#fff">Procura final</text><text x="480" y="656" text-anchor="middle" style="font:400 19px var(--sans)" fill="#C9D7E6">famílias, turistas, exportações</text></g>'+
  node(260,360,SC[0],p.names[0],p.X[0])+node(700,360,SC[1],p.names[1],p.X[1])+'</svg>';
 slide({tone:'light',bloco:'A',nav:'A economia como rede',title:'A economia como rede',steps:3,
  html:()=>hd('A economia é uma rede de compras e vendas','A')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:center">'+svg+
  '<div style="flex:1;font-size:31px;line-height:1.42"><p>Uma economia com dois setores, energia e água. Cada setor <b>produz</b> e <b>vende</b> a sua produção (valores em M€).</p>'+
  '<div class="f" data-s="1"><p>Parte da produção é vendida aos <b>setores</b>, o próprio incluído: são os <b>consumos intermédios</b>. A água compra '+f[0][1]+' M€ de energia; a energia compra '+f[1][0]+' M€ de água.</p></div>'+
  '<div class="f" data-s="2"><p>O resto vai para a <b>procura final</b>: quem consome e não volta a produzir.</p></div>'+
  '<div class="f" data-s="3"><div class="card" style="font-size:27px">Wassily Leontief (Nobel da Economia em 1973) organizou estas trocas numa tabela. A pergunta do modelo: <b>quanto tem de produzir cada setor</b> para satisfazer a procura final?</div></div></div></div></div>'});
})();
/* ---- quadro de fluxos ---- */
(function(){
 const p=P.T;
 slide({tone:'light',bloco:'A',nav:'Quadro de fluxos',title:'Quadro de fluxos',steps:4,
  html:()=>hd('O quadro de fluxos intersetoriais','A')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><div style="flex:none">'+iot(p,{id:'qf'})+'<div class="unit">Valores em milhões de euros (M€).</div>'+
  '<div class="f" data-s="3" style="margin-top:30px"><div class="card" style="font-size:30px">'+tex('x_{ij}')+' = valor que o setor '+tex('j')+' <b>compra</b> ao setor '+tex('i')+'.<br><span class="mut">Linha '+tex('i')+': quem vende. Coluna '+tex('j')+': quem compra.</span></div></div></div>'+
  '<div style="flex:1;font-size:30px;line-height:1.42">'+
  '<div class="f" data-s="1"><p><b class="acc">Em linha</b>, lemos as <b>vendas</b> da energia:</p><p class="fm">'+tex(p.flows[0][0]+'+'+p.flows[0][1]+'+'+p.D[0]+'='+p.X[0])+'</p><p class="mut" style="font-size:27px">Toda a produção é vendida: aos setores ou à procura final.</p></div>'+
  '<div class="f" data-s="2"><p><b class="acc2">Em coluna</b>, lemos as <b>compras</b> da energia: '+p.flows[0][0]+' M€ a si própria e '+p.flows[1][0]+' M€ à água.</p></div>'+
  '<div class="f" data-s="3"><p>'+tex('x_{21}='+p.flows[1][0])+': a energia (setor 1) compra '+p.flows[1][0]+' M€ à água (setor 2).</p></div>'+
  '<div class="f" data-s="4"><div class="card" style="border-color:var(--acc)"><div class="note">Equilíbrio de cada linha</div><div class="fm">'+tex('X_i=x_{i1}+x_{i2}+D_i',true)+'</div><span class="note" style="font-size:24px">'+tex('X_i')+': produção total do setor '+tex('i')+'; '+tex('D_i')+': procura final.</span></div></div></div></div></div>',
  enter(){this.onStep(ST.step)},
  onStep(s){const t=$('#qf');$$('td',t).forEach(c=>c.classList.remove('hl','hl2','sel'));
   if(s===1)$$('td[data-i="0"]',t).forEach(c=>c.classList.add('hl'));
   if(s===2)$$('td[data-j="0"]',t).forEach(c=>c.classList.add('hl2'));
   if(s===3){$('td[data-i="1"][data-j="0"]',t).classList.add('sel')}
   if(s===4){$$('td[data-i]',t).forEach(c=>c.classList.add('hl'))}}});
})();
/* ---- coeficientes técnicos ---- */
(function(){
 const p=P.T,n=2;
 const frac=(a,b)=>'<span class="frac"><span>'+a+'</span><span>'+b+'</span></span>';
 slide({tone:'light',bloco:'A',nav:'Coeficientes técnicos',title:'Coeficientes técnicos',steps:5,
  html:()=>hd('Coeficientes técnicos: compras por cada euro produzido','A')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><div style="flex:none" class="cf">'+iot(p,{id:'cfq',xrow:true})+
  '<div class="row" style="margin-top:34px;gap:20px;font-size:44px"><span class="math" style="font-style:italic">A</span><span class="math">=</span>'+cm([['',''],['','']],{id:'cfA'})+'</div></div>'+
  '<div style="flex:1;font-size:30px;line-height:1.42"><div class="card" style="border-color:var(--acc)"><div class="fm">'+tex('a_{ij}=\\dfrac{x_{ij}}{X_j}',true)+'</div><div class="note" style="font-size:24px">Divide-se cada coluna pela produção total do setor que compra.</div></div>'+
  '<div class="f" data-s="1" style="margin-top:18px"><span class="fm">'+tex('a_{11}=\\frac{'+p.flows[0][0]+'}{'+p.X[0]+'}='+dT(p.A[0][0])+',\\quad a_{21}=\\frac{'+p.flows[1][0]+'}{'+p.X[0]+'}='+dT(p.A[1][0]))+'</span></div>'+
  '<div class="f" data-s="2" style="margin-top:10px"><span class="fm">'+tex('a_{12}=\\frac{'+p.flows[0][1]+'}{'+p.X[1]+'}='+dT(p.A[0][1])+',\\quad a_{22}=\\frac{'+p.flows[1][1]+'}{'+p.X[1]+'}='+dT(p.A[1][1]))+'</span></div>'+
  '<div class="f" data-s="4" style="margin-top:18px"><p>'+tex('a_{21}='+dT(p.A[1][0]))+': por cada euro que produz, a energia compra '+p.A[1][0]+'0 € de água.</p></div>'+
  '<div class="f" data-s="5"><div class="card" style="border-color:var(--green)"><b>Economia produtiva</b><br>A soma de cada coluna de '+tex('A')+' é menor do que 1:<div class="fm" style="margin:4px 0">'+tex(p.tex.colsum[0])+' &nbsp;&nbsp;&nbsp; '+tex(p.tex.colsum[1])+'</div><span class="mut" style="font-size:26px">Cada setor gasta menos de 1 € em consumos intermédios por cada euro que produz.</span></div></div></div></div></div>',
  enter(){this.onStep(ST.step)},
  onStep(s){const t=$('#cfq'),Am=$('#cfA');
   $$('td',t).forEach(c=>c.classList.remove('hl','hl2'));
   for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=$('td[data-i="'+i+'"][data-j="'+j+'"]',Am);
     const v=s>=3?num(p.A[i][j]):(s>=j+1?frac(p.flows[i][j],p.X[j]):'');if(c.innerHTML!==v){c.innerHTML=v;if(v)c.classList.add('pop')}}
   if(s===1||s===2){const j=s-1;$$('td[data-j="'+j+'"]',t).forEach(c=>c.classList.add(c.dataset.i==='x'?'hl2':'hl'))}
   $$('td',Am).forEach(c=>c.classList.toggle('hl',s===4&&c.dataset.i==='1'&&c.dataset.j==='0'));
   $$('td',Am).forEach(c=>c.classList.toggle('hl2',s===5));
  }});
})();
/* ---- equação de Leontief ---- */
(function(){
 const p=P.T;
 slide({tone:'light',bloco:'A',nav:'A equação de Leontief',title:'A equação de Leontief',steps:5,
  html:()=>hd('Da tabela à equação matricial','A')+'<div class="bd tight"><div class="row" style="gap:70px;align-items:flex-start"><div style="flex:1.15;font-size:40px;line-height:1.6">'+
  '<div class="f" data-s="1"><div class="note">Equilíbrio em linha</div>'+tex('\\left\\{\\begin{array}{l}X_1=x_{11}+x_{12}+D_1\\\\X_2=x_{21}+x_{22}+D_2\\end{array}\\right.')+'</div>'+
  '<div class="f" data-s="2" style="margin-top:14px"><div class="note">Como '+tex('x_{ij}=a_{ij}X_j')+'</div>'+tex('\\left\\{\\begin{array}{l}X_1=a_{11}X_1+a_{12}X_2+D_1\\\\X_2=a_{21}X_1+a_{22}X_2+D_2\\end{array}\\right.')+'</div>'+
  '<div class="f" data-s="3" style="margin-top:14px"><div class="note">Forma matricial</div><b class="acc">'+tex('X=AX+D')+'</b></div></div>'+
  '<div style="flex:1;font-size:40px;line-height:1.7"><div class="f" data-s="4"><div class="note">Resolver em ordem a '+tex('X')+'</div>'+tex('X-AX=D')+'<br>'+tex('(I-A)\\,X=D')+'</div>'+
  '<div class="f" data-s="5" style="margin-top:16px"><div class="card" style="border-color:var(--acc);font-size:46px">'+tex('X=(I-A)^{-1}D')+'</div>'+
  '<p class="note" style="margin-top:14px">Numa economia produtiva, '+tex('I-A')+' é invertível e '+tex('(I-A)^{-1}')+' só tem elementos não negativos. Chama-se <b>inversa de Leontief</b>.</p></div></div></div>'+
  '<div class="f" data-s="3" style="margin-top:6px"><div class="vf" style="font-size:28px"><b>Confirmação com o quadro:</b> '+tex(dT(p.A[0][0])+'\\cdot'+p.X[0]+'+'+dT(p.A[0][1])+'\\cdot'+p.X[1]+'+'+p.D[0]+'='+p.flows[0][0]+'+'+p.flows[0][1]+'+'+p.D[0]+'='+p.X[0])+'</div></div></div>'});
})();
/* ---- Gauss-Jordan (teoria) ---- */
gjSlide({p:P.T,bloco:'A',nav:'Inversa por Gauss-Jordan',id:'gjT',title:'Calcular $(I-A)^{-1}$: Gauss-Jordan sobre $[I-A\\,|\\,I]$',fs:46,
 top:'<div class="lgd"><span><i class="c">6</i>elemento redutor (circulado)</span><span><i class="m">1</i>multiplicador à esquerda: soma a linha do elemento redutor vezes esse número</span><span><i class="m">×10&nbsp;:5</i>à direita da linha</span><span><i class="m">↶</i>troca de linhas</span></div>',
 first:'Escrevemos $[I-A\\,|\\,I]$, com $A$ do quadro de fluxos. Os decimais desaparecem logo no primeiro passo.'});
/* ---- leitura da inversa ---- */
(function(){
 const p=P.T,L=p.L;
 slide({tone:'light',bloco:'A',nav:'Como se lê a inversa',title:'Como se lê a inversa',steps:4,
  html:()=>hd('Como se lê a inversa de Leontief','A')+'<div class="bd tight"><div class="row" style="gap:70px;align-items:flex-start"><div style="flex:none">'+
  '<div class="lv" id="lv"><span></span><span class="ch">+1 € de procura<br>final de energia</span><span class="ch">+1 € de procura<br>final de água</span>'+
  [0,1].map(i=>'<span class="rh">produção<br>de '+p.names[i].toLowerCase()+'</span>'+[0,1].map(j=>'<span class="e" data-i="'+i+'" data-j="'+j+'">'+tex(frT(L[i][j]))+'</span>').join('')).join('')+'</div>'+
  '<div class="note" style="margin-top:16px">'+tex('(I-A)^{-1}='+p.tex.L)+'</div></div>'+
  '<div style="flex:1;font-size:30px;line-height:1.42">'+
  '<div class="f" data-s="1"><div class="card" style="border-color:var(--acc)">O elemento '+tex('(i,j)')+' é o <b>aumento da produção do setor '+tex('i')+'</b> por cada euro adicional de procura final do setor '+tex('j')+'.</div></div>'+
  '<div class="f" data-s="2" style="margin-top:18px"><p>Coluna 2: se a procura final de água aumentar 1 €, a energia produz mais '+tex('\\tfrac{2}{3}')+' € (cerca de 0,67 €) e a água produz mais 2 €.</p></div>'+
  '<div class="f" data-s="3"><p>O elemento da diagonal é sempre pelo menos 1: o euro pedido mais o que o setor gasta em si próprio, direta e indiretamente.</p></div>'+
  '<div class="f" data-s="4"><div class="card"><b>Variação da procura final</b><div class="fm">'+tex('\\Delta X=(I-A)^{-1}\\,\\Delta D',true)+'</div><span style="font-size:27px">Se a procura de energia aumentar '+p.dD[0]+' M€: '+tex('\\Delta X='+p.dD[0]+'\\cdot'+cols([frT(L[0][0]),frT(L[1][0])])+'='+cols(p.dX))+'</span></div></div></div></div></div>',
  enter(){this.onStep(ST.step)},
  onStep(s){$$('#lv .e').forEach(e=>{e.classList.toggle('on',(s===2&&e.dataset.j==='1')||(s===4&&e.dataset.j==='0'));e.classList.toggle('on2',s===1&&e.dataset.i==='0'&&e.dataset.j==='1')})}});
})();
/* ---- valor acrescentado ---- */
(function(){
 const p=P.T,n=2,mx=Math.max(...p.X);
 const bar=j=>'<div class="r"><div class="nm">'+p.names[j]+'</div><div class="tr" data-j="'+j+'">'+[0,1].map(i=>'<div class="sg c'+(i+1)+'" data-w="'+(100*p.flows[i][j]/mx)+'" style="width:0">'+p.flows[i][j]+'</div>').join('')+'<div class="sg cv" data-w="'+(100*p.VA[j]/mx)+'" style="width:0">VA '+p.VA[j]+'</div></div><div class="tt">'+p.X[j]+'</div></div>';
 slide({tone:'light',bloco:'A',nav:'Valor acrescentado',title:'Valor acrescentado',steps:3,
  html:()=>hd('Valor acrescentado: leitura em coluna','A')+'<div class="bd tight"><div class="row" style="gap:60px;align-items:flex-start"><div style="flex:1.1">'+
  '<div class="note" style="margin-bottom:14px">Leitura em <b>coluna</b>: como cada setor gasta a sua produção</div><div class="sb" id="vabars">'+bar(0)+bar(1)+'</div>'+
  '<div class="key" style="margin-top:20px"><span><i style="background:var(--s1)"></i>compras à energia</span><span><i style="background:var(--s2)"></i>compras à água</span><span><i style="background:var(--green)"></i>valor acrescentado</span></div>'+
  '<div class="f" data-s="3" style="margin-top:30px"><div class="vf" style="font-size:29px">Valor acrescentado total '+tex(p.VA.join('+')+'='+(p.VA[0]+p.VA[1]))+' = procura final total '+tex(p.D.join('+')+'='+(p.D[0]+p.D[1]))+'.</div></div></div>'+
  '<div style="flex:1;font-size:30px;line-height:1.42"><div class="card" style="border-color:var(--acc)"><div class="fm">'+tex('VA_j=X_j-\\sum_{i}x_{ij}',true)+'</div><span class="note" style="font-size:24px">Remunera os fatores primários: salários, rendas, juros e lucros.</span></div>'+
  '<div class="f" data-s="2" style="margin-top:18px" ><div class="fm">'+tex(p.tex.VA[0])+'<br>'+tex(p.tex.VA[1])+'</div></div>'+
  '<div class="f" data-s="3" style="margin-top:14px"><p style="font-size:27px">Não é coincidência: o que a economia acrescenta é o que entrega à procura final.</p></div></div></div></div>',
  enter(){this.onStep(ST.step)},
  onStep(s){$$('#vabars .sg').forEach(g=>g.style.width=(s>=1?g.dataset.w:0)+'%')}});
})();
/* ---- simulador ---- */
(function(){
 const p=P.T,L=p.L.map(r=>r.map(parseFr));
 slide({tone:'light',bloco:'A',nav:'Simulador: dois setores',title:'Simulador',
  html:()=>hd('Simulador: mexa na procura final','A')+'<div class="bd tight sim"><div class="row" style="gap:50px;align-items:flex-start"><div style="width:620px;flex:none"><div class="card">'+
  [0,1].map(i=>'<div class="note">Procura final de '+p.names[i].toLowerCase()+' '+tex('D_'+(i+1))+' (M€)</div><div class="row" style="gap:20px;margin:4px 0 22px"><input type="range" id="sd'+i+'" min="0" max="'+(i?180:150)+'" step="'+(i?3:5)+'" value="'+p.D[i]+'"><b class="vl" id="sv'+i+'"></b></div>').join('')+
  '<div class="ctl"><button class="btn sm" id="srst">Repor o quadro inicial</button></div></div>'+
  '<div class="card" style="margin-top:22px;font-size:26px" id="sinfo"></div></div>'+
  '<div style="flex:1"><div class="fm" id="sfx" style="font-size:34px;margin-bottom:18px"></div><div class="note" style="margin-bottom:12px">Como se vende a produção de cada setor (linha)</div><div class="sb" id="sbars"></div>'+
  '<div class="key" style="margin-top:18px"><span><i style="background:#7C93AE"></i>vendas aos setores (consumos intermédios)</span><span><i style="background:#1F3A5F"></i>procura final</span></div></div></div></div>',
  init(el){
   const sd=[0,1].map(i=>$('#sd'+i,el));
   function up(){const D=sd.map(s=>new Fr(+s.value));const X=[0,1].map(i=>L[i][0].mul(D[0]).add(L[i][1].mul(D[1])));
    sd.forEach((s,i)=>$('#sv'+i,el).textContent=s.value);
    $('#sfx',el).innerHTML=tex('X=(I-A)^{-1}D='+p.tex.L+cols(D.map(d=>d.n))+'='+cols(X.map(x=>x.d===1?x.n:frT(x.n+'/'+x.d))));
    const xv=X.map(x=>x.val()),mx=420;
    const fl=[0,1].map(i=>[0,1].map(j=>parseFr(p.A[i][j].replace('−','-')).val()*xv[j]));
    $('#sbars',el).innerHTML=[0,1].map(i=>'<div class="r"><div class="nm">'+p.names[i]+'</div><div class="tr"><div class="sg ci" style="width:'+(100*(fl[i][0]+fl[i][1])/mx)+'%">'+fmt(fl[i][0]+fl[i][1])+'</div><div class="sg cd" style="width:'+(100*D[i].val()/mx)+'%">'+(D[i].val()>=18?fmt(D[i].val()):'')+'</div></div><div class="tt">'+fmt(xv[i])+'</div></div>').join('');
    const va=[0,1].map(j=>xv[j]-fl[0][j]-fl[1][j]);
    $('#sinfo',el).innerHTML='Valor acrescentado: '+p.names.map((nm,j)=>nm.toLowerCase()+' <b>'+fmt(va[j])+'</b>').join(', ')+' M€.<br><span class="mut">Cada euro a mais de procura de água faz a energia produzir mais '+tex('\\tfrac23')+' €.</span>';
   }
   const fmt=v=>(Math.round(v*10)/10).toFixed(Math.abs(v-Math.round(v))<1e-9?0:1).replace('.',',');
   sd.forEach(s=>s.oninput=up);$('#srst',el).onclick=()=>{sd.forEach((s,i)=>s.value=p.D[i]);up()};up();
  }});
})();

/* ===================== BLOCO B · EXEMPLOS RESOLVIDOS ===================== */
opener('B','Exemplos resolvidos','Do quadro de fluxos às decisões: dois casos completos, passo a passo.',['Dois setores: agricultura e indústria','Três setores: comércio, agricultura e turismo','Verificação no fim de cada exemplo'],'Bloco B · exemplos');
/* --- página de resultados (c a f + verificação) --- */
function results(o){
 const p=o.p,n=p.n,t=p.tex;
 const cC=n===2?'<div class="f card" data-s="1"><div class="h"><span class="lb">c)</span>Produção para a nova procura final</div><div class="fm" style="font-size:28px">'+tex(t.Xn_calc,true)+'</div></div>'
  :'<div class="f card" data-s="1" style="height:100%"><div class="h"><span class="lb">c)</span>Produção para a nova procura final</div><div class="fm" style="font-size:26px;line-height:1.2">'+tex(t.Xn_a)+'<div style="margin-top:12px">'+tex(t.Xn_b)+'</div></div></div>';
 const cD='<div class="f card" data-s="2"><div class="h"><span class="lb">d)</span>Valor acrescentado, coluna a coluna</div><div class="fm" style="font-size:'+(n===2?30:26)+'px;line-height:1.5">'+t.VA.map(v=>tex(v)).join('<br>')+'</div></div>';
 const cE='<div class="f card" data-s="3"><div class="h"><span class="lb">e)</span>'+rich(o.eTitle)+'</div><div class="note" style="font-size:22px">'+tex("\\Delta D="+cols(p.dD))+'&nbsp; só muda a procura do setor '+(p.dj+1)+': basta a coluna '+(p.dj+1)+' da inversa.</div><div class="fm" style="font-size:'+(n===2?28:25)+'px">'+tex(t.dX_calc)+'</div><div style="font-size:24px;margin-top:6px">'+rich(o.eTxt)+'</div></div>';
 const top=n===2?cC+'<div class="g2" style="gap:16px;grid-template-columns:.75fr 1.25fr">'+cD+cE+'</div>':'<div class="g2" style="gap:16px;grid-template-columns:1.05fr 1fr"><div>'+cC+'</div><div style="display:grid;gap:16px">'+cD+cE+'</div></div>';
 return slide({tone:'light',bloco:o.bloco,nav:o.nav,title:o.nav,steps:5,
  html:()=>hd(o.title,o.bloco)+'<div class="bd tight"><div class="rs" style="font-size:27px;gap:14px">'+(o.warn?onlyFirst():'')+top+
  '<div class="g2" style="gap:16px;grid-template-columns:1fr 1fr;align-items:stretch"><div class="f card" data-s="4" style="font-size:26px"><span class="lb">f)</span> '+rich(o.fTxt)+'</div>'+
  '<div class="f vf" data-s="5"><b>Verificação:</b> '+tex("(I-A)X'=D'")+' <span class="ok">✓</span><div class="fm" style="font-size:'+(n===2?26:23)+'px;line-height:1.55;margin-top:4px">'+t.check.map(c=>tex(c)).join('<br>')+'</div></div></div></div></div>'});
}
/* --- página da matriz A (3 setores) --- */
function aSlide(o){
 const p=o.p,t=p.tex;
 return slide({tone:'light',bloco:o.bloco,nav:o.nav,title:o.nav,steps:3,
  html:()=>hd(o.title,o.bloco)+'<div class="bd tight"><div class="rs">'+(o.warn?onlyFirst():'')+
  '<div class="f card" data-s="1"><div class="h"><span class="lb">a)</span>Dividimos cada coluna pela produção total do setor que compra</div><div class="fm">'+tex('A='+t.Afrac+'='+t.A,true)+'</div></div>'+
  '<div class="f card" data-s="2"><div class="h">Somas das colunas</div><div class="fm">'+t.colsum.map(c=>tex(c)).join(' &nbsp;&nbsp; ')+'</div><div style="margin-top:6px;font-size:28px">Todas as colunas somam menos de 1: <b>a economia é produtiva</b>.</div></div>'+
  '<div class="f card" data-s="3"><div class="h">Matriz que vamos inverter</div><div class="fm">'+tex('I-A='+t.I+'-'+t.A+'='+t.IA,true)+'</div></div></div></div>'});
}
/* --- slide com A (2 setores) e Gauss-Jordan --- */
function aGjSlide(o){
 const p=o.p,t=p.tex;
 return gjSlide({p,bloco:o.bloco,nav:o.nav,id:o.id,title:o.title,pre:3,fs:42,finTxt:o.finTxt,
  top:(o.warn?'<div style="margin-bottom:12px">'+onlyFirst()+'</div>':'')+'<div class="row" style="gap:22px;align-items:stretch;margin-bottom:14px;font-size:27px">'+
   '<div class="f card" data-s="1" style="flex:1.25;padding:12px 22px"><span class="lb">a)</span>'+tex('A='+t.Afrac+'='+t.A)+'</div>'+
   '<div class="f card" data-s="2" style="flex:1;padding:12px 22px"><div>'+t.colsum.map(c=>tex(c)).join('<br>')+'</div><div style="font-size:24px;margin-top:4px">Economia produtiva.</div></div>'+
   '<div class="f card" data-s="3" style="flex:1.1;padding:12px 22px"><span class="lb">b)</span>'+tex('I-A='+t.IA)+'</div></div>'});
}
/* ----- Exemplo 1 ----- */
slide({tone:'light',bloco:'B',nav:'Exemplo 1 · enunciado',title:'Exemplo 1',
 html:()=>hd('Exemplo 1: agricultura e indústria','B')+'<div class="bd tight">'+statement(P.B1,'Uma economia regional tem dois setores, agricultura e indústria. O quadro resume as trocas de um ano.',{c:'Que produção de cada setor é necessária para uma procura final de 80 M€ de produtos agrícolas e 200 M€ de produtos industriais?',e:'A procura final de produtos industriais aumenta 30 M€. Qual é o efeito na produção de cada setor?',f:'Interprete economicamente o elemento $(1,2)$ de $(I-A)^{-1}$.'})+'</div>'});
aGjSlide({p:P.B1,bloco:'B',nav:'Exemplo 1 · A e inversa',id:'gjB1',title:'Exemplo 1: matriz $A$ e inversa de Leontief'});
results({p:P.B1,bloco:'B',nav:'Exemplo 1 · resultados',title:'Exemplo 1: produção, valor acrescentado e impacto',
 eTitle:'Procura final da indústria $+30$ M€',eTxt:'A agricultura produz mais 15 M€ e a indústria mais 40 M€: 55 M€ no total, mais do que os 30 M€ pedidos.',
 fTxt:'O elemento $(1,2)$ é $\\tfrac{1}{2}$: por cada euro adicional de procura final de produtos industriais, a agricultura tem de produzir mais 0,50 €. A indústria compra à agricultura, direta e indiretamente.'});
/* ----- Exemplo 2 ----- */
slide({tone:'light',bloco:'B',nav:'Exemplo 2 · enunciado',title:'Exemplo 2',
 html:()=>hd('Exemplo 2: comércio, agricultura e turismo','B')+'<div class="bd tight">'+statement(P.B2,'Numa região do Algarve há três setores. O turismo não compra diretamente à agricultura: os produtos agrícolas chegam aos hotéis através do comércio.',{c:'Que produção de cada setor é necessária para uma procura final de 60 M€ de comércio, 90 M€ de agricultura e 120 M€ de turismo?',e:'A procura final do turismo aumenta 30 M€. Qual é o efeito na produção de cada setor?',f:'Interprete o elemento $(2,3)$ de $(I-A)^{-1}$ e compare-o com $a_{23}$.'})+'</div>'});
aSlide({p:P.B2,bloco:'B',nav:'Exemplo 2 · matriz A',title:'Exemplo 2: coeficientes técnicos'});
gjSlide({p:P.B2,bloco:'B',nav:'Exemplo 2 · inversa',id:'gjB2',title:'Exemplo 2: $(I-A)^{-1}$ por Gauss-Jordan',fs:40});
results({p:P.B2,bloco:'B',nav:'Exemplo 2 · resultados',title:'Exemplo 2: produção, valor acrescentado e impacto',
 eTitle:'Procura final do turismo $+30$ M€',eTxt:'Comércio $+30$, agricultura $+10$ e turismo $+60$ M€: a produção total sobe 100 M€.',
 fTxt:'O elemento $(2,3)$ é $\\tfrac{1}{3}$: cada euro adicional de procura final do turismo faz a agricultura produzir mais cerca de 0,33 €. No entanto, $a_{23}=0$: o turismo não compra diretamente à agricultura. É um **efeito indireto**, que passa pelo comércio.'});

/* ===================== BLOCO C · EXERCÍCIOS ===================== */
function exStatement(o){
 return slide({tone:'light',bloco:'C',nav:o.nav,title:o.nav,tmr:true,
  html:()=>hd(o.title,'C')+'<div class="bd tight">'+statement(o.p,o.ctx,{c:o.c,e:o.e,f:o.f})+'<div class="row" style="margin-top:26px;gap:20px"><span class="tmrnote">'+CLOCK+'15 minutos · tecla T abre o cronómetro</span><span class="note">Resolva no papel. A resolução está nos slides seguintes.</span></div></div>'});
}
/* ----- Exercício 1 ----- */
exStatement({p:P.C1,nav:'Exercício 1 · enunciado',title:'Exercício 1: construção e imobiliário',
 ctx:'Em Portimão, a construção e o imobiliário compram serviços um ao outro. O quadro resume as trocas de um ano.',c:'Que produção de cada setor é necessária para uma procura final de 90 M€ de construção e 150 M€ de imobiliário?',e:'A procura final do imobiliário aumenta 30 M€. Qual é o efeito na produção de cada setor?',f:'Interprete economicamente o elemento $(2,1)$ de $(I-A)^{-1}$.'});
aGjSlide({p:P.C1,bloco:'C',nav:'Exercício 1 · A e inversa',id:'gjC1',title:'Exercício 1: resolução de a) e b)',warn:true});
results({p:P.C1,bloco:'C',nav:'Exercício 1 · resultados',title:'Exercício 1: resolução de c) a f)',warn:true,
 eTitle:'Procura final do imobiliário $+30$ M€',eTxt:'A construção produz mais 20 M€ e o imobiliário mais 45 M€: 65 M€ no total.',
 fTxt:'O elemento $(2,1)$ é $\\tfrac{1}{2}$: por cada euro adicional de procura final da construção, o imobiliário tem de produzir mais 0,50 €.'});
/* ----- Exercício 2 ----- */
exStatement({p:P.C2,nav:'Exercício 2 · enunciado',title:'Exercício 2: três setores do turismo',
 ctx:'Uma economia turística tem três setores. Os transportes não compram serviços de animação turística.',c:'Que produção de cada setor é necessária para uma procura final de 100 M€ de transportes, 60 M€ de alojamento local e 80 M€ de animação turística?',e:'A procura final do alojamento local aumenta 40 M€. Qual é o efeito na produção de cada setor?',f:'Interprete o elemento $(3,1)$ de $(I-A)^{-1}$ e compare-o com $a_{31}$.'});
aSlide({p:P.C2,bloco:'C',nav:'Exercício 2 · matriz A',title:'Exercício 2: resolução de a)',warn:true});
gjSlide({p:P.C2,bloco:'C',nav:'Exercício 2 · inversa',id:'gjC2',title:'Exercício 2: resolução de b)',fs:40,top:'<div style="margin-bottom:10px">'+onlyFirst()+'</div>'});
results({p:P.C2,bloco:'C',nav:'Exercício 2 · resultados',title:'Exercício 2: resolução de c) a f)',warn:true,
 eTitle:'Procura final do alojamento local $+40$ M€',eTxt:'Transportes $+40$, alojamento local $+90$ e animação $+30$ M€: 160 M€ no total.',
 fTxt:'O elemento $(3,1)$ é $\\tfrac{1}{4}$: cada euro adicional de procura final de transportes faz a animação turística produzir mais 0,25 €, embora $a_{31}=0$. Os transportes compram ao alojamento local, que compra à animação: é um **efeito indireto**.'});

/* ===================== BLOCO D · FECHO ===================== */
slide({tone:'light',bloco:'D',nav:'Síntese',title:'Síntese',steps:5,
 html:()=>hd('Em resumo','D')+'<div class="bd tight"><div style="display:grid;gap:18px;margin-top:6px">'+[
  ['1','Quadro de fluxos',tex('x_{ij}')+': o setor '+tex('j')+' compra ao setor '+tex('i')+'. Em linha: '+tex('X_i=\\sum_j x_{ij}+D_i')+'.'],
  ['2','Coeficientes técnicos',tex('a_{ij}=x_{ij}/X_j')+'. Economia produtiva: cada coluna de '+tex('A')+' soma menos de 1.'],
  ['3','Equação',tex('X=AX+D\\;\\Leftrightarrow\\;(I-A)X=D\\;\\Leftrightarrow\\;X=(I-A)^{-1}D')+'.'],
  ['4','Inversa de Leontief','Por Gauss-Jordan: '+tex('[I-A\\,|\\,I]\\to[I\\,|\\,(I-A)^{-1}]')+'. O elemento '+tex('(i,j)')+' é o aumento da produção de '+tex('i')+' por 1 € de procura final de '+tex('j')+'.'],
  ['5','Impacto e valor acrescentado',tex('\\Delta X=(I-A)^{-1}\\Delta D')+' e '+tex('VA_j=X_j-\\sum_i x_{ij}')+'.']
 ].map((r,i)=>'<div class="f card" data-s="'+(i+1)+'" style="display:grid;grid-template-columns:60px 330px 1fr;align-items:center;padding:18px 30px"><b style="font:600 46px var(--serif);color:var(--acc)">'+r[0]+'</b><b style="font:700 29px var(--sans)">'+r[1]+'</b><span style="font-size:30px">'+r[2]+'</span></div>').join('')+'</div></div>'});
slide({tone:'dark',bloco:'D',bg:'cover',nav:'Fecho',title:'Fecho',
 html:()=>'<div class="cov"><div class="inst fadein" style="--d:0">Matemática I · Ficha prática</div><h1 style="font-size:190px">'+letters('Bom trabalho',1)+'</h1><div class="sub fadein" style="--d:1">Dúvidas: aulas, atendimento e esta apresentação.</div><div class="who fadein" style="--d:2">Paulo Carrasco<br><span>pcarras@ualg.pt · Núcleo de Métodos Quantitativos, ESGHT</span></div></div>'+
 '<div class="fadein" style="--d:3;position:absolute;right:160px;top:290px;width:400px;text-align:center;white-space:nowrap;margin-right:0"><div class="qrb" style="background:#fff;border-radius:22px;padding:22px">'+QR_SVG+'</div><div style="font:700 26px var(--sans);color:#D7E6F5;margin-top:22px">Esta apresentação</div><div style="font:400 19px var(--sans);color:#8FA6BF;margin-top:4px;margin-left:-40px;margin-right:-40px">matematica1-carrasco-esght.netlify.app/leontief</div></div>'});
/* ---- arranque ---- */
function boot(){
  stage=$('#stage');buildDOM();buildTimer();buildOverview();bindKeys();startBG();fitStage();addEventListener('resize',fitStage);
  const h=parseInt(location.hash.slice(1),10);go(Number.isFinite(h)&&h>0?h-1:0);
  setTimeout(()=>hint('→ avançar · ← recuar · O índice · F ecrã inteiro'),1200);
}
document.fonts.ready.then(boot);
