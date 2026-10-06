(() => {
  'use strict';
  const C = window.CASE_FILE;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const OTHER = 'other';
  const DAY = 864e5;
  const STEPS = [['quiz', 'Hỏi cung'], ['court', 'Phân xử'], ['choice', 'Câu hỏi'], ['game', 'Chém món'], ['final', 'Mở thư']];
  const RIGHT = ['Đúng rồi.', 'Chuẩn.', 'Giỏi đấy.', 'Nhớ dai ghê.'];
  const WRONG = ['Sai rồi nhé.', 'Hụt.', 'Không phải đâu.', 'Trật lất.'];
  const fresh = () => ({ screen: 'home', from: 'court', quiz: 0, score: 0, verdicts: {}, yes: 0, noDodges: 0, noRefused: false, gameWon: false });
  const state = { ...fresh(), audio: false };
  let toastTimer, cleanup = null, audioCtx = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // Bỏ dấu, hạ chữ thường, gom dấu câu thành khoảng trắng: "Cơm Tấm!" -> "com tam".
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const matches = (text, keys = []) => { const t = norm(text); return !!t && keys.some(k => ` ${t} `.includes(` ${norm(k)} `)); };

  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const fmtDate = s => parseDate(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const daysTogether = () => Math.round((today() - parseDate(C.relationshipStart)) / DAY);
  function anniversaryNote() {
    const start = parseDate(C.relationshipStart), now = today();
    const next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    const years = next.getFullYear() - start.getFullYear(), left = Math.round((next - now) / DAY);
    return left === 0 ? `Hôm nay tròn ${years} năm` : `Còn ${left} ngày nữa là tròn ${years} năm`;
  }

  function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
  const screens = { home, quiz, quizResult, court, choice, game: gameScreen, memories, final: finalScreen };
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    (screens[state.screen] || home)();
    app.querySelectorAll('[data-back]').forEach(b => b.onclick = () => go(b.dataset.back));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function go(screen) { state.screen = screen; render(); }
  function openMemories() { state.from = state.screen; go('memories'); }

  function stepper(current) {
    const at = STEPS.findIndex(s => s[0] === current);
    return `<ol class="steps" aria-label="Tiến độ">${STEPS.map(([, label], i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"${i === at ? ' aria-current="step"' : ''}><span>${i < at ? '✓' : i + 1}</span><em>${label}</em></li>`).join('')}</ol>`;
  }
  function head({ back, backLabel, step, eyebrow, title, intro = '', label = '' }) {
    return `<div class="section-top"><button class="back-link" data-back="${back}">← ${backLabel}</button>${step ? stepper(step) : ''}</div><div class="section-head"><div><div class="eyebrow">${eyebrow}</div><h2 class="screen-title">${title}</h2>${intro ? `<p class="intro">${intro}</p>` : ''}</div>${label ? `<div class="step-label">${label}</div>` : ''}</div>`;
  }

  function home() {
    app.innerHTML = `<section class="hero" id="home"><div class="hero-copy"><div class="eyebrow">Chuyên án kỉ niệm 3 năm</div><h1>HỒ SƠ<br>TUYỆT MẬT<br><em>03 NĂM</em></h1><p class="lead">Hồ sơ này chỉ mở cho <b>${esc(C.agentNickname)}</b>. Có một vụ cần em điều tra: ${esc(C.caseIntro)}</p><dl class="case-facts"><div class="fact"><dt>Đối tượng</dt><dd>${esc(C.partnerName)}<small>hay ${esc(C.partnerNickname)}</small></dd></div><div class="fact"><dt>Ngày bắt đầu</dt><dd>${fmtDate(C.relationshipStart)}<small>Ngày tỏ tình</small></dd></div><div class="fact"><dt>Đã ở cạnh nhau</dt><dd>${daysTogether().toLocaleString('vi-VN')} ngày<small>${anniversaryNote()}</small></dd></div></dl><button class="btn btn-primary" id="start">Nhận vụ này →</button></div><div class="hero-art" aria-hidden="true"><span class="heart-note">♥</span><span class="paperclip">⌁</span><div class="folder"><div class="folder-tag">P.H.S · ĐIỀU TRA TÌNH CẢM</div><div class="folder-name">Vụ án: Hai đứa và miếng ăn cuối</div><div class="folder-lines">MÃ HỒ SƠ: 03-A<br>MỨC ĐỘ: RẤT ĐÁNG NGỜ<br>TÌNH TRẠNG: VẪN THƯƠNG NHAU</div><div class="stamp">TỐI<br>MẬT</div></div></div></section>`;
    document.getElementById('start').onclick = () => { Object.assign(state, { quiz: 0, score: 0 }); go('quiz'); };
  }

  function quiz() {
    const q = C.quiz[state.quiz];
    if (!q) return go('quizResult');
    const total = C.quiz.length, hasOther = Array.isArray(q.other) && q.other.length > 0;
    app.innerHTML = `<section class="section">${head({ back: 'home', backLabel: 'Trang đầu', step: 'quiz', eyebrow: 'Phần 1 · Hỏi cung', title: 'Em nhớ được bao nhiêu?', label: `Câu ${state.quiz + 1}/${total}` })}<div class="card question-card"><div class="progress"><span style="width:${state.quiz / total * 100}%"></span></div><h3 class="question">${esc(q.question)}</h3><div class="choices">${q.choices.map((x, i) => `<button class="choice" data-answer="${i}">${esc(x)}</button>`).join('')}${hasOther ? `<button class="choice choice-other" data-answer="${OTHER}">Khác, để em tự ghi…</button>` : ''}</div>${hasOther ? `<form class="other-form hidden" id="otherForm"><label for="otherInput">Em nghĩ là gì?</label><div class="other-row"><input id="otherInput" autocomplete="off" maxlength="80" placeholder="Gõ câu trả lời"><button class="btn btn-dark" type="submit">Chốt</button></div></form>` : ''}<div id="quizFeedback" class="feedback">Chọn một đáp án.</div><div class="action-row"><button class="small-link" id="skipQuiz">Bỏ qua phần này</button><button class="btn btn-primary hidden" id="nextQuiz">${state.quiz === total - 1 ? 'Xem kết quả' : 'Câu tiếp'} →</button></div></div></section>`;
    const buttons = [...app.querySelectorAll('[data-answer]')], form = document.getElementById('otherForm'), input = document.getElementById('otherInput');
    const feedback = document.getElementById('quizFeedback'), next = document.getElementById('nextQuiz');
    function settle(right, button, typed) {
      if (right) state.score++;
      buttons.forEach(b => b.disabled = true);
      if (form) { form.querySelectorAll('input,button').forEach(x => x.disabled = true); if (!typed) form.classList.add('hidden'); }
      button.classList.add(right ? 'is-right' : 'is-wrong');
      if (!right && q.answer >= 0) buttons[q.answer].classList.add('is-right');
      feedback.className = `feedback ${right ? 'ok' : 'no'}`;
      feedback.innerHTML = `<b>${pick(right ? RIGHT : WRONG)}</b> ${typed ? `Em ghi “${esc(typed)}”. ` : ''}${esc(q.fact)}`;
      next.classList.remove('hidden'); next.focus({ preventScroll: true });
    }
    buttons.forEach(b => b.onclick = () => {
      if (b.dataset.answer !== OTHER) return settle(Number(b.dataset.answer) === q.answer, b);
      b.classList.add('picked'); form.classList.remove('hidden'); input.focus();
    });
    if (form) form.onsubmit = e => {
      e.preventDefault();
      const typed = input.value.trim();
      if (!typed) return input.focus();
      settle(matches(typed, q.other) || (q.answer >= 0 && norm(typed) === norm(q.choices[q.answer])), buttons[buttons.length - 1], typed);
    };
    next.onclick = () => { state.quiz++; render(); };
    document.getElementById('skipQuiz').onclick = () => go('court');
  }

  function quizResult() {
    const total = C.quiz.length, verdict = C.quizVerdicts.find(v => state.score >= v.min * total) || C.quizVerdicts[C.quizVerdicts.length - 1];
    app.innerHTML = `<section class="section">${head({ back: 'home', backLabel: 'Trang đầu', step: 'quiz', eyebrow: 'Phần 1 · Kết quả', title: 'Chấm điểm' })}<div class="card result-card"><div class="score-big">${state.score}<span>/${total}</span></div><p>${esc(verdict.text)}</p><div class="action-row"><button class="small-link" id="redoQuiz">Làm lại</button><button class="btn btn-primary" id="toCourt">Sang phần phân xử →</button></div></div></section>`;
    document.getElementById('redoQuiz').onclick = () => { Object.assign(state, { quiz: 0, score: 0 }); go('quiz'); };
    document.getElementById('toCourt').onclick = () => go('court');
  }

  function court() {
    const parties = { agent: C.agentNickname, partner: C.partnerNickname, both: 'Cả hai' };
    const reactions = {
      agent: ['Ghi vào hồ sơ của {a}.', '{a} nhận tội. Được giảm án nếu ôm một cái.', 'Tự khai là được khoan hồng.'],
      partner: ['{p} nhận án. Anh xin kháng cáo.', 'Ghi nhận. {p} sẽ xem lại bản thân. Chắc vậy.', 'Ừ thì… cái này đúng là anh.'],
      both: ['Cả hai cùng tội. Án phạt: tiếp tục ở với nhau.', 'Huề. Không ai được chê ai.']
    };
    const fill = s => s.replace('{a}', C.agentNickname).replace('{p}', C.partnerNickname);
    app.innerHTML = `<section class="section">${head({ back: 'quizResult', backLabel: 'Kết quả hỏi cung', step: 'court', eyebrow: 'Phần 2 · Phân xử', title: 'Tật này của ai?', intro: 'Mỗi tật xấu chọn một người, hoặc cả hai. Khai gì cũng sẽ bị lôi ra trêu về sau.', label: `<span id="courtCount">0</span>/${C.allegations.length}` })}<div class="allegations">${C.allegations.map((x, i) => `<article class="allegation"><span class="count">#${String(i + 1).padStart(2, '0')}</span><p>${esc(x)}</p><div class="suspects">${Object.entries(parties).map(([k, name]) => `<button class="verdict-choice${state.verdicts[i] === k ? ' selected' : ''}" data-charge="${i}" data-party="${k}" aria-pressed="${state.verdicts[i] === k}">${esc(name)}</button>`).join('')}</div></article>`).join('')}</div><div id="courtResult" class="court-result">Tòa đang chờ lời khai đầu tiên.</div><div class="action-row"><button class="small-link" id="toMemories">Xem kho kỉ niệm</button><button class="btn btn-primary" id="toChoice">Tiếp →</button></div></section>`;
    const result = document.getElementById('courtResult');
    function tally() {
      const counts = { agent: 0, partner: 0, both: 0 };
      Object.values(state.verdicts).forEach(k => counts[k]++);
      const done = Object.keys(state.verdicts).length;
      document.getElementById('courtCount').textContent = done;
      if (done < C.allegations.length) return false;
      const end = counts.agent > counts.partner ? 'Em tự khai đấy nhé, anh không ép.' : counts.partner > counts.agent ? 'Anh xin kháng án, nhưng chắc chẳng ai nghe.' : 'Huề nhau. Đúng là một đội.';
      result.textContent = `Chốt hồ sơ: ${C.agentNickname} ${counts.agent} tội, ${C.partnerNickname} ${counts.partner} tội, chung ${counts.both}. ${end}`;
      return true;
    }
    tally();
    app.querySelectorAll('[data-charge]').forEach(b => b.onclick = () => {
      const i = b.dataset.charge;
      state.verdicts[i] = b.dataset.party;
      app.querySelectorAll(`[data-charge="${i}"]`).forEach(x => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', x === b); });
      if (!tally()) result.textContent = fill(pick(reactions[b.dataset.party]));
    });
    document.getElementById('toChoice').onclick = () => go('choice');
    document.getElementById('toMemories').onclick = openMemories;
  }

  function choice() {
    const yesLabels = ['Có', 'Có thật mà', 'Tin em đi', 'Để em chứng minh'];
    const yesReplies = ['Trả lời nhanh thế, chưa nghĩ gì đúng không?', 'Vẫn chưa tin. Ba năm mà bấm Có là xong à?', 'Được rồi. Giờ chứng minh đi.'];
    const giveUp = 'Thôi, cho bấm thật đấy. Nhưng anh vẫn mong em chọn Có.';
    app.innerHTML = `<section class="section">${head({ back: 'court', backLabel: 'Phần phân xử', step: 'choice', eyebrow: 'Phần 3 · Câu hỏi', title: 'Còn một câu nữa' })}<div class="choice-stage"><h3>Năm thứ tư, em vẫn đi cùng anh chứ?</h3><p>Trả lời thật lòng. Nút Có hơi được ưu ái một chút.</p><div class="choice-actions" id="choiceActions"><button class="btn btn-primary" id="yesButton">${yesLabels[Math.min(state.yes, 3)]}</button><button class="btn btn-no" id="noButton">${esc(state.noRefused ? 'Không, cảm ơn' : C.noButtonLines[Math.min(state.noDodges, C.noButtonLines.length - 1)])}</button></div><div id="choiceStatus" class="choice-status">${state.noDodges >= 5 && !state.noRefused ? giveUp : ''}</div><button id="noContinue" class="btn btn-quiet ${state.noRefused ? '' : 'hidden'}">Vẫn đi tiếp →</button></div></section>`;
    const no = document.getElementById('noButton'), area = document.getElementById('choiceActions'), status = document.getElementById('choiceStatus');
    let swallowClick = false;
    function dodge() {
      state.noDodges++;
      no.textContent = C.noButtonLines[Math.min(state.noDodges, C.noButtonLines.length - 1)];
      if (state.noDodges >= 5) { no.style.transform = ''; status.textContent = giveUp; return; }
      const a = area.getBoundingClientRect(), n = no.getBoundingClientRect();
      const x = n.left + (Math.random() - .5) * Math.min(120, a.width * .38), y = n.top + (Math.random() - .5) * 42;
      const dx = Math.max(a.left, Math.min(a.right - n.width, x)) - n.left, dy = Math.max(a.top, Math.min(a.bottom - n.height, y)) - n.top;
      no.style.transform = `translate(${dx}px,${dy}px) rotate(${(Math.random() - .5) * 12}deg)`;
    }
    // Chuột/ngón tay: né ngay khi vừa chạm. Bàn phím: né khi click. Sau 5 lần thì cho bấm thật.
    no.addEventListener('pointerdown', e => {
      if (state.noRefused || state.noDodges >= 5) return;
      e.preventDefault(); dodge(); swallowClick = true; setTimeout(() => swallowClick = false, 400);
    });
    no.addEventListener('click', () => {
      if (swallowClick) { swallowClick = false; return; }
      if (state.noRefused) return showToast('Ghi nhận rồi. Hồ sơ vẫn chưa đóng đâu.');
      if (state.noDodges < 5) return dodge();
      state.noRefused = true; no.textContent = 'Không, cảm ơn';
      status.textContent = 'Anh tôn trọng. Đổi ý lúc nào cũng được. ♥';
      document.getElementById('noContinue').classList.remove('hidden');
    });
    document.getElementById('noContinue').onclick = () => { state.noRefused = false; go('game'); };
    document.getElementById('yesButton').onclick = e => {
      state.yes++;
      e.currentTarget.textContent = yesLabels[Math.min(state.yes, 3)];
      status.textContent = yesReplies[Math.min(state.yes - 1, 2)];
      if (state.yes >= 3) setTimeout(() => { if (state.screen === 'choice') go('game'); }, 900);
    };
  }

  function gameScreen() {
    const G = C.game, chip = f => `<span class="food-chip">${f.img ? `<img src="${esc(f.img)}" alt="" onerror="this.replaceWith('${f.icon}')">` : esc(f.icon)}${esc(f.label)}</span>`;
    app.innerHTML = `<section class="section">${head({ back: 'choice', backLabel: 'Câu hỏi', step: 'game', eyebrow: 'Phần 4 · Chứng minh đi', title: 'Chém món anh thích', intro: `Chém món của anh để ghi điểm. Món của em cũng bay lên lẫn vào, chém nhầm là mất một mạng. ${G.time} giây, ${G.lives} mạng, cần ${G.target} điểm.` })}<div class="game-wrap"><div class="food-legend"><div><b>Chém</b>${G.good.map(chip).join('')}</div><div><b class="bad">Né</b>${G.bad.map(chip).join('')}</div></div><div class="game-hud"><span>Điểm <strong id="scoreLabel">0</strong>/${G.target}</span><b id="lifeLabel" aria-label="Số mạng">${'♥ '.repeat(G.lives).trim()}</b><strong id="timeLabel">${G.time.toFixed(1)}s</strong></div><div class="game-frame"><canvas id="slice" width="360" height="510" aria-label="Trò chơi chém món ăn"></canvas><div id="gameOverlay" class="game-overlay"><div class="game-overlay-inner"><div class="eyebrow">Cách chơi</div><h3>Sẵn sàng chưa?</h3><p>Vuốt ngón tay hoặc giữ chuột rồi kéo ngang qua món ăn để chém.</p><button class="btn btn-primary" id="startGame">Bắt đầu →</button></div></div></div></div></section>`;
    setupSlice();
  }
  function setupSlice() {
    const G = C.game, canvas = document.getElementById('slice'), ctx = canvas.getContext('2d'), W = 360, H = 510, GRAVITY = 620, R = 30, SLOW = .5; // SLOW: món bay chậm bằng một nửa, quỹ đạo giữ nguyên
    const load = f => { const image = new Image(); if (f.img) image.src = f.img; return { ...f, image }; };
    const good = G.good.map(load), bad = G.bad.map(load);
    const g = { objs: [], halves: [], drops: [], texts: [], trail: [], score: 0, lives: G.lives, elapsed: 0, last: 0, spawn: .4, running: false, ended: false, raf: 0, flash: 0, shake: 0, down: false };
    const scoreLabel = document.getElementById('scoreLabel'), lifeLabel = document.getElementById('lifeLabel'), timeLabel = document.getElementById('timeLabel');
    const rand = (a, b) => a + Math.random() * (b - a);
    cleanup = () => { g.running = false; cancelAnimationFrame(g.raf); };

    function spawnWave() {
      const n = g.elapsed > 12 && Math.random() < .3 ? 2 : 1, badChance = g.elapsed > 15 ? .35 : .3;
      for (let i = 0; i < n; i++) {
        const isBad = Math.random() < badChance, x = rand(60, W - 60);
        g.objs.push({ food: pick(isBad ? bad : good), bad: isBad, x, y: H + R + i * 18, vx: (W / 2 - x) * rand(.25, .7) + rand(-30, 30), vy: -rand(560, 690), rot: rand(-1, 1), vr: rand(-3, 3) });
      }
      g.spawn = rand(1.1, 1.6) - Math.min(.3, g.elapsed / 100);
    }
    function sprite(food, size) {
      if (food.image.complete && food.image.naturalWidth) ctx.drawImage(food.image, -size / 2, -size / 2, size, size);
      else { ctx.font = `${size * .8}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(food.icon, 0, 2); }
    }
    function float(text, x, y, color) { g.texts.push({ text, x, y, color, life: .8 }); }
    function cut(o, angle) {
      o.dead = true;
      [-1, 1].forEach(side => g.halves.push({ food: o.food, side, x: o.x, y: o.y, vx: o.vx + side * 90 * Math.cos(angle + Math.PI / 2), vy: Math.min(o.vy, 0) * .4 - 60, rot: angle, vr: side * 4, life: 1.2 }));
      for (let i = 0; i < 10; i++) g.drops.push({ x: o.x, y: o.y, vx: rand(-160, 160), vy: rand(-220, 60), life: rand(.3, .6), color: o.bad ? '#ff6b57' : '#ffd77a' });
      if (o.bad) {
        g.lives--; g.flash = .45; g.shake = .3;
        float(`${o.food.label}? Món của em mà!`, o.x, o.y - 30, '#ff8a78');
        if (navigator.vibrate) navigator.vibrate(120);
      } else { g.score++; float(`+1 ${o.food.label}`, o.x, o.y - 30, '#fff3cf'); }
    }
    function hitTest(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
      if (len2 < 4) return;
      const angle = Math.atan2(dy, dx);
      g.objs.forEach(o => {
        if (o.dead) return;
        const t = Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.y - a.y) * dy) / len2));
        if (Math.hypot(a.x + t * dx - o.x, a.y + t * dy - o.y) < R + 6) cut(o, angle);
      });
    }
    const toLocal = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, t: performance.now() }; };
    canvas.onpointerdown = e => { if (!g.running) return; e.preventDefault(); g.down = true; canvas.setPointerCapture?.(e.pointerId); g.trail = [toLocal(e)]; };
    canvas.onpointermove = e => {
      if (!g.running || !g.down) return;
      const p = toLocal(e), prev = g.trail[g.trail.length - 1];
      g.trail.push(p); if (prev) hitTest(prev, p);
    };
    canvas.onpointerup = canvas.onpointercancel = () => { g.down = false; };

    function update(dt) {
      g.elapsed += dt; g.spawn -= dt; g.flash = Math.max(0, g.flash - dt); g.shake = Math.max(0, g.shake - dt);
      if (g.spawn <= 0 && g.elapsed < G.time - 3) spawnWave();
      const st = dt * SLOW;
      g.objs.forEach(o => { o.vy += GRAVITY * st; o.x += o.vx * st; o.y += o.vy * st; o.rot += o.vr * st; });
      g.objs = g.objs.filter(o => !o.dead && !(o.vy > 0 && o.y > H + R * 2));
      g.halves.forEach(h => { h.vy += GRAVITY * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; h.life -= dt; });
      g.halves = g.halves.filter(h => h.life > 0 && h.y < H + 80);
      g.drops.forEach(d => { d.vy += GRAVITY * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; });
      g.drops = g.drops.filter(d => d.life > 0);
      g.texts.forEach(t => { t.y -= 40 * dt; t.life -= dt; });
      g.texts = g.texts.filter(t => t.life > 0);
      const now = performance.now();
      g.trail = g.trail.filter(p => now - p.t < 130);
      const left = Math.max(0, G.time - g.elapsed);
      scoreLabel.textContent = g.score;
      lifeLabel.textContent = '♥ '.repeat(Math.max(0, g.lives)).trim() || '—';
      timeLabel.textContent = `${left.toFixed(1)}s`;
      if (g.lives <= 0) endGame(false);
      else if (left <= 0) endGame(g.score >= G.target);
    }
    function draw(now) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * dpr)) { canvas.width = W * dpr; canvas.height = H * dpr; }
      if (g.running) update(Math.min(.05, (now - g.last) / 1000 || 0));
      g.last = now;
      const sx = g.shake ? rand(-5, 5) : 0, sy = g.shake ? rand(-5, 5) : 0;
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
      // Thớt gỗ
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(-10, -10, W + 20, H + 20);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#40302699' : '#33251e99'; ctx.fillRect(-10, i * 88, W + 20, 86); }
      ctx.strokeStyle = '#ffffff0d'; ctx.lineWidth = 1;
      for (let y = 20; y < H; y += 23) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * .3, y + 6, W * .6, y - 6, W, y + 3); ctx.stroke(); }
      g.drops.forEach(d => { ctx.globalAlpha = Math.min(1, d.life * 2); ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      g.halves.forEach(h => {
        ctx.save(); ctx.globalAlpha = Math.min(1, h.life * 1.5); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
        ctx.beginPath(); ctx.rect(h.side < 0 ? -40 : 0, -40, 40, 80); ctx.clip(); sprite(h.food, 64); ctx.restore();
      });
      g.objs.forEach(o => {
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot); sprite(o.food, 64); ctx.restore();
        ctx.font = '600 11px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(o.food.label).width + 14;
        ctx.fillStyle = '#1b2130cc'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(o.x - w / 2, o.y + 34, w, 18, 9); else ctx.rect(o.x - w / 2, o.y + 34, w, 18); ctx.fill();
        ctx.fillStyle = '#fff8eb'; ctx.fillText(o.food.label, o.x, o.y + 43.5);
      });
      if (g.trail.length > 1) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < g.trail.length; i++) {
          const k = i / g.trail.length;
          ctx.strokeStyle = `rgba(255,248,235,${k})`; ctx.lineWidth = 1 + k * 6;
          ctx.beginPath(); ctx.moveTo(g.trail[i - 1].x, g.trail[i - 1].y); ctx.lineTo(g.trail[i].x, g.trail[i].y); ctx.stroke();
        }
      }
      ctx.font = '700 15px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center';
      g.texts.forEach(t => { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillStyle = t.color; ctx.fillText(t.text, Math.max(90, Math.min(W - 90, t.x)), t.y); });
      ctx.globalAlpha = 1;
      if (g.flash) { ctx.fillStyle = `rgba(201,80,63,${g.flash * .7})`; ctx.fillRect(-10, -10, W + 20, H + 20); }
      if (g.running || g.halves.length || g.drops.length) g.raf = requestAnimationFrame(draw);
    }
    function endGame(win) {
      if (g.ended) return;
      g.running = false; g.ended = true; g.down = false; g.trail = [];
      const overlay = document.getElementById('gameOverlay');
      overlay.classList.remove('hidden');
      const reason = g.lives <= 0 ? `Chém nhầm món của em ${G.lives} lần rồi. Món anh thích mà em cũng nhầm à?` : `Mới được ${g.score}/${G.target} điểm. Chém thêm phát nữa.`;
      overlay.innerHTML = `<div class="game-overlay-inner"><div class="eyebrow">${win ? 'Qua màn' : 'Chưa qua'}</div><h3>${win ? `${g.score} điểm!` : 'Thử lại nhé'}</h3><p>${win ? 'Biết rõ anh thích ăn gì thế này thì coi như chứng minh xong.' : reason}</p><button class="btn btn-primary" id="${win ? 'unlockYes' : 'retryGame'}">${win ? 'Mở thư ♥' : 'Chơi lại →'}</button></div>`;
      if (win) { state.gameWon = true; confetti(); document.getElementById('unlockYes').onclick = () => { go('final'); confetti(); }; }
      else document.getElementById('retryGame').onclick = () => render();
    }
    // Vẽ lại khung đầu khi ảnh tải xong, để màn chờ không bị trống.
    [...good, ...bad].forEach(f => f.image.addEventListener('load', () => { if (!g.running && !g.ended) draw(performance.now()); }, { once: true }));
    draw(0);
    document.getElementById('startGame').onclick = () => {
      g.running = true; g.last = performance.now();
      document.getElementById('gameOverlay').classList.add('hidden');
      const hud = app.querySelector('.game-hud').getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + hud.top - document.querySelector('.topbar').offsetHeight - 8, behavior: 'smooth' });
      g.raf = requestAnimationFrame(draw);
    };
  }

  function memories() {
    const back = state.from === 'memories' ? 'court' : state.from;
    app.innerHTML = `<section class="section">${head({ back, backLabel: 'Quay lại', eyebrow: 'Kho kỉ niệm', title: 'Ba năm, tóm tắt', intro: 'Hồ sơ hai đứa và mấy mốc đáng nhớ.' })}<div class="profiles">${C.profiles.map(p => `<article class="profile"><div class="eyebrow">${esc(p.tag)}</div><h3>${esc(p.name)}</h3><dl>${p.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></article>`).join('')}</div><h3 class="subhead">Dòng thời gian <span>${C.milestones.length} mốc</span></h3><ol class="timeline">${C.milestones.map(m => `<li class="memory"><div class="memory-date">${esc(m.date)}</div><div><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p></div>${m.image ? `<img src="${esc(m.image)}" alt="${esc(m.title)}" loading="lazy" onerror="this.remove()">` : ''}</li>`).join('')}</ol><div class="action-row"><span></span><button class="btn btn-primary" id="finishCase">${state.gameWon ? 'Đọc lại thư →' : 'Quay lại →'}</button></div></section>`;
    document.getElementById('finishCase').onclick = () => go(state.gameWon ? 'final' : back);
  }

  function finalScreen() {
    if (!state.gameWon) return go('game');
    const d = C.dateNight || {}, invite = [['Thời gian', d.when], ['Địa điểm', d.where], ['Mặc gì', d.dress], ['Kế hoạch', d.plan]].filter(([, v]) => v);
    app.innerHTML = `<section class="section">${head({ back: 'game', backLabel: 'Trò chơi', step: 'final', eyebrow: 'Phần cuối · Khép hồ sơ 03-A', title: 'Ba năm rồi đấy.' })}<div class="card final-card"><div class="final-seal">ĐÃ<br>KHÉP</div>${C.sharedPhoto ? `<img class="final-photo" src="${esc(C.sharedPhoto)}" alt="Ảnh hai đứa" onerror="this.remove()">` : ''}<p class="final-message">${esc(C.finalMessage)}</p>${invite.length ? `<div class="date-invite"><h3>Thư mời đi hẹn hò</h3><div class="invite-grid">${invite.map(([k, v]) => `<div class="invite-item"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>` : ''}<div class="media-controls">${C.songUrl ? `<a href="${esc(C.songUrl)}" target="_blank" rel="noopener">♫ Bài hát của hai đứa</a>` : ''}${C.voiceUrl ? `<audio controls preload="none" src="${esc(C.voiceUrl)}">Trình duyệt không phát được âm thanh.</audio>` : ''}<button id="reviewMemories">Kho kỉ niệm ↗</button><button id="restart">Chơi lại từ đầu ↺</button></div></div></section>`;
    document.getElementById('reviewMemories').onclick = openMemories;
    document.getElementById('restart').onclick = () => { Object.assign(state, fresh()); render(); };
  }

  function confetti() {
    const icons = ['♥', '✦', '✿', '♥', '★'];
    for (let i = 0; i < 22; i++) {
      const el = document.createElement('span');
      el.className = 'confetti'; el.textContent = pick(icons);
      el.style.left = Math.random() * 100 + 'vw'; el.style.top = (48 + Math.random() * 32) + 'vh';
      el.style.color = ['#c9503f', '#d9a94f', '#4f7d5c'][i % 3];
      el.style.setProperty('--dx', (Math.random() - .5) * 180 + 'px');
      document.body.appendChild(el); setTimeout(() => el.remove(), 1600);
    }
  }

  document.getElementById('soundToggle').onclick = e => {
    state.audio = !state.audio;
    e.currentTarget.innerHTML = `♪ <span>Âm thanh: ${state.audio ? 'bật' : 'tắt'}</span>`;
    e.currentTarget.setAttribute('aria-pressed', state.audio);
  };
  document.addEventListener('click', e => {
    if (!state.audio || !e.target.closest('button') || e.target.closest('#soundToggle')) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = audioCtx.currentTime;
      osc.type = 'sine'; osc.frequency.value = 740;
      gain.gain.setValueAtTime(.035, t); gain.gain.exponentialRampToValueAtTime(.001, t + .09);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(t + .09);
    } catch (_) { /* Âm thanh chỉ là phụ, lỗi thì bỏ qua. */ }
  });
  document.getElementById('replayLink').onclick = () => { if (state.screen === 'home') showToast('Đang ở trang đầu rồi.'); else go('home'); };
  render();
})();
