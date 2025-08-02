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

