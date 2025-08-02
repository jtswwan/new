from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    temperature = int(data.get('temperature', 26))
    room_type = data.get('room_type', 'studio')

    # 基礎計算
    base_power = 1000  # 基礎耗電量(W)
    hours_per_day = 8  # 平均每日使用時數
    days_per_month = 30
    power_factor = max(0.7, 1 - (temperature - 24) * 0.1)  # 溫度影響因子
    
    # 計算每月耗電量(度)
    monthly_power = (base_power * power_factor * hours_per_day * days_per_month) / 1000
    
    # 計算節省金額
    price_per_unit = 3.52  # 夏月電價
    monthly_savings = round((28 - temperature) * monthly_power * price_per_unit)
    
    # 計算CO2減少量（每度電約0.509kg CO2）
    co2_reduction = round(monthly_savings * 0.509 / 1000, 2)
    
    # 計算效率提升
    efficiency_gain = round((28 - temperature) * 1.2, 1)
    
    # 計算舒適度（26度為最佳）
    comfort = round(100 - abs(26 - temperature) * 5)
    
    return jsonify({
        'monthlySavings': f"NT$ {monthly_savings:,}",
        'co2Reduction': f"{co2_reduction}噸",
        'efficiencyGain': f"{efficiency_gain}%",
        'comfort': f"{comfort}%",
        'powerUsage': f"{round(monthly_power, 1)}度",
        'temperature': temperature
    })

if __name__ == '__main__':
    app.run(debug=True)
