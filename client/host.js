const socket = io(window.SERVER_URL || undefined, { transports: ['websocket', 'polling'] });
const HK = 'quiz_host';
const AK = 'quiz_admin_pass';
// Base para o link de entrada dos jogadores (a página index.html do mesmo site)
const BASE = location.origin + location.pathname.replace(/host(\.html)?$/, '');
let hs = JSON.parse(localStorage.getItem(HK) || 'null');
let adminPass = sessionStorage.getItem(AK) || '';
localStorage.removeItem('quiz_pass');
let last = { phase: null, qi: -1 };
let current = null;

$('#questions').value = localStorage.getItem('quiz_questions') || '';
$('#joinHost').textContent = location.host + location.pathname.replace(/host(\.html)?$/, '');

const TPL_JSON = JSON.stringify([
  { q: 'Qual é a capital do Brasil?', options: ['São Paulo', 'Brasília', 'Rio de Janeiro', 'Salvador'], correct: 2, time: 20 },
  { q: 'O Sol é uma estrela.', options: ['Verdadeiro', 'Falso'], correct: 1, time: 10 },
], null, 2);
const TPL_TXT = `Qual é a capital do Brasil?
São Paulo
*Brasília
Rio de Janeiro
Salvador
tempo: 20

O Sol é uma estrela.
*Verdadeiro
Falso
tempo: 10`;
const download = (name, text, type = 'text/plain') => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
};
const loadMini = async () => { $('#questions').value = await (await fetch('quizzes/mini-quiz.txt')).text(); };
$('#miniQuiz').onclick = loadMini;
$('#tplJson').onclick = () => { $('#questions').value = TPL_JSON; };
$('#tplTxt').onclick = () => { $('#questions').value = TPL_TXT; };
$('#file').onchange = async (e) => { const f = e.target.files[0]; if (f) $('#questions').value = await f.text(); };

function enterSetup() {
  if (!$('#questions').value) loadMini();
  showScreen('h-setup');
}

function tryAuth(password, silent = false) {
  socket.emit('host:auth', { password }, (res) => {
    const e = $('#loginErr');
    if (res && res.ok) {
      adminPass = password;
      sessionStorage.setItem(AK, password);
      e.classList.remove('on');
      enterSetup();
    } else {
      adminPass = '';
      sessionStorage.removeItem(AK);
      if (!silent) {
        e.textContent = (res && res.error) || 'Senha incorreta';
        e.classList.add('on');
      }
      showScreen('h-login');
    }
  });
}

$('#loginForm').onsubmit = (ev) => {
  ev.preventDefault();
  $('#loginErr').classList.remove('on');
  tryAuth($('#pass').value, false);
};

$('#logoutAdmin').onclick = () => {
  adminPass = '';
  sessionStorage.removeItem(AK);
  $('#pass').value = '';
  $('#loginErr').classList.remove('on');
  showScreen('h-login');
};

$('#create').onclick = () => {
  const questions = $('#questions').value;
  localStorage.setItem('quiz_questions', questions);
  socket.emit('host:create', { password: adminPass, questions, base: BASE }, (res) => {
    const e = $('#setupErr');
    if (res.error) {
      if (res.error === 'Senha incorreta') {
        sessionStorage.removeItem(AK);
        adminPass = '';
        showScreen('h-login');
        $('#loginErr').textContent = 'Sessão expirada. Digite a senha novamente.';
        $('#loginErr').classList.add('on');
        return;
      }
      e.textContent = res.error; e.classList.add('on'); return;
    }
    e.classList.remove('on');
    hs = { pin: res.pin, hostToken: res.hostToken };
    localStorage.setItem(HK, JSON.stringify(hs));
    setRoom(res);
  });
};
function setRoom(res) { $('#pin').textContent = res.pin; $('#qr').src = res.qr; }

socket.on('connect', () => {
  if (hs) socket.emit('host:resume', { ...hs, base: BASE }, (res) => {
    if (res.error) {
      localStorage.removeItem(HK); hs = null;
      if (adminPass) tryAuth(adminPass, true); else showScreen('h-login');
    } else setRoom(res);
  });
  else if (adminPass) tryAuth(adminPass, true);
});

$('#start').onclick = () => socket.emit('host:start');
$('#endQ').onclick = () => socket.emit('host:next');
$('#toRank').onclick = () => socket.emit('host:next');
$('#nextQ').onclick = () => socket.emit('host:next');
const closeAndReload = () => {
  localStorage.removeItem(HK);
  if (socket.connected) socket.emit('host:close', () => location.reload());
  else location.reload();
};
$('#newGame').onclick = closeAndReload;
$('#csv').onclick = () => {
  const rows = ['posicao;nome;pontos', ...current.players.map((p) => `${p.rank};${p.name};${p.score}`)];
  download('resultado.csv', rows.join('\n'), 'text/csv');
};

socket.on('progress', (p) => { $('#hAnswered').textContent = p.answered; });

socket.on('state', (s) => {
  syncClock(s.now); current = s;
  const connected = s.players.filter((p) => p.connected).length;
  switch (s.phase) {
    case 'lobby':
      $('#pcount').textContent = `👥 ${s.players.length} jogador${s.players.length === 1 ? '' : 'es'}`;
      $('#plist').innerHTML = s.players.map((p) => `<div class="player${p.connected ? '' : ' off'}">${avatarSVG(p.avatar, 70)}${esc(p.name)}<span class="x" data-id="${p.id}" title="Remover">✕</span></div>`).join('');
      $('#plist').querySelectorAll('.x').forEach((x) => (x.onclick = () => socket.emit('host:kick', x.dataset.id)));
      $('#start').disabled = !s.players.length;
      showScreen('h-lobby');
      break;
    case 'question':
      if (last.phase !== 'question' || last.qi !== s.q.index) {
        $('#hqNum').textContent = `Pergunta ${s.q.index + 1} / ${s.q.total}`;
        $('#hqText').textContent = s.q.text;
        $('#hAnswers').innerHTML = s.q.options.map((o, i) => `<div class="ans c${i}" style="cursor:default">${SHAPES[i]}<span>${esc(o)}</span></div>`).join('');
        showScreen('h-question');
        runTimer(s.q.endsAt, s.q.time, $('#hBar'), $('#hClock'));
      }
      $('#hAnswered').textContent = s.answered;
      $('#hTotal').textContent = connected;
      break;
    case 'reveal': {
      $('#rText').textContent = s.q.text;
      const max = Math.max(1, ...s.counts);
      $('#rBars').style.gridTemplateColumns = `repeat(${s.q.options.length}, 1fr)`;
      $('#rBars').innerHTML = s.q.options.map((o, i) => `<div class="bar c${i}${i === s.q.correct ? '' : ' dim'}">${s.counts[i]}<div class="col" style="height:0" data-h="${(s.counts[i] / max) * 200 + 10}"></div>${SHAPES[i]}</div>`).join('');
      requestAnimationFrame(() => setTimeout(() => $('#rBars').querySelectorAll('.col').forEach((c) => (c.style.height = c.dataset.h + 'px')), 50));
      $('#rAnswers').innerHTML = s.q.options.map((o, i) => `<div class="ans c${i}${i === s.q.correct ? ' correct' : ' dim'}" style="cursor:default;min-height:70px">${SHAPES[i]}<span>${esc(o)}</span>${i === s.q.correct ? '<span class="n">✔</span>' : ''}</div>`).join('');
      showScreen('h-reveal');
      break;
    }
    case 'ranking':
      $('#hTop').innerHTML = rankRows(s.top);
      $('#nextQ').textContent = s.lastQuestion ? 'Ver pódio final 🏁' : 'Continuar ▶';
      showScreen('h-ranking');
      break;
    case 'ended': {
      if (last.phase !== 'ended') $('#hPodium').innerHTML = podiumHTML(s.players.slice(0, 3), 130);
      $('#hAll').innerHTML = rankRows(s.players.slice(3, 10));
      showScreen('h-ended');
      if (last.phase !== 'ended') celebrate();
      break;
    }
  }
  last = { phase: s.phase, qi: s.q ? s.q.index : -1 };
});

// ---- prompt para IA ----
function buildPrompt() {
  const theme = $('#aiTheme').value.trim() || '[TEMA]';
  const n = Math.max(3, Math.min(40, +$('#aiCount').value || 10));
  return `Crie um quiz com ${n} perguntas sobre o tema: ${theme}.

Responda SOMENTE com o conteúdo abaixo dentro de UM único bloco de código (sem explicações antes ou depois), seguindo EXATAMENTE este formato:

- Cada pergunta é um bloco; deixe UMA linha em branco entre as perguntas.
- 1ª linha do bloco: o texto da pergunta.
- Linhas seguintes: as alternativas, uma por linha (de 2 a 4 alternativas).
- Coloque um asterisco * no começo da alternativa CORRETA (apenas uma por pergunta).
- Última linha do bloco: tempo: N  (segundos para responder, entre 10 e 30).
- Misture perguntas de múltipla escolha (4 alternativas) e de Verdadeiro/Falso (alternativas "Verdadeiro" e "Falso").
- Não numere as perguntas, não use letras (A, B, C) e não use formatação extra.

Exemplo do formato:

Qual é a capital do Brasil?
São Paulo
*Brasília
Rio de Janeiro
Salvador
tempo: 20

O Sol é uma estrela.
*Verdadeiro
Falso
tempo: 10`;
}
const refreshPrompt = () => ($('#aiPrompt').value = buildPrompt());
$('#aiTheme').oninput = refreshPrompt; $('#aiCount').oninput = refreshPrompt; refreshPrompt();
$('#aiCopy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#aiPrompt').value); } catch { $('#aiPrompt').select(); document.execCommand('copy'); }
  toast('Prompt copiado! Cole na sua IA.');
};
$('#clearQ').onclick = () => { $('#questions').value = ''; localStorage.removeItem('quiz_questions'); $('#questions').focus(); };
$('#newGame2').onclick = closeAndReload;

