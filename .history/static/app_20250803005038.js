document.addEventListener('DOMContentLoaded', () => {
  // ===== 取得必要元素 =====
  const suggestionBtn   = document.getElementById('getSuggestionBtn');
  const suggestionBlock = document.getElementById('aiSuggestions');
  const suggestionList  = document.getElementById('suggestionText');
  const canvas          = document.getElementById('simulationCanvas');
  if (!canvas) return; // 沒有畫布就不往下
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ===== Canvas 尺寸處理（依容器實際大小 + DPR）=====
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // 用實際 CSS 高度，而不是寫死 420
    canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ====== AI 建議：顯示/收起 ======
  if (suggestionBtn && suggestionBlock && suggestionList) {
    function fillAISuggestions() {
      const tips = [
        '把風扇轉到與空調呈 45°，讓冷風沿牆面推送到房深處。',
        '大型家具避免直擋風口，留出 60–80 公分的風道。',
        '午後西曬時，空調 26–27°C + 低速循環扇更省電。'
      ];
      suggestionList.innerHTML = tips.map(t => `<li>${t}</li>`).join('');
    }

    suggestionBtn.addEventListener('click', () => {
      fillAISuggestions();                         // 更新內容
      suggestionBlock.classList.toggle('hidden');  // 顯示/收起
      if (!suggestionBlock.classList.contains('hidden')) {
        suggestionBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ====== 狀態：家具 + 設備（風扇/冷氣） ======
  // 家具（矩形，無氣流）
  const FURN_PRESET = {
    sofa:   { w: 120, h: 60,  color: '#1f3a5f', label: '沙發 🛋️' },
    table:  { w:  90, h: 60,  color: '#334155', label: '桌子 🪑' },
    bed:    { w: 140, h: 70,  color: '#3b3566', label: '床鋪 🛏️' },
    desk:   { w: 110, h: 60,  color: '#2b3a4a', label: '書桌 📚' },
    tv:     { w: 100, h: 40,  color: '#2f3646', label: '電視櫃 📺' },
    fridge: { w:  60, h: 80,  color: '#0f3d3e', label: '其他物體 🧊' }, // 你的 HTML 標成「其他物體」
  };

  // 設備（會吹氣）
  const DEVICE_PRESET = {
    fan: { w: 70,  h: 50, color: '#1e3a5f', label: '風扇 🌀', particlesPerFrame: 12, speed: 2.2, spreadDeg: 18 },
    ac:  { w: 120, h: 46, color: '#14532d', label: '冷氣 ❄️', particlesPerFrame: 18, speed: 2.8, spreadDeg: 12 },
  };

  /**
   * entity:
   * {
   *   kind: 'furniture' | 'fan' | 'ac',
   *   x, y, w, h,
   *   color, label,
   *   angle (只有 fan/ac 會用，單位：弧度)
   * }
   */
  const entities = [];

  function centerXY() {
    const r = canvas.getBoundingClientRect();
    return { x: r.width / 2, y: r.height / 2 };
  }

  function addFurniture(type) {
    const p = FURN_PRESET[type];
    if (!p) return;
    const c = centerXY();
    entities.push({
      kind: 'furniture', x: c.x - p.w / 2, y: c.y - p.h / 2,
      w: p.w, h: p.h, color: p.color, label: p.label, angle: 0
    });
  }

  function addDevice(kind) {
    const p = DEVICE_PRESET[kind];
    if (!p) return;
    const c = centerXY();
    entities.push({
      kind, x: c.x - p.w / 2, y: c.y - p.h / 2,
      w: p.w, h: p.h, color: p.color, label: p.label, angle: 0
    });
  }

  // 綁定六顆家具 + 風扇/冷氣（HTML 已有這些 id）
  document.getElementById('addSofaBtn')   ?.addEventListener('click', () => addFurniture('sofa'));
  document.getElementById('addTableBtn')  ?.addEventListener('click', () => addFurniture('table'));
  document.getElementById('addBedBtn')    ?.addEventListener('click', () => addFurniture('bed'));
  document.getElementById('addDeskBtn')   ?.addEventListener('click', () => addFurniture('desk'));
  document.getElementById('addTvBtn')     ?.addEventListener('click', () => addFurniture('tv'));
  document.getElementById('addFridgeBtn') ?.addEventListener('click', () => addFurniture('fridge'));
  document.getElementById('addFanBtn')    ?.addEventListener('click', () => addDevice('fan'));
  document.getElementById('addAcBtn')     ?.addEventListener('click', () => addDevice('ac'));

  // ====== 拖曳 + 點擊旋轉（針對任何 entity）======
  let dragIdx = -1, dragOffX = 0, dragOffY = 0;
  let downPos = null, movedSinceDown = false;

  canvas.addEventListener('mousedown', (e) => {
    const { x, y } = getMousePos(e);
    downPos = { x, y };
    movedSinceDown = false;
    dragIdx = hitTest(x, y);
    if (dragIdx >= 0) {
      const it = entities[dragIdx];
      dragOffX = x - it.x;
      dragOffY = y - it.y;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (dragIdx < 0) return;
    const { x, y } = getMousePos(e);
    const it = entities[dragIdx];
    it.x = x - dragOffX;
    it.y = y - dragOffY;
    movedSinceDown = true;
  });

  window.addEventListener('mouseup', () => {
    if (dragIdx >= 0 && !movedSinceDown) {
      // 幾乎沒移動 → 視為點擊：fan/ac 旋轉 45°
      const it = entities[dragIdx];
      if (it.kind === 'fan' || it.kind === 'ac') it.angle += Math.PI / 4;
    }
    dragIdx = -1;
    downPos = null;
  });

  function hitTest(x, y) {
    for (let i = entities.length - 1; i >= 0; i--) {
      const it = entities[i];
      if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return i;
    }
    return -1;
  }

  function getMousePos(evt) {
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  // ====== 粒子（氣流）======
  const particles = [];

  function spawnParticlesFrom(entity) {
    const spec = DEVICE_PRESET[entity.kind];
    if (!spec) return;
    const count = spec.particlesPerFrame;
    const dir = entity.angle;

    // 從矩形中心推到「前緣」當出風口
    const cx = entity.x + entity.w / 2;
    const cy = entity.y + entity.h / 2;
    const ox = Math.cos(dir) * (entity.w / 2);
    const oy = Math.sin(dir) * (entity.h / 2);

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * (spec.spreadDeg * Math.PI / 180);
      const ang = dir + spread;
      particles.push({
        x: cx + ox + (Math.random() - 0.5) * 10,
        y: cy + oy + (Math.random() - 0.5) * 10,
        vx: Math.cos(ang) * spec.speed * (1.1 + Math.random() * 0.6),
        vy: Math.sin(ang) * spec.speed * (1.1 + Math.random() * 0.6),
        r: 2 + Math.random() * 1.5,
        life: 60 + Math.random() * 40,
        kind: entity.kind
      });
    }
  }

  function updateParticles() {
    const r = canvas.getBoundingClientRect();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      // 微擾動
      p.vx += (Math.random() - 0.5) * 0.05;
      p.vy += (Math.random() - 0.5) * 0.05;
      p.x += p.vx; p.y += p.vy;
      p.life--;
      if (p.life <= 0 || p.x < -10 || p.y < -10 || p.x > r.width + 10 || p.y > r.height + 10) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.fillStyle = p.kind === 'ac'
        ? 'rgba(56,189,248,0.25)'   // 冷氣：藍
        : 'rgba(74,222,128,0.25)';  // 風扇：綠
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ====== 繪製 ======
  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawEntities() {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '12px "Noto Sans TC", sans-serif';

    entities.forEach(it => {
      // 主體（帶旋轉）
      ctx.save();
      ctx.translate(it.x + it.w / 2, it.y + it.h / 2);
      if (it.kind === 'fan' || it.kind === 'ac') ctx.rotate(it.angle);
      ctx.fillStyle = it.color;
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      roundRectPath(-it.w / 2, -it.h / 2, it.w, it.h, 10);
      ctx.fill(); ctx.stroke();

      // fan/ac 的出風箭頭
      if (it.kind === 'fan' || it.kind === 'ac') {
        ctx.beginPath();
        ctx.moveTo(it.w / 2, 0);
        ctx.lineTo(it.w / 2 + 16, -5);
        ctx.lineTo(it.w / 2 + 16, 5);
        ctx.closePath();
        ctx.fillStyle = it.kind === 'ac' ? 'rgba(56,189,248,.7)' : 'rgba(74,222,128,.7)';
        ctx.fill();
      }
      ctx.restore();

      // 文字固定水平
      ctx.fillStyle = '#e8e6f3';
      ctx.fillText(it.label, it.x + it.w / 2, it.y + it.h / 2);
    });
  }

  // ====== 主迴圈 ======
  function loop() {
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);

    // 生成氣流（僅 fan/ac）
    entities.forEach(it => {
      if (it.kind === 'fan' || it.kind === 'ac') spawnParticlesFrom(it);
    });

    updateParticles();
    drawParticles();
    drawEntities();

    requestAnimationFrame(loop);
  }
  loop();
});
