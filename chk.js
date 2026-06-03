
const QUOTES=[{c:"md",t:"a b c"}];

// shuffle so the landing quote is random each visit
for(let i=QUOTES.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[QUOTES[i],QUOTES[j]]=[QUOTES[j],QUOTES[i]];}

const track = document.getElementById('track');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const panels = [];
QUOTES.forEach((q) => {
  const sec = document.createElement('section');
  sec.className = 'panel';
  const fig = document.createElement('div');
  fig.className = 'quote ' + q.c;
  const tokens = q.t.split(/(\s+)/);
  const spans = [];
  tokens.forEach(tok => {
    if(tok.trim()===''){ fig.appendChild(document.createTextNode(tok)); return; }
    const s = document.createElement('span');
    s.className = 'w'; s.textContent = tok;
    fig.appendChild(s); spans.push(s);
  });
  sec.appendChild(fig);
  track.appendChild(sec);
  panels.push({el:sec, words:spans, shown:0, count:spans.length});
});

const allPanels = Array.from(track.querySelectorAll('.panel'));
if(reduce){ panels.forEach(p=>{ p.words.forEach(w=>w.classList.add('on')); p.shown=p.count; }); }

function revealPanel(p, target){
  if(target <= p.shown) return;
  for(let k=p.shown; k<target; k++){
    const localDelay = (k - p.shown) * 45;
    const span = p.words[k];
    if(localDelay>0){ setTimeout(()=>span.classList.add('on'), localDelay); }
    else span.classList.add('on');
  }
  p.shown = target;
}

let vw = window.innerWidth;
const counter = document.getElementById('counter');
const hint = document.getElementById('hint');
let hintHidden = false;

function onScroll(){
  const sl = track.scrollLeft;
  const center = sl + vw/2;
  const revealWindow = vw * 0.85;
  let activeIndex = Math.round(sl / vw);

  panels.forEach(p=>{
    const el = p.el;
    const pc = el.offsetLeft + el.offsetWidth/2;
    const dist = pc - center;
    let prog = 1 - (dist / revealWindow);
    if(prog < 0) prog = 0; if(prog > 1) prog = 1;
    const target = Math.ceil(prog * p.count);
    if(target > p.shown) revealPanel(p, target);
  });

  const max = track.scrollWidth - track.clientWidth;
  document.getElementById('progress').style.width = (max>0 ? sl/max*100 : 0)+'%';
  counter.textContent = String(activeIndex+1).padStart(2,'0')+' · '+QUOTES.length;

  if(!hintHidden && sl > vw*0.15){ hint.style.opacity='0'; hintHidden=true; }
}

let ticking=false;
track.addEventListener('scroll', ()=>{
  if(!ticking){ requestAnimationFrame(()=>{ onScroll(); ticking=false; }); ticking=true; }
}, {passive:true});
window.addEventListener('resize', ()=>{ vw = window.innerWidth; onScroll(); });

track.addEventListener('wheel', (e)=>{
  if(document.getElementById('overlay').classList.contains('show')) return;
  const dom = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if(Math.abs(dom) < 1) return;
  e.preventDefault();
  track.scrollLeft += dom;
}, {passive:false});

function go(dir){
  const i = Math.round(track.scrollLeft/vw);
  const ni = Math.min(allPanels.length-1, Math.max(0, i+dir));
  track.scrollTo({left: ni*vw, behavior:'smooth'});
}
window.addEventListener('keydown', (e)=>{
  if(document.getElementById('overlay').classList.contains('show')){
    if(e.key==='Escape') closeModal();
    return;
  }
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){ e.preventDefault(); go(1); }
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); go(-1); }
  else if(e.key==='Home'){ e.preventDefault(); track.scrollTo({left:0,behavior:'smooth'}); }
  else if(e.key==='End'){ e.preventDefault(); track.scrollTo({left:(allPanels.length-1)*vw,behavior:'smooth'}); }
});

let tsX=0,tsY=0,tScroll=0,touching=false;
track.addEventListener('touchstart',(e)=>{
  if(e.touches.length!==1) return;
  tsX=e.touches[0].clientX; tsY=e.touches[0].clientY; tScroll=track.scrollLeft; touching=true;
},{passive:true});
track.addEventListener('touchmove',(e)=>{
  if(!touching||e.touches.length!==1) return;
  const dx=tsX-e.touches[0].clientX, dy=tsY-e.touches[0].clientY;
  if(Math.abs(dy) > Math.abs(dx)){ track.scrollLeft = tScroll + dy; }
},{passive:true});
track.addEventListener('touchend',()=>{ touching=false; },{passive:true});

// ===== modal control =====
const overlay = document.getElementById('overlay');
function openModal(){ overlay.classList.add('show'); }
function closeModal(){ overlay.classList.remove('show'); }
document.getElementById('cover').addEventListener('click', openModal);
document.querySelector('#modal .close').addEventListener('click', closeModal);
overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });

// ===== optional local images: drop cover.jpg / author.jpg next to this file =====
// Tries several extensions; falls back to the CSS cover / placeholder if absent.
function tryLoad(bases, onFound){
  let i=0;
  const im=new Image();
  im.onload=()=>onFound(im.src);
  im.onerror=()=>{ i++; if(i<bases.length){ im.src=bases[i]; } };
  im.src=bases[0];
}
tryLoad(['cover.jpg','cover.jpeg','cover.png','cover.webp'], (src)=>{
  document.getElementById('coverImg').src=src;
  document.getElementById('cover').classList.add('has-img');
});
tryLoad(['author.jpg','author.jpeg','author.png','author.webp'], (src)=>{
  document.getElementById('authorImg').src=src;
  document.getElementById('authorPhoto').classList.add('has-img');
});

// start at first (randomised) quote, reveal it
track.scrollLeft = 0;
onScroll();
