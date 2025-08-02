document.addEventListener('DOMContentLoaded', () => {
  const suggestionBtn   = document.getElementById('getSuggestionBtn');
  const suggestionBlock = document.getElementById('aiSuggestions');
  const suggestionList  = document.getElementById('suggestionText');

  // 安全防呆：元素不存在就不綁
  if (!suggestionBtn || !suggestionBlock) return;

  // 模擬／範例：你若已經有 getAISuggestions() 就直接呼叫它
  function getAISuggestions() {
    // 這裡示範填入幾條建議；若你已有後端/模型回傳，改為使用你的資料。
    const tips = [
      '把風扇轉到與空調呈 45°，讓冷風沿牆面推送到房深處。',
      '大型家具避免直擋風口，留出 60–80cm 的風道。',
      '午後外牆西曬時，將空調設定到 26–27°C 並開低速循環扇更省電。'
    ];
    suggestionList.innerHTML = tips.map(t => `<li>${t}</li>`).join('');
  }

  suggestionBtn.addEventListener('click', () => {
    // ① 先更新內容
    if (typeof window.getAISuggestions === 'function') {
      window.getAISuggestions();        // 如果你已有同名函式，就用現成的
    } else {
      getAISuggestions();               // 沒有的話，用上面的示範
    }

    // ② 顯示／隱藏區塊（想固定顯示就改成 classList.remove('hidden')）
    suggestionBlock.classList.toggle('hidden');

    // ③ 顯示時平滑捲動到區塊
    if (!suggestionBlock.classList.contains('hidden')) {
      suggestionBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

// === 新增：傢俱按鈕 ➜ 加到畫布，並可拖曳 ===
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// 讓 canvas 有固定尺寸（避免 CSS 縮放造成座標不準）
function resizeCanvas() {
  // 依容器實際 CSS 寬度設定內部像素，提高清晰度
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(420 * dpr); // 與 CSS 高度對齊
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 傢俱狀態
const furniture = []; // {type, x, y, w, h, color, label}

// 類型對應的樣式
const FURN_PRESET = {
  sofa:   { w: 120, h: 60,  color: '#1f3a5f', label: '沙發 🛋️' },
  table:  { w: 90,  h: 60,  color: '#334155', label: '桌子 🪑' },
  bed:    { w: 140, h: 70,  color: '#3b3566', label: '床鋪 🛏️' },
  desk:   { w: 110, h: 60,  color: '#2b3a4a', label: '書桌 📚' },
  tv:     { w: 100, h: 40,  color: '#2f3646', label: '電視櫃 📺' },
  fridge: { w: 60,  h: 80,  color: '#0f3d3e', label: '冰箱 🧊' },
};

// 加入傢俱（放畫布中央）
function addFurniture(type) {
  const p = FURN_PRESET[type];
  if (!p) return;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2, cy = rect.height / 2;
  furniture.push({
    type,
    x: cx - p.w / 2,
    y: cy - p.h / 2,
    w: p.w,
    h: p.h,
    color: p.color,
    label: p.label
  });
  draw();
}

// 繪製全部
function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 你若有自己的背景/熱力圖，可在這裡先畫

  // 畫每個傢俱
  ctx.font = '12px "Noto Sans TC", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  furniture.forEach(f => {
    // 盒子
    ctx.fillStyle = f.color;
    roundRect(ctx, f.x, f.y, f.w, f.h, 10);
    ctx.fill();
    // 邊框
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.stroke();
    // 文字
    ctx.fillStyle = '#e8e6f3';
    ctx.fillText(f.label, f.x + f.w/2, f.y + f.h/2);
  });
}

// 小工具：圓角矩形
function roundRect(ctx, x, y, w, h, r) {
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

// 綁定六顆按鈕（HTML 已存在這些 id）
document.getElementById('addSofaBtn')  ?.addEventListener('click', () => addFurniture('sofa'));
document.getElementById('addTableBtn') ?.addEventListener('click', () => addFurniture('table'));
document.getElementById('addBedBtn')   ?.addEventListener('click', () => addFurniture('bed'));
document.getElementById('addDeskBtn')  ?.addEventListener('click', () => addFurniture('desk'));
document.getElementById('addTvBtn')    ?.addEventListener('click', () => addFurniture('tv'));
document.getElementById('addFridgeBtn')?.addEventListener('click', () => addFurniture('fridge'));

// 讓方塊可拖曳
let dragIdx = -1;
let dragOffsetX = 0, dragOffsetY = 0;

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getMousePos(e);
  dragIdx = hitTest(x, y);
  if (dragIdx >= 0) {
    const f = furniture[dragIdx];
    dragOffsetX = x - f.x;
    dragOffsetY = y - f.y;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (dragIdx < 0) return;
  const { x, y } = getMousePos(e);
  const f = furniture[dragIdx];
  f.x = x - dragOffsetX;
  f.y = y - dragOffsetY;
  draw();
});
window.addEventListener('mouseup', () => { dragIdx = -1; });

// 命中測試
function hitTest(x, y) {
  for (let i = furniture.length - 1; i >= 0; i--) { // 從最上層開始
    const f = furniture[i];
    if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) {
      return i;
    }
  }
  return -1;
}

// 取得滑鼠在 canvas 的座標（扣掉邊界）
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

// 初始繪製
draw();

// ============ 風扇 & 冷氣：可拖曳 + 旋轉 + 氣流動畫 ============

// 1) 取得 canvas 與 2D context
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// 2) DPR 尺寸處理，確保座標與視覺一致
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 3) 物件狀態（家具 + 設備都放在這）
/**
 * entity:
 * {
 *   kind: 'fan' | 'ac' | 'furniture',
 *   x, y, w, h,
 *   angle: 方向角度(弧度), 0=向右,
 *   label, color
 * }
 */
const entities = [];

// 4) 預設外觀
const PRESET = {
  fan: { w: 70,  h: 50, color: '#1e3a5f', label: '風扇 🌀', particlesPerFrame: 12, speed: 2.2, spread: 18 },
  ac:  { w: 120, h: 46, color: '#14532d', label: '冷氣 ❄️', particlesPerFrame: 18, speed: 2.8, spread: 12 },
};

// 5) 加入設備：放在畫布中央
function addDevice(kind) {
  const p = PRESET[kind];
  if (!p) return;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2, cy = rect.height / 2;
  entities.push({
    kind,
    x: cx - p.w / 2,
    y: cy - p.h / 2,
    w: p.w,
    h: p.h,
    angle: 0, // 初始向右
    label: p.label,
    color: p.color
  });
}

// （可選）如果你還需要原本家具，也可用這個加入：
// addFurniture('sofa') 之類可自己做；這裡專注 fan / ac

// 6) 綁定新增按鈕
document.getElementById('addFanBtn')?.addEventListener('click', () => { addDevice('fan'); });
document.getElementById('addAcBtn') ?.addEventListener('click', ()  => { addDevice('ac');  });

// 7) 互動：拖曳 & 點擊旋轉
let dragIdx = -1, dragOffX = 0, dragOffY = 0;
let downPos = null;      // 用來判斷是否點擊（非拖曳）
let movedSinceDown = false;

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getMousePos(e);
  const i = hitTest(x, y);
  downPos = { x, y };
  movedSinceDown = false;

  if (i >= 0) {
    dragIdx = i;
    dragOffX = x - entities[i].x;
    dragOffY = y - entities[i].y;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (dragIdx < 0) return;
  const { x, y } = getMousePos(e);
  entities[dragIdx].x = x - dragOffX;
  entities[dragIdx].y = y - dragOffY;
  movedSinceDown = true;
});

window.addEventListener('mouseup', (e) => {
  if (dragIdx >= 0 && !movedSinceDown && downPos) {
    // 幾乎沒移動 → 當作點擊：旋轉 45°
    entities[dragIdx].angle += Math.PI / 4;
  }
  dragIdx = -1;
  downPos = null;
});

// 命中測試：從上層往下找
function hitTest(x, y) {
  for (let i = entities.length - 1; i >= 0; i--) {
    const it = entities[i];
    if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return i;
  }
  return -1;
}

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

// 8) 氣流粒子系統
/**
 * 每個 frame：
 *  - 從 fan / ac 的出風口沿角度方向生成粒子
 *  - 粒子直線前進（帶一點隨機擾動），逐漸透明，超出畫布或壽命結束就移除
 */
const particles = [];

function spawnParticlesFrom(entity) {
  const spec = PRESET[entity.kind];
  if (!spec) return;
  const count = spec.particlesPerFrame;

  // 出風口位置：矩形中心 + 朝向的一半寬度
  const cx = entity.x + entity.w / 2;
  const cy = entity.y + entity.h / 2;
  const dir = entity.angle;

  // 讓粒子從矩形前緣帶一點寬度分佈
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * (spec.spread * Math.PI / 180); // 角度擴散
    const ang = dir + spread;

    // 出風口前緣起點（從中心推到前緣）
    const ox = Math.cos(dir) * (entity.w / 2);
    const oy = Math.sin(dir) * (entity.h / 2);

    particles.push({
      x: cx + ox + (Math.random() - 0.5) * 10,
      y: cy + oy + (Math.random() - 0.5) * 10,
      vx: Math.cos(ang) * spec.speed * (1.1 + Math.random() * 0.6),
      vy: Math.sin(ang) * spec.speed * (1.1 + Math.random() * 0.6),
      life: 60 + Math.random() * 40,   // 幀數
      r: 2 + Math.random() * 1.5,      // 半徑
      kind: entity.kind
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    // 微量擾動（讓流線更自然）
    p.vx += (Math.random() - 0.5) * 0.05;
    p.vy += (Math.random() - 0.5) * 0.05;

    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.life <= 0 || p.x < -10 || p.y < -10 || p.x > canvas.getBoundingClientRect().width + 10 || p.y > canvas.getBoundingClientRect().height + 10) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    // 顏色依設備種類略有不同
    ctx.fillStyle = p.kind === 'ac'
      ? 'rgba(56, 189, 248, 0.25)'   // 冷氣：偏藍
      : 'rgba(74, 222, 128, 0.25)';  // 風扇：偏綠
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 9) 繪製設備
function drawEntities() {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = '12px "Noto Sans TC", sans-serif';

  entities.forEach(it => {
    // 主體
    ctx.save();
    ctx.translate(it.x + it.w / 2, it.y + it.h / 2);
    ctx.rotate(it.angle);
    ctx.fillStyle = it.color;
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    roundRectPath(-it.w / 2, -it.h / 2, it.w, it.h, 10);
    ctx.fill();
    ctx.stroke();

    // 出風方向箭頭（細長三角形）
    ctx.beginPath();
    ctx.moveTo(it.w / 2, 0);
    ctx.lineTo(it.w / 2 + 16, -5);
    ctx.lineTo(it.w / 2 + 16, 5);
    ctx.closePath();
    ctx.fillStyle = it.kind === 'ac' ? 'rgba(56,189,248,.7)' : 'rgba(74,222,128,.7)';
    ctx.fill();
    ctx.restore();

    // 文字（不旋轉，保持水平）
    ctx.fillStyle = '#e8e6f3';
    ctx.fillText(it.label, it.x + it.w / 2, it.y + it.h / 2);
  });
}

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

// 10) 主迴圈（60FPS 左右）
function loop() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 先生成氣流，再更新、再畫
  entities.forEach(it => {
    if (it.kind === 'fan' || it.kind === 'ac') spawnParticlesFrom(it);
  });

  updateParticles();
  drawParticles();
  drawEntities();

  requestAnimationFrame(loop);
}
loop();

