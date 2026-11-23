const socket = io(window.SERVER_URL || undefined, { transports: ['websocket', 'polling'] });
const KEY = 'quiz_session';
let saved = JSON.parse(localStorage.getItem(KEY) || 'null');
let avatar = (saved && saved.avatar) || randomAvatar();
let joined = false, lastPhase = null, lastQ = -1, choosing = false, showQuestion = localStorage.getItem('quiz_showq') !== '0', curQ = null;

const qs = new URLSearchParams(location.search);
$('#pin').value = qs.get('pin') || (saved && saved.pin) || '';
if (qs.get('pin')) { $('#pin').style.display = 'none'; $('#pinRoom').style.display = 'inline-block'; $('#pinShow').textContent = qs.get('pin'); }
$('#name').value = (saved && saved.name) || '';

mountAvatarEditor($('#editor'), avatar, (a) => {
  if (joined) { socket.emit('player:avatar', a); if (saved) { saved.avatar = a; localStorage.setItem(KEY, JSON.stringify(saved)); } }
});
$('#dressOk').onclick = () => { choosing = false; socket.emit('player:avatar', avatar); showScreen('s-lobby'); };
$('#changeAv').onclick = () => { choosing = true; showScreen('s-dress'); };
const applyShowQ = () => {
  $('#qShow').style.display = showQuestion && curQ ? 'block' : 'none';
  $('#qShow').textContent = curQ || '';
  $('#showQ').textContent = showQuestion ? '🙈 Esconder a pergunta' : '📱 Ver a pergunta no celular';
};
$('#showQ').onclick = () => { showQuestion = !showQuestion; localStorage.setItem('quiz_showq', showQuestion ? '1' : '0'); applyShowQ(); };

function join(auto) {
  const pin = $('#pin').value.trim(), name = $('#name').value.trim();
  const tokenSaved = saved && saved.pin === pin ? saved.token : null;
  socket.emit('player:join', { pin, name, avatar, token: tokenSaved }, (res) => {
    if (res.error) {
      if (auto) { localStorage.removeItem(KEY); saved = null; showScreen('s-join'); }
      const e = $('#joinErr'); e.textContent = res.error; e.classList.add('on');
      return;
    }
    joined = true;
    if (!auto) { choosing = true; showScreen('s-dress'); }
    saved = { pin, name, token: res.token, avatar };
    localStorage.setItem(KEY, JSON.stringify(saved));
  });
}
$('#joinBtn').onclick = () => { $('#joinErr').classList.remove('on'); join(false); };
$('#leave').onclick = () => { localStorage.removeItem(KEY); location.href = location.pathname; };

// reconexão automática: ao conectar de novo, volta para a mesma sala
socket.on('connect', () => { if (saved) join(true); });
socket.on('disconnect', () => { if (joined) showScreen('s-lost'); });
socket.on('kicked', () => { localStorage.removeItem(KEY); alert('Você foi removido da sala.'); location.href = location.pathname; });

socket.on('state', (s) => {
  syncClock(s.now);
  const me = s.me;
  switch (s.phase) {
    case 'lobby':
      $('#lobbyAv').innerHTML = avatarSVG(me.avatar, 180);
      $('#lobbyName').textContent = me.name;
      $('#lobbyCount').textContent = `👥 ${s.count} jogador${s.count > 1 ? 'es' : ''} na sala`;
      showScreen(choosing ? 's-dress' : 's-lobby');
      break;
    case 'question': {
      if (s.answered) {
        $('#waitPick').innerHTML = `<div class="ans c${s.picked}" style="display:inline-flex;min-height:0;padding:14px 26px;cursor:default">${SHAPES[s.picked]}${esc(s.q.options[s.picked])}</div>`;
        showScreen('s-wait');
        break;
      }
      if (lastPhase !== 'question' || lastQ !== s.q.index || !$('#s-question').classList.contains('on')) {
        $('#pAnswers').innerHTML = s.q.options.map((o, i) => `<button class="ans c${i}" data-i="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join('');
        $('#pAnswers').querySelectorAll('.ans').forEach((b) => (b.onclick = () => { socket.emit('player:answer', +b.dataset.i); if (navigator.vibrate) navigator.vibrate(30); }));
        $('#qNum').textContent = `${s.q.index + 1} / ${s.q.total}`;
        $('#myScore').textContent = `⭐ ${me.score}`;
        curQ = s.q.text; applyShowQ();
        showScreen('s-question');
        runTimer(s.q.endsAt, s.q.time, $('#qBar'), null);
      }
      lastQ = s.q.index;
      break;
    }
    case 'reveal': {
      const r = s.result;
      const noAnswer = !s.answered;
      $('#revTitle').textContent = r.ok ? '✔ Correto!' : noAnswer ? '⏱ Sem resposta' : '✘ Errou';
      $('#revTitle').className = 'result ' + (r.ok ? 'ok' : 'no');
      $('#revPoints').textContent = r.ok ? `+${r.points} pontos` : '+0 pontos';
      $('#revAv').innerHTML = avatarSVG(me.avatar, 150);
      showScreen('s-reveal');
      if (r.ok && lastPhase !== 'reveal') confetti(50);
      break;
    }
    case 'ranking':
      $('#myPos').textContent = `Você: ${me.rank}º lugar • ${me.score} pts`;
      $('#topList').innerHTML = rankRows(s.top, me.id);
      showScreen('s-ranking');
      break;
    case 'ended':
      if (lastPhase !== 'ended') $('#podium').innerHTML = podiumHTML(s.podium, 84);
      $('#finalPos').textContent = `Você ficou em ${me.rank}º • ${me.score} pts`;
      showScreen('s-ended');
      if (lastPhase !== 'ended') celebrate();
      localStorage.removeItem(KEY);
      break;
  }
  lastPhase = s.phase;
});

