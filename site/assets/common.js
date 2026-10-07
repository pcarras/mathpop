/* Biblioteca comum dos applets de Matemática I (Tema 1). JS puro, sem dependências. */
'use strict';
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a};
class Fr{
  constructor(n,d=1){if(d===0)throw new Error('div0');if(d<0){n=-n;d=-d}const g=gcd(n,d)||1;this.n=n/g;this.d=d/g}
  add(o){return new Fr(this.n*o.d+o.n*this.d,this.d*o.d)}
  sub(o){return new Fr(this.n*o.d-o.n*this.d,this.d*o.d)}
  mul(o){return new Fr(this.n*o.n,this.d*o.d)}
  div(o){return new Fr(this.n*o.d,this.d*o.n)}
  neg(){return new Fr(-this.n,this.d)}
  isZero(){return this.n===0}
  isOne(){return this.n===1&&this.d===1}
  eq(o){return this.n===o.n&&this.d===o.d}
  val(){return this.n/this.d}
  str(){return this.d===1?String(this.n).replace('-','−'):(this.n<0?'−':'')+Math.abs(this.n)+'/'+this.d}
  html(){if(this.d===1)return String(this.n).replace('-','−');return (this.n<0?'−':'')+'<span class="frac"><span>'+Math.abs(this.n)+'</span><span>'+this.d+'</span></span>'}
}
Fr.ZERO=new Fr(0);Fr.ONE=new Fr(1);
/* converte texto ("3", "-2", "1/2", "0,75") em Fr; devolve null se inválido */
function parseFr(s){
  s=String(s).trim().replace(',','.').replace('−','-');
  if(s==='')return null;
  let m=s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if(m){const d=parseInt(m[2],10);if(d===0)return null;return new Fr(parseInt(m[1],10),d)}
  m=s.match(/^-?\d+(\.\d+)?$/);
  if(!m)return null;
  const dec=(m[1]||'').length-(m[1]?1:0);
  const sc=Math.pow(10,dec);
  return new Fr(Math.round(parseFloat(s)*sc),sc);
}
const M={
  clone:A=>A.map(r=>r.slice()),
  zeros:(m,n)=>Array.from({length:m},()=>Array.from({length:n},()=>Fr.ZERO)),
  ident:n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?Fr.ONE:Fr.ZERO)),
  fromInts:A=>A.map(r=>r.map(x=>x instanceof Fr?x:new Fr(x))),
  mul(A,B){const m=A.length,n=B.length,p=B[0].length;const C=M.zeros(m,p);for(let i=0;i<m;i++)for(let j=0;j<p;j++){let s=Fr.ZERO;for(let k=0;k<n;k++)s=s.add(A[i][k].mul(B[k][j]));C[i][j]=s}return C},
  transpose:A=>A[0].map((_,j)=>A.map(r=>r[j])),
  minor(A,i,j){return A.filter((_,r)=>r!==i).map(r=>r.filter((_,c)=>c!==j))},
  det(A){const n=A.length;if(n===1)return A[0][0];if(n===2)return A[0][0].mul(A[1][1]).sub(A[0][1].mul(A[1][0]));let s=Fr.ZERO;for(let j=0;j<n;j++){const t=A[0][j].mul(M.det(M.minor(A,0,j)));s=(j%2===0)?s.add(t):s.sub(t)}return s},
  eq:(A,B)=>A.length===B.length&&A.every((r,i)=>r.every((x,j)=>x.eq(B[i][j]))),
};
/* HTML de uma matriz. opts:{aug, hl:Set('i,j'), hl2:Set, piv:Set (elemento redutor circulado), sel:'i,j',
 * left:{i:Fr|string} multiplicadores à esquerda, right:{i:string} à direita, swap:[i,j] seta curva} */
function matHTML(A,opts={}){
  const o=opts;
  if(o.left||o.right||o.swap)return matAnnHTML(A,o);
  let h='<span class="mat math"><table>';
  A.forEach((r,i)=>{h+='<tr>';r.forEach((x,j)=>{
    let c=[];if(o.aug!==undefined&&j===o.aug)c.push('aug');
    if(o.hl&&o.hl.has(i+','+j))c.push('hl');
    if(o.hl2&&o.hl2.has(i+','+j))c.push('hl2');
    if(o.piv&&o.piv.has(i+','+j))c.push('piv');
    if(o.sel===i+','+j)c.push('sel');
    h+='<td'+(c.length?' class="'+c.join(' ')+'"':'')+'>'+(x.html?x.html():x)+'</td>'});h+='</tr>'});
  return h+'</table></span>';
}
function matAnnHTML(A,o){
  const m=A.length,n=A[0].length,L=o.left||{},R=o.right||{};
  const lab=v=>v&&v.html?v.html():(v||'');
  let h='<span class="mgrid math" style="grid-template-columns:auto repeat('+n+',auto) auto">';
  for(let i=0;i<m;i++){
    h+='<span class="lm" style="grid-row:'+(i+1)+';grid-column:1">'+lab(L[i])+'</span>';
    for(let j=0;j<n;j++){
      const x=A[i][j];let c=['c'];if(o.aug!==undefined&&j===o.aug)c.push('aug');
      if(o.hl&&o.hl.has(i+','+j))c.push('hl');if(o.hl2&&o.hl2.has(i+','+j))c.push('hl2');
      if(o.piv&&o.piv.has(i+','+j))c.push('piv');if(o.sel===i+','+j)c.push('sel');
      h+='<span class="'+c.join(' ')+'" style="grid-row:'+(i+1)+';grid-column:'+(j+2)+'">'+(x.html?x.html():x)+'</span>'}
    h+='<span class="rm" style="grid-row:'+(i+1)+';grid-column:'+(n+2)+'">'+lab(R[i])+'</span>';
  }
  h+='<span class="br" style="grid-row:1/span '+m+';grid-column:2/span '+n+'"></span>';
  if(o.swap){const a=Math.min(o.swap[0],o.swap[1]),b=Math.max(o.swap[0],o.swap[1]);
    h+='<span class="sw" style="grid-row:'+(a+1)+'/span '+(b-a+1)+';grid-column:1"><svg viewBox="0 0 20 100" preserveAspectRatio="none" width="22" height="100%"><path d="M17 8 C2 8 2 92 17 92" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M13 3 L18 8 L13 13 M13 87 L18 92 L13 97" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></span>';}
  return h+'</span>';
}
/* grelha de <input>; devolve {el, get(), set(A)} */
function makeGrid(container,rows,cols,init,onchange,opts={}){
  container.innerHTML='';
  const w=document.createElement('div');w.className='grid-in';
  const inputs=[];
  for(let i=0;i<rows;i++){const r=document.createElement('div');inputs.push([]);
    for(let j=0;j<cols;j++){const inp=document.createElement('input');inp.type='text';inp.inputMode='text';inp.setAttribute('aria-label','elemento ('+(i+1)+','+(j+1)+')');
      inp.value=(init&&init[i]&&init[i][j]!==undefined)?(init[i][j] instanceof Fr?init[i][j].str().replace('−','-'):String(init[i][j])):'0';
      if(opts.aug!==undefined&&j===opts.aug)inp.style.marginLeft='12px';
      inp.addEventListener('input',()=>{inp.style.borderColor=parseFr(inp.value)?'':'var(--red)';onchange&&onchange()});
      r.appendChild(inp);inputs[i].push(inp)}
    w.appendChild(r)}
  container.appendChild(w);
  return{inputs,
    get(){const A=[];for(let i=0;i<rows;i++){const r=[];for(let j=0;j<cols;j++){const v=parseFr(inputs[i][j].value);if(!v)return null;r.push(v)}A.push(r)}return A},
    set(A){A.forEach((r,i)=>r.forEach((x,j)=>{inputs[i][j].value=x instanceof Fr?x.str().replace('−','-'):String(x)}));onchange&&onchange()}};
}
/* ---------- Gauss ----------
 * Notação do professor: elemento redutor (circulado), multiplicadores das operações de Jacobi escritos à esquerda
 * da linha que muda, ×k ou :k à direita da linha, seta curva à esquerda para a troca de linhas.
 * Devolve passos {desc, A, piv, hl}; o passo k-1 tem .nxt = {left:{i:Fr}, right:{i:html}, swap:[i,j], piv:[r,c]} com as
 * anotações da operação que leva do passo k-1 ao passo k. mode 'ref' (escada) ou 'rref' (reduzida).
 * ncoef = nº de colunas de coeficientes (o elemento redutor não é escolhido na parte aumentada). */
function gaussSteps(A0,mode='ref',ncoef){
  let A=M.clone(A0);const m=A.length,n=A[0].length;ncoef=ncoef===undefined?n:ncoef;
  const steps=[{desc:'Matriz inicial.',A:M.clone(A),piv:new Set(),hl:new Set()}];
  const pivs=[];let r=0;
  const rows=(...l)=>new Set(l.flatMap(i=>[...Array(n).keys()].map(j=>i+','+j)));
  const snap=(desc,hl,nxt)=>{steps[steps.length-1].nxt=nxt;steps.push({desc,A:M.clone(A),piv:new Set(pivs.map(p=>p.join(','))),hl:hl||new Set()})};
  for(let c=0;c<ncoef&&r<m;c++){
    let p=-1;for(let i=r;i<m;i++)if(!A[i][c].isZero()){p=i;break}
    if(p<0)continue;
    if(p!==r){[A[p],A[r]]=[A[r],A[p]];snap('Coluna '+(c+1)+': o elemento no topo é nulo. Trocam-se as linhas '+(r+1)+' e '+(p+1)+' (seta curva à esquerda).',rows(r,p),{swap:[r,p]})}
    pivs.push([r,c]);
    const pc=[r,c];
    if(mode==='rref'&&!A[r][c].isOne()){const k=A[r][c];A[r]=A[r].map(x=>x.div(k));
      const lab=(k.d===1)?':'+k.html():(k.n===1?'×'+k.d:'×'+new Fr(k.d,k.n).html());
      snap('Divide-se a linha '+(r+1)+' pelo elemento redutor '+k.str()+' (escreve-se '+(k.d===1?':'+k.str():'×'+new Fr(k.d,k.n).str())+' à direita da linha).',rows(r),{right:{[r]:lab},piv:pc})}
    const left={};const from=mode==='rref'?0:r+1;
    for(let i=from;i<m;i++){if(i===r||A[i][c].isZero())continue;
      const f=A[i][c].div(A[r][c]).neg();left[i]=f;
      A[i]=A[i].map((x,j)=>x.add(f.mul(A[r][j])))}
    const ks=Object.keys(left).map(Number);
    if(ks.length)snap('Operação de Jacobi na coluna '+(c+1)+' (elemento redutor na linha '+(r+1)+'): '+ks.map(i=>'linha '+(i+1)+', multiplicador '+left[i].str()).join('; ')+'.',rows(...ks),{left,piv:pc});
    r++;
  }
  steps.push({desc:mode==='rref'?'Forma de escada reduzida obtida.':'Forma de escada obtida. Número de elementos redutores: '+pivs.length+'.',A:M.clone(A),piv:new Set(pivs.map(p=>p.join(','))),hl:new Set(),final:true,pivs:pivs.slice()});
  return steps;
}
/* mostra a operação que leva ao passo k na notação do professor: matriz anotada → matriz resultante */
function stepHTML(steps,k,o={}){
  const cur=steps[k];const oc={aug:o.aug,hl:cur.hl,piv:cur.final?cur.piv:new Set()};
  if(k===0)return matHTML(cur.A,{aug:o.aug,piv:new Set()});
  const src=steps[k-1],nx=src.nxt||{};
  const os={aug:o.aug,left:nx.left,right:nx.right,swap:nx.swap,piv:nx.piv?new Set([nx.piv.join(',')]):new Set()};
  return matHTML(src.A,os)+'<span class="arr math">→</span>'+matHTML(cur.A,oc);
}
function rankOf(A,ncoef){const s=gaussSteps(A,'ref',ncoef);return s[s.length-1].pivs.length}
/* classificação por Rouché–Capelli; A: m×(n+1) ampliada */
function classify(Aug){
  const n=Aug[0].length-1;const rA=rankOf(Aug,n);const rAB=rankOf(Aug,n+1);
  let kind;if(rA<rAB)kind='SI';else if(rA===n)kind='SPD';else kind='SPI';
  return{rA,rAB,n,kind,grau:n-rA};
}
const KIND_TXT={SPD:'Sistema possível e determinado',SPI:'Sistema possível e indeterminado',SI:'Sistema impossível'};
const tag=k=>'<span class="tag '+k.toLowerCase()+'">'+k+'</span>';
/* solução geral a partir da forma reduzida; devolve HTML */
function solutionHTML(Aug,names){
  const n=Aug[0].length-1;names=names||['x','y','z','w','u','v'].slice(0,n);
  const st=gaussSteps(Aug,'rref',n);const R=st[st.length-1].A;const pv=st[st.length-1].pivs;
  const c=classify(Aug);
  if(c.kind==='SI')return '<b>Sem solução.</b>';
  const pc=pv.map(p=>p[1]);const free=[...Array(n).keys()].filter(j=>!pc.includes(j));
  const par=['α','β','γ','δ'];
  const out=[];
  for(let j=0;j<n;j++){
    if(pc.includes(j)){const row=pv.find(p=>p[1]===j)[0];let s=R[row][n];
      let expr=s.isZero()?'':s.str();
      free.forEach((f,k)=>{const co=R[row][f].neg();if(co.isZero())return;const t=(co.isOne()?'':co.eq(new Fr(-1))?'−':co.str()+'·')+par[k];
        if(expr==='')expr=(t.startsWith('−')?t:t);else expr+=(t.startsWith('−')?' − '+t.slice(1):' + '+t)});
      out.push(names[j]+' = '+(expr===''?'0':expr))}
    else out.push(names[j]+' = '+par[free.indexOf(j)]);
  }
  return out.join(',&nbsp; ')+(free.length?' &nbsp;<span class="note">('+free.map((f,k)=>par[k]).join(', ')+' ∈ ℝ)</span>':'');
}
/* utilitários de interface */
function el(id){return document.getElementById(id)}
function rangeSel(id,a,b,v){const s=el(id);for(let i=a;i<=b;i++){const o=document.createElement('option');o.value=i;o.textContent=i;s.appendChild(o)}s.value=v;return s}
function header(eyebrow,title,sub){return '<header class="top"><div class="eyebrow">'+eyebrow+'</div><h1>'+title+'</h1><p>'+sub+'</p></header>'}
function footer(){return '<footer class="f">Applet de apoio à sebenta de Matemática I · Paulo Carrasco · Núcleo de Métodos Quantitativos, ESGHT · Universidade do Algarve</footer>'}
