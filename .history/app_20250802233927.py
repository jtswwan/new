from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    temperature = data.get('temperature')
    room_type = data.get('room_type')

    # 回傳基本分析數據
    monthly_savings = round((28 - temperature) * 50 * 2)  # 估算月節省費用
    co2_reduction = round(monthly_savings * 0.0062, 1)    # 估算CO2減少量
    efficiency_gain = round((28 - temperature) * 0.8, 1)  # 估算效率提升
    
    return jsonify({
        'monthlySavings': f"NT$ {monthly_savings:,}",
        'co2Reduction': f"{co2_reduction}噸",
        'efficiencyGain': f"{efficiency_gain}%",
        'roomTemp': temperature
    })

if __name__ == '__main__':
    app.run(debug=True)
