/* ===== Tema 2: componentes partilhados (quadros do Simplex, gráficos de PL) ===== */
const num=x=>String(x).replace('-','−');
function cm(rows,o={}){return '<span class="mat math"'+(o.id?' id="'+o.id+'"':'')+'><table>'+rows.map((r,i)=>'<tr>'+r.map((x,j)=>'<td data-i="'+i+'" data-j="'+j+'"'+(o.aug!==undefined&&j===o.aug?' class="aug"':'')+'>'+x+'</td>').join('')+'</tr>').join('')+'</table></span>'}
const letters=(s,d0)=>[...s].map((c,i)=>c===' '?' ':'<span class="lt" style="--d:'+(i+(d0||0))+'">'+c+'</span>').join('');
function opener(b,title,line,items,ref){
  return slide({tone:'dark',bloco:b,bg:'open',nav:title,title,
   html:'<div class="open stg"><div class="bk" style="--d:0">'+esc(ref)+'</div><h2 style="--d:1">'+title+'</h2><p style="--d:3">'+line+'</p><ul style="--d:5">'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>'});
}
/* ---------- quadro do Simplex na notação do professor ----------
 o: {entra, ratios, piv, ops, sol, small} ; q vem do motor Python (strings LaTeX) */
const T=s=>tex(String(s));
function quadroHTML(q,o={}){
  const nv=q.cols.length,ent=o.entra?q.entra:null,sai=o.piv?q.sai:null;
  const showR=o.ratios&&q.ratios&&q.ratios.length;
  let h='<table class="qd'+(o.small?' sm':'')+'">';
  // cabeçalho: nomes das variáveis e custos
  h+='<tr class="h1"><td class="an"></td><td></td><td></td>'+q.cols.map((c,j)=>'<td class="'+(j===ent?'ec ':'')+'vn">'+T(c)+'</td>').join('')+'<td></td><td></td><td class="an"></td></tr>';
  h+='<tr class="h2"><td class="an"></td><td>'+T('X_b')+'</td><td>'+T('c_j^b')+'</td>'+q.cost.map((c,j)=>'<td class="'+(j===ent?'ec':'')+'">'+T(c)+'</td>').join('')+'<td>RHS</td><td>'+(showR?T('r'):'')+'</td><td class="an"></td></tr>';
  q.rows.forEach((r,i)=>{
    const isS=i===sai;
    const left=o.ops&&q.mult[i]!==undefined?T(q.mult[i]):'';
    const right=o.ops&&q.div[i]!==undefined?(q.div[i]==='1'?'':T(':'+(q.div[i].startsWith('-')||q.div[i].startsWith('\\frac')?'\\left('+q.div[i]+'\\right)':q.div[i]))):'';
    h+='<tr class="'+(isS?'sr':'')+'"><td class="an l">'+left+'</td><td class="bv">'+T(q.cols[q.basis[i]])+'</td><td>'+T(q.cost[q.basis[i]])+'</td>'+
      r.map((x,j)=>{const c=[];if(j===ent)c.push('ec');if(o.piv&&q.piv&&q.piv[0]===i&&q.piv[1]===j)c.push('pv');return '<td'+(c.length?' class="'+c.join(' ')+'"':'')+'><span>'+T(x)+'</span></td>'}).join('')+
      '<td class="rhs">'+T(q.rhs[i])+'</td><td class="ra">'+(showR?(q.ratios[i]===null?'–':T(q.ratios[i])+(isS&&o.piv?' <span class="mn">mín.</span>':'')):'')+'</td><td class="an r">'+right+'</td></tr>'});
  h+='<tr class="cz"><td class="an"></td><td colspan="2">'+T('c_j-z_j')+'</td>'+q.cz.map((c,j)=>'<td class="'+(j===ent?'ec best':'')+'">'+T(c)+'</td>').join('')+'<td class="rhs zv">'+T((o.sol?'z^*=':'z=')+q.val)+'</td><td></td><td class="an"></td></tr>';
  return h+'</table>';
}
/* ---------- gráfico de PL (2 variáveis) ----------
 cfg: {box:[X,Y], cons:[{a:[a1,a2],r:'<=',b,lab,col}], c:[c1,c2], sense, z, pts:[{p:[x,y],lab,col}], csa:true, tick} */
const PLCOL=['#0E8797','#E9A537','#7A5CC2','#1FA57A','#E5484D','#3B6EA8'];
function clipHalf(poly,a,b,le){const out=[];const f=p=>a[0]*p[0]+a[1]*p[1]-b;const inside=p=>le?f(p)<=1e-9:f(p)>=-1e-9;
  for(let i=0;i<poly.length;i++){const P=poly[i],Q=poly[(i+1)%poly.length];const pi=inside(P),qi=inside(Q);
    if(pi)out.push(P);if(pi!==qi){const fp=f(P),fq=f(Q),t=fp/(fp-fq);out.push([P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])])}}return out}
function csaPoly(cfg){let p=[[0,0],[cfg.box[0],0],[cfg.box[0],cfg.box[1]],[0,cfg.box[1]]];
  (cfg.cons||[]).forEach(k=>{if(k.off)return;if(k.r!=='>=')p=clipHalf(p,k.a,k.b,true);if(k.r!=='<='&&p.length)p=clipHalf(p,k.a,k.b,false)});return p}
function plDraw(cv,cfg){
  const dpr=2,W=cv.clientWidth||+cv.getAttribute('width'),H=cv.clientHeight||+cv.getAttribute('height');
  if(cv.width!==W*dpr){cv.width=W*dpr;cv.height=H*dpr}
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  const pad={l:78,r:30,t:24,b:62},X=cfg.box[0],Y=cfg.box[1];
  const sx=x=>pad.l+x/X*(W-pad.l-pad.r),sy=y=>H-pad.b-y/Y*(H-pad.t-pad.b);
  const fs=cfg.fs||22;
  // grelha
  const tk=cfg.tick||[X/5,Y/5];
  g.strokeStyle='rgba(20,38,58,.08)';g.lineWidth=1;g.font=fs+'px Lato, sans-serif';g.fillStyle='#5F6B7A';g.textAlign='center';
  for(let x=0;x<=X+1e-9;x+=tk[0]){g.beginPath();g.moveTo(sx(x),sy(0));g.lineTo(sx(x),sy(Y));g.stroke();g.fillText(fmtN(x),sx(x),H-pad.b+fs+8)}
  g.textAlign='right';for(let y=0;y<=Y+1e-9;y+=tk[1]){g.beginPath();g.moveTo(sx(0),sy(y));g.lineTo(sx(X),sy(y));g.stroke();g.fillText(fmtN(y),pad.l-12,sy(y)+fs*.35)}
  // CSA
  if(cfg.csa!==false){const P=csaPoly(cfg);if(P.length>=2){g.beginPath();P.forEach((p,i)=>i?g.lineTo(sx(p[0]),sy(p[1])):g.moveTo(sx(p[0]),sy(p[1])));g.closePath();
    g.fillStyle=cfg.csaCol||'rgba(14,135,151,.20)';g.fill();g.strokeStyle='rgba(14,135,151,.9)';g.lineWidth=P.length===2||cfg.eqcsa?6:2.5;g.stroke()}}
  // restrições
  (cfg.cons||[]).forEach((k,i)=>{if(k.off||k.hide)return;const col=k.col||PLCOL[i%PLCOL.length];g.strokeStyle=col;g.lineWidth=k.w||3.2;g.setLineDash(k.dash?[10,8]:[]);
    const seg=lineInBox(k.a,k.b,X,Y);if(seg){g.beginPath();g.moveTo(sx(seg[0][0]),sy(seg[0][1]));g.lineTo(sx(seg[1][0]),sy(seg[1][1]));g.stroke();
      if(k.lab){g.setLineDash([]);g.font='600 '+(fs-1)+'px Lato, sans-serif';g.fillStyle=col;g.textAlign='left';const L=k.labAt||seg[1];const lx=Math.min(sx(L[0])+8,W-210),ly=Math.max(sy(L[1])+(k.labDy||-10),fs+4);g.fillText(k.lab,lx,ly)}}g.setLineDash([])});
  // eixos
  g.strokeStyle='#14263A';g.lineWidth=2.2;g.beginPath();g.moveTo(sx(0),sy(0));g.lineTo(sx(X),sy(0));g.moveTo(sx(0),sy(0));g.lineTo(sx(0),sy(Y));g.stroke();
  g.fillStyle='#14263A';g.font='italic '+(fs+4)+'px KaTeX_Math, serif';g.textAlign='left';g.fillText('x',sx(X)-30,sy(0)-12);g.font=(fs-2)+'px KaTeX_Main, serif';g.fillText('1',sx(X)-17,sy(0)-6);
  g.font='italic '+(fs+4)+'px KaTeX_Math, serif';g.fillText('x',sx(0)+12,sy(Y)+22);g.font=(fs-2)+'px KaTeX_Main, serif';g.fillText('2',sx(0)+25,sy(Y)+28);
  // reta da função objetivo
  if(cfg.c&&cfg.z!==null&&cfg.z!==undefined){const seg=lineInBox(cfg.c,cfg.z,X,Y);if(seg){g.strokeStyle=cfg.zcol||'#E5484D';g.lineWidth=3.6;g.setLineDash([14,9]);g.beginPath();g.moveTo(sx(seg[0][0]),sy(seg[0][1]));g.lineTo(sx(seg[1][0]),sy(seg[1][1]));g.stroke();g.setLineDash([]);
    if(cfg.arrow){const m=[(seg[0][0]+seg[1][0])/2,(seg[0][1]+seg[1][1])/2],n=Math.hypot(cfg.c[0]/X,cfg.c[1]/Y),dir=(cfg.sense==='min'?-1:1);
      const d=[dir*cfg.c[0]/X/n*.09*X,dir*cfg.c[1]/Y/n*.09*Y];arrow(g,sx(m[0]),sy(m[1]),sx(m[0]+d[0]),sy(m[1]+d[1]),cfg.zcol||'#E5484D')}}}
  // pontos
  (cfg.pts||[]).forEach(pt=>{const x=sx(pt.p[0]),y=sy(pt.p[1]);g.beginPath();g.arc(x,y,pt.r||8,0,7);g.fillStyle=pt.col||'#14263A';g.fill();g.strokeStyle='#fff';g.lineWidth=2.5;g.stroke();
    if(pt.lab){g.font=(pt.bold?'700 ':'600 ')+(fs)+'px Lato, sans-serif';g.fillStyle=pt.col||'#14263A';g.textAlign=pt.align||'left';g.fillText(pt.lab,x+(pt.dx===undefined?12:pt.dx),y+(pt.dy===undefined?-12:pt.dy))}});
  return {sx,sy,W,H,pad,X,Y};
}
function fmtN(v){return String(Math.round(v*100)/100).replace('.',',')}
function lineInBox(a,b,X,Y){const P=[];const add=p=>{if(p[0]>=-1e-9&&p[0]<=X+1e-9&&p[1]>=-1e-9&&p[1]<=Y+1e-9&&!P.some(q=>Math.abs(q[0]-p[0])<1e-7&&Math.abs(q[1]-p[1])<1e-7))P.push(p)};
  if(a[1]!==0){add([0,b/a[1]]);add([X,(b-a[0]*X)/a[1]])}if(a[0]!==0){add([b/a[0],0]);add([(b-a[1]*Y)/a[0],Y])}return P.length>=2?[P[0],P[P.length-1]]:null}
function arrow(g,x0,y0,x1,y1,col){g.strokeStyle=col;g.fillStyle=col;g.lineWidth=4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();const a=Math.atan2(y1-y0,x1-x0);g.beginPath();g.moveTo(x1,y1);g.lineTo(x1-18*Math.cos(a-.4),y1-18*Math.sin(a-.4));g.lineTo(x1-18*Math.cos(a+.4),y1-18*Math.sin(a+.4));g.closePath();g.fill()}
/* problema de referência do caderno teórico (Exemplo 1) */
const EX1={box:[110,110],tick:[10,10],cons:[{a:[3,1],r:'<=',b:150,lab:'3x₁ + x₂ = 150 (matéria-prima)',col:'#0E8797',labAt:[19,93],labDy:4},{a:[1,2],r:'<=',b:100,lab:'x₁ + 2x₂ = 100 (horas)',col:'#E9A537',labAt:[60,22],labDy:-12}],c:[30,20],sense:'max'};
