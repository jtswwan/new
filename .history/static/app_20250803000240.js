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
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(
        simulationCanvas.width - 60,
        20,
        40,
        20
    );
    
    // 繪製冷氣氣流方向指示
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
    ctx.beginPath();
    ctx.moveTo(simulationCanvas.width - 40, 40);
    ctx.lineTo(simulationCanvas.width - 40, 60);
    ctx.lineTo(simulationCanvas.width - 45, 55);
    ctx.moveTo(simulationCanvas.width - 40, 60);
    ctx.lineTo(simulationCanvas.width - 35, 55);
    ctx.stroke();
}

// 繪製熱力圖
function drawHeatmap() {
    const gradient = ctx.createRadialGradient(
        simulationCanvas.width - 40, 30,
        10,
        simulationCanvas.width - 40, 30,
        simulationCanvas.width * 0.8
    );
    
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)');   // 冷區
    gradient.addColorStop(0.3, 'rgba(251, 191, 36, 0.2)'); // 溫區
    gradient.addColorStop(1, 'rgba(245, 101, 101, 0.2)');  // 熱區

    ctx.fillStyle = gradient;
    ctx.fillRect(
        10, 10,
        simulationCanvas.width - 20,
        simulationCanvas.height - 20
    );
}

// 繪製氣流
function drawAirflow() {
    const time = Date.now() * 0.001;
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
        const offset = i * 20;
        const amplitude = 20;
        const frequency = 0.02;
        const speed = 50;

        ctx.beginPath();
        for (let x = simulationCanvas.width - 60; x > 0; x -= 5) {
            const y = Math.sin((x + time * speed + offset) * frequency) * amplitude + simulationCanvas.height / 2;
            if (x === simulationCanvas.width - 60) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

// 新增傢俱
function addFurniture(furnitureId) {
    const type = FURNITURE_TYPES[furnitureId];
    if (!type) return;

    const newFurniture = {
        type: furnitureId,
        x: simulationCanvas.width / 2 - type.width / 2,
        y: simulationCanvas.height / 2 - type.height / 2,
        width: type.width,
        height: type.height,
        color: type.color,
        rotation: 0
    };

    furniture.push(newFurniture);
    updateSimulation();
}

// 繪製所有傢俱
function drawAllFurniture() {
    furniture.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        ctx.fillStyle = item.color;
        ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
    });
}

// 拖曳相關函數
function startDragging(e) {
    const rect = simulationCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    furniture.forEach(item => {
        if (isPointInFurniture(x, y, item)) {
            isDragging = true;
            selectedFurniture = item;
        }
    });
}

function drag(e) {
    if (!isDragging || !selectedFurniture) return;

    const rect = simulationCanvas.getBoundingClientRect();
    selectedFurniture.x = e.clientX - rect.left - selectedFurniture.width / 2;
    selectedFurniture.y = e.clientY - rect.top - selectedFurniture.height / 2;

    // 限制在房間範圍內
    selectedFurniture.x = Math.max(10, Math.min(simulationCanvas.width - selectedFurniture.width - 10, selectedFurniture.x));
    selectedFurniture.y = Math.max(10, Math.min(simulationCanvas.height - selectedFurniture.height - 10, selectedFurniture.y));
}

function stopDragging() {
    isDragging = false;
    selectedFurniture = null;
}

// 判斷點是否在傢俱內
function isPointInFurniture(x, y, furniture) {
    return x >= furniture.x && 
           x <= furniture.x + furniture.width && 
           y >= furniture.y && 
           y <= furniture.y + furniture.height;
}

// 清除所有傢俱
function clearFurniture() {
    furniture = [];
    updateSimulation();
}

// 載入房型模板
function loadRoomTemplate(template) {
    switch(template) {
        case 'studio':
            furniture = [
                { type: 'addBedBtn', x: 50, y: 50, ...FURNITURE_TYPES['addBedBtn'] },
                { type: 'addDeskBtn', x: 50, y: 150, ...FURNITURE_TYPES['addDeskBtn'] }
            ];
            break;
        case '1br':
            furniture = [
                { type: 'addBedBtn', x: 50, y: 50, ...FURNITURE_TYPES['addBedBtn'] },
                { type: 'addSofaBtn', x: 200, y: 50, ...FURNITURE_TYPES['addSofaBtn'] },
                { type: 'addTvBtn', x: 200, y: 150, ...FURNITURE_TYPES['addTvBtn'] }
            ];
            break;
        case '2br':
            furniture = [
                { type: 'addBedBtn', x: 50, y: 50, ...FURNITURE_TYPES['addBedBtn'] },
                { type: 'addBedBtn', x: 50, y: 150, ...FURNITURE_TYPES['addBedBtn'] },
                { type: 'addSofaBtn', x: 200, y: 100, ...FURNITURE_TYPES['addSofaBtn'] },
                { type: 'addTvBtn', x: 200, y: 200, ...FURNITURE_TYPES['addTvBtn'] }
            ];
            break;
    }
    updateSimulation();
}

// 獲取 AI 建議
function getAISuggestions() {
    const suggestions = [
        '根據目前布局，建議將沙發移向房間中央以優化氣流分布',
        '考慮添加一台電風扇在東北角，可提升整體空氣循環效率',
        '檢測到西曬問題，建議在窗戶安裝遮陽簾以減少熱輻射',
        '目前空調溫度設定適中，維持在26°C可達到最佳節能效果'
    ];

    const suggestionList = document.getElementById('suggestionText');
    suggestionList.innerHTML = suggestions.map(text => `<li>${text}</li>`).join('');
}

// 保存設定
function saveSettings() {
    // 模擬保存設定
    alert('設定已保存！');
}

// 重設設定
function resetSettings() {
    if (confirm('確定要重設所有設定嗎？')) {
        // 重設所有設定到預設值
        document.getElementById('acTemp').value = 26;
        document.getElementById('acTempLabel').textContent = '26°C';
        document.getElementById('roomTemplate').value = 'custom';
        clearFurniture();
        updateSimulation();
    }
}

// 頁面載入時初始化
window.addEventListener('load', initializeApp);
