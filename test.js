const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('aardige_vrouwen_trailer.html', 'utf8');
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window, d = w.document;
w.addEventListener('error', e => errors.push(e.message || String(e.error)));
Object.defineProperty(w, 'innerWidth', { value: 1200, configurable: true });

setTimeout(() => {
  const panels = [...d.querySelectorAll('.panel')];
  console.log('total panels:', panels.length, '(expect 165)');
  const megas = d.querySelectorAll('.title-panel .mega');
  console.log('start title:', megas[0].textContent, '| end title:', megas[1].textContent);
  const qp = d.querySelectorAll('.panel.quote-panel');
  console.log('quote panels:', qp.length, '(expect 163)');
  console.log('quote#1 word spans:', qp[0].querySelectorAll('.w').length);
  console.log('counter exists:', Boolean(d.getElementById('counter')));
  console.log('progress exists:', Boolean(d.getElementById('progress')));

  // simulate reveal: fake geometry then dispatch scroll
  const track = d.getElementById('track');
  Object.defineProperty(track, 'scrollWidth', { value: 165 * 1200, configurable: true });
  Object.defineProperty(track, 'clientWidth', { value: 1200, configurable: true });
  panels.forEach((p, i) => {
    Object.defineProperty(p, 'offsetLeft', { value: i * 1200, configurable: true });
    Object.defineProperty(p, 'offsetWidth', { value: 1200, configurable: true });
  });
  // scroll so quote #1 (panel index 1) is centered
  track.scrollLeft = 1 * 1200;
  track.dispatchEvent(new w.Event('scroll'));
  setTimeout(() => {
    const on1 = qp[0].querySelectorAll('.w.on').length;
    console.log('after centering quote#1 -> words revealed:', on1, '/', qp[0].querySelectorAll('.w').length);
    console.log('counter text:', JSON.stringify(d.getElementById('counter').textContent));
    console.log('progress width:', d.getElementById('progress').style.width);
    console.log('panel index1 active class:', panels[1].classList.contains('active'));
    console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  }, 300);
}, 200);
