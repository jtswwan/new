// DOM 元素
const tempSlider = document.getElementById('acTemp');
const tempLabel = document.getElementById('acTempLabel');
const roomSelect = document.getElementById('roomTemplate');
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// 全局變數
let currentTemp = 26;
let currentRoom = 'studio';

// 初始化圖表
function initCharts() {
    // 每日用電量趨勢
    const dailyChart = new Chart(document.getElementById('dailyChart'), {
        type: 'line',
        data: {
            labels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
            datasets: [{
                label: '用電量 (kW)',
                data: [0.8, 1.2, 2.1, 1.8, 0.9],
                borderColor: '#4fd1c5',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 其他圖表初始化...
}

// 更新分析數據
async function updateAnalysis() {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                temperature: currentTemp,
                room_type: currentRoom
            })
        });

        const data = await response.json();
        
        // 更新統計數據
        document.getElementById('totalSavings').textContent = data.monthlySavings;
        document.getElementById('co2Reduction').textContent = data.co2Reduction;
        document.getElementById('efficiencyGain').textContent = data.efficiencyGain;
        document.getElementById('comfortMetric').textContent = data.comfort;
        
        // 更新模擬視圖
        updateSimulation();
        
    } catch (error) {
        console.error('更新失敗:', error);
    }
}

// 更新模擬視圖
function updateSimulation() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製房間外框
    ctx.strokeStyle = '#4fd1c5';
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // 繪製冷氣機位置
    ctx.fillStyle = '#4fd1c5';
    ctx.fillRect(canvas.width - 40, 20, 20, 40);
    
    // 繪製溫度分布...（簡化版）
}

// 事件監聽器
tempSlider.addEventListener('input', (e) => {
    currentTemp = parseInt(e.target.value);
    tempLabel.textContent = `${currentTemp}°C`;
    updateAnalysis();
});

roomSelect.addEventListener('change', (e) => {
    currentRoom = e.target.value;
    updateAnalysis();
});

// Tab 切換
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        // 移除所有 active 類別
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 添加 active 到當前按鈕和內容
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// 初始化
window.addEventListener('load', () => {
    initCharts();
    updateAnalysis();
});
