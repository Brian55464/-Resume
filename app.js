(() => {
  'use strict';
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let chosen = null;
  try { chosen = localStorage.getItem('bozhang-motion'); } catch {}
  let reduced = chosen === 'reduced' || (chosen !== 'full' && preference.matches);
  const motionButton = document.querySelector('.motion-toggle');

  function applyMotion() {
    root.classList.toggle('no-motion', reduced);
    if (!motionButton) return;
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.setAttribute('aria-label', reduced ? '開啟動畫' : '減少動畫');
    motionButton.title = reduced ? '開啟動畫' : '減少動畫';
    motionButton.querySelector('.motion-label').textContent = reduced ? '動畫減少' : '動畫開啟';
  }
  applyMotion();
  motionButton?.addEventListener('click', () => {
    reduced = !reduced;
    chosen = reduced ? 'reduced' : 'full';
    try { localStorage.setItem('bozhang-motion', chosen); } catch {}
    applyMotion();
    if (reduced) currentShape = targetShape;
    render(performance.now());
    schedule();
  });
  preference.addEventListener('change', () => {
    if (chosen) return;
    reduced = preference.matches;
    applyMotion();
    if (reduced) currentShape = targetShape;
    render(performance.now());
    schedule();
  });

  document.querySelectorAll('.project-visual').forEach(visual => {
    if (visual.classList.contains('filmwise-visual') || visual.classList.contains('coldchain-visual')) {
      const scan = document.createElement('span');
      scan.className = 'visual-scan';
      scan.setAttribute('aria-hidden', 'true');
      visual.append(scan);
    }
    visual.addEventListener('pointermove', event => {
      if (reduced || event.pointerType !== 'mouse') return;
      const rect = visual.getBoundingClientRect();
      visual.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - .5) * 17 + 'px');
      visual.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - .5) * 13 + 'px');
    });
    visual.addEventListener('pointerleave', () => {
      visual.style.setProperty('--px', '0px');
      visual.style.setProperty('--py', '0px');
    });
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }), { threshold: .07 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    root.classList.add('js-reveal');
  }

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  let scrollQueued = false;
  function updateScroll() {
    const maxScroll = root.scrollHeight - innerHeight;
    if (progress) progress.style.width = (maxScroll > 0 ? scrollY / maxScroll * 100 : 0) + '%';
    header?.classList.toggle('scrolled', scrollY > 30);
    scrollQueued = false;
  }
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('nav a').forEach(a => {
        const active = a.getAttribute('href') === '#' + entry.target.id;
        a.classList.toggle('active', active);
        if (active) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -50% 0px' });
    ['home', 'about', 'work', 'engineering', 'contact'].forEach(id => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  const previews = {
    meter: ['assets/filmwise-meter.png', 'Filmwise 0.4.0 直接測光介面與示範 EV 讀值'],
    advice: ['assets/filmwise-advice.png', 'Filmwise 拍攝建議與曝光組合的實際 App 示範畫面'],
    tutorial: ['assets/filmwise-tutorial.png', 'Filmwise 圖解教學的實際 App 示範畫面']
  };
  document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
    const img = document.getElementById('filmwise-preview');
    const data = previews[button.dataset.preview];
    if (!img || !data) return;
    img.src = data[0]; img.alt = data[1];
    document.querySelectorAll('[data-preview]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  const demos = {
    calendar: ['下週三下午兩點，提醒我開專案會議。', '行程草稿 / 等待確認', '專案會議', '下週三 · 14:00', '確認內容後，再建立行程與提醒。'],
    currency: ['旅行前，先看看換匯工具。', '換匯面板 / 功能示意', '先選幣別，再輸入金額', '來源幣別 → 目標幣別', '實際使用會顯示參考匯率與資料日期。'],
    split: ['這趟旅行，和朋友一起記帳。', '獨立分帳 / 功能示意', '暱稱、幣別與分攤', '新增支出 → 分攤 → 結算', '由 LINE 開啟獨立分帳工具。']
  };
  document.querySelectorAll('[data-agent-demo]').forEach(button => button.addEventListener('click', () => {
    const data = demos[button.dataset.agentDemo];
    if (!data) return;
    document.getElementById('demo-request').textContent = data[0];
    const response = document.getElementById('demo-response');
    response.replaceChildren();
    for (const [tag, text] of [['small', data[1]], ['strong', data[2]], ['span', data[3] + '\n' + data[4]]]) {
      const el = document.createElement(tag);
      el.textContent = text;
      el.style.whiteSpace = 'pre-line';
      response.append(el);
    }
    document.querySelectorAll('[data-agent-demo]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));

  let currentShape = 0, targetShape = 0;
  const hero = document.getElementById('home');
  const geometryNames = ['環面', '扭轉曲面', '球體'];
  let burstStarted = 0;
  function nextGeometry() {
    targetShape = (targetShape + 1) % geometryNames.length;
    if (reduced) currentShape = targetShape;
    canvas.setAttribute('aria-label', '互動圖形：' + geometryNames[targetShape] + '。點擊圖形或按 Enter 切換。');
    hero.dataset.geometry = String(targetShape);
    burstStarted = reduced ? 0 : performance.now();
    render(performance.now());
    schedule();
  }
  hero.dataset.geometry = '0';

  const canvas = document.getElementById('orbit-canvas');
  const ctx = canvas?.getContext('2d');
  const rows = 28, columns = 64, points = [];
  for (let row = 0; row < rows; row++) {
    const u = row / rows * Math.PI * 2;
    for (let column = 0; column < columns; column++) {
      const v = column / columns * Math.PI * 2;
      const r = 1.12 + .4 * Math.cos(v);
      const ribbonRadius = 1.1 + .46 * Math.cos(v) * Math.cos(u / 2);
      const latitude = (column + .5) / columns * Math.PI;
      points.push({ row, column, forms: [
        [r * Math.cos(u), r * Math.sin(u), .4 * Math.sin(v)],
        [ribbonRadius * Math.cos(u), ribbonRadius * Math.sin(u), .46 * Math.cos(v) * Math.sin(u / 2) + .13 * Math.sin(v)],
        [1.35 * Math.sin(latitude) * Math.cos(u), 1.35 * Math.sin(latitude) * Math.sin(u), 1.35 * Math.cos(latitude)]
      ] });
    }
  }
  let width = 0, height = 0, pointerX = 0, pointerY = 0, visible = true, frame = null, last = 0;
  let projectedPoints = [];
  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(performance.now()); schedule();
  }
  function render(time) {
    if (!ctx || !width || !height) return;
    if (!reduced) currentShape += (targetShape - currentShape) * .085;
    if (Math.abs(currentShape - targetShape) < .001) currentShape = targetShape;
    const from = Math.floor(currentShape), to = Math.min(from + 1, 2), blend = currentShape - from;
    const angle = reduced ? .7 : time * .00012;
    const ax = .85 + pointerY * .23, ay = -.45 + pointerX * .3, az = -.55 + angle;
    const burst = burstStarted && !reduced ? Math.min((time - burstStarted) / 850, 1) : 1;
    const baseScale = Math.min(width, height) * .255;
    const scale = baseScale * (1 + (burst < 1 ? Math.sin(burst * Math.PI) * .035 : 0));
    ctx.clearRect(0, 0, width, height);
    const mapped = points.map(point => {
      const a = point.forms[from], b = point.forms[to];
      const x = a[0] + (b[0] - a[0]) * blend;
      const y = a[1] + (b[1] - a[1]) * blend;
      const z = a[2] + (b[2] - a[2]) * blend;
      const ry = y * Math.cos(ax) - z * Math.sin(ax), rz = y * Math.sin(ax) + z * Math.cos(ax);
      const rx = x * Math.cos(ay) + rz * Math.sin(ay), depth = -x * Math.sin(ay) + rz * Math.cos(ay);
      return { x: width * .53 + (rx * Math.cos(az) - ry * Math.sin(az)) * scale,
        y: height * .46 + (rx * Math.sin(az) + ry * Math.cos(az)) * scale, z: depth, column: point.column };
    });
    projectedPoints = mapped;
    for (const front of [false, true]) {
      ctx.beginPath();
      mapped.forEach((p, index) => {
        if ((p.z > 0) !== front) return;
        if (p.column < columns - 1) {
          const next = mapped[index + 1]; ctx.moveTo(p.x, p.y); ctx.lineTo(next.x, next.y);
        }
        if (p.column % 4 === 0) {
          const next = mapped[(index + columns) % mapped.length]; ctx.moveTo(p.x, p.y); ctx.lineTo(next.x, next.y);
        }
      });
      ctx.strokeStyle = front ? 'rgba(246,198,76,.38)' : 'rgba(119,151,180,.16)';
      ctx.lineWidth = front ? .7 : .55; ctx.stroke();
    }
    mapped.forEach((p, index) => {
      if (p.column % 4 !== 0) return;
      ctx.fillStyle = p.z > 0 ? 'rgba(255,217,119,.85)' : 'rgba(151,178,199,.32)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.z > .75 ? 1.45 : .8, 0, Math.PI * 2); ctx.fill();
      if (index % 37 === 0 && p.z > 0) {
        ctx.strokeStyle = 'rgba(255,218,117,.45)'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.stroke();
      }
    });
    if (burst < 1) {
      ctx.strokeStyle = `rgba(255,209,98,${(1 - burst) * .3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(width * .53, height * .46, baseScale * (1.55 + burst * .55), baseScale * (1.5 + burst * .5), -.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(153,175,196,.17)'; ctx.lineWidth = .6;
    ctx.setLineDash([2, 9]); ctx.beginPath();
    ctx.ellipse(width * .53, height * .46, scale * 1.7, scale * 1.65, -.3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    const sweep = reduced ? .6 : time * .00018;
    const x = width * .53 + Math.cos(sweep) * scale * 1.7;
    const y = height * .46 + Math.sin(sweep) * scale * 1.65;
    ctx.fillStyle = '#ffcf59'; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.strokeStyle = 'rgba(255,207,89,.12)'; ctx.beginPath();
    ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke();
  }
  function isOnGeometry(x, y, tolerance = 13) {
    if (innerWidth <= 700 && x < width * .28) return false;
    const threshold = tolerance * tolerance;
    const closeTo = (a, b) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
      return (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2 <= threshold;
    };
    return projectedPoints.some((point, index) => {
      if ((x - point.x) ** 2 + (y - point.y) ** 2 <= threshold) return true;
      if (point.column < columns - 1 && closeTo(point, projectedPoints[index + 1])) return true;
      return point.column % 4 === 0 && closeTo(point, projectedPoints[(index + columns) % projectedPoints.length]);
    });
  }
  function animate(time) {
    frame = null;
    if (!visible || reduced || document.hidden) return;
    if (time - last > 31) { render(time); last = time; }
    schedule();
  }
  function schedule() {
    if (!ctx || reduced || !visible || document.hidden || frame !== null) return;
    frame = requestAnimationFrame(animate);
  }
  if (ctx) {
    resize(); schedule();
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; schedule();
    }).observe(canvas);
    canvas.addEventListener('click', event => {
      if (event.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      if (isOnGeometry(event.clientX - rect.left, event.clientY - rect.top, event.pointerType === 'touch' ? 20 : 13)) nextGeometry();
    });
    canvas.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault(); nextGeometry();
      }
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      canvas.style.cursor = isOnGeometry(event.clientX - rect.left, event.clientY - rect.top) ? 'pointer' : 'default';
      if (reduced) return;
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
    });
    canvas.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; canvas.style.cursor = 'default'; });
  }
})();
