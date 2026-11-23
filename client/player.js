const socket = io(window.SERVER_URL || undefined, { transports: ['websocket', 'polling'] });
const KEY = 'quiz_session';
let saved = JSON.parse(localStorage.getItem(KEY) || 'null');
let avatar = (saved && saved.avatar) || randomAvatar();
let joined = false, lastPhase = null, lastQ = -1, choosing = false, showQuestion = localStorage.getItem('quiz_showq') !== '0', curQ = null;

const qs = new URLSearchParams(location.search);
let urlPin = qs.get('pin') || '';
$('#pin').value = urlPin || (saved && saved.pin) || '';
if (urlPin) {
  $('#pin').style.display = 'none';
  $('#pinRoom').style.display = 'block';
  $('#pinShow').textContent = urlPin;
}
$('#name').value = (saved && saved.name) || '';

function unlinkToJoin(msg, clearPin = true) {
  localStorage.removeItem(KEY);
  saved = null;
  joined = false;
  choosing = false;
  lastPhase = null;
  lastQ = -1;
  curQ = null;
  urlPin = '';
  if (location.search.includes('pin=')) history.replaceState(null, '', location.pathname);
  $('#pinRoom').style.display = 'none';
  $('#pin').style.display = '';
  if (clearPin) $('#pin').value = '';
  const e = $('#joinErr');
  if (msg) { e.textContent = msg; e.classList.add('on'); } else e.classList.remove('on');
  showScreen('s-join');
  $('#pin').focus();
}

function leaveRoom() {
  if (socket.connected) socket.emit('player:leave', () => unlinkToJoin('', true));
  else unlinkToJoin('', true);
}

mountAvatarEditor($('#editor'), avatar, (a) => {
  if (joined) { socket.emit('player:avatar', a); if (saved) { saved.avatar = a; localStorage.setItem(KEY, JSON.stringify(saved)); } }
});
$('#dressOk').onclick = () => { choosing = false; socket.emit('player:avatar', avatar); showScreen('s-lobby'); };
$('#changeAv').onclick = () => { choosing = true; showScreen('s-dress'); };
$('#changePin').onclick = () => unlinkToJoin('', true);
$('#pinPill').onclick = () => unlinkToJoin('', true);
$('#leaveLobby').onclick = leaveRoom;
$('#leaveDress').onclick = leaveRoom;
$('#leaveLost').onclick = () => unlinkToJoin('', true);

const applyShowQ = () => {
  $('#qShow').style.display = showQuestion && curQ ? 'block' : 'none';
  $('#qShow').textContent = curQ || '';
  $('#showQ').textContent = showQuestion ? '🙈 Esconder a pergunta' : '📱 Ver a pergunta no celular';
};
$('#showQ').onclick = () => { showQuestion = !showQuestion; localStorage.setItem('quiz_showq', showQuestion ? '1' : '0'); applyShowQ(); };

function join(auto) {
  const pin = (auto && saved ? saved.pin : $('#pin').value).trim();
  const name = (auto && saved ? saved.name : $('#name').value).trim();
  const tokenSaved = saved && saved.pin === pin ? saved.token : null;
  socket.emit('player:join', { pin, name, avatar, token: tokenSaved }, (res) => {
    if (res.error) {
      if (auto || res.closed) {
        unlinkToJoin(auto ? 'A sala anterior foi fechada. Você foi desvinculado — digite um novo PIN.' : res.error, res.closed);
        return;
      }
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
$('#leave').onclick = () => unlinkToJoin('', true);

// Ao conectar: se havia sessão salva (mesma sala ou sem ?pin= novo), verifica e volta;
// se veio só ?pin= na URL, verifica se a sala ainda está aberta.
socket.on('connect', () => {
  if (saved && (!urlPin || urlPin === saved.pin)) {
    join(true);
  } else if (urlPin) {
    socket.emit('room:check', { pin: urlPin, token: null }, (res) => {
      if (res && !res.open) {
        unlinkToJoin(`A sala ${urlPin} foi fechada (${res.reason}). Digite um novo PIN.`, true);
      }
    });
  }
});
socket.on('disconnect', () => { if (joined) showScreen('s-lost'); });
socket.on('room:closed', () => unlinkToJoin('A sala foi fechada pelo host. Digite um novo PIN.', true));
socket.on('kicked', () => unlinkToJoin('Você foi removido da sala.', true));

socket.on('state', (s) => {
  syncClock(s.now);
  if (s.phase !== 'ended') stopCelebrate();
  const me = s.me;
  switch (s.phase) {
    case 'lobby':
      lastQ = -1;
      if (!saved) {
        saved = { pin: s.pin, name: me.name, token: me.id, avatar: me.avatar };
        localStorage.setItem(KEY, JSON.stringify(saved));
      }
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
