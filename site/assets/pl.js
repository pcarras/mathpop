/* Biblioteca comum dos applets de Programação Linear (Matemática I, Tema 2).
 * JS puro, sem dependências. Usa Fr, parseFr, classify e el de common.js.
 * Contém: valores a + bM (MV), modelo de PL, forma standard, Simplex exato com o método do M grande
 * (notação do professor: folgas F_i, excessos E_i, artificiais A_i, elemento redutor, :k e multiplicadores),
 * método algébrico (soluções básicas), resolução gráfica exata com 2 variáveis, dual, formatação e um
 * pequeno motor de desenho em canvas. */
'use strict';
const PL=(()=>{
const F=x=>x instanceof Fr?x:parseFr(String(x));
const sgn=f=>Math.sign(f.n);
const cmpF=(a,b)=>sgn(a.sub(b));
const NEG1=new Fr(-1);
const REL={'<=':'≤','>=':'≥','=':'='};
const FLIP={'<=':'>=','>=':'<=','=':'='};
/* ---------- formatação ---------- */
const SUBD='₀₁₂₃₄₅₆₇₈₉';
function vTxt(nm){const m=String(nm).match(/^([A-Za-z]+)(\d+)$/);return m?m[1]+m[2].replace(/\d/g,d=>SUBD[d]):nm}
function vHTML(nm){const m=String(nm).match(/^([A-Za-z]+)(\d+)$/);return m?'<i>'+m[1]+'</i><sub>'+m[2]+'</sub>':'<i>'+nm+'</i>'}
function isTerm(f){let q=f.d;while(q%2===0)q/=2;while(q%5===0)q/=5;return q===1}
/* decimal exato (só para frações com denominador 2^a·5^b), com vírgula */
function exactDec(f){
  if(f.d===1)return String(f.n).replace('-','−');
  let k=0,p=1;while(p%f.d!==0&&k<8){p*=10;k++}
  const N=Math.abs(f.n)*(p/f.d);let s=String(N).padStart(k+1,'0');
  s=s.slice(0,s.length-k)+','+s.slice(s.length-k);return (f.n<0?'−':'')+s;
}
/* coeficientes do modelo: inteiros, decimais curtos (0,25) ou frações */
const shortDec=f=>f.d!==1&&isTerm(f)&&f.d<=10000;
function cTxt(f){return shortDec(f)?exactDec(f):f.str()}
function cHTML(f){return shortDec(f)?exactDec(f):f.html()}
function inTxt(f){return cTxt(f).replace('−','-')}
function decTxt(v,nd=2){if(!isFinite(v))return '∞';const p=Math.pow(10,nd);let r=Math.round(v*p)/p;if(Object.is(r,-0))r=0;return String(r).replace('.',',').replace('-','−')}
/* resultado exato com aproximação decimal quando é fração */
function resHTML(f,nd=2){return f.html()+(f.d===1||!isFinite(f.val())?'':' <span class="note">≈ '+decTxt(f.val(),nd)+'</span>')}
function niceStep(r,k=5){if(!(r>0))return 1;const raw=r/k,mag=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/mag;return(m<1.5?1:m<3.5?2:m<7.5?5:10)*mag}
/* ---------- valores a + bM ---------- */
class MV{
  constructor(a,b){this.a=a||Fr.ZERO;this.b=b||Fr.ZERO}
  static of(x){return x instanceof MV?x:new MV(F(x),Fr.ZERO)}
  add(o){o=MV.of(o);return new MV(this.a.add(o.a),this.b.add(o.b))}
  sub(o){o=MV.of(o);return new MV(this.a.sub(o.a),this.b.sub(o.b))}
  mul(k){return new MV(this.a.mul(k),this.b.mul(k))}
  neg(){return new MV(this.a.neg(),this.b.neg())}
  /* compara primeiro o coeficiente de M */
  cmp(o){o=MV.of(o);const db=this.b.sub(o.b);if(!db.isZero())return sgn(db);return sgn(this.a.sub(o.a))}
  isZero(){return this.a.isZero()&&this.b.isZero()}
  hasM(){return !this.b.isZero()}
  _fmt(h){
    const fa=x=>h?x.html():x.str();
    if(this.b.isZero())return fa(this.a);
    const mp=this.b.isOne()?'M':this.b.eq(NEG1)?'−M':fa(this.b)+'M';
    if(this.a.isZero())return mp;
    const ng=this.a.n<0;return mp+(ng?'−':'+')+fa(ng?this.a.neg():this.a);
  }
  html(){return this._fmt(true)}
  str(){return this._fmt(false)}
}
const MV0=new MV();
/* ---------- modelo ---------- */
function make(sense,c,A,rel,b,names){
  const lp={sense,c:c.map(F),A:A.map(r=>r.map(F)),rel:rel.slice(),b:b.map(F)};
  lp.n=lp.c.length;lp.m=lp.A.length;lp.names=names?names.slice():lp.c.map((_,j)=>'x'+(j+1));return lp;
}
function clone(lp){return make(lp.sense,lp.c,lp.A,lp.rel,lp.b,lp.names)}
/* termo independente negativo: multiplica-se a restrição por −1 */
function norm(lp0){const lp=clone(lp0);lp.flipped=[];
  for(let i=0;i<lp.m;i++)if(sgn(lp.b[i])<0){lp.A[i]=lp.A[i].map(x=>x.neg());lp.b[i]=lp.b[i].neg();lp.rel[i]=FLIP[lp.rel[i]];lp.flipped.push(i)}
  return lp}
const dot=(u,v)=>u.reduce((s,x,j)=>s.add(x.mul(v[j])),Fr.ZERO);
function lhs(lp,i,x){return dot(lp.A[i],x)}
function satisfies(v,rel,b){const s=cmpF(v,b);return rel==='<='?s<=0:rel==='>='?s>=0:s===0}
function feasible(lp,x){if(x.some(v=>sgn(v)<0))return false;for(let i=0;i<lp.m;i++)if(!satisfies(lhs(lp,i,x),lp.rel[i],lp.b[i]))return false;return true}
/* estado de cada restrição técnica numa solução x (variáveis de decisão) */
function estado(lp,x){
  return lp.A.map((r,i)=>{const v=lhs(lp,i,x),rel=lp.rel[i],b=lp.b[i];
    if(rel==='<='){const f=b.sub(v);return{i,v,rel,b,sat:f.isZero(),tipo:'folga',var:'F'+(i+1),val:f}}
    if(rel==='>='){const e=v.sub(b);return{i,v,rel,b,sat:e.isZero(),tipo:'excesso',var:'E'+(i+1),val:e}}
    return{i,v,rel,b,sat:true,tipo:'igualdade',var:null,val:Fr.ZERO}});
}
/* ---------- HTML do modelo ---------- */
function linHTML(coefs,names,o={}){
  let s='';
  coefs.forEach((k,j)=>{
    if(k instanceof MV&&!k.hasM())k=k.a;
    const zero=k.isZero();if(zero&&!(o.zero&&o.zero.has(j)))return;
    let neg=false,body;
    if(zero)body='0'+vHTML(names[j]);
    else if(k instanceof MV){
      if(k.a.isZero()){neg=k.b.n<0;const ab=neg?k.b.neg():k.b;body=(ab.isOne()?'':cHTML(ab))+'M&#8239;'+vHTML(names[j])}
      else body='('+k.html()+')'+vHTML(names[j]);
    }else{neg=k.n<0;const ab=neg?k.neg():k;body=(ab.isOne()?'':cHTML(ab))+vHTML(names[j])}
    if(s==='')s=(neg?'−':'')+body;else s+=(neg?' − ':' + ')+body;
  });
  return s||'0';
}
function modelHTML(lp,o={}){
  const fo=o.fo||'z';
  let h='<table class="pl-mod math"><tr><td class="k">'+(lp.sense==='max'?'Maximizar':'Minimizar')+'</td><td>'+fo+' = '+linHTML(lp.c,lp.names)+'</td></tr>';
  lp.A.forEach((r,i)=>{h+='<tr><td class="k">'+(i===0?'sujeito a':'')+'</td><td>'+linHTML(r,lp.names)+' '+REL[lp.rel[i]]+' '+cHTML(lp.b[i])+(o.tags?' <span class="note">('+(i+1)+')</span>':'')+'</td></tr>'});
  h+='<tr><td></td><td>'+lp.names.map(vHTML).join(', ')+'&nbsp;≥&nbsp;0</td></tr></table>';
  return h;
}
/* ---------- forma standard (M grande) ---------- */
function standard(lp){
  const cols=lp.names.map((nm,j)=>({name:nm,type:'x',j}));
  const cost=lp.c.map(c=>new MV(c));
  const rows=lp.A.map(r=>r.slice());const basis=new Array(lp.m).fill(-1);
  const big=lp.sense==='max'?new MV(Fr.ZERO,NEG1):new MV(Fr.ZERO,Fr.ONE);
  const add=(name,type,i,val,c)=>{cols.push({name,type,i});cost.push(c);rows.forEach((r,k)=>r.push(k===i?val:Fr.ZERO));return cols.length-1};
  lp.rel.forEach((rl,i)=>{if(rl==='<=')basis[i]=add('F'+(i+1),'F',i,Fr.ONE,new MV());else if(rl==='>=')add('E'+(i+1),'E',i,NEG1,new MV())});
  lp.rel.forEach((rl,i)=>{if(rl!=='<=')basis[i]=add('A'+(i+1),'A',i,Fr.ONE,big)});
  return{cols,cost,rows,rhs:lp.b.slice(),basis};
}
function zrow(T){
  const nc=T.cols.length;const z=[],cz=[];
  for(let j=0;j<nc;j++){let s=MV0;T.basis.forEach((bi,i)=>{s=s.add(T.cost[bi].mul(T.rows[i][j]))});z.push(s);cz.push(T.cost[j].sub(s))}
  let val=MV0;T.basis.forEach((bi,i)=>{val=val.add(T.cost[bi].mul(T.rhs[i]))});
  return{z,cz,val};
}
function snapQ(T){const{z,cz,val}=zrow(T);
  return{cols:T.cols.slice(),cost:T.cost.slice(),rows:T.rows.map(r=>r.slice()),rhs:T.rhs.slice(),basis:T.basis.slice(),z,cz,val,entra:null,sai:null,ratios:null,piv:null,ops:null,retira:null}}
function ratiosOf(T,c){return T.rows.map((r,i)=>sgn(r[c])>0?T.rhs[i].div(r[c]):null)}
function reduz(T,q,r,c){
  q.sai=r;q.piv=[r,c];const p=T.rows[r][c];
  const np=T.rows[r].map(x=>x.div(p)),nb=T.rhs[r].div(p);
  const mult={},rows=[],rhs=[];
  T.rows.forEach((row,i)=>{
    if(i===r){rows.push(np);rhs.push(nb);return}
    const k=row[c].neg();if(!k.isZero())mult[i]=k;
    rows.push(row.map((x,j)=>x.add(k.mul(np[j]))));rhs.push(T.rhs[i].add(k.mul(nb)));
  });
  q.ops={div:p,mult};
  T.rows=rows;T.rhs=rhs;const leaving=T.basis[r];T.basis[r]=c;
  if(T.cols[leaving].type==='A'){
    q.retira=T.cols[leaving].name;
    T.cols=T.cols.filter((_,j)=>j!==leaving);T.cost=T.cost.filter((_,j)=>j!==leaving);
    T.rows=T.rows.map(rw=>rw.filter((_,j)=>j!==leaving));T.basis=T.basis.map(b=>b>leaving?b-1:b);
  }
}
function minRatio(rat){let r=-1;rat.forEach((x,i)=>{if(x&&(r<0||cmpF(x,rat[r])<0))r=i});return r}
/* Simplex completo. opt.alt: depois do ótimo, se houver ótimos múltiplos, faz mais uma iteração (quadro alternativo). */
function simplex(lp0,opt={}){
  const lp=norm(lp0);const T=standard(lp);const Q=[];let status='iter';const maxit=opt.maxit||40;
  for(let it=0;it<maxit;it++){
    const q=snapQ(T);Q.push(q);
    /* artificial positiva na base e nenhum cj − zj melhora o termo em M: problema impossível */
    const artPos=q.basis.some((b,i)=>q.cols[b].type==='A'&&sgn(q.rhs[i])>0);
    const mImp=q.cols.some((_,j)=>!q.basis.includes(j)&&(lp.sense==='max'?sgn(q.cz[j].b)>0:sgn(q.cz[j].b)<0));
    if(artPos&&!mImp){status='impossivelM';break}
    let best=-1;
    q.cols.forEach((_,j)=>{if(q.basis.includes(j))return;
      if(best<0||(lp.sense==='max'?q.cz[j].cmp(q.cz[best])>0:q.cz[j].cmp(q.cz[best])<0))best=j});
    if(best<0||(lp.sense==='max'?q.cz[best].cmp(MV0)<=0:q.cz[best].cmp(MV0)>=0)){status='otimo';break}
    q.entra=best;q.ratios=ratiosOf(T,best);
    const r=minRatio(q.ratios);
    if(r<0){status='ilimitado';break}
    reduz(T,q,r,best);
  }
  const last=Q[Q.length-1];
  const res={lp,quadros:Q,status,std:standard(lp)};
  const artIn=last.basis.map((b,i)=>[b,i]).filter(([b,i])=>last.cols[b].type==='A'&&sgn(last.rhs[i])>0);
  if(status==='impossivelM'){res.status='impossivel';res.impM=true;res.artIn=artIn.map(([b])=>last.cols[b].name)}
  if(status==='otimo'&&artIn.length){res.status='impossivel';res.artIn=artIn.map(([b])=>last.cols[b].name)}
  if(status==='ilimitado'&&artIn.length)res.artIn=artIn.map(([b])=>last.cols[b].name);
  if(res.status==='otimo'){
    const vals={};last.cols.forEach(c=>{vals[c.name]=Fr.ZERO});last.basis.forEach((b,i)=>{vals[last.cols[b].name]=last.rhs[i]});
    res.vals=vals;res.x=lp.names.map(nm=>vals[nm]);res.z=last.val.a;
    const nb=last.cols.map((c,j)=>j).filter(j=>!last.basis.includes(j)&&last.cols[j].type!=='A');
    res.altCols=nb.filter(j=>last.cz[j].isZero());res.multiplas=res.altCols.length>0;
    res.estado=estado(lp,res.x);
    if(opt.alt&&res.multiplas){
      const Tl={cols:last.cols.slice(),cost:last.cost.slice(),rows:last.rows.map(r=>r.slice()),rhs:last.rhs.slice(),basis:last.basis.slice()};
      const c=res.altCols[0];const rat=ratiosOf(Tl,c);const r=minRatio(rat);
      if(r>=0){const qa=Object.assign({},last);qa.entra=c;qa.ratios=rat;qa.alt=true;reduz(Tl,qa,r,c);Q[Q.length-1]=qa;
        const q2=snapQ(Tl);q2.altFinal=true;Q.push(q2);
        const v2={};q2.cols.forEach(cc=>{v2[cc.name]=Fr.ZERO});q2.basis.forEach((b,i)=>{v2[q2.cols[b].name]=q2.rhs[i]});res.altVals=v2;res.altX=lp.names.map(nm=>v2[nm])}
      else res.altRay=true;
    }
  }
  return res;
}
/* preços-sombra (variação de z por unidade adicional de b_i) lidos no quadro ótimo:
 * restrição ≤ → −(cj − zj) da folga F_i; restrição ≥ → (cj − zj) do excesso E_i */
function sombra(res){
  const lp=res.lp,last=res.quadros[res.quadros.length-1];
  return lp.rel.map((rl,i)=>{
    const nm=(rl==='<='?'F':rl==='>='?'E':null);if(!nm)return null;
    const j=last.cols.findIndex(c=>c.name===nm+(i+1));if(j<0)return null;
    const cz=last.cz[j].a;let y=rl==='<='?cz.neg():cz;
    if(lp.flipped&&lp.flipped.includes(i))y=y.neg();
    return{col:nm+(i+1),cz,y};
  });
}
/* ---------- quadro do Simplex em HTML (formato do professor) ---------- */
function quadroHTML(q,o={}){
  const nc=q.cols.length,an=o.annot&&q.entra!==null&&q.entra!==undefined;
  const ec=an?q.entra:-1,pr=an&&q.piv?q.piv[0]:-1;
  const hc=o.hlCols||new Set();
  const cls=(j)=>(j===ec?' ent':'')+(hc.has(q.cols[j].name)?' hc':'')+(q.cols[j].type==='A'?' art':'');
  const sol=q.cols.map((c,j)=>{const i=q.basis.indexOf(j);return i>=0?q.rhs[i]:Fr.ZERO});
  const solTxt=(o.final&&!o.noStar?'X* = (':'X = (')+sol.map(x=>x.html()).join(', ')+')';
  let h='<table class="qd math"><tr class="nm"><td class="out"></td><td></td><td></td>';
  q.cols.forEach((c,j)=>{h+='<td class="v'+cls(j)+'">'+vHTML(c.name)+'</td>'});
  h+='<td></td><td></td><td class="out"></td></tr>';
  h+='<tr class="cj"><td class="out"></td><th>X<sub>b</sub></th><th class="sep">c<sub>jb</sub></th>';
  q.cols.forEach((c,j)=>{h+='<td class="'+cls(j)+'">'+q.cost[j].html()+'</td>'});
  h+='<th class="sepl">RHS</th><th>r</th><td class="out"></td></tr>';
  q.rows.forEach((row,i)=>{
    const isP=i===pr;const mlt=an&&q.ops&&q.ops.mult[i]!==undefined?q.ops.mult[i]:null;
    h+='<tr class="b'+(isP?' pr':'')+'"><td class="out lm">'+(mlt?mlt.html():'')+'</td><td class="bv">'+vHTML(q.cols[q.basis[i]].name)+'</td><td class="sep">'+q.cost[q.basis[i]].html()+'</td>';
    row.forEach((x,j)=>{h+='<td class="'+cls(j).trim()+(isP&&j===ec?' pv':'')+'">'+(isP&&j===ec?'<span class="ring">'+x.html()+'</span>':x.html())+'</td>'});
    let rr='';if(an&&q.ratios){rr=q.ratios[i]?q.ratios[i].html():'–';if(isP)rr='<b>'+rr+'</b> ←'}
    h+='<td class="sepl">'+q.rhs[i].html()+'</td><td class="rt">'+rr+'</td><td class="out rm">'+(isP&&q.ops?':'+q.ops.div.html():'')+'</td></tr>';
  });
  h+='<tr class="cz"><td class="out"></td><td colspan="2" class="sep">c<sub>j</sub> − z<sub>j</sub></td>';
  q.cz.forEach((x,j)=>{h+='<td class="'+cls(j).trim()+'">'+x.html()+(j===ec?' ↑':'')+'</td>'});
  h+='<td class="sepl zv" title="valor de z">'+q.val.html()+(o.final&&!o.noStar?'*':'')+'</td><td></td><td class="out"></td></tr></table>';
  return '<div class="qwrap"><div class="xs math">'+solTxt+'</div>'+h+'</div>';
}
/* ---------- método algébrico ---------- */
function combos(N,k){const out=[];const rec=(s,acc)=>{if(acc.length===k){out.push(acc.slice());return}for(let j=s;j<N;j++){acc.push(j);rec(j+1,acc);acc.pop()}};rec(0,[]);return out}
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return Math.round(r)}
function solveSq(B,b){
  const n=B.length;const A=B.map((r,i)=>r.concat([b[i]]));
  for(let c=0;c<n;c++){let p=-1;for(let i=c;i<n;i++)if(!A[i][c].isZero()){p=i;break}
    if(p<0)return null;[A[c],A[p]]=[A[p],A[c]];const pv=A[c][c];A[c]=A[c].map(x=>x.div(pv));
    for(let i=0;i<n;i++)if(i!==c&&!A[i][c].isZero()){const f=A[i][c];A[i]=A[i].map((x,j)=>x.sub(f.mul(A[c][j])))}}
  return A.map(r=>r[n]);
}
function algebraic(lp0){
  const lp=norm(lp0);
  const cols=lp.names.map(nm=>({name:nm,type:'x'}));const rows=lp.A.map(r=>r.slice());
  lp.rel.forEach((rl,i)=>{if(rl==='=')return;cols.push({name:(rl==='<='?'F':'E')+(i+1),type:rl==='<='?'F':'E',i});rows.forEach((r,k)=>r.push(k===i?(rl==='<='?Fr.ONE:NEG1):Fr.ZERO))});
  const N=cols.length,m=lp.m;const out=[];
  if(N<m)return{lp,cols,rows,N,m,out,bad:true};
  combos(N,N-m).forEach(nb=>{
    const base=[...Array(N).keys()].filter(j=>!nb.includes(j));
    const B=rows.map(r=>base.map(j=>r[j]));const sol=solveSq(B,lp.b);
    if(!sol){const k=classify(B.map((r,i)=>r.concat([lp.b[i]]))).kind;out.push({nb,base,vals:null,kind:k});return}
    const vals=new Array(N).fill(Fr.ZERO);base.forEach((j,k)=>{vals[j]=sol[k]});
    const adm=vals.every(v=>sgn(v)>=0);
    out.push({nb,base,vals,adm,z:dot(lp.c,vals.slice(0,lp.n))});
  });
  return{lp,cols,rows,N,m,out};
}
/* ---------- resolução gráfica exata (2 variáveis) ---------- */
function graph2(lp0){
  const lp=norm(lp0);
  const L=lp.A.map((r,i)=>({a:r[0],b:r[1],c:lp.b[i],i})).concat([{a:Fr.ONE,b:Fr.ZERO,c:Fr.ZERO,i:-1},{a:Fr.ZERO,b:Fr.ONE,c:Fr.ZERO,i:-2}]);
  const pts=[];
  for(let p=0;p<L.length;p++)for(let q=p+1;q<L.length;q++){
    const A=L[p],B=L[q];const det=A.a.mul(B.b).sub(B.a.mul(A.b));if(det.isZero())continue;
    const x=A.c.mul(B.b).sub(B.c.mul(A.b)).div(det),y=A.a.mul(B.c).sub(B.a.mul(A.c)).div(det);
    if(feasible(lp,[x,y])&&!pts.some(P=>P.x.eq(x)&&P.y.eq(y)))pts.push({x,y});
  }
  if(pts.length>2){const cx=pts.reduce((s,P)=>s+P.x.val(),0)/pts.length,cy=pts.reduce((s,P)=>s+P.y.val(),0)/pts.length;
    pts.sort((P,Q)=>Math.atan2(P.y.val()-cy,P.x.val()-cx)-Math.atan2(Q.y.val()-cy,Q.x.val()-cx));
    let k=0;pts.forEach((P,i)=>{const s=P.x.val()+P.y.val(),s0=pts[k].x.val()+pts[k].y.val();if(s<s0-1e-12||(Math.abs(s-s0)<1e-12&&P.x.val()<pts[k].x.val()))k=i});
    const r=pts.splice(0,k);pts.push(...r);}
  else pts.sort((P,Q)=>(P.x.val()+P.y.val())-(Q.x.val()+Q.y.val()));
  pts.forEach((P,i)=>{P.lab=String.fromCharCode(65+i);P.z=lp.c[0].mul(P.x).add(lp.c[1].mul(P.y))});
  /* direções de recessão (raios extremos) */
  const cand=[[Fr.ONE,Fr.ZERO],[Fr.ZERO,Fr.ONE]];
  lp.A.forEach(r=>{if(r[0].isZero()&&r[1].isZero())return;cand.push([r[1],r[0].neg()],[r[1].neg(),r[0]])});
  const inCone=d=>sgn(d[0])>=0&&sgn(d[1])>=0&&!(d[0].isZero()&&d[1].isZero())&&lp.A.every((r,i)=>satisfies(dot(r,d),lp.rel[i],Fr.ZERO));
  let rays=cand.filter(inCone);
  if(rays.length){const ang=d=>Math.atan2(d[1].val(),d[0].val());rays.sort((u,v)=>ang(u)-ang(v));rays=[rays[0],rays[rays.length-1]];if(Math.abs(ang(rays[0])-ang(rays[1]))<1e-12)rays=[rays[0]]}
  const G={lp,verts:pts,rays,empty:pts.length===0,unbounded:pts.length>0&&rays.length>0};
  const better=(s)=>lp.sense==='max'?s>0:s<0;
  if(G.empty){G.status='impossivel';return G}
  const cz=lp.c[0].isZero()&&lp.c[1].isZero();
  const improving=rays.find(d=>better(sgn(dot(lp.c,d))));
  if(improving){G.status='ilimitado';G.ray=improving;return G}
  let best=pts[0].z;pts.forEach(P=>{if(better(cmpF(P.z,best)))best=P.z});
  G.zStar=best;G.opt=pts.filter(P=>P.z.eq(best));
  const flat=rays.find(d=>dot(lp.c,d).isZero());
  if(cz){G.status='multiplas';G.nulo=true}
  else if(G.opt.length>1)G.status='multiplas';
  else if(flat){G.status='multiplas';G.optRay=flat}
  else G.status='unico';
  return G;
}
/* ---------- dual (forma canónica) ---------- */
function dual(lp){
  const At=lp.c.map((_,j)=>lp.A.map(r=>r[j]));
  const names=lp.b.map((_,i)=>'y'+(i+1));
  return make(lp.sense==='max'?'min':'max',lp.b,At,lp.c.map(()=>lp.sense==='max'?'>=':'<='),lp.c,names);
}
/* ---------- editor de problemas ---------- */
function editor(box,o,onchange){
  const S={n:o.n||2,m:o.m||2,sense:'max',c:[],A:[],rel:[],b:[],names:null};
  const rels=o.rels||['<=','>=','='];
  let inp=null;
  function readRaw(){if(!inp)return;S.sense=inp.sense.value;S.c=inp.c.map(x=>x.value);S.A=inp.A.map(r=>r.map(x=>x.value));S.rel=inp.rel.map(x=>x?x.value:null);S.b=inp.b.map(x=>x.value)}
  function opts(sel,list,v){sel.innerHTML='';list.forEach(([val,txt])=>{const op=document.createElement('option');op.value=val;op.textContent=txt;sel.appendChild(op)});sel.value=v}
  function build(){
    box.innerHTML='';const w=document.createElement('div');w.className='pl-ed';
    const names=S.names&&S.names.length===S.n?S.names:[...Array(S.n).keys()].map(j=>'x'+(j+1));
    const dim=document.createElement('div');dim.className='pl-dim';
    if(!o.nFixed){const l=document.createElement('label');l.textContent='Variáveis ';const s=document.createElement('select');opts(s,range(o.nMin||2,o.nMax||4).map(k=>[k,k]),S.n);s.onchange=()=>{readRaw();S.n=+s.value;S.names=null;build();fire()};l.appendChild(s);dim.appendChild(l)}
    const l2=document.createElement('label');l2.textContent='Restrições ';const s2=document.createElement('select');opts(s2,range(o.mMin||1,o.mMax||5).map(k=>[k,k]),S.m);s2.onchange=()=>{readRaw();S.m=+s2.value;build();fire()};l2.appendChild(s2);dim.appendChild(l2);
    w.appendChild(dim);
    const mkIn=(v,lab)=>{const x=document.createElement('input');x.type='text';x.inputMode='text';x.value=v===undefined||v===null||v===''?'0':v;x.setAttribute('aria-label',lab);x.addEventListener('input',()=>{x.classList.toggle('badin',!parseFr(x.value));fire()});x.classList.toggle('badin',!parseFr(x.value));return x};
    const term=(row,x,j)=>{if(j>0){const p=document.createElement('span');p.className='op';p.textContent='+';row.appendChild(p)}row.appendChild(x);const v=document.createElement('span');v.className='vn math';v.innerHTML=vHTML(names[j]);row.appendChild(v)};
    const fo=document.createElement('div');fo.className='pl-row fo';
    const ss=document.createElement('select');opts(ss,[['max','Max'],['min','Min']],S.sense);ss.setAttribute('aria-label','Maximizar ou minimizar');ss.onchange=()=>{if(o.relFixed){readRaw();S.sense=ss.value;build()}fire()};
    if(o.senseFixed){ss.disabled=true}
    fo.appendChild(ss);const zl=document.createElement('span');zl.className='math eqz';zl.innerHTML=(o.fo||'z')+' =';fo.appendChild(zl);
    const ci=[];for(let j=0;j<S.n;j++){const x=mkIn(S.c[j],'coeficiente de '+vTxt(names[j])+' na função objetivo');ci.push(x);term(fo,x,j)}
    w.appendChild(fo);
    const sa=document.createElement('div');sa.className='pl-sa';sa.textContent='sujeito a';w.appendChild(sa);
    const Ai=[],ri=[],bi=[];
    for(let i=0;i<S.m;i++){
      const row=document.createElement('div');row.className='pl-row';
      const tg=document.createElement('span');tg.className='tg';tg.textContent='('+(i+1)+')';row.appendChild(tg);
      const r=[];for(let j=0;j<S.n;j++){const x=mkIn(S.A[i]&&S.A[i][j],'restrição '+(i+1)+', coeficiente de '+vTxt(names[j]));r.push(x);term(row,x,j)}
      Ai.push(r);
      let rs=null;
      if(o.relFixed){const sp=document.createElement('span');sp.className='rel math';sp.textContent=REL[o.relFixed(S.sense)];row.appendChild(sp)}
      else{rs=document.createElement('select');rs.className='rel';opts(rs,rels.map(x=>[x,REL[x]]),S.rel[i]&&rels.includes(S.rel[i])?S.rel[i]:rels[0]);rs.setAttribute('aria-label','sinal da restrição '+(i+1));rs.onchange=fire;row.appendChild(rs)}
      ri.push(rs);
      const bx=mkIn(S.b[i],'termo independente da restrição '+(i+1));bx.classList.add('rhs');row.appendChild(bx);bi.push(bx);
      w.appendChild(row);
    }
    const sg=document.createElement('div');sg.className='pl-sign math';sg.innerHTML=names.map(vHTML).join(', ')+'&nbsp;≥&nbsp;0';w.appendChild(sg);
    box.appendChild(w);
    inp={sense:ss,c:ci,A:Ai,rel:ri,b:bi,names};
  }
  function fire(){onchange&&onchange()}
  function get(){
    if(!inp)return null;const P=v=>parseFr(v.value);
    const c=inp.c.map(P),A=inp.A.map(r=>r.map(P)),b=inp.b.map(P);
    if(c.some(x=>!x)||A.some(r=>r.some(x=>!x))||b.some(x=>!x))return null;
    const sense=inp.sense.value;
    const rel=inp.rel.map(x=>x?x.value:o.relFixed(sense));
    return make(sense,c,A,rel,b,inp.names);
  }
  function set(lp){S.n=lp.n;S.m=lp.m;S.sense=lp.sense;S.c=lp.c.map(inTxt);S.A=lp.A.map(r=>r.map(inTxt));S.rel=lp.rel.slice();S.b=lp.b.map(inTxt);S.names=lp.names.slice();build();fire()}
  build();
  return{get,set,rebuild:build};
}
function range(a,b){const r=[];for(let i=a;i<=b;i++)r.push(i);return r}
/* ---------- desenho em canvas ---------- */
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function rgba(hex,k){hex=String(hex).replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');const n=parseInt(hex,16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+k+')'}
const CCOL=['--navy','--amber','--violet','--green','--gray'];
/* recorta um polígono (float) ao semiplano a·x + b·y ≤ c */
function clipLE(poly,a,b,c){
  const out=[];const f=P=>a*P[0]+b*P[1]-c;const eps=1e-12*(1+Math.abs(c));
  for(let i=0;i<poly.length;i++){const P=poly[i],Q=poly[(i+1)%poly.length];const fp=f(P),fq=f(Q);
    if(fp<=eps)out.push(P);
    if((fp<-eps&&fq>eps)||(fp>eps&&fq<-eps)){const t=fp/(fp-fq);out.push([P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])])}}
  return out;
}
function clipRel(poly,a,b,c,rel){if(rel!=='>=')poly=clipLE(poly,a,b,c);if(rel!=='<=')poly=clipLE(poly,-a,-b,-c);return poly}
class Plot{
  constructor(cv,wrap,o={}){this.cv=cv;this.wrap=wrap;this.o=o;this.ml=50;this.mr=14;this.mt=18;this.mb=36;this.v={x1:10,y1:10,sx:2,sy:2};this.labs=[]}
  fit(){const W=Math.max(250,Math.min(this.o.maxW||680,Math.floor(this.wrap.clientWidth)));const H=Math.round(Math.max(this.o.minH||240,W*(this.o.ratio||.8)));
    const dpr=window.devicePixelRatio||1;this.cv.width=Math.round(W*dpr);this.cv.height=Math.round(H*dpr);this.cv.style.width=W+'px';this.cv.style.height=H+'px';
    this.g=this.cv.getContext('2d');this.g.setTransform(dpr,0,0,dpr,0,0);this.W=W;this.H=H;this.ml=W<380?42:50}
  setView(xm,ym){const sx=niceStep(xm),sy=niceStep(ym);this.v={x1:Math.ceil(xm/sx-1e-9)*sx,y1:Math.ceil(ym/sy-1e-9)*sy,sx,sy}}
  get pw(){return this.W-this.ml-this.mr}get ph(){return this.H-this.mt-this.mb}
  X(x){return this.ml+x/this.v.x1*this.pw}Y(y){return this.mt+this.ph-y/this.v.y1*this.ph}
  inv(px,py){return[(px-this.ml)/this.pw*this.v.x1,(this.mt+this.ph-py)/this.ph*this.v.y1]}
  rect(){return[[0,0],[this.v.x1,0],[this.v.x1,this.v.y1],[0,this.v.y1]]}
  C(){return{ink:css('--ink'),bg:css('--bg'),line:css('--line'),gray:css('--gray'),navy:css('--navy'),teal:css('--teal'),amber:css('--amber'),red:css('--red'),violet:css('--violet'),green:css('--green')}}
  base(names){
    const g=this.g,c=this.C(),v=this.v;this.labs=[];
    g.clearRect(0,0,this.W,this.H);g.fillStyle=c.bg;g.fillRect(0,0,this.W,this.H);
    g.font='11px Lato,system-ui,sans-serif';g.lineWidth=1;
    for(let k=0;k*v.sx<=v.x1+1e-9;k++){const x=k*v.sx,px=Math.round(this.X(x))+.5;g.strokeStyle=rgba(c.line,.7);g.beginPath();g.moveTo(px,this.mt);g.lineTo(px,this.mt+this.ph);g.stroke();g.fillStyle=c.gray;g.textAlign='center';g.textBaseline='top';if(k>0||true)g.fillText(decTxt(x,4),this.X(x),this.mt+this.ph+4)}
    for(let k=0;k*v.sy<=v.y1+1e-9;k++){const y=k*v.sy,py=Math.round(this.Y(y))+.5;g.strokeStyle=rgba(c.line,.7);g.beginPath();g.moveTo(this.ml,py);g.lineTo(this.ml+this.pw,py);g.stroke();g.fillStyle=c.gray;g.textAlign='right';g.textBaseline='middle';if(k>0)g.fillText(decTxt(y,4),this.ml-6,this.Y(y))}
    g.strokeStyle=c.gray;g.lineWidth=1.6;g.beginPath();g.moveTo(this.ml,this.Y(0));g.lineTo(this.ml+this.pw,this.Y(0));g.moveTo(this.X(0),this.mt);g.lineTo(this.X(0),this.mt+this.ph);g.stroke();
    g.fillStyle=c.ink;g.font='italic 15px "Libertinus Serif","Times New Roman",serif';
    g.textAlign='right';g.textBaseline='bottom';g.fillText(vTxt(names[0]),this.ml+this.pw,this.H-2);
    g.textAlign='left';g.textBaseline='top';g.fillText(vTxt(names[1]),this.ml+5,1);
  }
  clipOn(){const g=this.g;g.save();g.beginPath();g.rect(this.ml,this.mt,this.pw,this.ph);g.clip()}
  clipOff(){this.g.restore()}
  path(poly){const g=this.g;g.beginPath();poly.forEach((P,i)=>{const x=this.X(P[0]),y=this.Y(P[1]);i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath()}
  fill(poly,color){if(poly.length<3)return;this.clipOn();this.path(poly);this.g.fillStyle=color;this.g.fill();this.clipOff()}
  /* extremos visíveis da reta a·x + b·y = c */
  seg(a,b,c){
    let P,Q;const v=this.v;
    if(Math.abs(b)>1e-15){P=[0,c/b];Q=[v.x1,(c-a*v.x1)/b]}else if(Math.abs(a)>1e-15){P=[c/a,0];Q=[c/a,v.y1]}else return null;
    let t0=0,t1=1;const dx=Q[0]-P[0],dy=Q[1]-P[1];
    const pp=[-dx,dx,-dy,dy],qq=[P[0],v.x1-P[0],P[1],v.y1-P[1]];
    for(let k=0;k<4;k++){if(Math.abs(pp[k])<1e-15){if(qq[k]<-1e-9)return null;continue}const t=qq[k]/pp[k];if(pp[k]<0){if(t>t1)return null;if(t>t0)t0=t}else{if(t<t0)return null;if(t<t1)t1=t}}
    return[[P[0]+t0*dx,P[1]+t0*dy],[P[0]+t1*dx,P[1]+t1*dy]];
  }
  line(a,b,c,color,w,dash){const s=this.seg(a,b,c);if(!s)return null;const g=this.g;this.clipOn();g.setLineDash(dash||[]);g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(this.X(s[0][0]),this.Y(s[0][1]));g.lineTo(this.X(s[1][0]),this.Y(s[1][1]));g.stroke();g.setLineDash([]);this.clipOff();return s}
  segment(P,Q,color,w,dash){const g=this.g;this.clipOn();g.setLineDash(dash||[]);g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(this.X(P[0]),this.Y(P[1]));g.lineTo(this.X(Q[0]),this.Y(Q[1]));g.stroke();g.setLineDash([]);this.clipOff()}
  dot(x,y,r,fill,stroke,sw){const g=this.g;g.beginPath();g.arc(this.X(x),this.Y(y),r,0,7);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=sw||2;g.stroke()}}
  /* texto com halo e sem sobreposição (tenta várias posições) */
  text(t,px,py,color,o={}){
    const g=this.g,c=this.C();g.font=o.font||'bold 13px Lato,system-ui,sans-serif';
    const w=g.measureText(t).width,h=14;const tries=o.tries||[[8,-8],[8,14],[-8-w,-8],[-8-w,14],[8,-22],[-w/2,-14]];
    let best=null;
    for(const [dx,dy] of tries){const r={x:px+dx,y:py+dy-h+3,w,h};
      if(r.x<this.ml+2||r.x+r.w>this.W-2||r.y<1||r.y+r.h>this.mt+this.ph-1)continue;
      if(this.labs.some(L=>!(r.x+r.w<L.x||L.x+L.w<r.x||r.y+r.h<L.y||L.y+L.h<r.y)))continue;best=r;break}
    if(!best){const dx=tries[0][0],dy=tries[0][1];best={x:Math.min(Math.max(px+dx,this.ml+2),this.W-w-2),y:Math.min(Math.max(py+dy-h+3,1),this.mt+this.ph-h),w,h}}
    this.labs.push(best);
    g.textAlign='left';g.textBaseline='alphabetic';g.lineJoin='round';g.strokeStyle=rgba(c.bg,.9);g.lineWidth=4;g.strokeText(t,best.x,best.y+h-3);g.fillStyle=color;g.fillText(t,best.x,best.y+h-3);
  }
  reserve(px,py,r){this.labs.push({x:px-r,y:py-r,w:2*r,h:2*r})}
  arrow(x0,y0,x1,y1,color,w){const g=this.g;const a=Math.atan2(y1-y0,x1-x0);g.strokeStyle=color;g.fillStyle=color;g.lineWidth=w||2.4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1-7*Math.cos(a),y1-7*Math.sin(a));g.stroke();
    g.beginPath();g.moveTo(x1,y1);g.lineTo(x1-11*Math.cos(a-.42),y1-11*Math.sin(a-.42));g.lineTo(x1-11*Math.cos(a+.42),y1-11*Math.sin(a+.42));g.closePath();g.fill()}
  /* escala automática a partir das interseções com os eixos, vértices e pontos extra */
  auto(lp,G,extra){
    const xs=[1e-9],ys=[1e-9];
    lp.A.forEach((r,i)=>{const a=r[0].val(),b=r[1].val(),c=lp.b[i].val();if(Math.abs(a)>1e-12&&c/a>0)xs.push(c/a);if(Math.abs(b)>1e-12&&c/b>0)ys.push(c/b)});
    if(G)G.verts.forEach(P=>{xs.push(P.x.val());ys.push(P.y.val())});
    (extra||[]).forEach(P=>{xs.push(P[0]);ys.push(P[1])});
    let xm=Math.max(...xs),ym=Math.max(...ys);
    if(G&&G.unbounded){const vx=Math.max(1e-9,...G.verts.map(P=>P.x.val())),vy=Math.max(1e-9,...G.verts.map(P=>P.y.val()));
      if(G.rays.some(d=>d[0].val()>0))xm=Math.max(xm,vx*1.5,ym*.4);if(G.rays.some(d=>d[1].val()>0))ym=Math.max(ym,vy*1.5,xm*.4)}
    if(xm<1e-6)xm=ym>1e-6?ym:10;if(ym<1e-6)ym=xm;
    this.setView(xm*1.12,ym*1.12);
  }
  /* restrições, sombreados e CSA. Devolve o polígono do CSA (float) */
  constraints(lp,o={}){
    const c=this.C();let csa=this.rect();
    lp.A.forEach((r,i)=>{const a=r[0].val(),b=r[1].val(),cc=lp.b[i].val();csa=clipRel(csa,a,b,cc,lp.rel[i]);
      if(o.shade&&lp.rel[i]!=='='&&!(a===0&&b===0)){const hp=clipRel(this.rect(),a,b,cc,lp.rel[i]);this.fill(hp,rgba(c[CCOL[i%5].slice(2)],.07))}});
    if(csa.length>=3){this.fill(csa,rgba(c.teal,o.csaAlpha||.30))}
    lp.A.forEach((r,i)=>{const a=r[0].val(),b=r[1].val(),cc=lp.b[i].val();if(a===0&&b===0)return;
      const col=c[CCOL[i%5].slice(2)];const s=this.line(a,b,cc,col,lp.rel[i]==='='?2.6:2);
      if(s&&o.labels!==false){const pts=[.1,.9,.25,.75,.5].map(t=>[s[0][0]+t*(s[1][0]-s[0][0]),s[0][1]+t*(s[1][1]-s[0][1])]);
        const P=pts.find(P=>P[1]>this.v.y1*.06&&P[0]>this.v.x1*.04)||pts[0];this.text('('+(i+1)+')',this.X(P[0]),this.Y(P[1]),col,{tries:[[6,-6],[6,16],[-30,-6],[-30,16]]})}});
    if(csa.length>=2){const g=this.g;this.clipOn();this.path(csa);g.strokeStyle=c.teal;g.lineWidth=csa.length>=3&&Math.abs(area(csa))>1e-9*this.v.x1*this.v.y1?1.6:6;g.stroke();this.clipOff()}
    return csa;
  }
}
function area(p){let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1]}return s/2}
/* parte da reta c1·x + c2·y = z que está dentro de um polígono convexo (float) */
function lineInPoly(poly,c1,c2,z,plot){
  const s=plot.seg(c1,c2,z);if(!s||poly.length<2)return null;
  let P=s[0],Q=s[1],t0=0,t1=1;const n=poly.length;const cx=poly.reduce((a,p)=>a+p[0],0)/n,cy=poly.reduce((a,p)=>a+p[1],0)/n;
  for(let i=0;i<n;i++){const A=poly[i],B=poly[(i+1)%n];let nx=B[1]-A[1],ny=A[0]-B[0];if(nx*(cx-A[0])+ny*(cy-A[1])<0){nx=-nx;ny=-ny}
    const fp=nx*(P[0]-A[0])+ny*(P[1]-A[1]),fd=nx*(Q[0]-P[0])+ny*(Q[1]-P[1]);const sc=Math.hypot(nx,ny)*Math.max(plot.v.x1,plot.v.y1)*1e-9;
    if(Math.abs(fd)<1e-15){if(fp<-sc)return null;continue}const t=-fp/fd;if(fd>0){if(t>t0)t0=t}else{if(t<t1)t1=t}}
  if(t0>t1+1e-9)return null;return[[P[0]+t0*(Q[0]-P[0]),P[1]+t0*(Q[1]-P[1])],[P[0]+t1*(Q[0]-P[0]),P[1]+t1*(Q[1]-P[1])]];
}
/* rótulo de ponto com frações: (7/12, 5/12) */
const ptTxt=(x,y)=>'('+x.str()+', '+y.str()+')';
const ptHTML=(x,y)=>'('+x.html()+', '+y.html()+')';
/* hash de URL ↔ problema: max;30,20;3,1,<=,150;1,2,<=,100 */
function toHash(lp){const h=f=>inTxt(f).replace(',','.');return lp.sense+';'+lp.c.map(h).join(',')+';'+lp.A.map((r,i)=>r.map(h).concat([{'<=':'le','>=':'ge','=':'eq'}[lp.rel[i]],h(lp.b[i])]).join(',')).join(';')}
function fromHash(h){try{h=decodeURIComponent(h).replace(/^#/,'');const p=h.split(';');if(p.length<2)return null;const sense=p[0]==='min'?'min':'max';const c=p[1].split(',').map(parseFr);
  const A=[],rel=[],b=[];p.slice(2).forEach(s=>{const t=s.split(',');const rl={le:'<=',ge:'>=',eq:'='}[t[t.length-2]];A.push(t.slice(0,t.length-2).map(parseFr));rel.push(rl);b.push(parseFr(t[t.length-1]))});
  if(c.some(x=>!x)||A.some(r=>r.length!==c.length||r.some(x=>!x))||b.some(x=>!x)||rel.some(x=>!x))return null;return make(sense,c,A,rel,b)}catch(e){return null}}
return{F,sgn,cmpF,MV,MV0,REL,FLIP,vTxt,vHTML,exactDec,cTxt,cHTML,inTxt,decTxt,resHTML,niceStep,isTerm,
  make,clone,norm,dot,lhs,feasible,estado,linHTML,modelHTML,standard,zrow,simplex,sombra,quadroHTML,
  combos,binom,solveSq,algebraic,graph2,dual,editor,css,rgba,CCOL,clipLE,clipRel,Plot,area,lineInPoly,ptTxt,ptHTML,toHash,fromHash};
})();
