// Servidor do Quiz ao Vivo (Express + Socket.IO). Estado em memória.
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, pingInterval: 10000, pingTimeout: 20000 });

app.get('/health', (_, res) => res.send('ok'));
app.use(express.static(path.join(__dirname, '..', 'client')));

const rooms = new Map();
const lanIP = () => { for (const l of Object.values(require('os').networkInterfaces())) for (const i of l || []) if (i.family === 'IPv4' && !i.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(i.address)) return i.address; return null; };
const fixBase = (b) => { const ip = lanIP(); return ip ? String(b).replace(/\/\/(localhost|127\.0\.0\.1)/, '//' + ip) : b; };
const rid = () => crypto.randomBytes(12).toString('hex');

// ---------- parsing de perguntas ----------
function stripCodeFence(raw) {
  const m = raw.match(/```(?:json|txt|text|markdown)?\s*\r?\n([\s\S]*?)\r?\n```/i);
  return m ? m[1].trim() : raw.replace(/^```[^\n]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim();
}

function normalizeQuestion(q, i) {
  const text = String(q.q || q.pergunta || q.question || '').trim();
  const label = text ? `"${text.slice(0, 36)}${text.length > 36 ? '…' : ''}"` : 'sem texto';
  const rawOpts = q.options || q.opcoes || q.alternativas || [];
  let options = rawOpts.map((o) => String(o).trim()).filter(Boolean);
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
  const dbl = Boolean(q.double || q.dobro || q.pontos === '2x' || q.points === 2);
  return { text, options, correct: correct - 1, time, double: dbl };
}

function parseQuestions(raw) {
  raw = stripCodeFence(String(raw || '').trim());
  if (!raw) throw new Error('Cole as perguntas primeiro');
  let list;
  if (raw[0] === '[' || raw[0] === '{') {
    const data = JSON.parse(raw);
    list = Array.isArray(data) ? data : data.questions || data.perguntas;
    if (!Array.isArray(list)) throw new Error('JSON inválido: esperado uma lista de perguntas');
  } else {
    // TXT: blocos separados por linha em branco. 1ª linha = pergunta, demais = opções, "*" marca a correta,
    // "tempo: 15" opcional. Tolera markdown simples e marcadores como (correta) / [CORRETA].
    list = raw
      .split(/\r?\n\s*\r?\n/)
      .map((b) => b.trim())
      .filter((b) => b && !/^[-_=]{3,}$/.test(b))
      .map((block) => {
        const lines = block
          .split(/\r?\n/)
          .map((l) => l.trim().replace(/^\*\*(.+)\*\*$/, '$1').trim())
          .filter(Boolean);
        let title = (lines.shift() || '').replace(/^(?:pergunta\s*)?\d+\s*[:)\-]\s+/i, '').trim();
        const q = { q: title, options: [], correct: 0, time: 20 };
        lines.forEach((l) => {
          const t = l.match(/^(?:tempo|time)\s*:\s*(\d+)/i);
          if (t) return (q.time = Number(t[1]));
          if (/^(?:pontos?\s*:\s*2x|dobro|2x|pontos?\s+duplos?)$/i.test(l)) return (q.double = true);
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
  return list.map(normalizeQuestion);
}

function applyDoublePoints(list, doubleCount) {
  const n = Number(doubleCount);
  if (!Number.isInteger(n) || n < 0) return list;
  const out = list.map((q) => ({ ...q }));
  let picked = out.filter((q) => q.double).length;
  if (picked > n) {
    let keep = n;
    out.forEach((q) => { if (q.double) { if (keep > 0) keep--; else q.double = false; } });
  } else if (picked < n) {
    // Promove perguntas (preferindo Quiz de 3-4 opções da metade para o fim)
    const cands = out
      .map((q, idx) => ({ q, idx }))
      .filter((x) => !x.q.double)
      .sort((a, b) => {
        const qa = a.q.options.length > 2 ? 1 : 0, qb = b.q.options.length > 2 ? 1 : 0;
        if (qb !== qa) return qb - qa;
        return b.idx - a.idx;
      });
    for (const c of cands) {
      if (picked >= n) break;
      if (c.idx === 0 && out.length > n) continue;
      c.q.double = true;
      picked++;
    }
    for (const c of cands) {
      if (picked >= n) break;
      if (!c.q.double) { c.q.double = true; picked++; }
    }
  }
  return out;
}

function shuffleQuestionOptions(q) {
  if (q.options.length <= 2) return q;
  const pairs = q.options.map((text, idx) => ({ text, ok: idx === q.correct }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return { ...q, options: pairs.map((p) => p.text), correct: pairs.findIndex((p) => p.ok) };
}

// ---------- sala ----------
function newPin() {
  let pin;
  do pin = String(Math.floor(100000 + Math.random() * 900000));
  while (rooms.has(pin));
  return pin;
}

const ranking = (room) =>
  [...room.players.values()].sort((a, b) => b.score - a.score).map((p, i) => ({ ...pub(p), rank: i + 1 }));
const pub = (p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score, connected: p.connected });

function questionView(room, withCorrect) {
  const q = room.questions[room.qIndex];
  if (!q) return null;
  return {
    index: room.qIndex,
    total: room.questions.length,
    text: q.text,
    options: q.options,
    time: q.time,
    double: !!q.double,
    endsAt: room.endsAt,
    ...(withCorrect ? { correct: q.correct } : {}),
  };
}

function counts(room) {
  const q = room.questions[room.qIndex];
  const c = q ? q.options.map(() => 0) : [];
  room.answers.forEach((a) => c[a.choice]++);
  return c;
}

function hostView(room) {
  const revealed = room.phase === 'reveal' || room.phase === 'ranking' || room.phase === 'ended';
  return {
    role: 'host',
    now: Date.now(),
    phase: room.phase,
    pin: room.pin,
    players: ranking(room),
    q: questionView(room, revealed),
    answered: room.answers.size,
    counts: counts(room),
    top: ranking(room).slice(0, 5),
    totalQuestions: room.questions.length,
    lastQuestion: room.qIndex >= room.questions.length - 1,
  };
}

function playerView(room, p) {
  const rk = ranking(room);
  const me = rk.find((r) => r.id === p.id);
  const a = room.answers.get(p.id);
  const q = room.questions[room.qIndex];
  const revealed = room.phase === 'reveal' || room.phase === 'ranking';
  return {
    role: 'player',
    now: Date.now(),
    phase: room.phase,
    pin: room.pin,
    me: { ...pub(p), rank: me.rank },
    count: room.players.size,
    q: questionView(room, false),
    answered: !!a,
    picked: a ? a.choice : null,
    result: revealed && q ? { correct: q.correct, ok: !!a && a.choice === q.correct, points: a ? a.points : 0 } : null,
    top: rk.slice(0, 5),
    nextRank: rk[me.rank - 2] ? rk[me.rank - 2] : null,
    podium: room.phase === 'ended' ? rk.slice(0, 3) : null,
  };
}

function liveInfo() {
  const room = [...rooms.values()].at(-1);
  if (!room) return { live: false };
  return { live: true, pin: room.pin, phase: room.phase, count: room.players.size };
}

function emitRoom(room) {
  if (!rooms.has(room.pin)) return;
  const hv = hostView(room);
  io.to('host:' + room.pin).emit('state', hv);
  io.to('watch:' + room.pin).emit('state', { ...hv, role: 'watch' });
  room.players.forEach((p) => io.to('p:' + room.pin + ':' + p.id).emit('state', playerView(room, p)));
  io.emit('live:status', liveInfo());
}

function emitProgress(room) {
  io.to('host:' + room.pin).to('watch:' + room.pin).emit('progress', { answered: room.answers.size, counts: counts(room) });
}

function startQuestion(room) {
  clearTimeout(room.timer);
  const q = room.questions[room.qIndex];
  room.phase = 'question';
  room.answers = new Map();
  room.top3Ids = new Set(ranking(room).slice(0, 3).filter((p) => p.score > 0).map((p) => p.id));
  room.startedAt = Date.now();
  room.endsAt = room.startedAt + q.time * 1000;
  room.timer = setTimeout(() => endQuestion(room), q.time * 1000 + 400);
  emitRoom(room);
}

function endQuestion(room) {
  if (room.phase !== 'question') return;
  clearTimeout(room.timer);
  room.phase = 'reveal';
  emitRoom(room);
}

function advance(room) {
  if (room.phase === 'reveal') {
    room.phase = 'ranking';
    emitRoom(room);
  } else if (room.phase === 'ranking') {
    if (room.qIndex >= room.questions.length - 1) {
      room.phase = 'ended';
      emitRoom(room);
    } else {
      room.qIndex++;
      startQuestion(room);
    }
  }
}

const cleanAvatar = (a) => {
  const o = {};
  Object.keys(a || {}).slice(0, 12).forEach((k) => {
    const v = a[k];
    if (typeof v === 'number' || (typeof v === 'string' && v.length < 20)) o[k] = v;
  });
  return o;
};

// ---------- sockets ----------
io.on('connection', (socket) => {
  let ctx = null; // { room, role, pid }
  socket.emit('live:status', liveInfo());

  socket.on('watch:join', async ({ pin, base } = {}, cb) => {
    if (typeof cb !== 'function') return;
    const room = pin ? rooms.get(String(pin).trim()) : [...rooms.values()].at(-1);
    if (!room) return cb({ error: 'Nenhuma sala ao vivo no momento.' });
    socket.join('watch:' + room.pin);
    ctx = { room, role: 'watch' };
    const joinUrl = `${fixBase(base)}?pin=${room.pin}`;
    cb({ ok: true, pin: room.pin, joinUrl, qr: await QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }) });
    socket.emit('state', { ...hostView(room), role: 'watch' });
  });

  socket.on('watch:leave', (cb) => {
    if (ctx?.role === 'watch') {
      socket.leave('watch:' + ctx.room.pin);
      ctx = null;
    }
    if (typeof cb === 'function') cb();
  });

  socket.on('room:check', ({ pin, token } = {}, cb) => {
    if (typeof cb !== 'function') return;
    const room = rooms.get(String(pin || '').trim());
    if (!room) return cb({ open: false, reason: 'Sala fechada ou não encontrada.' });
    if (room.phase === 'ended') return cb({ open: false, reason: 'Esta sala já foi encerrada.' });
    const hasPlayer = !!(token && room.players.get(token));
    if (room.phase !== 'lobby' && !hasPlayer)
      return cb({ open: false, reason: 'Esta sala já iniciou o jogo.' });
    cb({ open: true, phase: room.phase, hasPlayer });
  });

  socket.on('host:auth', ({ password } = {}, cb) => {
    if (typeof cb !== 'function') return;
    if (password !== ADMIN_PASSWORD) return cb({ error: 'Senha incorreta' });
    cb({ ok: true });
  });

  socket.on('host:preset', ({ password, id } = {}, cb) => {
    if (typeof cb !== 'function') return;
    if (password !== ADMIN_PASSWORD) return cb({ error: 'Senha incorreta' });
    const presets = { 'sne-pne': path.join(__dirname, 'quizzes', 'sne-pne.txt') };
    const file = presets[id];
    if (!file) return cb({ error: 'Quiz não encontrado' });
    try { cb({ ok: true, text: require('fs').readFileSync(file, 'utf8') }); }
    catch { cb({ error: 'Erro ao ler o quiz' }); }
  });

  socket.on('host:create', async ({ password, questions, base, timeOverride, shuffle, doubleCount, podiumPenalty }, cb) => {
    try {
      if (password !== ADMIN_PASSWORD) return cb({ error: 'Senha incorreta' });
      let qs = parseQuestions(questions);
      const tOv = Number(timeOverride);
      if (Number.isFinite(tOv) && tOv >= 5 && tOv <= 120) qs = qs.map((q) => ({ ...q, time: tOv }));
      qs = applyDoublePoints(qs, doubleCount);
      const shuf = !!shuffle;
      const pin = newPin();
      const room = {
        pin, hostToken: rid(), phase: 'lobby', baseQuestions: qs,
        questions: shuf ? qs.map(shuffleQuestionOptions) : qs,
        shuffle: shuf, podiumPenalty: podiumPenalty !== false,
        qIndex: 0, players: new Map(), answers: new Map(), created: Date.now(),
      };
      rooms.set(pin, room);
      socket.join('host:' + pin);
      ctx = { room, role: 'host' };
      const joinUrl = `${fixBase(base)}?pin=${pin}`;
      cb({ ok: true, pin, hostToken: room.hostToken, joinUrl, qr: await QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }) });
      emitRoom(room);
    } catch (e) {
      cb({ error: e.message });
    }
  });

  socket.on('host:resume', async ({ pin, hostToken, base }, cb) => {
    const room = rooms.get(pin);
    if (!room || room.hostToken !== hostToken) return cb({ error: 'Sala não encontrada' });
    socket.join('host:' + pin);
    ctx = { room, role: 'host' };
    const joinUrl = `${fixBase(base)}?pin=${pin}`;
    cb({ ok: true, pin, joinUrl, qr: await QRCode.toDataURL(joinUrl, { margin: 1, width: 360 }) });
    socket.emit('state', hostView(room));
  });

  socket.on('host:close', (cb) => {
    if (ctx?.role === 'host') {
      const room = ctx.room;
      clearTimeout(room.timer);
      rooms.delete(room.pin);
      room.players.forEach((_, id) => io.to('p:' + room.pin + ':' + id).emit('room:closed'));
      io.to('watch:' + room.pin).emit('room:closed');
      ctx = null;
      io.emit('live:status', liveInfo());
    }
    if (typeof cb === 'function') cb();
  });

  socket.on('host:start', () => {
    if (ctx?.role !== 'host' || ctx.room.phase !== 'lobby' || !ctx.room.players.size) return;
    ctx.room.qIndex = 0;
    startQuestion(ctx.room);
  });
  socket.on('host:next', () => {
    if (ctx?.role !== 'host') return;
    if (ctx.room.phase === 'question') endQuestion(ctx.room);
    else advance(ctx.room);
  });
  socket.on('host:restart', () => {
    if (ctx?.role !== 'host') return;
    const room = ctx.room;
    clearTimeout(room.timer);
    room.phase = 'lobby';
    room.qIndex = 0;
    room.answers = new Map();
    room.players.forEach((p) => { p.score = 0; });
    room.questions = room.shuffle ? room.baseQuestions.map(shuffleQuestionOptions) : room.baseQuestions;
    emitRoom(room);
  });
  socket.on('host:kick', (id) => {
    if (ctx?.role !== 'host') return;
    ctx.room.players.delete(id);
    io.to('p:' + ctx.room.pin + ':' + id).emit('kicked');
    emitRoom(ctx.room);
  });

  socket.on('player:join', ({ pin, name, avatar, token }, cb) => {
    const room = rooms.get(String(pin || '').trim());
    if (!room) return cb({ error: 'Sala fechada ou não encontrada. Confira o PIN.', closed: true });
    if (room.phase === 'ended') return cb({ error: 'Esta sala já encerrou.', closed: true });
    let p = token && room.players.get(token);
    if (!p) {
      if (room.phase !== 'lobby') return cb({ error: 'O jogo já começou. Não é possível entrar agora.', closed: true });
      name = String(name || '').trim().slice(0, 14);
      if (!name) return cb({ error: 'Digite um apelido' });
      if ([...room.players.values()].some((x) => x.name.toLowerCase() === name.toLowerCase()))
        return cb({ error: 'Esse apelido já está em uso' });
      p = { id: rid(), name, avatar: cleanAvatar(avatar), score: 0, connected: true };
      room.players.set(p.id, p);
    } else {
      p.connected = true;
      if (avatar && room.phase === 'lobby') p.avatar = cleanAvatar(avatar);
    }
    socket.join('p:' + room.pin + ':' + p.id);
    ctx = { room, role: 'player', pid: p.id };
    cb({ ok: true, token: p.id });
    emitRoom(room);
  });

  socket.on('player:leave', (cb) => {
    if (ctx?.role === 'player') {
      const { room, pid } = ctx;
      socket.leave('p:' + room.pin + ':' + pid);
      if (room.phase === 'lobby') room.players.delete(pid);
      else {
        const p = room.players.get(pid);
        if (p) p.connected = false;
      }
      ctx = null;
      emitRoom(room);
    }
    if (typeof cb === 'function') cb();
  });

  socket.on('player:avatar', (avatar) => {
    if (ctx?.role !== 'player' || ctx.room.phase !== 'lobby') return;
    ctx.room.players.get(ctx.pid).avatar = cleanAvatar(avatar);
    emitRoom(ctx.room);
  });

  socket.on('player:answer', (choice) => {
    if (ctx?.role !== 'player') return;
    const room = ctx.room;
    const q = room.questions[room.qIndex];
    if (room.phase !== 'question' || room.answers.has(ctx.pid)) return;
    const now = Date.now();
    if (now > room.endsAt + 600 || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return;
    const frac = Math.min(1, (now - room.startedAt) / (q.time * 1000));
    const ok = choice === q.correct;
    const basePts = q.double ? 2000 : 1000;
    let points = 0;
    if (ok) {
      points = Math.round(basePts * (1 - frac / 2));
    } else if (room.podiumPenalty && room.top3Ids && room.top3Ids.has(ctx.pid)) {
      const pl = room.players.get(ctx.pid);
      points = -Math.min(pl.score, q.double ? 400 : 250);
    }
    room.answers.set(ctx.pid, { choice, points });
    const pl = room.players.get(ctx.pid);
    pl.score = Math.max(0, pl.score + points);
    io.to('p:' + room.pin + ':' + ctx.pid).emit('state', playerView(room, room.players.get(ctx.pid)));
    emitProgress(room);
    const connected = [...room.players.values()].filter((p) => p.connected).length;
    if (room.answers.size >= connected) endQuestion(room);
  });

  socket.on('disconnect', () => {
    if (ctx?.role === 'player' && rooms.has(ctx.room.pin)) {
      const p = ctx.room.players.get(ctx.pid);
      // só marca offline se não houver outro socket do mesmo jogador
      const still = io.sockets.adapter.rooms.get('p:' + ctx.room.pin + ':' + ctx.pid);
      if (p && !(still && still.size)) {
        p.connected = false;
        emitRoom(ctx.room);
      }
    }
  });
});

setInterval(() => {
  const limit = Date.now() - 8 * 3600 * 1000;
  rooms.forEach((r, k) => r.created < limit && rooms.delete(k));
}, 600000);

server.listen(PORT, () => console.log(`Quiz ao Vivo rodando em http://localhost:${PORT}  (senha admin: ${ADMIN_PASSWORD})`));
