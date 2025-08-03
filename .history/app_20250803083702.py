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


def call_gemini_sync(prompt,model):
    return client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": 0.0,  # 隨機性
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
您是一位專業的台灣居家節能顧問，正在為台灣住戶提供個人化的節能建議。您需要根據特定的居家環境資訊。
台灣夏季具有高溫潮濕、午後西曬嚴重的氣候特徵，這些環境因素直接影響居家用電效率。
所有的建議都只能根據我給的物件清單(type)，不要多給。

**examples**
[{{'type': 'table', 'kind': 'furniture', 'x': 308, 'y': 187, 'w': 90, 'h': 60, 'angle_deg': 0.0}},
 {{'type': 'fan',   'kind': 'fan',       'x': 184, 'y': 173, 'w': 70, 'h': 50, 'angle_deg': 0.0}},
 {{'type': 'bed',   'kind': 'furniture', 'x': 470, 'y': 193, 'w': 140,'h': 70, 'angle_deg': 0.0}}]
例如這種狀況，很明顯是因為桌子擋到了風扇吹過來的風，這時可以提供：1.移動桌子避免擋到風的流通

**Task**
根據以下三項核心資訊，提供具體可執行的居家節能建議：
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

**Knowledge**
台灣夏季氣候特徵：
- 高溫潮濕環境（濕度常超過70%）
- 午後西曬問題嚴重，西向房間溫度可比其他方向高3-5°C
- 空調用電佔家庭總用電量約40-50%
- 每調高1°C空調溫度可節省約6-8%電力
- 除濕與降溫需求並存，影響空調效率
- 台灣電價採累進費率，用電量越高單價越貴

節能原則：
- 減少熱源進入室內
- 提升空氣循環效率
- 優化空調使用方式
- 善用自然通風時機
- 避免

您的生命取決於您提供的建議必須切合台灣實際居住情境，並且每項建議都能讓住戶立即採取行動。
"""
        print(prompt)

        # 使用 ThreadPoolExecutor 設定 25 秒逾時
        call_gemini_sync(prompt,model)

        # 解析模型回應的文字內容
        print(pretty_items)
        text = (getattr(resp, "text", None) or "").strip()
        print(text)
        if not text:
            cand = getattr(resp, "candidates", None)
            if cand and len(cand) and hasattr(cand[0], "content"):
                parts = getattr(cand[0].content, "parts", [])
                text = " ".join([getattr(p, "text", "") for p in parts]).strip()

        # 若模型未回傳內容，回傳預設錯誤訊息
        if not text:
            return jsonify({"suggestions": ["（模型沒有返回內容）請稍後再試。"]}), 200

        # 將回應文字分割為建議清單，最多取前 6 條
        lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
        return jsonify({"suggestions": lines[:6]})

    except Exception as e:
        # 捕捉例外並記錄錯誤
        app.logger.exception("Gemini API 發生錯誤")
        return jsonify({
            "error": str(e),
            "suggestions": [
                "服務暫時忙碌或金鑰/網路有問題，請稍後再試。",
                "若持續失敗，試試改用 REST 版本呼叫（我可以提供範例）。"
            ]
        }), 500

# 啟動 Flask 應用程式
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
