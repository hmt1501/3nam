(() => {
  'use strict';
  const C = window.CASE_FILE;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const OTHER = 'other';
  const DAY = 864e5;
  const STEPS = [['quiz', 'Hỏi cung'], ['court', 'Phân xử'], ['choice', 'Phán quyết'], ['game', 'Biện hộ'], ['final', 'Tuyên án']];
  const RIGHT = ['Đúng rồi.', 'Chuẩn.', 'Giỏi đấy.', 'Nhớ dai ghê.'];
  const WRONG = ['Sai rồi nhé.', 'Hụt.', 'Không phải đâu.', 'Trật lất.'];
  const fresh = () => ({ screen: 'home', quiz: 0, score: 0, verdicts: {}, gameWon: false });
  const state = fresh();
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
  // Đếm ngược tới 0h ngày kỉ niệm kế tiếp; cả ngày kỉ niệm thì báo "hôm nay".
  function countdown() {
    const start = parseDate(C.relationshipStart), now = new Date();
    const next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (next - now <= -DAY) next.setFullYear(next.getFullYear() + 1);
    const t = Math.floor((next - now) / 1000), p = n => String(n).padStart(2, '0');
    if (t <= 0) return `Hôm nay tròn ${next.getFullYear() - start.getFullYear()} năm ♥`;
    return `Còn ${Math.floor(t / 86400)} ngày ${p(t / 3600 % 24 | 0)}:${p(t / 60 % 60 | 0)}:${p(t % 60)}`;
  }

  function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
  const screens = { home, quiz, quizResult, court, choice, game: gameScreen, memories, final: finalScreen, outro: outroScreen };
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    (screens[state.screen] || home)();
    app.querySelectorAll('[data-back]').forEach(b => b.onclick = () => go(b.dataset.back));
    app.scrollTop = 0;
  }
  function go(screen) { state.screen = screen; render(); }

  function stepper(current) {
    const at = STEPS.findIndex(s => s[0] === current);
    return `<ol class="steps" aria-label="Tiến độ">${STEPS.map(([, label], i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"${i === at ? ' aria-current="step"' : ''}><span>${i < at ? '✓' : i + 1}</span><em>${label}</em></li>`).join('')}</ol>`;
  }
  function head({ back, backLabel, step, eyebrow, title, intro = '', label = '' }) {
    return `<div class="section-top"><button class="back-link" data-back="${back}">← ${backLabel}</button>${step ? stepper(step) : ''}</div><div class="section-head"><div><div class="eyebrow">${eyebrow}</div>${title ? `<h2 class="screen-title">${title}</h2>` : ''}${intro ? `<p class="intro">${intro}</p>` : ''}</div>${label ? `<div class="step-label">${label}</div>` : ''}</div>`;
  }

  function home() {
    app.innerHTML = `<section class="hero" id="home"><div class="hero-copy"><h1>HỒ SƠ<br>TUYỆT MẬT<br><em>03 NĂM</em></h1><p class="lead">Hồ sơ này chỉ mở cho <b>${esc(C.agentNickname)}</b>. Có một vụ cần em điều tra: ${esc(C.caseIntro)}</p><dl class="case-facts"><div class="fact"><dt>Đối tượng</dt><dd>${esc(C.partnerName)}<small>hay ${esc(C.partnerNickname)}</small></dd></div><div class="fact"><dt>Ngày bắt đầu</dt><dd>${fmtDate(C.relationshipStart)}<small>Ngày tỏ tình</small></dd></div><div class="fact"><dt>Đã ở cạnh nhau</dt><dd>${daysTogether().toLocaleString('vi-VN')} ngày<small id="countdown">${countdown()}</small></dd></div></dl><button class="btn btn-primary" id="start">Nhận vụ này →</button></div><div class="hero-art" aria-hidden="true"><span class="heart-note">♥</span><span class="paperclip">⌁</span><div class="folder"><div class="folder-name">Vụ án tuyệt mật</div><div class="folder-lines">Tình trạng: đã lưu hồ sơ 3 năm và hơn nữa</div></div></div></section>`;
    const timer = setInterval(() => document.getElementById('countdown').textContent = countdown(), 1000);
    cleanup = () => clearInterval(timer);
    document.getElementById('start').onclick = () => { Object.assign(state, { quiz: 0, score: 0 }); go('quiz'); };
  }

  function quiz() {
    const q = C.quiz[state.quiz];
    if (!q) return go('quizResult');
    const total = C.quiz.length, hasOther = Array.isArray(q.other) && q.other.length > 0;
    app.innerHTML = `<section class="section">${head({ back: 'home', backLabel: 'Trang đầu', step: 'quiz', eyebrow: 'Phần 1 · Hỏi cung', title: 'Thông tin bị cáo', label: `Câu ${state.quiz + 1}/${total}` })}<div class="card question-card"><div class="progress"><span style="width:${state.quiz / total * 100}%"></span></div><h3 class="question">${esc(q.question)}</h3><div class="choices">${q.choices.map((x, i) => `<button class="choice" data-answer="${i}">${esc(x)}</button>`).join('')}${hasOther ? `<button class="choice choice-other" data-answer="${OTHER}">Khác, để em tự ghi…</button>` : ''}</div>${hasOther ? `<form class="other-form hidden" id="otherForm"><label for="otherInput">Em nghĩ là gì?</label><div class="other-row"><input id="otherInput" autocomplete="off" maxlength="80" placeholder="Gõ câu trả lời"><button class="btn btn-dark" type="submit">Chốt</button></div></form>` : ''}<div id="quizFeedback" class="feedback">Chọn một đáp án.</div><div class="action-row"><button class="small-link" id="skipQuiz">Bỏ qua phần này</button><button class="btn btn-primary hidden" id="nextQuiz">${state.quiz === total - 1 ? 'Xem kết quả' : 'Câu tiếp'} →</button></div></div></section>`;
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
    app.innerHTML = `<section class="section">${head({ back: 'quizResult', backLabel: 'Kết quả hỏi cung', step: 'court', eyebrow: 'Phần 2 · Phân xử', title: 'Tội ác', label: `<span id="courtCount">0</span>/${C.allegations.length}` })}<div class="allegations">${C.allegations.map((x, i) => `<article class="allegation"><span class="count">#${String(i + 1).padStart(2, '0')}</span><p>${esc(x)}</p><div class="suspects">${Object.entries(parties).map(([k, name]) => `<button class="verdict-choice${state.verdicts[i] === k ? ' selected' : ''}" data-charge="${i}" data-party="${k}" aria-pressed="${state.verdicts[i] === k}">${esc(name)}</button>`).join('')}</div></article>`).join('')}</div><div id="courtResult" class="court-result">Tòa đang chờ lời khai đầu tiên.</div><div class="action-row"><span></span><button class="btn btn-primary" id="toChoice">Tiếp →</button></div></section>`;
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
  }

  function choice() {
    app.innerHTML = `<section class="section">${head({ back: 'court', backLabel: 'Phần phân xử', step: 'choice', eyebrow: 'Phần 3 · Phán quyết' })}<div class="choice-stage"><h3>Năm thứ tư, em vẫn đi cùng anh chứ?</h3><div class="choice-actions"><button class="btn btn-primary" id="yesButton">Có</button><button class="btn btn-no" id="noButton">Không</button></div></div><div id="verdictPopup" class="popup hidden" role="alertdialog"><div class="popup-box" id="popupBox" aria-live="assertive"></div></div></section>`;
    const yes = document.getElementById('yesButton');
    // Nút Có không bao giờ bấm được: chạm/di chuột/Enter vào là nhảy tới điểm xa con trỏ nhất trong 12 điểm ngẫu nhiên.
    function flee(e) {
      e.preventDefault();
      const r = yes.getBoundingClientRect(), m = 16, cx = e.clientX || r.left + r.width / 2, cy = e.clientY || r.top + r.height / 2;
      let best = [m, m], far = -1;
      for (let i = 0; i < 12; i++) {
        const x = m + Math.random() * (innerWidth - r.width - 2 * m), y = m + Math.random() * (innerHeight - r.height - 2 * m);
        const d = Math.hypot(x + r.width / 2 - cx, y + r.height / 2 - cy);
        if (d > far) { far = d; best = [x, y]; }
      }
      Object.assign(yes.style, { position: 'fixed', left: `${best[0]}px`, top: `${best[1]}px`, zIndex: 5 });
      // Tổ tiên đang có transform (hiệu ứng vào trang) thì fixed bị lệch: đo lại rồi bù.
      const now = yes.getBoundingClientRect();
      Object.assign(yes.style, { left: `${2 * best[0] - now.left}px`, top: `${2 * best[1] - now.top}px` });
    }
    yes.addEventListener('pointerenter', flee); yes.addEventListener('pointerdown', flee); yes.onclick = flee;
    document.getElementById('noButton').onclick = e => {
      e.currentTarget.disabled = true;
      const box = document.getElementById('popupBox');
      document.getElementById('verdictPopup').classList.remove('hidden');
      box.innerHTML = '<p>Haiz biết ngay không yêu tôi mà</p>';
      let later;
      const first = setTimeout(() => {
        box.innerHTML = '<p>Tất cả chỉ là lừa dối thôi, yêu đương gì nữa</p>';
        later = setTimeout(() => {
          box.insertAdjacentHTML('beforeend', '<p class="popup-note">Nếu có chút tình cảm thì hãy chứng minh đi đừng nói suông</p><button class="btn btn-primary" id="proveIt">Chứng minh</button>');
          document.getElementById('proveIt').onclick = () => go('game');
        }, 5000);
      }, 2000);
      cleanup = () => { clearTimeout(first); clearTimeout(later); };
    };
  }

  function gameScreen() {
    const G = C.game, chip = f => `<span class="food-chip">${f.img ? `<img src="${esc(f.img)}" alt="" onerror="this.replaceWith('${f.icon}')">` : esc(f.icon)}${esc(f.label)}</span>`;
    app.innerHTML = `<section class="section">${head({ back: 'choice', backLabel: 'Phán quyết', step: 'game', eyebrow: 'Phần 4 · Biện hộ', title: 'Anh thích ăn gì?' })}<div class="game-wrap"><div class="food-legend"><div><b>Chém</b>${G.good.map(chip).join('')}</div><div><b class="bad">Né</b>${G.bad.map(chip).join('')}</div></div><div class="game-hud"><span>Điểm <strong id="scoreLabel">0</strong>/${G.target}</span><b id="lifeLabel" aria-label="Số mạng">${'♥ '.repeat(G.lives).trim()}</b><strong id="timeLabel">${G.time.toFixed(1)}s</strong></div><div class="game-frame"><canvas id="slice" width="360" height="510" aria-label="Trò chơi chém món ăn"></canvas><div id="gameOverlay" class="game-overlay"><div class="game-overlay-inner"><div class="eyebrow">Cách chơi</div><h3>Sẵn sàng chưa?</h3><p>Vuốt hoặc kéo chuột qua món của anh để chém, chém nhầm món của em là mất mạng. ${G.time} giây, ${G.lives} mạng, cần ${G.target} điểm.</p><button class="btn btn-primary" id="startGame">Bắt đầu →</button></div></div></div></div></section>`;
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
      overlay.innerHTML = `<div class="game-overlay-inner"><div class="eyebrow">${win ? 'Qua màn' : 'Chưa qua'}</div><h3>${win ? `${g.score} điểm!` : 'Thử lại nhé'}</h3><p>${win ? 'Biết rõ anh thích ăn gì thế này thì coi như chứng minh xong.' : reason}</p><button class="btn btn-primary" id="${win ? 'unlockYes' : 'retryGame'}">${win ? 'Tuyên án ♥' : 'Chơi lại →'}</button></div>`;
      if (win) { state.gameWon = true; confetti(); document.getElementById('unlockYes').onclick = () => { go('final'); confetti(); }; }
      else document.getElementById('retryGame').onclick = () => render();
    }
    // Vẽ lại khung đầu khi ảnh tải xong, để màn chờ không bị trống.
    [...good, ...bad].forEach(f => f.image.addEventListener('load', () => { if (!g.running && !g.ended) draw(performance.now()); }, { once: true }));
    draw(0);
    document.getElementById('startGame').onclick = () => {
      g.running = true; g.last = performance.now();
      document.getElementById('gameOverlay').classList.add('hidden');
      g.raf = requestAnimationFrame(draw);
    };
  }

  function memories() {
    app.innerHTML = `<section class="section">${head({ back: 'outro', backLabel: 'Quay lại', eyebrow: 'Kho kỉ niệm' })}<div class="profiles">${C.profiles.map(p => `<article class="profile"><div class="eyebrow">${esc(p.tag)}</div><h3>${esc(p.name)}</h3><dl>${p.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></article>`).join('')}</div><ol class="timeline">${C.milestones.map(m => `<li class="memory"><div class="memory-date">${esc(m.date)}</div><div><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p></div>${m.image ? `<img src="${esc(m.image)}" alt="${esc(m.title)}" loading="lazy" onerror="this.remove()">` : ''}</li>`).join('')}</ol></section>`;
  }

  function finalScreen() {
    if (!state.gameWon) return go('game');
    const d = C.dateNight || {}, invite = [['Thời gian', d.when], ['Địa điểm', d.where], ['Mặc gì', d.dress], ['Kế hoạch', d.plan]].filter(([, v]) => v);
    const fb = C.feedback || {};
    const targetEmail = fb.email || 'hoangmanhtan1501@gmail.com';

    const formHtml = `
      <form class="promise-form" id="promiseForm">
        <div class="promise-header">
          <div class="promise-title">
            <span class="promise-icon">💌</span>
            <div>
              <h4>${esc(fb.title || 'Mục tiêu năm thứ 4')}</h4>
              <small>Lời nhắn nhủ cho ${esc(C.partnerName || 'Tân')}</small>
            </div>
          </div>
        </div>
        <div class="promise-fields">
          <div class="promise-field">
            <label for="improvePartner">${esc(fb.field1Label || 'Điều anh (Tân) cần cải thiện:')}</label>
            <textarea id="improvePartner" name="improvePartner" rows="2" maxlength="500" required placeholder="${esc(fb.field1Placeholder || 'Ví dụ: bớt thức khuya, quan tâm em nhiều hơn...')}"></textarea>
          </div>
          <div class="promise-field">
            <label for="improveAgent">${esc(fb.field2Label || 'Điều em (Linh) hứa sẽ cải thiện:')}</label>
            <textarea id="improveAgent" name="improveAgent" rows="2" maxlength="500" required placeholder="${esc(fb.field2Placeholder || 'Ví dụ: bớt dỗi vô cớ, chịu khó ăn đúng bữa...')}"></textarea>
          </div>
        </div>
        <div class="promise-footer">
          <button type="submit" class="btn btn-primary" id="promiseSubmitBtn">
            <span class="btn-text">${esc(fb.btnText || 'Gửi cho anh ♥')}</span>
          </button>
          <div id="promiseStatus" class="promise-status"></div>
        </div>
      </form>
    `;

    app.innerHTML = `<section class="section">${head({ back: 'game', backLabel: 'Biện hộ', step: 'final', eyebrow: 'Phần 5 · Tuyên án' })}<div class="card final-card"><div class="final-letter"><div class="final-seal">ĐÃ<br>KHÉP</div>${C.sharedPhoto ? `<img class="final-photo" src="${esc(C.sharedPhoto)}" alt="Ảnh hai đứa" onerror="this.remove()">` : ''}<p class="final-message">${esc(C.finalMessage)}</p>${formHtml}</div><div class="final-side">${invite.length ? `<div class="date-invite"><h3>Thư mời đi hẹn hò</h3><div class="invite-grid">${invite.map(([k, v]) => `<div class="invite-item"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>` : ''}<div class="media-controls">${C.songUrl ? `<a href="${esc(C.songUrl)}" target="_blank" rel="noopener">♫ Bài hát của hai đứa</a>` : ''}${C.voiceUrl ? `<audio controls preload="none" src="${esc(C.voiceUrl)}">Trình duyệt không phát được âm thanh.</audio>` : ''}</div></div></div></section>`;

    const form = document.getElementById('promiseForm');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('promiseSubmitBtn');
        const status = document.getElementById('promiseStatus');
        const partnerVal = document.getElementById('improvePartner').value.trim();
        const agentVal = document.getElementById('improveAgent').value.trim();

        if (!partnerVal || !agentVal) {
          showToast('Em hãy viết đủ cả 2 điều nhé ♥');
          return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="btn-text">Đang gửi thư đi... ⏳</span>';
        status.className = 'promise-status';
        status.textContent = '';

        const payload = {
          _subject: `💌 [Kỉ niệm 3 năm] Lời nhắn nhủ năm thứ 4 từ ${C.agentNickname || 'Linh'}!`,
          "Người gửi": `${C.agentName || 'Linh'} (${C.agentNickname || 'Linh'})`,
          "Người nhận": `${C.partnerName || 'Tân'} (${C.partnerNickname || 'Tân'})`,
          "1. Điều anh cần cải thiện": partnerVal,
          "2. Điều em hứa sẽ cải thiện": agentVal,
          "Thời gian gửi": new Date().toLocaleString('vi-VN'),
          _template: "table",
          _captcha: "false"
        };

        try {
          const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok || data.success === "true" || data.success === true) {
            confetti();
            status.className = 'promise-status is-success';
            status.innerHTML = `✓ ${esc(fb.successMsg || 'Anh đã nhận được rồi nhé!')}`;
            btn.innerHTML = '<span class="btn-text">Đã gửi thành công ♥</span>';
            localStorage.setItem('couple_feedback', JSON.stringify({
              improvePartner: partnerVal,
              improveAgent: agentVal,
              sent: true,
              at: new Date().toISOString()
            }));
            showToast('Đã gửi thành công tới email của anh rồi ♥');
            setTimeout(() => go('outro'), 1100);
          } else {
            throw new Error(data.message || 'Lỗi gửi thư');
          }
        } catch (err) {
          status.className = 'promise-status is-error';
          status.innerHTML = 'Không gửi được qua mạng. <button type="button" id="copyPromise" class="link-inline">Bấm để sao chép</button> gửi cho anh nhé!';
          btn.disabled = false;
          btn.innerHTML = `<span class="btn-text">${esc(fb.btnText || 'Thử gửi lại ♥')}</span>`;
          const copyBtn = document.getElementById('copyPromise');
          if (copyBtn) {
            copyBtn.onclick = () => {
              const txt = `Lời nhắn năm thứ 4:\n- Điều anh cần cải thiện: ${partnerVal}\n- Điều em hứa cải thiện: ${agentVal}`;
              navigator.clipboard.writeText(txt).then(() => showToast('Đã sao chép vào bộ nhớ tạm!'));
            };
          }
        }
      };
    }
  }

  function outroScreen() {
    app.innerHTML = `
      <section class="outro-stage">
        <div class="outro-card">
          <span class="outro-heart" aria-hidden="true">♥</span>
          <h2 class="outro-title">Hẹn sớm gặp lại Linh béo ♥</h2>
          <p class="outro-sub">Hồ sơ 03 năm đã được niêm phong an toàn và gửi tới anh.</p>
          <div class="outro-floating-wrap">
            <button class="btn btn-floating-memories" id="openMemoriesBtn">
              <span>📖</span>
              <span>Kho kỉ niệm</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </section>
    `;
    confetti();
    document.getElementById('openMemoriesBtn').onclick = () => go('memories');
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

  // === INTRO SCREEN ===
  const introEl = document.getElementById('intro');
  const openBtn = document.getElementById('openCase');

  // Spawn subtle floating particles
  const particleContainer = introEl.querySelector('.intro-particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    p.className = 'intro-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = -(Math.random() * 30) + '%';
    p.style.animationDuration = (6 + Math.random() * 8) + 's';
    p.style.animationDelay = (Math.random() * 6) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    particleContainer.appendChild(p);
  }

  // Nhạc nền: KHÔNG phát ngay — chỉ phát sau khi intro chuyển cảnh xong.
  const bgm = C.musicUrl ? Object.assign(new Audio(C.musicUrl), { loop: true }) : null;
  let musicUnlocked = false;

  function startMusic() {
    if (musicUnlocked) return;
    musicUnlocked = true;
    if (bgm) {
      bgm.volume = 0;
      bgm.play().then(() => {
        // Fade in nhạc mượt mà
        let vol = 0;
        const fade = setInterval(() => {
          vol = Math.min(1, vol + 0.05);
          bgm.volume = vol;
          if (vol >= 1) clearInterval(fade);
        }, 60);
      }).catch(() => { });
    }
  }

  // Khi bấm nút "Mở hồ sơ": chuyển cảnh intro -> app
  openBtn.onclick = () => {
    introEl.classList.add('exit');
    // Bắt đầu nhạc sau khi hiệu ứng chạy được nửa chừng
    setTimeout(startMusic, 400);
    // Xóa intro khỏi DOM sau khi animation xong
    setTimeout(() => {
      introEl.classList.add('gone');
    }, 900);
  };

  // Sau khi intro đã bị dismiss, các lần chạm tiếp đảm bảo nhạc chạy (trình duyệt chặn autoplay)
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => {
    if (musicUnlocked && bgm && bgm.paused) bgm.play().catch(() => { });
  }));

  document.addEventListener('click', e => {
    if (!e.target.closest('button')) return;
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
  document.getElementById('replayLink').onclick = () => {
    localStorage.removeItem('couple_feedback');
    Object.assign(state, fresh());
    render();
  };
  render();
})();
