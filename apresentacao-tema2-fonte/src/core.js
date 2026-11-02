/* ===== Núcleo da apresentação: motor de slides, fundo animado, utilitários ===== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const MACROS={"\\T":"^{\\mathsf{T}}","\\R":"\\mathbb{R}","\\adj":"\\operatorname{adj}","\\rang":"\\operatorname{r}"};
function tex(s,display){try{return katex.renderToString(s,{displayMode:!!display,throwOnError:false,macros:MACROS,trust:true,strict:false})}catch(e){return '<span class="red">'+s+'</span>'}}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* texto com $math$, **negrito**, *itálico* */
function rich(s){
  if(s==null)return '';
  const out=[];let i=0;const re=/\$([^$]+)\$|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g;let m;
  while((m=re.exec(s))){out.push(esc(s.slice(i,m.index)));
    if(m[1]!==undefined)out.push(tex(m[1]));else if(m[2]!==undefined)out.push('<b>'+rich(m[2])+'</b>');else out.push('<i>'+esc(m[3])+'</i>');
    i=re.lastIndex}
  out.push(esc(s.slice(i)));return out.join('');
}
function texify(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const ns=[];while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>{if(n.nodeValue.includes('$')&&!n.parentElement.closest('.katex,script,style,.notex')){const sp=document.createElement('span');
    sp.innerHTML=n.nodeValue.split(/(\$[^$]+\$)/).map(p=>/^\$[^$]+\$$/.test(p)?tex(p.slice(1,-1)):esc(p)).join('');n.replaceWith(...sp.childNodes)}})}
/* ---------- registo de slides ---------- */
const SL=[];const BLOCOS=(typeof DECK!=='undefined'&&DECK.blocos)||[
 {k:'A',nome:'Matrizes'},{k:'B',nome:'Característica e condensação'},{k:'C',nome:'Determinantes'},{k:'D',nome:'Matriz inversa'},{k:'E',nome:'Sistemas de equações lineares'},{k:'F',nome:'Fecho'}];
function slide(o){SL.push(Object.assign({tone:'light',bloco:'A',html:'',steps:0},o));return o}
const bnome=k=>(BLOCOS.find(b=>b.k===k)||{}).nome||'';
/* cabeçalho padrão */
const hd=(title,bl)=>'<div class="hd"><div class="bl"><i></i>'+esc(bnome(bl))+'</div><h2>'+title+'</h2></div>';
let F_COUNTER=0;
/* ---------- motor ---------- */
const ST={i:0,step:0,ov:false};
let stage,chrome;
function fitStage(){
  const s=Math.min(innerWidth/1920,innerHeight/1080);
  stage.style.transform='scale('+s+')';
  stage.style.margin=((innerHeight-1080)/2)+'px '+((innerWidth-1920)/2)+'px';
}
function buildDOM(){
  stage=$('#stage');
  SL.forEach((o,i)=>{
    const s=document.createElement('section');s.className='slide after';s.dataset.tone=o.tone;s.dataset.i=i;
    s.innerHTML=typeof o.html==='function'?o.html():o.html;texify(s);
    stage.insertBefore(s,$('#chrome'));o.el=s;
    const fr=$$('.f',s);o.steps=Math.max(o.steps||0,...fr.map(f=>+f.dataset.s||0),0);
  });
  // progresso por blocos
  const pr=$('#prog');BLOCOS.forEach(b=>{const n=SL.filter(s=>s.bloco===b.k).length;if(!n)return;
    const d=document.createElement('div');d.className='seg';d.style.flex=n;d.dataset.b=b.k;d.innerHTML='<i></i>';d.title=b.nome;pr.appendChild(d)});
}
function setStepDOM(o,step){$$('.f',o.el).forEach(f=>f.classList.toggle('show',(+f.dataset.s||0)<=step))}
function go(i,opts={}){
  i=Math.max(0,Math.min(SL.length-1,i));
  const prev=ST.i,dir=i>=prev?1:-1;
  const cur=SL[i];
  if(!cur.inited){cur.inited=true;try{cur.init&&cur.init(cur.el,cur)}catch(e){console.error('init',i,e)}}
  SL.forEach((o,k)=>{o.el.classList.remove('on','before','after');if(k===i)o.el.classList.add('on');else o.el.classList.add(k<i?'before':'after')});
  if(prev!==i&&SL[prev].leave)try{SL[prev].leave(SL[prev].el)}catch(e){}
  ST.i=i;ST.step=opts.last?cur.steps:0;setStepDOM(cur,ST.step);
  stage.classList.toggle('dark',cur.tone==='dark');stage.classList.toggle('light',cur.tone!=='dark');
  if(cur.enter)try{cur.enter(cur.el,dir)}catch(e){console.error('enter',i,e)}
  BG.mode=cur.bg||'calm';
  tmrSync(cur);
  // progresso
  $$('#prog .seg').forEach(sg=>{const b=sg.dataset.b;const idx=SL.map((o,k)=>o.bloco===b?k:-1).filter(k=>k>=0);
    const done=idx.filter(k=>k<=i).length;sg.firstChild.style.width=(100*done/idx.length)+'%'});
  $('#count').textContent=String(i+1).padStart(2,'0')+' / '+String(SL.length).padStart(2,'0');
  $('#brand').textContent='Matemática I · '+((typeof DECK!=='undefined'&&DECK.tema)||'Tema 1')+' · '+bnome(cur.bloco);
  history.replaceState(null,'','#'+(i+1));
  $$('#ov .card').forEach(c=>c.classList.toggle('cur',+c.dataset.i===i));
}
function next(){const o=SL[ST.i];
  if(o.onNext&&o.onNext()===true)return;
  if(ST.step<o.steps){ST.step++;setStepDOM(o,ST.step);o.onStep&&o.onStep(ST.step,1);return}
  if(ST.i<SL.length-1)go(ST.i+1)}
function prev(){const o=SL[ST.i];
  if(o.onPrev&&o.onPrev()===true)return;
  if(ST.step>0){ST.step--;setStepDOM(o,ST.step);o.onStep&&o.onStep(ST.step,-1);return}
  if(ST.i>0)go(ST.i-1,{last:true})}
function buildOverview(){
  const ov=$('#ov');let h='<h3>Índice da apresentação</h3>';
  BLOCOS.forEach(b=>{const l=SL.map((o,i)=>o.bloco===b.k?i:-1).filter(i=>i>=0);if(!l.length)return;
    h+='<div class="grp"><h4>'+esc(b.nome)+'</h4><div class="cards">'+l.map(i=>'<div class="card" data-i="'+i+'"><small>'+String(i+1).padStart(2,'0')+'</small>'+esc(SL[i].nav||SL[i].title||'')+'</div>').join('')+'</div></div>'});
  ov.innerHTML=h;
  ov.addEventListener('click',e=>{const c=e.target.closest('.card');if(c){toggleOV(false);go(+c.dataset.i)}else if(e.target===ov)toggleOV(false)});
}
function toggleOV(v){ST.ov=v===undefined?!ST.ov:v;$('#ov').classList.toggle('show',ST.ov)}
let hintT;function hint(t){const h=$('#hint');h.textContent=t;h.classList.add('show');clearTimeout(hintT);hintT=setTimeout(()=>h.classList.remove('show'),2600)}
function fs(){if(!document.fullscreenElement)document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();else document.exitFullscreen()}
function bindKeys(){
  addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select'))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key;
    if(ST.ov){if(k==='Escape'||k==='o'||k==='O')toggleOV(false);return}
    if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();next()}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();prev()}
    else if(k==='Home')go(0);else if(k==='End')go(SL.length-1);
    else if(k==='ArrowDown'||k==='ArrowUp'){const o=SL[ST.i];if(o.onKeyV){e.preventDefault();o.onKeyV(k==='ArrowDown'?1:-1)}}
    else if(k==='f'||k==='F')fs();
    else if((k==='t'||k==='T')&&(SL[ST.i].exs||SL[ST.i].tmr))tmrOpen(!TMR.open);
    else if((k==='p'||k==='P')&&(SL[ST.i].exs||SL[ST.i].tmr)&&TMR.open)tmrToggle();
    else if(k==='o'||k==='O'||k==='Escape')toggleOV();
    else if(k==='?'||k==='h'||k==='H')hint('→ avançar · ← recuar · O índice · F ecrã inteiro · clique nos cartões dos exercícios para ver a solução · T cronómetro nos exercícios e nos testes');
  });
  $('.zone.l').onclick=prev;$('.zone.r').onclick=next;
  let tx=null;
  addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
  addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60){dx<0?next():prev()}tx=null});
  addEventListener('wheel',e=>{if(e.target.closest('.scroll'))return;},{passive:true});
}
/* ---------- cronómetro dos exercícios recomendados ---------- */
const DKEY=(typeof DECK!=='undefined'&&DECK.key)||'m1t1';
const SOLREF=e=>e.pg?'Resolução detalhada na sebenta, p. '+e.pg:((typeof DECK!=='undefined'&&DECK.solref)||'');
const TMR={dur:600,left:600,run:false,end:0,open:false,iv:null,ctx:null,el:null,kind:'ex',durs:{ex:600,t:1200}};
try{const s=JSON.parse(localStorage.getItem(DKEY+'_tmr')||'{}');if(s.dur>=60&&s.dur<=3600){TMR.durs.ex=s.dur|0}if(s.durT>=60&&s.durT<=3600){TMR.durs.t=s.durT|0}TMR.dur=TMR.left=TMR.durs.ex;TMR.open=!!s.open}catch(e){}
const tmrSave=()=>{try{TMR.durs[TMR.kind]=TMR.dur;localStorage.setItem(DKEY+'_tmr',JSON.stringify({dur:TMR.durs.ex,durT:TMR.durs.t,open:TMR.open}))}catch(e){}};
const tmrFmt=s=>{s=Math.max(0,Math.ceil(s-1e-6));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const TMR_ICON='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4.2l2.6 1.6M9.5 2.8h5M12 2.8v3.2M18.6 6.4l1.4-1.4"/></svg>';
const TMR_PLAY='<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>';
const TMR_PAUSE='<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><rect x="6" y="5" width="4.4" height="14" rx="1.4"/><rect x="13.6" y="5" width="4.4" height="14" rx="1.4"/></svg>';
const TMR_RESET='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4.5v4.6h4.6"/></svg>';
const TMR_X='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function buildTimer(){
  const d=document.createElement('div');d.id='tmr';d.className='off';
  d.innerHTML='<button class="tg" data-t="tog" title="Abrir o cronómetro (T)" aria-label="Abrir o cronómetro">'+TMR_ICON+'<span class="tgt">10:00</span></button>'+
   '<div class="pn" role="group" aria-label="Cronómetro do exercício">'+
   '<button class="rb" data-t="minus" title="Menos 1 minuto" aria-label="Menos 1 minuto">−</button>'+
   '<button class="dg" data-t="edit" title="Clique para escrever o tempo" aria-live="off">10:00</button>'+
   '<input class="ed" type="text" inputmode="decimal" maxlength="6" aria-label="Tempo em minutos" hidden>'+
   '<button class="rb" data-t="plus" title="Mais 1 minuto" aria-label="Mais 1 minuto">+</button>'+
   '<button class="rb pl" data-t="play" title="Iniciar ou pausar (P)" aria-label="Iniciar">'+TMR_PLAY+'</button>'+
   '<button class="rb" data-t="reset" title="Reiniciar" aria-label="Reiniciar">'+TMR_RESET+'</button>'+
   '<button class="rb cl" data-t="close" title="Fechar (T)" aria-label="Fechar o cronómetro">'+TMR_X+'</button>'+
   '<div class="bar"><i></i></div></div>';
  stage.insertBefore(d,$('#chrome'));TMR.el=d;
  const rep={t:null,iv:null};
  const stopRep=()=>{clearTimeout(rep.t);clearInterval(rep.iv)};
  d.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-t=plus],[data-t=minus]');if(!b)return;
    const k=b.dataset.t==='plus'?1:-1;tmrAdj(k*60);stopRep();rep.t=setTimeout(()=>{rep.iv=setInterval(()=>tmrAdj(k*60),130)},450)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>d.addEventListener(ev,stopRep));
  d.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;e.stopPropagation();
    const a=b.dataset.t;
    if(a==='tog')tmrOpen(true);else if(a==='close')tmrOpen(false);
    else if(a==='play')tmrToggle();else if(a==='reset')tmrReset();else if(a==='edit')tmrEdit();});
  const ed=$('.ed',d);
  ed.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){tmrCommit(ed.value);tmrEditEnd()}else if(e.key==='Escape')tmrEditEnd()});
  ed.addEventListener('blur',()=>{if(!ed.hidden){tmrCommit(ed.value);tmrEditEnd()}});
  ['touchstart','touchend'].forEach(ev=>d.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
  tmrRender();
}
function tmrSync(cur){if(!TMR.el)return;const on=!!(cur&&(cur.exs||cur.tmr));TMR.el.classList.toggle('off',!on);
  if(on){const k=cur.tmr?'t':'ex';if(k!==TMR.kind){TMR.durs[TMR.kind]=TMR.dur;TMR.kind=k;TMR.dur=TMR.durs[k];tmrReset()}}}
function tmrOpen(v){TMR.open=v;tmrSave();tmrRender()}
function tmrAudio(){try{if(!TMR.ctx)TMR.ctx=new(window.AudioContext||window.webkitAudioContext)();if(TMR.ctx.state==='suspended')TMR.ctx.resume()}catch(e){}}
function tmrBeep(){tmrAudio();const c=TMR.ctx;if(!c)return;
  [0,.34,.68].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=i===2?1175:880;
    const t0=c.currentTime+t;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.22,t0+.03);g.gain.exponentialRampToValueAtTime(.001,t0+.28);
    o.connect(g);g.connect(c.destination);o.start(t0);o.stop(t0+.3)})}
function tmrTick(){
  if(!TMR.run)return;
  TMR.left=(TMR.end-Date.now())/1000;
  if(TMR.left<=0){TMR.left=0;TMR.run=false;clearInterval(TMR.iv);TMR.iv=null;TMR.done=true;tmrBeep()}
  tmrRender();
}
function tmrToggle(){
  tmrAudio();
  if(TMR.run){TMR.run=false;clearInterval(TMR.iv);TMR.iv=null;tmrRender();return}
  if(TMR.left<=0)TMR.left=TMR.dur;
  TMR.done=false;TMR.run=true;TMR.end=Date.now()+TMR.left*1000;
  clearInterval(TMR.iv);TMR.iv=setInterval(tmrTick,200);tmrRender();
}
function tmrReset(){TMR.run=false;TMR.done=false;clearInterval(TMR.iv);TMR.iv=null;TMR.left=TMR.dur;tmrRender()}
function tmrAdj(delta){
  const nd=Math.max(60,Math.min(3600,TMR.dur+delta));const real=nd-TMR.dur;if(!real)return;
  TMR.dur=nd;
  if(TMR.run){TMR.end+=real*1000;TMR.left=Math.max(5,(TMR.end-Date.now())/1000);TMR.end=Date.now()+TMR.left*1000}
  else{TMR.left=TMR.dur;TMR.done=false}
  tmrSave();tmrRender();
}
function tmrCommit(txt){
  const t=String(txt).trim().replace(',','.');let s=NaN,m;
  if((m=/^(\d{1,3}):([0-5]?\d)$/.exec(t)))s=+m[1]*60+ +m[2];
  else if(/^\d{1,3}(\.\d{1,2})?$/.test(t))s=Math.round(parseFloat(t)*60);
  if(!(s>=60))s=NaN;
  if(isNaN(s)){hint('Escreva o tempo em minutos, por exemplo 12 ou 7:30 (mínimo 1 minuto)');return}
  s=Math.min(3600,s);TMR.dur=s;
  if(TMR.run){TMR.end=Date.now()+s*1000;TMR.left=s}else{TMR.left=s;TMR.done=false}
  tmrSave();tmrRender();
}
function tmrEdit(){const ed=$('.ed',TMR.el),dg=$('.dg',TMR.el);ed.value=tmrFmt(TMR.dur).replace(/^0/,'').replace(/:00$/,'');dg.hidden=true;ed.hidden=false;ed.focus();ed.select()}
function tmrEditEnd(){const ed=$('.ed',TMR.el);if(ed.hidden)return;ed.hidden=true;$('.dg',TMR.el).hidden=false}
function tmrRender(){
  const d=TMR.el;if(!d)return;
  d.classList.toggle('open',TMR.open);d.classList.toggle('run',TMR.run);
  d.classList.toggle('warn',TMR.left<=120&&TMR.left>60);d.classList.toggle('crit',TMR.left<=60&&TMR.left>0);d.classList.toggle('end',!!TMR.done&&TMR.left<=0);
  const txt=tmrFmt(TMR.left);
  $('.dg',d).textContent=txt;$('.tgt',d).textContent=tmrFmt(TMR.run||TMR.left<TMR.dur?TMR.left:TMR.dur);
  const p=$('.pl',d);const want=TMR.run?'p':'s';if(p.dataset.k!==want){p.dataset.k=want;p.innerHTML=TMR.run?TMR_PAUSE:TMR_PLAY;p.setAttribute('aria-label',TMR.run?'Pausar':'Iniciar')}
  $('.bar i',d).style.width=(TMR.dur?100*Math.max(0,Math.min(1,TMR.left/TMR.dur)):0)+'%';
}
/* ---------- fundo animado: superfície em fio (eco da capa) ---------- */
const BG={mode:'calm',t:0,mx:0,my:0,nums:[]};
function startBG(){
  const c=$('#bg'),g=c.getContext('2d');c.width=1920;c.height=1080;
  for(let i=0;i<46;i++)BG.nums.push({x:Math.random()*1920,y:Math.random()*1080,v:Math.floor(Math.random()*19)-9,s:.4+Math.random()*.9,a:Math.random()*.5});
  addEventListener('pointermove',e=>{BG.mx=(e.clientX/innerWidth-.5);BG.my=(e.clientY/innerHeight-.5)});
  const NX=46,NY=30;let last=0;
  const P={calm:{cx:1120,cy:760,sc:900,tilt:1.05,al:.45,amp:.22},cover:{cx:1150,cy:600,sc:1150,tilt:1.0,al:.95,amp:.34},open:{cx:1100,cy:700,sc:1050,tilt:1.02,al:.75,amp:.3}};
  let cur={...P.calm};
  function frame(ts){
    requestAnimationFrame(frame);
    if(!stage.classList.contains('dark')||document.hidden)return;
    if(ts-last<33)return;last=ts;BG.t=ts/1000;
    const tg=P[BG.mode]||P.calm;for(const k in tg)cur[k]+=(tg[k]-cur[k])*.06;
    const t=BG.t,rot=.55+.18*Math.sin(t*.2)+BG.mx*.5,tl=cur.tilt+BG.my*.25;
    g.clearRect(0,0,1920,1080);
    // halo
    const gr=g.createRadialGradient(cur.cx,cur.cy-120,50,cur.cx,cur.cy,900);gr.addColorStop(0,'rgba(24,110,140,.30)');gr.addColorStop(1,'rgba(10,26,44,0)');g.fillStyle=gr;g.fillRect(0,0,1920,1080);
    const pts=[];
    for(let j=0;j<=NY;j++){const row=[];for(let i=0;i<=NX;i++){
      const x=(i/NX-.5)*3.2,y=(j/NY-.5)*2.2;
      const z=cur.amp*(Math.sin(1.7*x+t*.7)*Math.cos(2.1*y-t*.5)+.45*Math.sin(3.1*x-t*.9+y)+.3*Math.cos(2*x*y+t*.4));
      const xr=x*Math.cos(rot)-y*Math.sin(rot),yr=x*Math.sin(rot)+y*Math.cos(rot);
      const py=yr*Math.cos(tl)-z*Math.sin(tl),pz=yr*Math.sin(tl)+z*Math.cos(tl);
      const d=1/(1+.22*(pz+1.4));
      row.push([cur.cx+xr*cur.sc*d*.5,cur.cy+py*cur.sc*d*.5,z,pz]);}pts.push(row)}
    g.lineWidth=1.4;
    const col=(z,pz)=>{const k=Math.max(0,Math.min(1,(z/cur.amp+1)/2));const r=Math.round(40+k*200),gg=Math.round(220-k*50),b=Math.round(212-k*150);
      const a=cur.al*(.18+.5*Math.max(0,Math.min(1,(1.6-pz)/2.4)));return 'rgba('+r+','+gg+','+b+','+a.toFixed(3)+')'};
    for(let j=0;j<=NY;j++){g.beginPath();for(let i=0;i<=NX;i++){const p=pts[j][i];i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])}
      const m=pts[j][NX>>1];g.strokeStyle=col(m[2],m[3]);g.stroke()}
    for(let i=0;i<=NX;i+=1){g.beginPath();for(let j=0;j<=NY;j++){const p=pts[j][i];j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])}
      const m=pts[NY>>1][i];g.strokeStyle=col(m[2],m[3]);g.stroke()}
    // números a flutuar
    g.font='italic 34px KaTeX_Math, serif';
    BG.nums.forEach(n=>{n.y-=n.s*.25;n.a+=.004;if(n.y<-40||n.a>1){n.y=1100;n.x=Math.random()*1920;n.a=0;n.v=Math.floor(Math.random()*19)-9}
      const al=Math.sin(Math.min(1,n.a)*Math.PI)*.22*cur.al;g.fillStyle='rgba(120,230,225,'+al.toFixed(3)+')';g.fillText(n.v<0?'−'+(-n.v):String(n.v),n.x,n.y)});
  }
  requestAnimationFrame(frame);
}
/* ---------- componentes partilhados ---------- */
const STAR='<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="currentColor"/></svg>';
const starsHTML=n=>'<span class="stars" title="Dificuldade '+n+' de 3">'+[1,2,3].map(k=>'<span style="color:'+(k<=n?'var(--acc2)':'var(--bd)')+'">'+STAR+'</span>').join('')+'</span>';
const CK='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
function blocksHTML(bl){
  return bl.map(b=>{
    if(b.t==='p')return '<div>'+rich(b.x)+'</div>';
    if(b.t==='eq')return b.x.map(l=>'<div class="tex-d">'+tex(l,true)+'</div>').join('');
    if(b.t==='ul'){const tp=b.s==='alpha'?'a':b.s==='roman'?'i':'1';const tag=b.s==='bullet'?'ul':'ol';
      return '<'+tag+(b.s!=='bullet'?' type="'+tp+'"':'')+' style="margin:.15em 0 .15em 1.6em">'+b.x.map(it=>'<li>'+(typeof it==='string'?rich(it):blocksHTML(it))+'</li>').join('')+'</'+tag+'>'}
    if(b.t==='tab')return '<table class="mini">'+'<tr>'+b.h.map(h=>'<th>'+rich(h)+'</th>').join('')+'</tr>'+b.r.map(r=>'<tr>'+r.map(c=>'<td>'+rich(c)+'</td>').join('')+'</tr>').join('')+'</table>';
    return ''}).join('');
}
let DONE={};try{DONE=JSON.parse(localStorage.getItem(DKEY+'_done')||'{}')}catch(e){}
function saveDone(){try{localStorage.setItem(DKEY+'_done',JSON.stringify(DONE))}catch(e){}}
const EXN=n=>DATA.ex.find(e=>e.n===n);
function exCard(n){
  const e=EXN(n);
  return '<div class="ex'+(DONE[n]?' done':'')+'" data-n="'+n+'"><div class="n">'+n+'</div><div class="q">'+blocksHTML(e.st)+'</div>'+
  '<div class="meta">'+starsHTML(e.lv)+'<div class="ck" title="Marcar como feito">'+CK+'</div></div>'+
  '<div class="ans"><div class="in"><b>Solução:</b> '+rich(e.an)+'<small>'+SOLREF(e)+'</small></div></div></div>';
}
function updateProgressAll(){$$('[data-prog]').forEach(el=>el.dispatchEvent(new Event('upd')))}
/* slide de exercícios recomendados (lista à esquerda, enunciado grande à direita) */
const EXLABEL={1:'Construir matrizes por regra',3:'Submatrizes e matriz ampliada',5:'Classificar matrizes',6:'Parâmetros e simetria',8:'Combinações lineares',9:'Produto AB e BA',11:'Quadrado de uma soma',12:'Potências e indução',
 16:'Característica por condensação',17:'Dependência das linhas',18:'Característica com parâmetro',19:'Parâmetro e característica',
 22:'Determinantes de ordem 2',23:'Regra de Sarrus',25:'Teorema de Laplace',26:'Determinante por condensação',27:'Propriedades',28:'Determinante e parâmetro',
 30:'Inversa quando existe',31:'Inversa por Gauss-Jordan',33:'Inversa de ordem 3',34:'Invertibilidade com parâmetro',37:'Mensagem codificada',
 38:'Resolver AX = B e XA = B',39:'Resolver AX + B = C',40:'Resolver X − AX = B',42:'Resolver XᵀA = B',
 44:'Gauss e classificação',46:'Gauss-Jordan',47:'Resolver e classificar',49:'SPI e grau de indeterminação',51:'Ler matrizes ampliadas',52:'Regra de Cramer',54:'Sistema homogéneo',56:'Classificação geométrica',57:'Solução fracionária',
 58:'Discussão com parâmetro',59:'Discussão com parâmetro',61:'Discussão, nível avançado',62:'Discussão, nível avançado',64:'Discussão com parâmetro',65:'Dois parâmetros',67:'Homogéneo com parâmetro',
 68:'Mistura de rações',70:'Investimento em três fundos',72:'Equilíbrio com imposto',73:'Fluxos numa rotunda'};
function exSlide(nav,title,bloco,ids){
  const o=slide({tone:'light',bloco,nav,title:nav,exs:ids,
   html:()=>hd(title,bloco)+'<div class="bd tight"><div class="mdl"><div class="exl">'+ids.map(n=>{const e=EXN(n);return '<div class="exr" data-n="'+n+'"><b>'+n+'</b><span>'+esc(e.lab||EXLABEL[n]||('Exercício '+n))+'</span>'+starsHTML(e.lv)+'<div class="ck" title="Marcar como feito">'+CK+'</div></div>'}).join('')+'<div class="note" style="margin-top:12px;font-size:22px">Clique num exercício. Setas para cima e para baixo também servem. Tecla T abre o cronómetro.</div></div>'+
   '<div class="exd"><div class="exh"></div><div class="exq"></div><div class="exa"><div class="row" style="gap:20px"><button class="btn fill" data-a="sol">Ver solução</button><span class="note exp"></span></div><div class="exs"></div></div></div></div></div>',
   init(el,so){
    let cur=ids[0];
    const rows=()=>$$('.exr',el);
    function paint(){rows().forEach(r=>{r.classList.toggle('sel',+r.dataset.n===cur);r.classList.toggle('done',!!DONE[r.dataset.n])})}
    function show(n,keep){cur=n;const e=EXN(n);
      $('.exh',el).innerHTML='<span class="exn">Exercício '+n+'</span>'+starsHTML(e.lv)+'<span class="note" style="font-size:24px">'+['','Base','Intermédio','Desafio'][e.lv]+'</span>';
      $('.exq',el).innerHTML=blocksHTML(e.st);
      $('.exs',el).innerHTML='<div class="in"><b>Solução:</b> '+rich(e.an)+'</div>';
      $('.exp',el).textContent=SOLREF(e);
      $('.exs',el).classList.remove('shown');$('[data-a=sol]',el).textContent='Ver solução';
      paint();}
    el.addEventListener('click',ev=>{
      const ck=ev.target.closest('.ck');const r=ev.target.closest('.exr');
      if(ck&&r){const n=r.dataset.n;DONE[n]=!DONE[n];saveDone();paint();return}
      if(r){if(+r.dataset.n!==cur)tmrReset();show(+r.dataset.n);return}
      if(ev.target.closest('[data-a=sol]')){const s=$('.exs',el);s.classList.toggle('shown');if(s.classList.contains('shown'))setTimeout(()=>{const d=$('.exd',el);d.scrollTo({top:d.scrollHeight,behavior:'smooth'})},250);$('[data-a=sol]',el).textContent=s.classList.contains('shown')?'Esconder solução':'Ver solução'}});
    so.onKeyV=d=>{const k=ids.indexOf(cur)+d;if(k>=0&&k<ids.length){tmrReset();show(ids[k])}};
    so.onEnter2=paint;show(cur);}});
  return o}
/* ---------- matrizes estáticas em HTML (KaTeX) ---------- */
const pm=(rows,br)=>{br=br||'bmatrix';return '\\begin{'+br+'}'+rows.map(r=>r.join('&')).join('\\\\')+'\\end{'+br+'}'};
/* ---------- componente stepper (condensação passo a passo) ---------- */
function fitTo(view,box){
  view.style.transform='none';view.style.transformOrigin='left center';
  const w=view.scrollWidth,W=box.clientWidth;const s=Math.min(1,W/w);view.style.transform='scale('+s+')';view.style.height=(view.firstChild?view.firstChild.offsetHeight:0)*s+'px'}
function mountStepper(root,cfg){
  const A=M.fromInts(cfg.A),steps=gaussSteps(A,cfg.mode||'ref',cfg.ncoef);
  root.innerHTML='<div class="stp-box"><div class="stp-view math" style="font-size:'+(cfg.fs||46)+'px"><div class="stp-in"></div></div></div><div class="desc"></div><div class="ctl"><button class="btn sm" data-a="prev">Anterior</button><div class="dots"></div><button class="btn sm fill" data-a="next">Seguinte</button><button class="btn sm" data-a="auto">Reproduzir</button></div><div class="stp-fin"></div>';
  const view=$('.stp-in',root),box=$('.stp-box',root),desc=$('.desc',root),dots=$('.dots',root),fin=$('.stp-fin',root);
  let k=0,timer=null;
  dots.innerHTML=steps.map((_,i)=>'<i data-k="'+i+'"></i>').join('');
  function show(n){
    k=Math.max(0,Math.min(steps.length-1,n));
    const last=k===steps.length-1;
    view.innerHTML=stepHTML(steps,k,{aug:cfg.aug});
    const v=$('.stp-view',root);v.style.minHeight='0';
    setTimeout(()=>fitTo(view,box),0);
    desc.innerHTML=k===0?(cfg.first||'Matriz inicial.'):steps[k].desc.replace(/\(([^)]*)\)/g,'<span class="mut">($1)</span>');
    $$('i',dots).forEach((d,i)=>{d.classList.toggle('on',i<=k);d.classList.toggle('cur',i===k)});
    fin.style.opacity=last?1:0;fin.style.transform=last?'none':'translateY(14px)';
    fin.innerHTML=last&&cfg.final?cfg.final(steps):'';
    cfg.onShow&&cfg.onShow(k,steps);
  }
  const api={steps,next(){if(k<steps.length-1){show(k+1);return true}return false},prev(){if(k>0){show(k-1);return true}return false},show,get k(){return k},stop(){clearInterval(timer);timer=null;$('[data-a=auto]',root).textContent='Reproduzir'}};
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');const d=e.target.closest('i[data-k]');
    if(d){api.stop();show(+d.dataset.k);return}
    if(!b)return;
    if(b.dataset.a==='next'){api.stop();api.next()}
    else if(b.dataset.a==='prev'){api.stop();api.prev()}
    else if(b.dataset.a==='auto'){if(timer){api.stop();return}if(k>=steps.length-1)show(0);b.textContent='Parar';timer=setInterval(()=>{if(!api.next())api.stop()},2600)}
  });
  fin.style.transition='opacity .6s,transform .6s';
  show(0);
  return api;
}

