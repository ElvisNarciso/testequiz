const socket = io(window.SERVER_URL || undefined, { transports: ['websocket', 'polling'] });
const KEY = 'quiz_session';
const BASE = location.origin + location.pathname;
let saved = JSON.parse(localStorage.getItem(KEY) || 'null');
let avatar = (saved && saved.avatar) || randomAvatar();
let joined = false, watching = false, watchPin = sessionStorage.getItem('quiz_watch') || '', livePin = '';
let lastPhase = null, lastQ = -1, choosing = false, showQuestion = localStorage.getItem('quiz_showq') !== '0', curQ = null;
$('#wJoinHost').textContent = location.host + location.pathname;

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
  sessionStorage.removeItem('quiz_watch');
  saved = null;
  joined = false;
  watching = false;
  watchPin = '';
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
// ---- modo assistir ao vivo (sem controle) ----
function startWatch(pin, silent = false) {
  socket.emit('watch:join', { pin: pin || livePin || '', base: BASE }, (res) => {
    if (!res || res.error) {
      sessionStorage.removeItem('quiz_watch');
      watching = false;
      watchPin = '';
      if (!silent) toast((res && res.error) || 'Nenhuma sala ao vivo');
      else showScreen('s-join');
      return;
    }
    watching = true;
    watchPin = res.pin;
    sessionStorage.setItem('quiz_watch', res.pin);
    $('#wPin').textContent = res.pin;
    $('#wQr').src = res.qr;
  });
}
function exitWatch() {
  sessionStorage.removeItem('quiz_watch');
  watching = false;
  watchPin = '';
  lastPhase = null;
  lastQ = -1;
  stopCelebrate();
  if (socket.connected) socket.emit('watch:leave');
  showScreen('s-join');
}
$('#watchLive').onclick = () => startWatch(livePin, false);
document.querySelectorAll('.w-exit').forEach((b) => (b.onclick = exitWatch));

socket.on('live:status', (info) => {
  if (info && info.live) {
    livePin = info.pin;
    $('#watchLive').disabled = false;
    $('#liveLabel').textContent = `Assistir ao vivo • Sala ${info.pin}`;
  } else {
    livePin = '';
    $('#watchLive').disabled = true;
    $('#liveLabel').textContent = 'Assistir ao vivo (aguardando host)';
  }
});

socket.on('connect', () => {
  if (watchPin) {
    startWatch(watchPin, true);
  } else if (saved && (!urlPin || urlPin === saved.pin)) {
    join(true);
  } else if (urlPin) {
    socket.emit('room:check', { pin: urlPin, token: null }, (res) => {
      if (res && !res.open) {
        unlinkToJoin(`A sala ${urlPin} foi fechada (${res.reason}). Digite um novo PIN.`, true);
      }
    });
  }
});
socket.on('disconnect', () => { if (joined || watching) showScreen('s-lost'); });
socket.on('room:closed', () => {
  sessionStorage.removeItem('quiz_watch');
  watching = false;
  watchPin = '';
  stopCelebrate();
  unlinkToJoin('A sala foi fechada pelo host.', true);
});
socket.on('kicked', () => unlinkToJoin('Você foi removido da sala.', true));
socket.on('progress', (p) => { if (watching) $('#wAnswered').textContent = p.answered; });

function renderWatch(s) {
  syncClock(s.now);
  if (s.phase !== 'ended') stopCelebrate();
  const connected = s.players.filter((p) => p.connected).length;
  switch (s.phase) {
    case 'lobby':
      lastQ = -1;
      $('#wPcount').textContent = `👥 ${s.players.length} jogador${s.players.length === 1 ? '' : 'es'}`;
      $('#wPlist').innerHTML = s.players.map((p) => `<div class="player${p.connected ? '' : ' off'}">${avatarSVG(p.avatar, 70)}${esc(p.name)}</div>`).join('');
      showScreen('w-lobby');
      break;
    case 'question':
      if (lastPhase !== 'question' || lastQ !== s.q.index) {
        $('#wqNum').textContent = `Pergunta ${s.q.index + 1} / ${s.q.total}`;
        $('#wDouble').style.display = s.q.double ? 'inline-block' : 'none';
        $('#wqText').textContent = s.q.text;
        $('#wAnswers').innerHTML = s.q.options.map((o, i) => `<div class="ans c${i}" style="cursor:default">${SHAPES[i]}<span>${esc(o)}</span></div>`).join('');
        showScreen('w-question');
        runTimer(s.q.endsAt, s.q.time, $('#wBar'), $('#wClock'));
      }
      $('#wAnswered').textContent = s.answered;
      $('#wTotal').textContent = connected;
      lastQ = s.q.index;
      break;
    case 'reveal': {
      $('#wrText').textContent = s.q.text;
      const max = Math.max(1, ...s.counts);
      $('#wrBars').style.gridTemplateColumns = `repeat(${s.q.options.length}, 1fr)`;
      $('#wrBars').innerHTML = s.q.options.map((o, i) => `<div class="bar c${i}${i === s.q.correct ? '' : ' dim'}">${s.counts[i]}<div class="col" style="height:0" data-h="${(s.counts[i] / max) * 200 + 10}"></div>${SHAPES[i]}</div>`).join('');
      requestAnimationFrame(() => setTimeout(() => $('#wrBars').querySelectorAll('.col').forEach((c) => (c.style.height = c.dataset.h + 'px')), 50));
      $('#wrAnswers').innerHTML = s.q.options.map((o, i) => `<div class="ans c${i}${i === s.q.correct ? ' correct' : ' dim'}" style="cursor:default;min-height:70px">${SHAPES[i]}<span>${esc(o)}</span>${i === s.q.correct ? '<span class="n">✔</span>' : ''}</div>`).join('');
      showScreen('w-reveal');
      break;
    }
    case 'ranking':
      $('#wTop').innerHTML = rankRows(s.top);
      showScreen('w-ranking');
      break;
    case 'ended':
      if (lastPhase !== 'ended') $('#wPodium').innerHTML = podiumHTML(s.players.slice(0, 3), 130);
      $('#wAll').innerHTML = rankRows(s.players.slice(3));
      showScreen('w-ended');
      if (lastPhase !== 'ended') celebrate();
      break;
  }
  lastPhase = s.phase;
}

socket.on('state', (s) => {
  if (s.role === 'watch') return renderWatch(s);
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
        $('#pDouble').style.display = s.q.double ? 'inline-block' : 'none';
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
      $('#revPoints').textContent = r.ok
        ? `+${r.points} pontos${s.q && s.q.double ? ' ⚡ (2x!)' : ''}`
        : r.points < 0
        ? `${r.points} pts (penalidade do pódio)`
        : '+0 pontos';
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
