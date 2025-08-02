import os, math, logging, concurrent.futures, functools
from flask import Flask, request, jsonify, render_template
from google import genai

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

def call_gemini_sync(prompt: str, model: str = "gemini-1.5-flash"):
    # SDK 不支援 timeout 參數；這裡只傳可用的 config
    return client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": 0.6,
            # ← 不要放 timeout，SDK 會報你看到的 ValidationError
        }
    )

@app.route("/api/suggestions", methods=["POST"])
def api_suggestions():
    try:
        data = request.get_json(force=True) or {}
        ac_temp = data.get("ac_temp", 26)
        room_template = data.get("room_template", "custom")
        items = data.get("items", [])
        canvas_size = data.get("canvas_size", {})

        # 弧度 -> 角度（好讀）
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
你是台灣居家節能顧問。畫布大小：{canvas_size}（像素）。
根據下列資訊，用條列式給 3~5 點可執行建議：
- 空調設定溫度：{ac_temp}°C
- 房型：{room_template}
- 物件清單（位置/尺寸/角度）：{pretty_items}
限制：
- 建議要短句、務實、能立刻操作。
- 切合台灣夏季潮濕、午後西曬的情境。
- 若可省電，說明原因（簡短）。
"""
        app.logger.info("Gemini prompt len=%d", len(prompt))

        # 用 ThreadPool 做 25 秒逾時
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            fut = ex.submit(call_gemini_sync, prompt, "gemini-1.5-flash")
            try:
                resp = fut.result(timeout=25)
            except concurrent.futures.TimeoutError:
                return jsonify({"error": "Gemini 逾時（>25s）", "suggestions": [
                    "請稍後重試或簡化輸入內容。",
                    "可以先改用 gemini-1.5-flash（已使用）或減少 items。"
                ]}), 504

        # 取文字（不同版本 SDK 回傳結構可能略不同）
        text = (getattr(resp, "text", None) or "").strip()
        if not text:
            cand = getattr(resp, "candidates", None)
            if cand and len(cand) and hasattr(cand[0], "content"):
                parts = getattr(cand[0].content, "parts", [])
                text = " ".join([getattr(p, "text", "") for p in parts]).strip()

        if not text:
            return jsonify({"suggestions": ["（模型沒有返回內容）請稍後再試。"]}), 200

        lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
        return jsonify({"suggestions": lines[:6]})

    except Exception as e:
        app.logger.exception("Gemini API 發生錯誤")
        return jsonify({
            "error": str(e),
            "suggestions": [
                "服務暫時忙碌或金鑰/網路有問題，請稍後再試。",
                "若持續失敗，試試改用 REST 版本呼叫（我可以提供範例）。"
            ]
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
