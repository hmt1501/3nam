(() => {
  'use strict';
  const C = window.CASE_FILE;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const OTHER = 'other';
  const DAY = 864e5;
  const STEPS = [['quiz', 'Hỏi cung'], ['court', 'Phân xử'], ['choice', 'Câu hỏi'], ['game', 'Về đích'], ['final', 'Mở thư']];
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
    app.innerHTML = `<section class="section">${head({ back: 'choice', backLabel: 'Câu hỏi', step: 'game', eyebrow: 'Phần 4 · Chứng minh đi', title: 'Đường đến buổi hẹn', intro: 'Nhặt ít nhất 3 món trên đường, né mấy thứ phá đám. Có 24 giây, đâm 3 lần là chạy lại.', label: `Nhặt: <span id="scoreLabel">0</span>/3` })}<div class="game-wrap"><div class="game-hud"><span class="legend">Nhặt ${C.gameItems.join(' ')}<i>·</i>Né ${C.gameObstacles.join(' ')}</span><span class="hud-right"><b id="lifeLabel" aria-label="Số mạng">♥ ♥ ♥</b><strong id="timeLabel">24.0s</strong></span></div><div class="game-frame"><canvas id="race" width="360" height="510" aria-label="Đường đua mini game"></canvas><div id="gameOverlay" class="game-overlay"><div class="game-overlay-inner"><div class="eyebrow">Cách chơi</div><h3>Sẵn sàng chưa?</h3><p>Vuốt trái/phải trên đường, chạm hai bên màn hình, bấm nút bên dưới hoặc dùng phím ← →.</p><button class="btn btn-primary" id="startRace">Xuất phát →</button></div></div></div><div class="game-controls"><button class="control-btn" id="leftControl" aria-label="Sang trái">←</button><div class="control-hint">CHẠM / VUỐT<br>ĐỂ ĐỔI LÀN</div><button class="control-btn" id="rightControl" aria-label="Sang phải">→</button></div></div></section>`;
    setupRace();
  }
  function setupRace() {
    const canvas = document.getElementById('race'), ctx = canvas.getContext('2d'), W = 360, H = 510, lanes = [85, 180, 275];
    const g = { lane: 1, items: [], score: 0, lives: 3, time: 24, elapsed: 0, last: 0, spawn: 0, running: false, ended: false, raf: 0, hitFlash: 0 };
    const scoreLabel = document.getElementById('scoreLabel'), lifeLabel = document.getElementById('lifeLabel'), timeLabel = document.getElementById('timeLabel');
    const laneMove = d => { if (g.running) g.lane = Math.max(0, Math.min(2, g.lane + d)); };
    const roundRect = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); };
    document.getElementById('leftControl').onpointerdown = e => { e.preventDefault(); laneMove(-1); };
    document.getElementById('rightControl').onpointerdown = e => { e.preventDefault(); laneMove(1); };
    let touchX = 0;
    canvas.onpointerdown = e => { if (!g.running) return; touchX = e.clientX; canvas.setPointerCapture?.(e.pointerId); };
    canvas.onpointerup = e => {
      if (!g.running) return;
      const dx = e.clientX - touchX;
      if (Math.abs(dx) > 18) laneMove(dx < 0 ? -1 : 1);
      else { const r = canvas.getBoundingClientRect(); laneMove(e.clientX - r.left < r.width / 2 ? -1 : 1); }
    };
    const key = e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); laneMove(-1); }
      if (k === 'arrowright' || k === 'd') { e.preventDefault(); laneMove(1); }
    };
    window.addEventListener('keydown', key);
    cleanup = () => { g.running = false; cancelAnimationFrame(g.raf); window.removeEventListener('keydown', key); };

    function draw(now) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * dpr)) { canvas.width = W * dpr; canvas.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#536653'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#26342e'; ctx.fillRect(35, 0, 290, H);
      ctx.fillStyle = '#34453c'; ctx.fillRect(43, 0, 274, H);
      const offset = (g.elapsed * 115) % 70;
      ctx.strokeStyle = '#cbbd8b'; ctx.lineWidth = 3; ctx.setLineDash([23, 19]); ctx.lineDashOffset = -offset;
      ctx.beginPath(); ctx.moveTo(132, 0); ctx.lineTo(132, H); ctx.moveTo(228, 0); ctx.lineTo(228, H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#d7c49b';
      for (let y = -20 + offset; y < H; y += 70) { ctx.fillRect(17, y, 10, 25); ctx.fillRect(333, y + 30, 10, 25); }
      if (g.running) {
        const dt = Math.min(.05, (now - g.last) / 1000 || 0);
        g.elapsed += dt; g.time = Math.max(0, 24 - g.elapsed); g.spawn -= dt; g.hitFlash = Math.max(0, g.hitFlash - dt);
        if (g.spawn <= 0) {
          const collect = Math.random() < .62;
          g.items.push({ lane: Math.floor(Math.random() * 3), y: -30, kind: collect ? 'item' : 'obstacle', symbol: pick(collect ? C.gameItems : C.gameObstacles), done: false });
          g.spawn = .8 + Math.random() * .36;
        }
        g.items.forEach(o => {
          o.y += dt * 156;
          if (o.y > 414 && o.y < 470 && !o.done && o.lane === g.lane) {
            o.done = true;
            if (o.kind === 'item') g.score++; else { g.lives--; g.hitFlash = .35; }
          }
        });
        g.items = g.items.filter(o => o.y < H + 35 && !(o.done && o.kind === 'item'));
        scoreLabel.textContent = g.score;
        lifeLabel.textContent = '♥ '.repeat(Math.max(0, g.lives)).trim() || '—';
        timeLabel.textContent = `${g.time.toFixed(1)}s`;
        if (g.lives <= 0) endRace(false); else if (g.time <= 0) endRace(g.score >= 3);
      }
      ctx.font = '27px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      g.items.forEach(o => ctx.fillText(o.symbol, lanes[o.lane], o.y));
      const px = lanes[g.lane], py = 437;
      ctx.fillStyle = g.hitFlash > 0 ? '#ff8f7e' : '#ed7160'; roundRect(px - 19, py - 29, 38, 58, 11);
      ctx.fillStyle = '#ffe9bc'; roundRect(px - 13, py - 20, 26, 18, 6);
      ctx.fillStyle = '#303840'; [[-22, -17], [17, -17], [-22, 12], [17, 12]].forEach(([x, y]) => ctx.fillRect(px + x, py + y, 5, 13));
      ctx.fillStyle = '#8e3340'; ctx.fillRect(px - 10, py + 7, 20, 3);
      g.last = now;
      if (g.running) g.raf = requestAnimationFrame(draw);
    }
    function endRace(win) {
      if (g.ended) return;
      g.running = false; g.ended = true; cancelAnimationFrame(g.raf);
      const overlay = document.getElementById('gameOverlay');
      overlay.classList.remove('hidden');
      overlay.innerHTML = `<div class="game-overlay-inner"><div class="eyebrow">${win ? 'Tới nơi rồi' : 'Chưa tới'}</div><h3>${win ? 'Đến đúng giờ!' : 'Thử lại nhé'}</h3><p>${win ? `Nhặt được ${g.score} món. Coi như chứng minh xong.` : `Mới nhặt được ${g.score} món. Đường còn dài, chạy lại phát nữa.`}</p><button class="btn btn-primary" id="${win ? 'unlockYes' : 'retryRace'}">${win ? 'Mở thư ♥' : 'Chạy lại →'}</button></div>`;
      if (win) { state.gameWon = true; confetti(); document.getElementById('unlockYes').onclick = () => { go('final'); confetti(); }; }
      else document.getElementById('retryRace').onclick = () => render();
    }
    draw(0);
    document.getElementById('startRace').onclick = () => {
      g.running = true; g.last = performance.now();
      document.getElementById('gameOverlay').classList.add('hidden');
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
    app.innerHTML = `<section class="section">${head({ back: 'game', backLabel: 'Đường đua', step: 'final', eyebrow: 'Phần cuối · Khép hồ sơ 03-A', title: 'Ba năm rồi đấy.' })}<div class="card final-card"><div class="final-seal">ĐÃ<br>KHÉP</div>${C.sharedPhoto ? `<img class="final-photo" src="${esc(C.sharedPhoto)}" alt="Ảnh hai đứa" onerror="this.remove()">` : ''}<p class="final-message">${esc(C.finalMessage)}</p>${invite.length ? `<div class="date-invite"><h3>Thư mời đi hẹn hò</h3><div class="invite-grid">${invite.map(([k, v]) => `<div class="invite-item"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>` : ''}<div class="media-controls">${C.songUrl ? `<a href="${esc(C.songUrl)}" target="_blank" rel="noopener">♫ Bài hát của hai đứa</a>` : ''}${C.voiceUrl ? `<audio controls preload="none" src="${esc(C.voiceUrl)}">Trình duyệt không phát được âm thanh.</audio>` : ''}<button id="reviewMemories">Kho kỉ niệm ↗</button><button id="restart">Chơi lại từ đầu ↺</button></div></div></section>`;
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
