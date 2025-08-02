# app.py
import os
from flask import Flask, request, jsonify, render_template
from google import genai

app = Flask(__name__)

# 初始化 Gemini Client（Google GenAI SDK）
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/suggestions", methods=["POST"])
def api_suggestions():
    data = request.get_json(force=True) or {}
    ac_temp = data.get("ac_temp", 26)
    room_template = data.get("room_template", "custom")
    items = data.get("items", [])   # 例: [{"type":"sofa","x":120,"y":80,"w":100,"h":60}, ...]

    prompt = f"""
你是台灣居家節能顧問。根據下列資訊，用條列式給 3~5 點可執行建議：
- 空調設定溫度：{ac_temp}°C
- 房型：{room_template}
- 物件清單（含位置/尺寸，單位像素，相對於模擬畫布）：{items}

限制：
- 建議要短句、務實、能立刻操作。
- 切合台灣夏季潮濕、午後西曬的情境。
- 若可省電，說明原因（簡短）。
"""

    # 選一個一般任務適合的模型（可換成更新的型號）
    model = "gemini-1.5-flash"   # 速度快；要更精確可換 gemini-1.5-pro
    resp = client.models.generate_content(
        model=model,
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
        config={"temperature": 0.6}
    )

    text = resp.text or ""
    # 簡單把 LLM 的條列輸出切成陣列（也可回傳整段文字）
    lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
    return jsonify({"suggestions": lines[:6]})

if __name__ == "__main__":
    # 開發時開啟 debug，方便看錯誤
    app.run(host="127.0.0.1", port=5000, debug=True)

