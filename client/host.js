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
const loadMini = async () => { $('#questions').value = await (await fetch('quizzes/mini-quiz.txt')).text(); renderPreview(); };
$('#miniQuiz').onclick = loadMini;
$('#tplJson').onclick = () => { $('#questions').value = TPL_JSON; renderPreview(); };
$('#tplTxt').onclick = () => { $('#questions').value = TPL_TXT; renderPreview(); };
$('#file').onchange = async (e) => { const f = e.target.files[0]; if (f) { $('#questions').value = await f.text(); renderPreview(); } };

function enterSetup() {
  if (!$('#questions').value) loadMini(); else renderPreview();
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

// ---- parser local + pré-visualização ----
function stripCodeFence(raw) {
  const m = raw.match(/```(?:json|txt|text|markdown)?\s*\r?\n([\s\S]*?)\r?\n```/i);
  return m ? m[1].trim() : raw.replace(/^```[^\n]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim();
}
function normalizeQuestionClient(q, i) {
  const text = String(q.q || q.pergunta || q.question || '').trim();
  const label = text ? `"${text.slice(0, 36)}${text.length > 36 ? '…' : ''}"` : 'sem texto';
  const options = (q.options || q.opcoes || q.alternativas || []).map((o) => String(o).trim()).filter(Boolean);
  if (!text) throw new Error(`Pergunta ${i + 1}: texto vazio`);
  if (options.length < 2 || options.length > 4)
    throw new Error(`Pergunta ${i + 1} (${label}): use de 2 a 4 opções (encontradas: ${options.length})`);
  let correct = q.correct ?? q.correta ?? q.resposta;
  if (typeof correct === 'string' && !/^\d+$/.test(correct.trim())) {
    const idx = options.findIndex((o) => o.toLowerCase() === correct.trim().toLowerCase());
    correct = idx >= 0 ? idx + 1 : 0;
  } else {
    correct = Number(correct);
  }
  if (!Number.isInteger(correct) || correct < 1 || correct > options.length)
    throw new Error(`Pergunta ${i + 1} (${label}): marque a resposta correta com * no início`);
  const time = Math.min(120, Math.max(5, Number(q.time || q.tempo) || 20));
  return { text, options, correct: correct - 1, time };
}
function parseQuestionsClient(raw) {
  raw = stripCodeFence(String(raw || '').trim());
  if (!raw) throw new Error('Cole as perguntas primeiro');
  let list;
  if (raw[0] === '[' || raw[0] === '{') {
    const data = JSON.parse(raw);
    list = Array.isArray(data) ? data : data.questions || data.perguntas;
    if (!Array.isArray(list)) throw new Error('JSON inválido: esperado uma lista de perguntas');
  } else {
    list = raw
      .split(/\r?\n\s*\r?\n/)
      .map((b) => b.trim())
      .filter((b) => b && !/^[-_=]{3,}$/.test(b))
      .map((block) => {
        const lines = block
          .split(/\r?\n/)
          .map((l) => l.trim().replace(/^\*\*(.+)\*\*$/, '$1').trim())
          .filter(Boolean);
        const title = (lines.shift() || '').replace(/^(?:pergunta\s*)?\d+\s*[:)\-]\s+/i, '').trim();
        const q = { q: title, options: [], correct: 0, time: 20 };
        lines.forEach((l) => {
          const t = l.match(/^(?:tempo|time)\s*:\s*(\d+)/i);
          if (t) return (q.time = Number(t[1]));
          const ansLine = l.match(/^(?:resposta\s*correta|correta|resposta)\s*:\s*(.+)$/i);
          if (ansLine) {
            const v = ansLine[1].trim();
            if (/^[1-4]$/.test(v)) q.correct = Number(v);
            else if (/^[a-d]$/i.test(v)) q.correct = v.toUpperCase().charCodeAt(0) - 64;
            else q.correct = v;
            return;
          }
          let isRight = /^\*/.test(l) || /\*\s*$/.test(l) || /(\[correta\]|\(correta\)|\(certa\)|✔|✅)/i.test(l);
          let opt = l
            .replace(/^\*+\s*/, '')
            .replace(/\s*\*+$/, '')
            .replace(/\s*(\[correta\]|\(correta\)|\(certa\)|✔|✅)/gi, '')
            .replace(/^(?:[a-dA-D][).]\s+|-\s+)/, '')
            .replace(/^\*\*(.+)\*\*$/, '$1')
            .trim();
          if (opt.startsWith('*')) { isRight = true; opt = opt.replace(/^\*+\s*/, '').trim(); }
          if (!opt) return;
          if (isRight) q.correct = q.options.length + 1;
          q.options.push(opt);
        });
        return q;
      });
  }
  if (!list.length) throw new Error('Nenhuma pergunta encontrada');
  return list.map(normalizeQuestionClient);
}

function renderPreview() {
  const errEl = $('#setupErr');
  const box = $('#previewBox');
  try {
    const list = parseQuestionsClient($('#questions').value);
    localStorage.setItem('quiz_questions', $('#questions').value);
    errEl.classList.remove('on');
    const tfCount = list.filter((q) => q.options.length === 2).length;
    const quizCount = list.length - tfCount;
    box.innerHTML =
      `<div class="pv-summary"><span>✅ ${list.length} pergunta${list.length > 1 ? 's' : ''} pronta${list.length > 1 ? 's' : ''}!</span><span>${quizCount} Quiz · ${tfCount} V/F</span></div>` +
      list
        .map(
          (q, idx) => `<div class="pv-card">
            <div class="pv-head"><span>#${idx + 1} · ${q.options.length === 2 ? 'Verdadeiro / Falso' : 'Quiz'}</span><span>⏱ ${q.time}s</span></div>
            <div class="pv-q">${esc(q.text)}</div>
            <div class="pv-opts">${q.options.map((o, i) => `<div class="pv-opt c${i}${i === q.correct ? ' ok' : ''}">${SHAPES[i]}<span>${esc(o)}</span>${i === q.correct ? '<span style="margin-left:auto">✔</span>' : ''}</div>`).join('')}</div>
          </div>`
        )
        .join('');
    box.style.display = 'flex';
  } catch (e) {
    box.style.display = 'none';
    box.innerHTML = '';
    errEl.textContent = e.message;
    errEl.classList.add('on');
  }
}
$('#previewBtn').onclick = renderPreview;

// ---- prompt para IA ----
function buildPrompt() {
  const theme = $('#aiTheme').value.trim() || '[TEMA]';
  const n = Math.max(3, Math.min(40, +$('#aiCount').value || 10));
  const type = ($('#aiType') && $('#aiType').value) || 'mix';
  const typeRule =
    type === 'quiz'
      ? '- TODAS as perguntas devem ser de múltipla escolha com exatamente 4 alternativas.'
      : type === 'tf'
      ? '- TODAS as perguntas devem ser de Verdadeiro ou Falso, com exatamente 2 alternativas: "Verdadeiro" e "Falso".'
      : '- Misture perguntas de múltipla escolha (4 alternativas) e de Verdadeiro/Falso (exatamente "Verdadeiro" e "Falso").';
  const example =
    type === 'tf'
      ? `O Sol é uma estrela.\n*Verdadeiro\nFalso\ntempo: 12\n\nA água ferve a 50 graus ao nível do mar.\nVerdadeiro\n*Falso\ntempo: 12`
      : type === 'quiz'
      ? `Qual é a capital do Brasil?\nSão Paulo\n*Brasília\nRio de Janeiro\nSalvador\ntempo: 20\n\nQual é o maior planeta do Sistema Solar?\nMarte\nTerra\n*Júpiter\nSaturno\ntempo: 20`
      : `Qual é a capital do Brasil?\nSão Paulo\n*Brasília\nRio de Janeiro\nSalvador\ntempo: 20\n\nO Sol é uma estrela.\n*Verdadeiro\nFalso\ntempo: 10`;

  return `Crie um quiz com exatamente ${n} perguntas sobre o tema: ${theme}.

Responda SOMENTE com um único bloco de código contendo o texto puro abaixo (sem introdução, sem explicações e sem comentários).

REGRAS OBRIGATÓRIAS:
1. Separe cada pergunta da próxima com EXATAMENTE UMA linha em branco.
2. NÃO deixe linha em branco entre a pergunta e suas alternativas.
3. 1ª linha do bloco: apenas o texto da pergunta (NÃO numere com 1., 2., etc.).
4. Próximas linhas: as alternativas, uma por linha (NÃO use letras A), B), C), nem traços -, nem negrito **).
5. Marque APENAS UMA alternativa correta por pergunta colocando um asterisco * colado no início da linha (ex: *Brasília).
6. Última linha do bloco: tempo: 20 (um número entre 10 e 30).
${typeRule}

EXEMPLO EXATO DO FORMATO:

${example}`;
}
const refreshPrompt = () => ($('#aiPrompt').value = buildPrompt());
$('#aiTheme').oninput = refreshPrompt;
$('#aiCount').oninput = refreshPrompt;
$('#aiType').onchange = refreshPrompt;
refreshPrompt();
$('#aiCopy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#aiPrompt').value); } catch { $('#aiPrompt').select(); document.execCommand('copy'); }
  toast('Prompt copiado! Cole na sua IA.');
};
$('#clearQ').onclick = () => {
  $('#questions').value = '';
  localStorage.removeItem('quiz_questions');
  $('#previewBox').style.display = 'none';
  $('#previewBox').innerHTML = '';
  $('#setupErr').classList.remove('on');
  $('#questions').focus();
};
$('#newGame2').onclick = closeAndReload;

