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
    temperatureSlider.addEventListener('input', (e) => {
        currentTemperature = parseInt(e.target.value);
        temperatureLabel.textContent = `${currentTemperature}°C`;
        updateMetrics();
    });

    // 房型選擇事件
    roomTemplate.addEventListener('change', (e) => {
        currentRoom = e.target.value;
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
async function updateMetrics() {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                temperature: currentTemperature,
                room_type: currentRoom
            })
        });

        const data = await response.json();

        // 更新頂部統計
        document.getElementById('totalSavings').textContent = data.monthlySavings;
        document.getElementById('co2Reduction').textContent = data.co2Reduction;
        document.getElementById('efficiencyGain').textContent = data.efficiencyGain;

        // 更新即時指標
        document.getElementById('comfortMetric').textContent = data.comfort;
        document.getElementById('energyMetric').textContent = data.powerUsage;

        // 更新模擬視圖
        updateSimulation();

    } catch (error) {
        console.error('更新指標失敗:', error);
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

// 模擬相關函數
function startSimulation() {
    // 設置畫布尺寸
    simulationCanvas.width = simulationCanvas.offsetWidth;
    simulationCanvas.height = simulationCanvas.offsetWidth * 0.6;

    // 開始動畫循環
    requestAnimationFrame(updateSimulation);
}

function updateSimulation() {
    if (!simulationActive) return;

    // 清除畫布
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);

    // 繪製房間邊界
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, simulationCanvas.width - 20, simulationCanvas.height - 20);

    // 繪製冷氣位置
    drawAC();

    // 繪製熱力分布
    drawHeatmap();

    // 繪製傢俱
    drawFurniture();

    // 請求下一幀
    requestAnimationFrame(updateSimulation);
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
