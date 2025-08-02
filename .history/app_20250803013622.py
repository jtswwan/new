# app.py
import os, math, logging
from flask import Flask, request, jsonify, render_template
from google import genai

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/suggestions", methods=["POST"])
def api_suggestions():
    try:
        data = request.get_json(force=True) or {}
        ac_temp = data.get("ac_temp", 26)
        room_template = data.get("room_template", "custom")
        items = data.get("items", [])
        canvas_size = data.get("canvas_size", {})

        # 把弧度轉角度，比較好閱讀
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
        app.logger.info("Gemini prompt:\n%s", prompt)

        # ✅ 用穩定可用的型號（flash 快速；要更精細可改 'gemini-1.5-pro'）
        model = "gemini-1.5-pro"

        # ✅ 不同版本 SDK 這裡參數名可能不同；這種寫法最兼容
        resp = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "temperature": 0.6,
                # 設置超時（秒）— 部分版本支援；不支援時仍由 try/except 保護
                "timeout": 30
            }
        )

        text = (getattr(resp, "text", None) or "").strip()
        if not text:
            # 某些回應在 resp.candidates 裡
            cand = getattr(resp, "candidates", None)
            if cand and len(cand) and hasattr(cand[0], "content"):
                parts = getattr(cand[0].content, "parts", [])
                text = " ".join([getattr(p, "text", "") for p in parts]).strip()

        if not text:
            return jsonify({"suggestions": ["（模型沒有返回內容）請稍後再試或降低輸入長度。"]}), 200

        lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
        return jsonify({"suggestions": lines[:6]})

    except Exception as e:
        app.logger.exception("Gemini API 發生錯誤")
        return jsonify({"error": str(e), "suggestions": [
            "服務暫時忙碌，請稍後重試。",
            "請確認 GOOGLE_API_KEY 是否正確且仍有效。",
            "若一直逾時，嘗試改用 gemini-1.5-flash 或縮短輸入內容。"
        ]}), 500

if __name__ == "__main__":
    # 本地開發模式
    app.run(host="127.0.0.1", port=5000, debug=True)
