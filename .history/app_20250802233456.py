from flask import Flask, render_template, request, jsonify
import sqlite3
import json

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('coolspace.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS analysis_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature INTEGER,
            room_type TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    temperature = data.get('temperature')
    room_type = data.get('room_type')
    
    # 簡單的節能建議邏輯
    suggestions = []
    if temperature < 26:
        suggestions.append("建議提高溫度設定至26°C以上，可節省更多能源")
    if room_type == "客廳":
        suggestions.append("建議確保沙發不要直接擋住冷氣出風口")
    elif room_type == "臥室":
        suggestions.append("建議床頭位置避免直對冷氣，以免受寒")
    
    # 儲存分析資料
    conn = sqlite3.connect('coolspace.db')
    c = conn.cursor()
    c.execute('INSERT INTO analysis_data (temperature, room_type) VALUES (?, ?)',
              (temperature, room_type))
    conn.commit()
    conn.close()
    
    return jsonify({
        'suggestions': suggestions,
        'estimated_savings': f"預估每月可節省 {(28-temperature)*50 if temperature < 28 else 0} 度電"
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
