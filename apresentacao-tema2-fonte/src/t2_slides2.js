/* ===== Slides do Tema 2: bloco C (forma standard e método algébrico) e bloco D (Simplex) ===== */
/* ===================== BLOCO C ===================== */
opener('C','Forma standard e método algébrico','Transformar desigualdades em igualdades e procurar as soluções básicas.',['Variáveis de folga e de excesso','Soluções básicas','O método algébrico'],'Bloco C · capítulo 4');
slide({tone:'light',bloco:'C',nav:'Folgas e excessos',title:'Folgas e excessos',steps:3,
 html:()=>hd('A forma standard: só igualdades','C')+'<div class="bd tight"><div class="st3">'+
 '<div class="card f" data-s="1"><h4>Restrição $\\leq$</h4>Soma-se uma variável de <b class="acc">folga</b> $F_i\\geq0$: o que sobra do recurso.<div style="margin-top:12px">$x_1+2x_2\\leq100\\;\\to\\;x_1+2x_2+F_2=100$</div></div>'+
 '<div class="card f" data-s="1"><h4>Restrição $\\geq$</h4>Subtrai-se uma variável de <b style="color:var(--amberD)">excesso</b> $E_i\\geq0$: o que se ultrapassa o mínimo.<div style="margin-top:12px">$3x_1\\geq450\\;\\to\\;3x_1-E_2=450$</div></div>'+
 '<div class="card f" data-s="1"><h4>Restrição $=$</h4>Já é uma igualdade e fica como está. (No Simplex vai precisar de uma variável artificial, no bloco D.)</div></div>'+
 '<div class="g2 f" data-s="2" style="gap:40px;margin-top:30px;grid-template-columns:1.2fr 1fr"><div class="card" style="font-size:32px"><div class="note">Exemplo 1 na forma standard</div>'+tex('\\begin{array}{l}\\text{Maximizar } z=30x_1+20x_2+0F_1+0F_2\\\\ \\text{s.a. } 3x_1+x_2+F_1=150\\\\ \\phantom{\\text{s.a. }}x_1+2x_2+F_2=100\\\\ \\phantom{\\text{s.a. }}x_1,x_2,F_1,F_2\\geq0\\end{array}',true)+'</div>'+
 '<div class="card f" data-s="3" style="font-size:28px;line-height:1.5">As variáveis adicionais entram na função objetivo com coeficiente $0$: não dão lucro nem custo.<br><br>Em $(40,30)$: $F_1=150-150=0$ e $F_2=100-100=0$, as duas restrições estão saturadas.</div></div></div>'});
slide({tone:'light',bloco:'C',nav:'Soluções básicas',title:'Soluções básicas',steps:3,
 html:()=>hd('Soluções básicas: anular $n-m$ variáveis','C')+'<div class="bd tight"><div class="row" style="gap:46px;align-items:flex-start"><canvas id="c2" style="width:760px;height:700px"></canvas>'+
 '<div style="flex:1;font-size:28px;line-height:1.5"><div class="f" data-s="1">Na forma standard há $n=4$ incógnitas e $m=2$ equações. Anulando $n-m=2$ variáveis, sobra um sistema $2\\times2$.</div>'+
 '<div class="f card" data-s="2" style="margin-top:18px">Há $C^4_2=\\dfrac{4!}{2!\\,2!}=6$ formas de escolher as duas variáveis a anular, logo, no máximo, 6 soluções básicas.</div>'+
 '<div class="f card" data-s="3" style="margin-top:18px;border:3px solid var(--teal)">Cada solução básica é uma interseção de retas. As <b style="color:var(--green)">admissíveis</b> (tudo $\\geq0$) são os vértices do CSA; as outras ficam fora.</div></div></div></div>',
 onStep(s){const cv=$('#c2');if(!cv)return;const g=(p,ok,l)=>({p,col:ok?'#1FA57A':'#E5484D',lab:s>=3?l:'',r:9});
   plDraw(cv,{box:[110,160],tick:[20,20],cons:EX1.cons.map(k=>Object.assign({},k,{lab:''})),csa:s>=3,fs:19,pts:s>=1?[g([0,0],1,'(0, 0)'),g([50,0],1,'(50, 0)'),g([40,30],1,'(40, 30)'),g([0,50],1,'(0, 50)'),g([100,0],0,'(100, 0)'),g([0,150],0,'(0, 150)')]:[]})},
 enter(el){this.onStep(ST.step)},init(el,o){setTimeout(()=>o.onStep(ST.step),60)}});
slide({tone:'light',bloco:'C',nav:'Método algébrico',title:'Método algébrico',steps:7,
 html:()=>{const A=DATA.ALG1,R=A.rows.slice().reverse();
  return hd('O método algébrico: todas as soluções básicas','C')+'<div class="bd tight"><div class="g2" style="gap:46px;grid-template-columns:1.35fr 1fr">'+
  '<table class="mini" style="font-size:29px"><tr><th>Anuladas</th>'+A.cols.map(c=>'<th>$'+c+'$</th>').join('')+'<th>Admissível</th><th>$z$</th></tr>'+
  R.map((r,i)=>'<tr class="f'+(r.z==='1800'?' best':'')+'" data-s="'+(i+1)+'"><td>$'+r.zero.map(j=>A.cols[j]).join(',')+'$</td>'+r.vals.map((v,j)=>'<td>'+(r.zero.includes(j)?'<span class="mut">0</span>':'$'+v+'$')+'</td>').join('')+'<td class="'+(r.adm?'ok':'no')+'">'+(r.adm?'Sim':'Não')+'</td><td>'+(r.adm?'$'+r.z+'$':'×')+'</td></tr>').join('')+'</table>'+
  '<div style="font-size:28px;line-height:1.5"><div class="card">Para cada linha: anulamos duas variáveis e resolvemos o sistema que sobra. Se algum valor for negativo, a solução <b class="red">não é admissível</b>.</div>'+
  '<div class="card f" data-s="7" style="margin-top:20px;border:3px solid var(--teal)">Das quatro soluções admissíveis, a melhor é $x_1=40$, $x_2=30$, com $z^*=1800$: a mesma do gráfico.</div>'+
  '<p class="note f" data-s="7" style="margin-top:16px;font-size:24px">Nesta resolução só entram as restrições técnicas (com as folgas e os excessos), não as de sinal.</p></div></div></div>'}});
exSlide('Exercícios: forma standard','Exercícios recomendados: forma standard e método algébrico','C',[13,14,15,16]);
/* ===================== BLOCO D ===================== */
opener('D','Método do Simplex','Saltar de vértice em vértice, sempre a melhorar, até ao ótimo.',['O algoritmo','O primeiro quadro','Quem entra e quem sai','Iterar com o elemento redutor','Variáveis artificiais e M grande','Casos especiais'],'Bloco D · capítulos 5 a 7');
slide({tone:'light',bloco:'D',nav:'O algoritmo do Simplex',title:'O algoritmo',steps:6,
 html:()=>hd('O algoritmo do Simplex em seis passos','D')+'<div class="bd tight"><div class="flow">'+[
  ['1','Escrever a forma standard (folgas, excessos e, se for preciso, artificiais).'],
  ['2','As variáveis cujas colunas formam a matriz identidade são a base inicial.'],
  ['3','Entra na base a variável com o $c_j-z_j$ <b>mais positivo</b> (maximização) ou <b>mais negativo</b> (minimização).'],
  ['4','Sai a variável com o <b>menor rácio</b> $r=\\text{RHS}/a_{ij}$, só com $a_{ij}>0$.'],
  ['5','No cruzamento está o <b class="red">elemento redutor</b> (circulado). Divide-se a sua linha ($:k$ à direita) e anula-se o resto da coluna (multiplicador à esquerda).'],
  ['6','Recalcula-se $c_j-z_j$. Se ainda houver valores positivos (max) ou negativos (min), volta-se ao passo 3. Se não, a solução é ótima.']]
 .map((c,i)=>'<div class="card f" data-s="'+(i+1)+'"><b class="k">'+c[0]+'</b>'+c[1]+'</div>').join('')+'</div>'+
 '<p class="note f" data-s="6" style="margin-top:24px;font-size:25px">$z_j=\\sum c_j^b\\,a_{ij}$ (coeficientes da base vezes a coluna). O valor $c_j-z_j$ diz quanto $z$ varia por cada unidade da variável $j$ que entre na base.</p></div>'});
slide({tone:'light',bloco:'D',nav:'O primeiro quadro',title:'O primeiro quadro',steps:3,
 html:()=>hd('O primeiro quadro do Exemplo 1','D')+'<div class="bd tight"><div class="qwrap" style="margin-top:6px">'+quadroHTML(DATA.QX1[0])+'</div>'+
 '<div class="st3" style="margin-top:34px">'+
 '<div class="card f" data-s="1"><h4>Base inicial</h4>$F_1$ e $F_2$ têm as colunas da matriz identidade. Começamos em $(x_1,x_2)=(0,0)$, com $F_1=150$ e $F_2=100$.</div>'+
 '<div class="card f" data-s="2"><h4>RHS</h4>Os termos independentes são os valores das variáveis básicas. As que estão fora da base valem $0$.</div>'+
 '<div class="card f" data-s="3"><h4>$c_j-z_j$</h4>Ganho por unidade de cada variável que entre: $30$ para $x_1$, $20$ para $x_2$. Aqui $z=0$.</div></div></div>'});
slide({tone:'light',bloco:'D',nav:'Quem entra e quem sai',title:'Quem entra e quem sai',steps:3,
 html:()=>hd('Quem entra, quem sai e o elemento redutor','D')+'<div class="bd tight"><div class="qwrap" id="qes" style="margin-top:6px"></div>'+
 '<div class="st3" style="margin-top:34px">'+
 '<div class="card f" data-s="1"><h4>Entra $x_1$</h4>Maximização: o $c_j-z_j$ mais positivo é $30$, na coluna de $x_1$.</div>'+
 '<div class="card f" data-s="2"><h4>Sai $F_1$</h4>Rácios: $150/3=50$ e $100/1=100$. O menor é $50$: sai $F_1$. Mais de $50$ unidades de $x_1$ esgotariam a matéria-prima.</div>'+
 '<div class="card f" data-s="3"><h4>Elemento redutor: $3$</h4>Está no cruzamento da coluna que entra com a linha que sai. Dividimos a linha por $3$ e anulamos o $1$ da outra linha com o multiplicador $-1$.</div></div></div>',
 onStep(s){const e=$('#qes');if(e){e.innerHTML=quadroHTML(DATA.QX1[0],{entra:s>=1,ratios:s>=2,piv:s>=2,ops:s>=3});texify(e)}},enter(){this.onStep(ST.step)},init(el,o){o.onStep(0)}});
/* ---------- stepper de quadros ---------- */
function quadroStates(Q){const S=[];Q.forEach((q,k)=>{S.push({k,o:{sol:k===Q.length-1}});if(k<Q.length-1)S.push({k,o:{entra:true,ratios:true,piv:true,ops:true}})});return S}
function descQ(Q,st,sense){const q=Q[st.k],last=st.k===Q.length-1;
  if(st.o.ops){const e=q.cols[q.entra],s=q.cols[q.basis[q.sai]],p=q.rows[q.sai][q.entra];
   const mt=Object.keys(q.mult).map(i=>'$'+q.mult[i]+'$ na linha de $'+q.cols[q.basis[i]]+'$').join(' e ');
   return 'Entra $'+e+'$ ($c_j-z_j='+q.cz[q.entra]+'$, o mais '+(sense==='max'?'positivo':'negativo')+'). Sai $'+s+'$ (menor rácio, $'+q.ratios[q.sai]+'$). Elemento redutor $'+p+'$: dividimos a sua linha'+(q.div[q.sai]==='1'?' (já vale 1)':' por $'+q.div[q.sai]+'$')+(mt?'; multiplicadores '+mt+' (aplicados à linha já dividida).':'.')+(q.retira?' A variável artificial $'+q.retira+'$ sai da base e a sua coluna deixa de ser precisa.':'')}
  if(last)return 'Já não há $c_j-z_j$ '+(sense==='max'?'positivos':'negativos')+': a solução é <b class="acc">ótima</b>, com $z^*='+q.val+'$.';
  return 'Quadro '+(st.k+1)+'. Base: $'+q.basis.map(b=>q.cols[b]).join(',')+'$, com $z='+q.val+'$.'}
function mountQS(root,Q,cfg){const S=quadroStates(Q);let i=0;
  root.innerHTML='<div class="qwrap qv"></div><div class="desc" style="font-size:28px;min-height:96px;margin-top:20px;line-height:1.45"></div><div class="ctl"><button class="btn sm" data-a="p">Anterior</button><div class="dots">'+S.map((_,k)=>'<i data-k="'+k+'"></i>').join('')+'</div><button class="btn sm fill" data-a="n">Seguinte</button></div>';
  function show(n){i=Math.max(0,Math.min(S.length-1,n));const st=S[i];const v=$('.qv',root);v.innerHTML=quadroHTML(Q[st.k],Object.assign({small:cfg.small},st.o));
   $('.desc',root).innerHTML=descQ(Q,st,cfg.sense);texify($('.desc',root));$$('.dots i',root).forEach((d,k)=>{d.classList.toggle('on',k<=i);d.classList.toggle('cur',k===i)});
   texify(v);v.style.transform='none';const W=root.clientWidth,w=v.scrollWidth;if(w>W)v.style.transform='scale('+(W/w)+')';cfg.onShow&&cfg.onShow(st,i)}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-a]'),d=e.target.closest('i[data-k]');if(d)show(+d.dataset.k);else if(b)show(i+(b.dataset.a==='n'?1:-1))});
  show(0);return{next(){if(i<S.length-1){show(i+1);return true}return false},prev(){if(i>0){show(i-1);return true}return false},show,get i(){return i},S}}
slide({tone:'light',bloco:'D',nav:'Iterar até ao ótimo',title:'Iterar',
 html:()=>hd('De quadro em quadro, de vértice em vértice','D')+'<div class="bd tight"><div class="row" style="gap:40px;align-items:flex-start"><div id="qs1" style="flex:1;min-width:0"></div><canvas id="qg1" style="width:470px;height:440px;flex:none"></canvas></div></div>',
 init(el,o){const V=[[0,0],[50,0],[40,30]];
  o.api=mountQS($('#qs1',el),DATA.QX1,{sense:'max',onShow(st){const k=st.k+(st.o.ops?0:0);plDraw($('#qg1',el),Object.assign({},EX1,{fs:16,tick:[20,20],cons:EX1.cons.map(c=>Object.assign({},c,{lab:''})),pts:V.slice(0,k+1).map((p,j)=>({p,col:j===k?'#E5484D':'#5F6B7A',r:j===k?10:7,lab:j===k?'('+p.join(', ')+')':''}))}))}});
  o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
slide({tone:'light',bloco:'D',nav:'Ler o quadro ótimo',title:'Quadro ótimo',steps:3,
 html:()=>hd('Ler o quadro ótimo','D')+'<div class="bd tight"><div class="qwrap">'+quadroHTML(DATA.QX1[2],{sol:true})+'</div>'+
 '<div class="st3" style="margin-top:34px">'+
 '<div class="card f" data-s="1"><h4>A solução</h4>Na base: $x_1=40$ e $x_2=30$. Fora da base: $F_1=F_2=0$. Lucro máximo $z^*=1800$ €.</div>'+
 '<div class="card f" data-s="2"><h4>As restrições</h4>$F_1=0$ e $F_2=0$: as duas restrições estão saturadas. Não sobra matéria-prima nem horas.</div>'+
 '<div class="card f" data-s="3" style="border:3px solid var(--teal)"><h4>Valores marginais</h4>$c_j-z_j=-8$ em $F_1$: cada kg a mais de matéria-prima aumentaria o lucro em $8$ €. Em $F_2$, cada hora a mais vale $6$ €. São os <b class="acc">preços-sombra</b> (bloco E).</div></div></div>'});
slide({tone:'light',bloco:'D',nav:'Variáveis artificiais e M grande',title:'M grande',steps:3,
 html:()=>hd('Variáveis artificiais: o método do M grande','D')+'<div class="bd tight"><div class="g2" style="gap:46px;grid-template-columns:1fr 1.1fr">'+
 '<div style="font-size:28px;line-height:1.5"><div class="card">Minimizar $z=3x_1+5x_2$<br>s.a. $x_1+2x_2\\leq410$<br>$\\phantom{s.a. }3x_1\\geq450$<br>$\\phantom{s.a. }x_1+5x_2\\geq500$, $\\;x_1,x_2\\geq0$</div>'+
 '<div class="f card" data-s="1" style="margin-top:18px">Com $-E_2$ e $-E_3$ as colunas não dão a matriz identidade. Juntamos <b class="red">variáveis artificiais</b> $A_2$ e $A_3$, que só servem para arrancar.</div></div>'+
 '<div style="font-size:28px;line-height:1.5"><div class="f card" data-s="2" style="font-size:30px">'+tex('\\begin{array}{l}\\text{Min } z=3x_1+5x_2+0F_1+0E_2+0E_3+MA_2+MA_3\\\\ \\text{s.a. } x_1+2x_2+F_1=410\\\\ \\phantom{\\text{s.a. }}3x_1-E_2+A_2=450\\\\ \\phantom{\\text{s.a. }}x_1+5x_2-E_3+A_3=500\\end{array}',true)+'</div>'+
 '<div class="f card" data-s="3" style="margin-top:18px;border:3px solid var(--teal)">$M$ é um número muito grande: custo $+M$ quando se minimiza e $-M$ quando se maximiza. Assim o Simplex "expulsa" as artificiais da base. Se uma ficar na base com valor positivo no fim, o problema é <b class="red">impossível</b>.</div></div></div></div>'});
slide({tone:'light',bloco:'D',nav:'Simplex com M grande',title:'Simplex M',
 html:()=>hd('Simplex com M grande, quadro a quadro','D')+'<div class="bd tight"><div id="qs2"></div><p class="note" style="margin-top:8px;font-size:22px">Comparam-se primeiro os coeficientes de $M$: $-5M+5$ é mais negativo do que $-4M+3$.</p></div>',
 init(el,o){o.api=mountQS($('#qs2',el),DATA.QM,{sense:'min',small:true});o.onNext=()=>o.api.next();o.onPrev=()=>o.api.prev()}});
slide({tone:'light',bloco:'D',nav:'Casos especiais',title:'Casos especiais',
 html:()=>hd('Os casos especiais no quadro do Simplex','D')+'<div class="bd tight"><div class="g2 stg" style="gap:26px">'+[
  ['Ótimos múltiplos','No quadro ótimo, uma variável <b>fora da base</b> tem $c_j-z_j=0$. Fazendo-a entrar obtém-se outra solução com o mesmo $z^*$.'],
  ['Sem solução ótima','A variável que entra não tem nenhum coeficiente positivo na sua coluna: não há rácio e $z$ cresce sem limite.'],
  ['Problema impossível','Chega-se ao critério de paragem com uma variável <b>artificial na base</b> e com valor positivo.'],
  ['Solução degenerada','Uma variável básica vale $0$ (empate nos rácios). O Simplex continua normalmente.']]
 .map((c,i)=>'<div class="card" style="--d:'+i+';font-size:29px;line-height:1.45;padding:28px 32px"><h4 style="font:700 31px var(--sans);color:#1F3A5F;margin-bottom:8px">'+c[0]+'</h4>'+c[1]+'</div>').join('')+'</div></div>'});
exSlide('Exercícios: Simplex','Exercícios recomendados: método do Simplex','D',[17,18,19,20,21,22,23]);
