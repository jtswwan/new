import os, math, logging, concurrent.futures, functools
from flask import Flask, request, jsonify, render_template
from google import genai


logging.basicConfig(level=logging.INFO)
app = Flask(__name__)
API_KEY = os.getenv("API_KEY")
client = genai.Client(api_key=API_KEY)

model = "gemini-2.5-pro"

@app.route("/")
def index():
    return render_template("index.html")

schema = {
    "type": "object",
    "properties": {
        "分析": {"type": "array", "items": {"type": "string"}},
        "建議": {"type": "array", "items": {"type": "string"}},
        "舒適度評分": {"type": "integer", "minimum": 0, "maximum": 100},
        "能耗指數": {"type": "integer", "minimum": 0, "maximum": 100},
        "氣流效率": {"type": "integer", "minimum": 0, "maximum": 100},
        "建議冷氣溫度": {"type": "integer"}
    },
    "required": ["分析","建議","舒適度評分","能耗指數","氣流效率","建議冷氣溫度"]
}

def call_gemini_sync(prompt,model):
    return client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": 0.0,  # 隨機性
            "response_mime_type": "application/json",
            "response_schema": schema
        }
    )


@app.route("/api/suggestions", methods=["POST"])
def api_suggestions():
    try:
        data = request.get_json(force=True) or {}
        ac_temp = data.get("ac_temp")  # 空調設定溫度
        room_template = data.get("room_template")  # 房型模板
        items = data.get("items", [])  # 傢俱物件清單
        canvas_size = data.get("canvas_size", {})  # 畫布尺寸

        # 將物件的弧度轉換為角度，方便閱讀
        pretty_items = []
        for it in items:
            pretty_items.append({
                "type": it.get("type"),
                "kind": it.get("kind"),
                "x": it.get("x"), "y": it.get("y"),
                "w": it.get("w"), "h": it.get("h"),
                "angle_deg": round((it.get("angle") or 0) * 180.0 / math.pi, 1)
            })

        prompt = f"""
**Situation**
您是一位專業的台灣居家節能顧問，正在為台灣住戶提供個人化的節能建議。您需要根據特定的居家環境資訊，提供最適當的建議
台灣夏季具有高溫潮濕環境（濕度常超過70%）、午後西曬嚴重的氣候特徵，這些環境因素直接影響居家用電效率。
所有的建議都只能根據我給的物件清單(type)，不要多給。

**examples**
[{{'type': 'table', 'kind': 'furniture', 'x': 308, 'y': 187, 'w': 90, 'h': 60, 'angle_deg': 0.0}},
 {{'type': 'fan',   'kind': 'fan',       'x': 184, 'y': 173, 'w': 70, 'h': 50, 'angle_deg': 0.0}},
 {{'type': 'bed',   'kind': 'furniture', 'x': 470, 'y': 193, 'w': 140,'h': 70, 'angle_deg': 0.0}}]
例如這種狀況，很明顯因為桌子擋到了風扇吹過來的風，這時可以提供：移動桌子避免擋到風的流通

**Task**
根據以下核心資訊，提供具體可執行的居家節能建議：
你是台灣居家節能顧問。以下是模擬畫布與擺設資訊：
- 畫布尺寸（像素）：{canvas_size}
- 空調設定溫度：{ac_temp}°C
- 房型：{room_template}
- 物件清單（位置/尺寸/角度）：{pretty_items}

**Objective**
請輸出 3~6 點可執行的建議（每點 1 句話），重點包含：
1) 風扇/冷氣的方向或位置如何調整（若有）
2) 哪些大型傢俱需要移動/避開出風口
3) 為何能省電或提升舒適（簡短）

"""
        print(prompt)

        response = call_gemini_sync(prompt,model)
        text = (getattr(response, "text", None) or "").strip()
        print(text)
        return text

    except Exception as e:
        app.logger.exception("Gemini API 發生錯誤")
        return jsonify({
            "error": str(e),
            "suggestions": [
                "出事了謝謝",
            ]
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
