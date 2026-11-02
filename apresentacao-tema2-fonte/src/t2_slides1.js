/* ===== Slides do Tema 2: capa, roteiro, bloco A (formulação) e bloco B (resolução gráfica) ===== */
/* ---------- capa ---------- */
slide({tone:'dark',bloco:'A',bg:'cover',nav:'Capa',title:'Capa',
 html:'<div class="cov"><div class="inst fadein" style="--d:0">Universidade do Algarve<br>Escola Superior de Gestão, Hotelaria e Turismo</div>'+
 '<h1>'+letters('Matemática I',2)+'</h1>'+
 '<div class="sub fadein" style="--d:1">Tema 2: <em>Programação</em> Linear</div>'+
 '<div class="who fadein" style="--d:3">Paulo Carrasco<br><span>Núcleo de Métodos Quantitativos · Licenciatura em Gestão, Portimão · 2026/27</span></div></div>'});
/* ---------- roteiro ---------- */
slide({tone:'light',bloco:'A',nav:'Roteiro',title:'Roteiro',
 html:()=>hd('Seis blocos, do problema à decisão','A')+'<div class="bd tight"><div class="rot stg" style="grid-template-columns:repeat(3,1fr);gap:26px">'+[
  ['A','Introdução e formulação','Variáveis de decisão, função objetivo e restrições.','Sebenta, capítulos 1 e 2',[1,6]],
  ['B','Resolução gráfica','Conjunto de soluções admissíveis e retas de isolucro.','Sebenta, capítulo 3',[7,12]],
  ['C','Forma standard e método algébrico','Folgas, excessos e soluções básicas.','Sebenta, capítulo 4',[13,16]],
  ['D','Método do Simplex','Quadros, elemento redutor e M grande.','Sebenta, capítulos 5 a 7',[17,23]],
  ['E','Dualidade','O problema dual e os preços-sombra.','Sebenta, capítulo 8',[24,27]],
  ['F','Software','Excel (Solver) e Python (SciPy).','Sebenta, capítulo 9',[28,29]]
 ].map((c,i)=>'<div class="c" style="--d:'+i+';min-height:0;padding:26px 30px" data-b="'+c[0]+'"><div class="k">'+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[2]+'</p><div class="ft">Exercícios '+c[4][0]+' a '+c[4][1]+'<small>'+c[3]+'</small></div></div>').join('')+'</div></div>',
 init(el){$$('.c',el).forEach(c=>c.onclick=()=>go(SL.findIndex(s=>s.bloco===c.dataset.b&&s.tone==='dark'&&s.bg==='open')))}});
/* ===================== BLOCO A ===================== */
opener('A','Introdução e formulação','Decidir bem com recursos limitados: o que produzir, quanto, e com que resultado.',['O que é programar','A estrutura de um modelo','Formular passo a passo','Maximizar e minimizar'],'Bloco A · capítulos 1 e 2');
slide({tone:'light',bloco:'A',nav:'O que é programar?',title:'O que é programar?',steps:4,
 html:()=>hd('Programar é planear a melhor decisão','A')+'<div class="bd tight"><p class="big" style="max-width:1500px">Em <b class="acc">programação linear</b>, programar não é escrever código: é planear. Procuramos a melhor decisão num problema em que todas as relações são lineares.</p>'+
 '<div class="cyc">'+[['1','Observar','Recolher os dados e perceber que decisões estão em jogo.'],['2','Formular','Escrever o modelo: variáveis, função objetivo e restrições.'],['3','Resolver','Pelo gráfico, pelo Simplex ou por software.'],['4','Avaliar','A solução faz sentido na empresa? Se não, ajustar o modelo.']]
  .map((c,i)=>'<div class="card f" data-s="'+(i+1)+'"><div class="ic">'+c[0]+'</div><h4>'+c[1]+'</h4><p>'+c[2]+'</p></div>').join('')+'</div>'+
 '<p class="note f" data-s="4" style="margin-top:28px;font-size:26px">O processo é um ciclo: quando a realidade muda (preços, recursos, procura), volta-se à formulação.</p></div>'});
slide({tone:'light',bloco:'A',nav:'A estrutura de um modelo',title:'A estrutura de um modelo',steps:3,
 html:()=>hd('Três partes em todos os modelos','A')+'<div class="bd tight"><div class="g2" style="gap:56px;grid-template-columns:1.25fr 1fr">'+
 '<div style="display:grid;gap:22px">'+
  '<div class="card f" data-s="1" style="border-left:8px solid var(--teal)"><div class="lbl">FUNÇÃO OBJETIVO</div><div style="font-size:34px;margin-top:6px">$\\text{Maximizar (ou Minimizar) } z=c_1x_1+c_2x_2+\\dots+c_nx_n$</div><p class="mut" style="font-size:25px;margin-top:6px">O que se quer: lucro máximo, custo mínimo.</p></div>'+
  '<div class="card f" data-s="2" style="border-left:8px solid var(--amber)"><div class="lbl" style="color:var(--amberD)">RESTRIÇÕES TÉCNICAS</div><div style="font-size:34px;margin-top:6px">$a_{i1}x_1+\\dots+a_{in}x_n\\;(\\leq,\\;\\geq\\text{ ou }=)\\;b_i$</div><p class="mut" style="font-size:25px;margin-top:6px">Os limites: matéria-prima, horas, procura mínima.</p></div>'+
  '<div class="card f" data-s="3" style="border-left:8px solid #7A5CC2"><div class="lbl" style="color:#7A5CC2">RESTRIÇÕES DE SINAL</div><div style="font-size:34px;margin-top:6px">$x_1,x_2,\\dots,x_n\\geq0$</div><p class="mut" style="font-size:25px;margin-top:6px">Não se produzem quantidades negativas.</p></div></div>'+
 '<div class="card f" data-s="3" style="align-self:start"><b>As variáveis de decisão</b><p style="font-size:28px;line-height:1.5;margin-top:10px">São as quantidades que a empresa escolhe (unidades a produzir, kg a comprar). Neste tema são <b class="acc">contínuas</b> e não negativas, e resolvem-se pelo método do Simplex.</p>'+
 '<p class="mut" style="font-size:25px;line-height:1.45;margin-top:14px">Quando têm de ser inteiras ou binárias (0 ou 1) usam-se outros algoritmos, como o Branch and Bound, que ficam fora desta UC.</p></div></div></div>'});
slide({tone:'light',bloco:'A',nav:'Formular passo a passo',title:'Formular passo a passo',steps:5,
 html:()=>hd('Exemplo: dois produtos, dois recursos','A')+'<div class="bd tight"><div class="g2" style="gap:56px;grid-template-columns:1fr 1.15fr">'+
 '<div><p style="font-size:28px;line-height:1.45">Uma empresa produz semanalmente os produtos A e B com matéria-prima (kg) e horas de trabalho:</p>'+
 '<table class="mini" style="margin-top:16px;font-size:28px"><tr><th></th><th>Matéria-prima</th><th>Horas</th><th>Lucro</th></tr><tr><td><b>Produto A</b></td><td>3 kg</td><td>1 h</td><td>30 €</td></tr><tr><td><b>Produto B</b></td><td>1 kg</td><td>2 h</td><td>20 €</td></tr><tr><td><b>Disponível</b></td><td>150 kg</td><td>100 h</td><td></td></tr></table>'+
 '<p class="mut" style="font-size:25px;margin-top:16px">Quanto produzir de cada produto para ter o lucro máximo?</p></div>'+
 '<div style="display:grid;gap:14px;font-size:30px">'+
  '<div class="f card" data-s="1"><span class="lbl">1. VARIÁVEIS</span><br>$x_1$ = unidades de A, $x_2$ = unidades de B</div>'+
  '<div class="f card" data-s="2"><span class="lbl">2. FUNÇÃO OBJETIVO</span><br>$\\text{Maximizar } z=30x_1+20x_2$ (lucro total)</div>'+
  '<div class="f card" data-s="3"><span class="lbl">3. MATÉRIA-PRIMA</span><br>$3x_1+x_2\\leq150$</div>'+
  '<div class="f card" data-s="4"><span class="lbl">4. HORAS DE TRABALHO</span><br>$x_1+2x_2\\leq100$</div>'+
  '<div class="f card" data-s="5" style="border:3px solid var(--teal)"><span class="lbl">5. SINAL</span><br>$x_1,x_2\\geq0$. O modelo está completo.</div></div></div></div>'});
slide({tone:'light',bloco:'A',nav:'Maximizar e minimizar',title:'Maximizar e minimizar',steps:4,
 html:()=>hd('Minimizar também é otimizar','A')+'<div class="bd tight"><div class="g2" style="gap:56px">'+
 '<div><p style="font-size:28px;line-height:1.5">Um talho faz uma mistura de carne picada com carne de vaca (20 % de gordura, 8 €/kg) e carne de porco (32 % de gordura, 6 €/kg). A mistura não pode ter mais de 25 % de gordura. Qual é a mistura mais barata?</p>'+
 '<div class="f card" data-s="1" style="margin-top:20px;font-size:29px">$x$, $y$ = kg de vaca e de porco em cada kg de mistura</div>'+
 '<div class="f card" data-s="2" style="margin-top:14px;font-size:29px">$\\text{Minimizar } z=8x+6y$ &nbsp; sujeito a &nbsp; $0{,}2x+0{,}32y\\leq0{,}25$</div></div>'+
 '<div><div class="f card" data-s="3" style="border-color:var(--red);font-size:28px;line-height:1.45"><b class="red">Atenção.</b> Com estas restrições, o custo mínimo é $z=0$ em $x=y=0$: não fazer mistura nenhuma! Falta dizer quanto se quer produzir.</div>'+
 '<div class="f card" data-s="4" style="margin-top:18px;border:3px solid var(--teal);font-size:30px">Juntamos $x+y=1$ (um quilo de mistura):<div class="tex-d">'+tex('\\begin{array}{l}\\text{Minimizar } z=8x+6y\\\\ \\text{s.a. } 0{,}2x+0{,}32y\\leq0{,}25\\\\ \\phantom{\\text{s.a. }}x+y=1\\\\ \\phantom{\\text{s.a. }}x,y\\geq0\\end{array}',true)+'</div></div></div></div></div>'});
exSlide('Exercícios recomendados','Exercícios recomendados: formulação','A',[1,2,3,4,5,6]);
/* ===================== BLOCO B ===================== */
opener('B','Resolução gráfica','Com duas variáveis, o problema cabe num gráfico e a solução vê-se.',['Conjunto de soluções admissíveis','Retas de isolucro','Porque é que o ótimo está num vértice','Quatro cenários possíveis','Estado das restrições e alteração do lucro'],'Bloco B · capítulo 3');
(function(){
 const PTS=[['S₀',[0,0]],['S₁',[0,50]],['S₃',[10,30]],['S₄',[20,60]],['S₅',[40,30]],['S₆',[50,0]],['S₇',[60,10]],['S₈',[80,30]],['S₉',[100,0]]];
 function info(p){const a=3*p[0]+p[1],b=p[0]+2*p[1];const ok1=a<=150,ok2=b<=100;
   const t1='$3\\cdot'+p[0]+'+'+p[1]+'='+a+(a<150?'<':a===150?'=':'>')+'150$ '+(a<150?'(folga de '+(150-a)+' kg)':a===150?'(saturada)':'(não cumpre)');
   const t2='$'+p[0]+'+2\\cdot'+p[1]+'='+b+(b<100?'<':b===100?'=':'>')+'100$ '+(b<100?'(folga de '+(100-b)+' h)':b===100?'(saturada)':'(não cumpre)');
   return '<div style="font-size:28px;line-height:1.7">'+rich(t1)+'<br>'+rich(t2)+'</div><div style="margin-top:10px;font:700 30px var(--sans);color:'+(ok1&&ok2?'var(--green)':'var(--red)')+'">'+(ok1&&ok2?'Solução admissível':'Solução não admissível')+'</div>'}
 slide({tone:'light',bloco:'B',nav:'Conjunto de soluções admissíveis',title:'CSA',steps:4,
  html:()=>hd('O conjunto de soluções admissíveis','B')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><canvas id="g1" style="width:860px;height:770px"></canvas>'+
  '<div style="flex:1"><div class="f" data-s="0" style="font-size:28px;line-height:1.45">$x_1,x_2\\geq0$: só interessa o 1.º quadrante.</div>'+
  '<div class="f card" data-s="1" style="margin-top:16px;font-size:27px;border-left:7px solid #0E8797">$3x_1+x_2\\leq150$: tudo o que fica sobre a reta ou abaixo dela.</div>'+
  '<div class="f card" data-s="2" style="margin-top:12px;font-size:27px;border-left:7px solid #E9A537">$x_1+2x_2\\leq100$: o mesmo para as horas.</div>'+
  '<div class="f card" data-s="3" style="margin-top:12px;font-size:27px;border:3px solid var(--teal)">A interseção é o <b class="acc">conjunto de soluções admissíveis</b> (CSA): as combinações que cumprem todas as restrições.</div>'+
  '<div class="f card" data-s="4" style="margin-top:12px;min-height:200px"><div class="note" id="g1t">Clique num dos pontos do gráfico.</div><div id="g1i"></div></div></div></div></div>',
  init(el,o){const cv=$('#g1',el);let st=0,sel=null;
   function draw(){const cons=EX1.cons.map((k,i)=>Object.assign({},k,{off:i>=st}));
     const pts=st>=4?PTS.map(([l,p])=>({p,lab:l,col:(3*p[0]+p[1]<=150&&p[0]+2*p[1]<=100)?'#1FA57A':'#E5484D',r:sel===l?11:8})):[];
     plDraw(cv,{box:EX1.box,tick:EX1.tick,cons:cons.filter(k=>!k.off),csa:st>=3,pts});}
   o.onStep=s=>{st=s;draw()};
   cv.onclick=e=>{if(st<4)return;const r=cv.getBoundingClientRect(),k=cv.clientWidth/r.width;const mx=(e.clientX-r.left)*k,my=(e.clientY-r.top)*k;
     const m=plDraw(cv,{box:EX1.box,tick:EX1.tick,cons:EX1.cons,csa:true});let best=null,bd=1e9;
     PTS.forEach(([l,p])=>{const d=Math.hypot(m.sx(p[0])-mx,m.sy(p[1])-my);if(d<bd){bd=d;best=[l,p]}});
     if(bd<40){sel=best[0];$('#g1t',el).innerHTML='<b>'+best[0]+' = ('+best[1].join(', ')+')</b>';$('#g1i',el).innerHTML=info(best[1])}draw()};
   o.enter2=draw;setTimeout(draw,50)},enter(el,d){const o=SL.find(s=>s.title==='CSA');o.onStep(ST.step)}});
})();
(function(){
 const V=[[0,0],[50,0],[40,30],[0,50]];
 const zmax=v=>Math.max(...V.map(p=>30*p[0]+20*p[1]));
 slide({tone:'light',bloco:'B',nav:'Retas de isolucro',title:'Isolucro',
  html:()=>hd('Retas de isolucro: o lucro a deslizar','B')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><canvas id="g2" style="width:860px;height:770px"></canvas>'+
  '<div style="flex:1"><p style="font-size:28px;line-height:1.45">Cada valor de $z$ dá uma reta $30x_1+20x_2=z$. Todos os pontos dessa reta dão o mesmo lucro: é uma <b class="acc">reta de isolucro</b>.</p>'+
  '<div class="card" style="margin-top:22px"><div class="note">Lucro pretendido</div><div style="font-size:52px;margin:6px 0" id="g2z"></div><input type="range" id="g2r" min="0" max="2600" step="100" value="600" style="width:100%">'+
  '<div id="g2s" style="font-size:27px;margin-top:14px;min-height:80px"></div><div class="ctl" style="margin-top:10px"><button class="btn fill" id="g2b">Ir ao ótimo</button><button class="btn" id="g2c">Recomeçar</button></div></div>'+
  '<p class="note" style="margin-top:18px;font-size:24px">As retas são paralelas. Para maximizar, desloca-se a reta no sentido da seta até ao último ponto do CSA.</p></div></div></div>',
  init(el){const cv=$('#g2',el),rg=$('#g2r',el);
   function draw(){const z=+rg.value,ok=z<=zmax();
     $('#g2z',el).innerHTML=tex('z='+z);
     const opt=z===1800;
     plDraw(cv,Object.assign({},EX1,{z,arrow:true,pts:opt?[{p:[40,30],lab:'S* = (40, 30)',col:'#E5484D',bold:true,r:11}]:[]}));
     $('#g2s',el).innerHTML=opt?'<b class="red">Ótimo:</b> $x_1=40$, $x_2=30$ e $z^*=1800$ €. Para lá desta reta já não há soluções admissíveis.':ok?'<span style="color:var(--green);font-weight:700">Há soluções admissíveis com este lucro</span> (a reta corta o CSA).':'<span class="red" style="font-weight:700">Nenhuma solução admissível dá este lucro.</span>';texify($('#g2s',el))}
   rg.oninput=draw;$('#g2b',el).onclick=()=>{rg.value=1800;draw()};$('#g2c',el).onclick=()=>{rg.value=600;draw()};setTimeout(draw,50)}});
 slide({tone:'light',bloco:'B',nav:'Porque é que o ótimo está num vértice',title:'Vértices',steps:3,
  html:()=>hd('O ótimo está sempre num vértice','B')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><canvas id="g3" style="width:800px;height:720px"></canvas>'+
  '<div style="flex:1"><table class="mini" style="font-size:29px"><tr><th>Vértice</th><th>$(x_1,x_2)$</th><th>$z=30x_1+20x_2$</th></tr>'+
  [['A','(0, 0)','0'],['B','(50, 0)','1500'],['C','(40, 30)','1800'],['D','(0, 50)','1000']].map((r,i)=>'<tr class="f'+(i===2?' best':'')+'" data-s="1"><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</table>'+
  '<div class="f card" data-s="2" style="margin-top:24px;font-size:27px;line-height:1.45">O CSA é um <b class="acc">polígono convexo</b>: o segmento entre dois dos seus pontos fica todo dentro dele. Com uma função objetivo linear, o ótimo (se existir) está num vértice.</div>'+
  '<div class="f card" data-s="3" style="margin-top:16px;font-size:27px;line-height:1.45;border:3px solid var(--teal)">Basta comparar os vértices: o ótimo é $C=(40,30)$, com $z^*=1800$. É esta ideia que o método do Simplex aproveita.</div></div></div></div>',
  onStep(s){const cv=$('#g3');plDraw(cv,Object.assign({},EX1,{pts:[{p:[0,0],lab:'A',dx:10,dy:-12},{p:[50,0],lab:'B',dx:6,dy:-14},{p:[40,30],lab:'C',col:s>=3?'#E5484D':'#14263A',bold:true},{p:[0,50],lab:'D',dx:12,dy:-8}],z:s>=3?1800:null}))},
  init(el,o){setTimeout(()=>o.onStep(0),50)}});
})();
(function(){
 const SC=[
  {t:'Ótimo único',p:'O declive da função objetivo é diferente dos lados do CSA.',cfg:{box:[110,110],tick:[50,50],cons:[{a:[3,1],r:'<=',b:150},{a:[1,2],r:'<=',b:100}],c:[30,20],z:1800,pts:[{p:[40,30],col:'#E5484D',r:9}]}},
  {t:'Ótimos múltiplos',p:'A função objetivo é paralela a um lado do CSA: todo o segmento é ótimo.',cfg:{box:[10,10],tick:[5,5],cons:[{a:[1,2],r:'<=',b:8},{a:[1,0],r:'<=',b:6}],c:[2,4],z:16,pts:[{p:[0,4],col:'#E5484D',r:9},{p:[6,1],col:'#E5484D',r:9}]}},
  {t:'Sem solução ótima',p:'O CSA é ilimitado no sentido em que $z$ cresce: $z$ pode ser tão grande quanto se queira.',cfg:{box:[10,10],tick:[5,5],cons:[{a:[1,-1],r:'<=',b:2},{a:[1,0],r:'>=',b:1}],c:[1,1],z:9,arrow:true}},
  {t:'Problema impossível',p:'As restrições não têm pontos comuns: o CSA é vazio.',cfg:{box:[8,8],tick:[2,2],cons:[{a:[1,1],r:'<=',b:2},{a:[1,2],r:'>=',b:6}],csa:false}}];
 slide({tone:'light',bloco:'B',nav:'Quatro cenários possíveis',title:'Cenários',
  html:()=>hd('Quatro cenários possíveis','B')+'<div class="bd tight"><div class="sc4 stg">'+SC.map((s,i)=>'<div class="card" style="--d:'+i+'"><canvas id="sc'+i+'"></canvas><h4>'+s.t+'</h4><p>'+rich(s.p)+'</p></div>').join('')+'</div>'+
  '<p class="note" style="margin-top:20px;font-size:24px">Com um CSA ilimitado, um problema de <b>minimização</b> pode ter ótimo. Os sinais destes casos no quadro do Simplex aparecem no bloco D.</p></div>',
  init(el){setTimeout(()=>SC.forEach((s,i)=>{const cv=$('#sc'+i,el);const cfg=Object.assign({fs:17,arrow:true},s.cfg);
    if(i===3){cfg.cons=[{a:[1,1],r:'<=',b:2,col:'#0E8797'},{a:[1,2],r:'>=',b:6,col:'#E9A537'}];const m=plDraw(cv,cfg);const g=cv.getContext('2d');
      g.fillStyle='rgba(14,135,151,.18)';g.beginPath();g.moveTo(m.sx(0),m.sy(0));g.lineTo(m.sx(2),m.sy(0));g.lineTo(m.sx(0),m.sy(2));g.fill();
      g.fillStyle='rgba(233,165,55,.18)';g.beginPath();g.moveTo(m.sx(0),m.sy(3));g.lineTo(m.sx(6),m.sy(0));g.lineTo(m.sx(8),m.sy(0));g.lineTo(m.sx(8),m.sy(8));g.lineTo(m.sx(0),m.sy(8));g.fill();return}
    plDraw(cv,cfg);if(i===1){const m=plDraw(cv,cfg),g=cv.getContext('2d');g.strokeStyle='#E5484D';g.lineWidth=7;g.beginPath();g.moveTo(m.sx(0),m.sy(4));g.lineTo(m.sx(6),m.sy(1));g.stroke();
      (cfg.pts||[]).forEach(p=>{g.beginPath();g.arc(m.sx(p.p[0]),m.sy(p.p[1]),9,0,7);g.fillStyle='#E5484D';g.fill()})}}),60)}});
})();
slide({tone:'light',bloco:'B',nav:'Estado das restrições',title:'Estado das restrições',steps:2,
 html:()=>hd('Saturada ou não saturada?','B')+'<div class="bd tight"><p style="font-size:28px;line-height:1.45">Na solução ótima, uma restrição está <b class="acc">saturada</b> se se verifica com igualdade (o recurso esgota-se). Se não, está <b>não saturada</b> e há <b>folga</b> (em $\\leq$) ou <b>excesso</b> (em $\\geq$).</p>'+
 '<div class="g2" style="gap:40px;margin-top:22px">'+
 '<div class="card f" data-s="1"><b>Exemplo 1, em $(40,30)$</b><table class="mini" style="margin-top:12px;font-size:26px"><tr><th>Restrição</th><th>Valor</th><th>Estado</th></tr>'+
  '<tr><td>$3x_1+x_2\\leq150$</td><td>$150$</td><td class="ok">saturada</td></tr><tr><td>$x_1+2x_2\\leq100$</td><td>$100$</td><td class="ok">saturada</td></tr></table>'+
  '<p class="mut" style="font-size:24px;margin-top:10px">Usa-se toda a matéria-prima e todas as horas.</p></div>'+
 '<div class="card f" data-s="2"><b>Banheiras (exercício 9), em $(40,20)$</b><table class="mini" style="margin-top:12px;font-size:26px"><tr><th>Restrição</th><th>Valor</th><th>Estado</th></tr>'+
  '<tr><td>fabrico $x_1+x_2\\leq90$</td><td>$60$</td><td>folga de 30 h</td></tr><tr><td>acabamento $x_1+2x_2\\geq80$</td><td>$80$</td><td class="ok">saturada</td></tr>'+
  '<tr><td>$x_1\\geq40$</td><td>$40$</td><td class="ok">saturada</td></tr><tr><td>$x_1\\leq60$</td><td>$40$</td><td>folga de 20</td></tr></table></div></div></div>'});
(function(){
 const V=[[0,0],[50,0],[40,30],[0,50]];
 slide({tone:'light',bloco:'B',nav:'E se o lucro mudar?',title:'Alterar o lucro',
  html:()=>hd('E se o lucro unitário de A mudar?','B')+'<div class="bd tight"><div class="row" style="gap:50px;align-items:flex-start"><canvas id="g5" style="width:820px;height:740px"></canvas>'+
  '<div style="flex:1"><div class="card"><div class="note">Lucro unitário de A (o de B fica em 20 €)</div><div style="font-size:48px;margin:6px 0" id="g5c"></div><input type="range" id="g5r" min="0" max="90" step="5" value="30" style="width:100%"></div>'+
  '<div class="card" style="margin-top:18px;font-size:28px;line-height:1.5;min-height:180px" id="g5s"></div>'+
  '<div class="card" style="margin-top:18px;font-size:26px;line-height:1.45;border:3px solid var(--teal)">No ótimo $(40,30)$ cruzam-se as retas de declive $-3$ e $-\\tfrac12$. A solução mantém-se enquanto o declive da função objetivo, $-\\tfrac{c_1}{20}$, ficar entre eles: $\\tfrac12\\leq\\tfrac{c_1}{20}\\leq3$, ou seja $\\mathbf{10\\leq c_1\\leq60}$.</div></div></div></div>',
  init(el){const cv=$('#g5',el),rg=$('#g5r',el);
   function draw(){const c1=+rg.value;const zs=V.map(p=>c1*p[0]+20*p[1]);const zm=Math.max(...zs);const best=V.filter((p,i)=>zs[i]===zm);
     $('#g5c',el).innerHTML=tex('c_1='+c1+'\\text{ €}');
     plDraw(cv,Object.assign({},EX1,{c:[c1,20],z:zm,arrow:true,pts:best.map(p=>({p,col:'#E5484D',r:11,lab:'('+p.join(', ')+')',bold:true}))}));
     $('#g5s',el).innerHTML=(best.length>1?'<b class="red">Ótimos múltiplos:</b> a reta é paralela a um lado do CSA; todo o segmento entre '+best.map(p=>'('+p.join(', ')+')').join(' e ')+' é ótimo.':'Ótimo em <b class="acc">('+best[0].join(', ')+')</b>.')+'<br>$z^*='+c1+'x_1+20x_2='+zm+'$ €'+(c1>=10&&c1<=60&&best.length===1&&best[0][0]===40?'. A solução não mudou.':'');texify($('#g5s',el))}
   rg.oninput=draw;setTimeout(draw,50)}});
})();
exSlide('Exercícios: gráfico','Exercícios recomendados: resolução gráfica','B',[7,8,9,10,11,12]);
