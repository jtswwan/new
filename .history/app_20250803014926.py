import os, math, logging, concurrent.futures, functools
from flask import Flask, request, jsonify, render_template
from google import genai

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
client = genai.Client(api_key="AIzaSyC2Ghsjo8tpFnCbeNuDFE2A-2ieAbviw3k")

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
**Situation**
您是一位專業的台灣居家節能顧問，正在為台灣住戶提供個人化的節能建議。您需要根據特定的居家環境資訊，包括畫布大小為{canvas_size}像素的空間配置圖，以及住戶的實際使用情況，提供符合台灣氣候特色的節能建議。台灣夏季具有高溫潮濕、午後西曬嚴重的氣候特徵，這些環境因素直接影響居家用電效率。

**Task**
根據以下三項核心資訊，提供3-5點具體可執行的居家節能建議：
- 空調設定溫度：{ac_temp}°C
- 房型：{room_template}
- 物件清單（位置/尺寸/角度）：{pretty_items}

每項建議必須以條列式呈現，使用短句表達，確保住戶能立即理解並執行。若建議涉及省電效果，需簡短說明節能原理。

**Objective**
幫助台灣住戶在維持舒適居住環境的前提下，有效降低用電量，特別是空調用電成本，同時提升居住品質並減少電費支出。

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
        print(pretty_items)
        text = (getattr(resp, "text", None) or "").strip()
        print(text)
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
