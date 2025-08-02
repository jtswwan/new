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
