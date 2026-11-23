// Utilidades compartilhadas
const $ = (s, r = document) => r.querySelector(s);
const SHAPES = [
  '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>', // estrela
  '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2l8.7 5v10L12 22 3.3 17V7z"/></svg>', // hexágono
  '<svg viewBox="0 0 24 24"><circle fill="#fff" cx="12" cy="12" r="10"/></svg>', // círculo
  '<svg viewBox="0 0 24 24"><rect fill="#fff" x="3" y="3" width="18" height="18" rx="3"/></svg>', // quadrado
];
const COLOR_NAMES = ['Rosa', 'Azul', 'Amarelo', 'Verde'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
}
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 3500);
}
function confetti(n = 90) {
  const cols = ['#ff4d6d', '#3a86ff', '#ffbe0b', '#06d6a0', '#9b5de5'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = 2 + Math.random() * 3 + 's';
    c.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 6500);
  }
}
// relógio sincronizado com o servidor
let clockOffset = 0;
const syncClock = (serverNow) => (clockOffset = serverNow - Date.now());
const serverNow = () => Date.now() + clockOffset;

function runTimer(endsAt, total, barEl, labelEl) {
  cancelAnimationFrame(runTimer.raf);
  const tick = () => {
    const left = Math.max(0, endsAt - serverNow());
    if (barEl) barEl.style.width = (left / (total * 1000)) * 100 + '%';
    if (labelEl) labelEl.textContent = Math.ceil(left / 1000);
    if (left > 0) runTimer.raf = requestAnimationFrame(tick);
  };
  tick();
}
function rankRows(list, meId) {
  return list
    .map((p, i) => `<div class="rk${p.id === meId ? ' me' : ''}" style="animation-delay:${i * 0.12}s"><span class="pos">${p.rank || i + 1}º</span>${avatarSVG(p.avatar, 46)}<span class="nm">${esc(p.name)}</span><span>${p.score}</span></div>`)
    .join('');
}

// ---- pódio animado ----
function podiumHTML(top, size = 100) {
  if (!top || !top.length) return '';
  const pod = (i) => top[i] ? `<div class="pod p${i + 1}">
      ${i === 0 ? '<div class="crown">👑</div>' : ''}
      <div class="pod-av">${avatarSVG(top[i].avatar, size)}</div>
      <div class="pod-name">${esc(top[i].name)}</div><small>${top[i].score} pts</small>
      <div class="blk">${['🥇', '🥈', '🥉'][i]}</div></div>` : '';
  return `<div class="stage"><div class="rays"></div>
    <div class="drum">🥁 E o vencedor é…</div>
    <div class="winner-name">🏆 ${esc(top[0].name)} venceu!</div>
    <div class="podium">${pod(1)}${pod(0)}${pod(2)}</div></div>`;
}
function fireworks(n = 3) {
  const cols = ['#ff1744', '#ffc400', '#00e676', '#18c8ff', '#d500f9', '#fff'];
  for (let f = 0; f < n; f++) {
    const x = 10 + Math.random() * 80, y = 12 + Math.random() * 45, col = cols[Math.floor(Math.random() * cols.length)];
    setTimeout(() => {
      for (let i = 0; i < 18; i++) {
        const d = document.createElement('div'); d.className = 'spark';
        const a = (i / 18) * Math.PI * 2, r = 60 + Math.random() * 60;
        d.style.cssText = `left:${x}vw;top:${y}vh;background:${col};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
        document.body.appendChild(d); setTimeout(() => d.remove(), 1200);
      }
    }, f * 350);
  }
}
let celebTimers = [];
function stopCelebrate() { celebTimers.forEach((t) => { clearTimeout(t); clearInterval(t); }); celebTimers = []; }
function celebrate() {
  stopCelebrate();
  celebTimers.push(setTimeout(() => { confetti(220); fireworks(5); }, 3100));
  celebTimers.push(setTimeout(() => celebTimers.push(setInterval(() => { if (!document.querySelector('.screen.on .stage')) return stopCelebrate(); confetti(50); fireworks(2); }, 2600)), 5200));
}
