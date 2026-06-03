
const QUOTES=[{c:"md",t:"Een twee drie."}];

const track = document.getElementById('track');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- build title start panel ----
function titlePanel(word, opts){
  const p = document.createElement('section');
  p.className = 'panel title-panel';
  let inner = '';
  if(opts.author) inner += '<p class="author-top">Megan van Kessel</p>';
  inner += '<h1 class="mega">'+word+'</h1>';
  if(opts.publisher) inner += '<p class="publisher">Nijgh &amp; Van Ditmar</p>';
  if(opts.hint) inner += '<div class="scroll-hint">scroll<span class="arrow"></span></div>';
  p.innerHTML = inner;
  return p;
}

track.appendChild(titlePanel('aardige', {author:true, hint:true}));

// ---- quote panels ----
const panels = []; // {el, words:[span], shown:int, count:int}
QUOTES.forEach((q, i) => {
  const sec = document.createElement('section');
  sec.className = 'panel quote-panel';
  const fig = document.createElement('div');
  fig.className = 'quote ' + q.c;
  // split into words, keep punctuation attached
  const tokens = q.t.split(/(\s+)/); // keep spaces
  const spans = [];
  tokens.forEach(tok => {
    if(tok.trim()===''){ fig.appendChild(document.createTextNode(tok)); return; }
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = tok;
    fig.appendChild(s);
    spans.push(s);
  });
  sec.appendChild(fig);
  const idx = document.createElement('div');
  idx.className = 'idx';
  idx.textContent = String(i+1).padStart(3,'0') + ' / ' + QUOTES.length;
  sec.appendChild(idx);
  track.appendChild(sec);
  panels.push({el:sec, words:spans, shown:0, count:spans.length});
});

// ---- end title panel ----
track.appendChild(titlePanel('vrouwen', {publisher:true}));

const allPanels = Array.from(track.querySelectorAll('.panel'));

// reduced motion: reveal everything
if(reduce){
  panels.forEach(p=>{ p.words.forEach(w=>w.classList.add('on')); p.shown=p.count; });
}

// ---- reveal logic based on horizontal scroll position ----
function revealPanel(p, target){
  if(target <= p.shown) return;
  // stagger newly revealed words
  for(let k=p.shown; k<target; k++){
    const localDelay = (k - p.shown) * 45;
    const span = p.words[k];
    if(localDelay>0){ setTimeout(()=>span.classList.add('on'), localDelay); }
    else span.classList.add('on');
  }
  p.shown = target;
}

let vw = window.innerWidth;
function onScroll(){
  const sl = track.scrollLeft;
  const center = sl + vw/2;
  const revealWindow = vw * 0.85; // distance over which a quote fully reveals
  let activeIndex = Math.round(sl / vw);

  panels.forEach(p=>{
    const el = p.el;
    const pc = el.offsetLeft + el.offsetWidth/2;
    const dist = pc - center; // >0 means panel is to the right (upcoming)
    // progress: 0 when one revealWindow to the right, 1 when centered (and stays 1 after)
    let prog = 1 - (dist / revealWindow);
    if(prog < 0) prog = 0;
    if(prog > 1) prog = 1;
    const target = Math.ceil(prog * p.count);
    if(target > p.shown) revealPanel(p, target);
  });

  // active class
  allPanels.forEach((el,i)=> el.classList.toggle('active', i===activeIndex));

  // progress + counter
  const max = track.scrollWidth - track.clientWidth;
  const frac = max>0 ? sl/max : 0;
  document.getElementById('progress').style.width = (frac*100)+'%';
  const total = QUOTES.length;
  if(activeIndex===0){ counter.textContent=''; }
  else if(activeIndex===allPanels.length-1){ counter.textContent='— fin —'; }
  else { counter.textContent = String(activeIndex).padStart(2,'0')+' · '+total; }
}
const counter = document.getElementById('counter');

let ticking=false;
track.addEventListener('scroll', ()=>{
  if(!ticking){ requestAnimationFrame(()=>{ onScroll(); ticking=false; }); ticking=true; }
}, {passive:true});

window.addEventListener('resize', ()=>{ vw = window.innerWidth; onScroll(); });

// ---- wheel: vertical OR horizontal wheel drives horizontal scroll ----
track.addEventListener('wheel', (e)=>{
  // let native horizontal trackpad gestures pass, but also map vertical
  const dom = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if(Math.abs(dom) < 1) return;
  e.preventDefault();
  track.scrollLeft += dom;
}, {passive:false});

// ---- keyboard ----
function go(dir){
  const sl = track.scrollLeft;
  const i = Math.round(sl/vw);
  const ni = Math.min(allPanels.length-1, Math.max(0, i+dir));
  track.scrollTo({left: ni*vw, behavior:'smooth'});
}
window.addEventListener('keydown', (e)=>{
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){ e.preventDefault(); go(1); }
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); go(-1); }
  else if(e.key==='Home'){ e.preventDefault(); track.scrollTo({left:0,behavior:'smooth'}); }
  else if(e.key==='End'){ e.preventDefault(); track.scrollTo({left:(allPanels.length-1)*vw,behavior:'smooth'}); }
});

// ---- touch: allow vertical swipe to advance horizontally too ----
let tsX=0, tsY=0, tScroll=0, touching=false;
track.addEventListener('touchstart',(e)=>{
  if(e.touches.length!==1) return;
  tsX=e.touches[0].clientX; tsY=e.touches[0].clientY; tScroll=track.scrollLeft; touching=true;
},{passive:true});
track.addEventListener('touchmove',(e)=>{
  if(!touching||e.touches.length!==1) return;
  const dx = tsX - e.touches[0].clientX;
  const dy = tsY - e.touches[0].clientY;
  // if mostly vertical, translate to horizontal
  if(Math.abs(dy) > Math.abs(dx)){
    track.scrollLeft = tScroll + dy;
  }
},{passive:true});
track.addEventListener('touchend',()=>{ touching=false; },{passive:true});

// initial
onScroll();
