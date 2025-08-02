// 全局變量
let simulationCanvas;
let ctx;
let animationFrameId;
let currentTemperature = 26;
let currentRoom = 'studio';
let simulationActive = true;
let isDragging = false;
let selectedFurniture = null;
let furniture = [];

// 傢俱類型定義
const FURNITURE_TYPES = {
    'addSofaBtn': { name: '沙發', width: 80, height: 40, color: '#2d3748' },
    'addTableBtn': { name: '桌子', width: 60, height: 60, color: '#2d3748' },
    'addBedBtn': { name: '床鋪', width: 100, height: 60, color: '#2d3748' },
    'addDeskBtn': { name: '書桌', width: 70, height: 40, color: '#2d3748' },
    'addTvBtn': { name: '電視櫃', width: 80, height: 30, color: '#2d3748' },
    'addFridgeBtn': { name: '冰箱', width: 40, height: 40, color: '#2d3748' }
};

// 初始化函數
function initializeApp() {
    initializeCanvas();
    setupEventListeners();
    initializeCharts();
    startSimulation();
    updateMetrics();
}

// 初始化畫布
function initializeCanvas() {
    simulationCanvas = document.getElementById('simulationCanvas');
    ctx = simulationCanvas.getContext('2d');
    
    // 設置畫布大小
    function resizeCanvas() {
        const container = simulationCanvas.parentElement;
        simulationCanvas.width = container.clientWidth;
        simulationCanvas.height = container.clientHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// 設置事件監聽器
function setupEventListeners() {
    // 溫度滑塊事件
    const temperatureSlider = document.getElementById('acTemp');
    const temperatureLabel = document.getElementById('acTempLabel');
    temperatureSlider.addEventListener('input', (e) => {
        currentTemperature = parseInt(e.target.value);
        temperatureLabel.textContent = `${currentTemperature}°C`;
        updateMetrics();
    });

    // 房型選擇事件
    const roomTemplate = document.getElementById('roomTemplate');
    roomTemplate.addEventListener('change', (e) => {
        currentRoom = e.target.value;
        clearFurniture();
        loadRoomTemplate(e.target.value);
        updateSimulation();
    });

    // 分頁切換事件
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 傢俱按鈕事件
    document.querySelectorAll('.furniture-btn').forEach(btn => {
        btn.addEventListener('click', () => addFurniture(btn.id));
    });

    // 畫布互動事件
    simulationCanvas.addEventListener('mousedown', startDragging);
    simulationCanvas.addEventListener('mousemove', drag);
    simulationCanvas.addEventListener('mouseup', stopDragging);
    simulationCanvas.addEventListener('mouseleave', stopDragging);

    // AI 建議按鈕事件
    document.getElementById('getSuggestionBtn').addEventListener('click', getAISuggestions);

    // 設置更新事件
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
}

// 切換分頁
function switchTab(tabId) {
    // 移除所有活動狀態
    document.querySelectorAll('.tab-btn').forEach(btn => 
        btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => 
        content.classList.remove('active'));

    // 設置新的活動分頁
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 更新指標
function updateMetrics() {
    // 計算舒適度
    const comfort = calculateComfort();
    document.getElementById('comfortMetric').textContent = `${comfort}%`;

    // 計算能耗
    const energy = calculateEnergy();
    document.getElementById('energyMetric').textContent = energy;

    // 計算氣流效率
    const airflow = calculateAirflow();
    document.getElementById('airflowMetric').textContent = `${airflow}%`;

    // 更新頂部統計
    updateHeaderStats();
}
}

// 初始化圖表
function initializeCharts() {
    // 每日用電量趨勢
    const dailyChart = new Chart(document.getElementById('dailyChart'), {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: '用電量 (kWh)',
                data: [0.5, 0.3, 0.8, 1.2, 1.5, 0.9],
                borderColor: '#4fd1c5',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#a0aec0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2d3748'
                    },
                    ticks: {
                        color: '#a0aec0'
                    }
                },
                x: {
                    grid: {
                        color: '#2d3748'
                    },
                    ticks: {
                        color: '#a0aec0'
                    }
                }
            }
        }
    });

    // 其他圖表初始化...
}

// 開始模擬
function startSimulation() {
    simulationActive = true;
    animate();
}

// 動畫循環
function animate() {
    if (!simulationActive) return;
    
    animationFrameId = requestAnimationFrame(animate);
    drawSimulation();
}

// 停止模擬
function stopSimulation() {
    simulationActive = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// 繪製模擬
function drawSimulation() {
    // 清除畫布
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);

    // 繪製房間邊界
    drawRoom();
    
    // 繪製熱力分布
    drawHeatmap();
    
    // 繪製傢俱
    drawAllFurniture();
    
    // 繪製氣流
    drawAirflow();
}

// 繪製房間
function drawRoom() {
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, simulationCanvas.width - 20, simulationCanvas.height - 20);

    // 繪製冷氣
    drawAC();
}

// 計算舒適度
function calculateComfort() {
    const optimalTemp = 26;
    const diff = Math.abs(currentTemperature - optimalTemp);
    return Math.max(0, Math.min(100, 100 - diff * 8));
}

// 計算能耗
function calculateEnergy() {
    const baseEnergy = 50;
    const tempDiff = Math.abs(currentTemperature - 26);
    return Math.floor(baseEnergy + tempDiff * 5);
}

// 計算氣流效率
function calculateAirflow() {
    return 75 + Math.floor(Math.random() * 10);
}

// 更新頂部統計
function updateHeaderStats() {
    const monthlySavings = 4560;
    const co2Reduction = 1.37;
    const efficiencyGain = 28;

    document.getElementById('totalSavings').textContent = `NT$ ${monthlySavings.toLocaleString()}`;
    document.getElementById('co2Reduction').textContent = `${co2Reduction}噸`;
    document.getElementById('efficiencyGain').textContent = `${efficiencyGain}%`;
}

// 繪製冷氣
function drawAC() {
    ctx.fillStyle = '#4fd1c5';
    ctx.fillRect(
        simulationCanvas.width - 60,
        20,
        40,
        20
    );
}

// 繪製熱力圖
function drawHeatmap() {
    // 簡化版熱力圖
    const gradient = ctx.createLinearGradient(
        simulationCanvas.width - 60, 0,
        0, simulationCanvas.height
    );
    
    gradient.addColorStop(0, 'rgba(66, 153, 225, 0.2)');  // 冷區
    gradient.addColorStop(0.5, 'rgba(236, 201, 75, 0.2)'); // 溫區
    gradient.addColorStop(1, 'rgba(245, 101, 101, 0.2)');  // 熱區

    ctx.fillStyle = gradient;
    ctx.fillRect(
        10, 10,
        simulationCanvas.width - 20,
        simulationCanvas.height - 20
    );
}

// 繪製傢俱
function drawFurniture() {
    // 示例傢俱
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(100, 100, 80, 40);  // 範例沙發
}

// 新增傢俱
function addFurniture(furnitureId) {
    console.log('新增傢俱:', furnitureId);
    // 實作傢俱新增邏輯
}

// 頁面載入時初始化
window.addEventListener('load', initializeApp);
