# CoolSpace AI — Oasis\@Home  城市微綠洲室內節能優化系統

> **支援 SDGs 永續發展目標 · 以 AI 與開放資料減少居家能源浪費**

## 目錄

1. [專案簡介](#專案簡介)
2. [核心功能](#核心功能)
3. [技術架構](#技術架構)
4. [專案結構](#專案結構)
5. [快速開始](#快速開始)
6. [路線圖 & 延伸目標](#路線圖--延伸目標)
7. [貢獻指南](#貢獻指南)
8. [授權](#授權)
9. [致謝](#致謝)

---

## 專案簡介

《**CoolSpace AI — Oasis\@Home**》 旨在解決因 **室內家具與冷氣出風方向不當** 所造成的能源浪費與舒適度下降。

* 使用者透過 **智慧控制面板** 輸入冷氣設定溫度與房間情境。
* 後端 **Flask** 伺服器採用簡化熱負荷模型，估算可省電量。
* 系統回傳 **AI 優化建議**（家具微調、出風角度、濾網清潔週期…）。
* 若使用者同意，可 **匿名上傳資料**，匯聚成「城市建築內部微氣候資料庫」。

> 🎯 **MVP 範圍**：僅用 *純 HTML/CSS* + *Flask*；不含拍照、IoT 感測器，以最快速度展示價值。

---

## 核心功能

| 模組       | MVP 內容                        | 後續擴充                         |
| -------- | ----------------------------- | ---------------------------- |
| 智慧控制面板   | Range Slider 設定溫度、Select 房間模式 | 即時感測器數據、自動抓氣象 API            |
| 即時空間熱象模擬 | 以 Canvas 生成簡化示意圖              | YOLOv8 物件偵測、CFD‑GNN 加速氣流預測   |
| AI 節能建議  | Rule‑based + Heuristic 文字建議   | GPT‑4o 自然語言優化、多語系支援          |
| 匿名資料貢獻   | JSON 寫入 SQLite                | Postgres / Supabase、公民科學 API |

---

## 技術架構

```mermaid
flowchart TD
    subgraph Frontend
        A[HTML / CSS / JS]<br/>index.html
    end
    subgraph Backend (Flask)
        B[/app.py/]
        C[(SQLite)]
    end
    A -- POST /analyze --> B
    B -- render_template --> A
    B -- write JSON --> C
```

> **易部署**：僅需 Python ≥3.9。未來可透過 Docker + Gunicorn 推上 GCP Cloud Run / Render。

---

## 專案結構

```
coolspace/
│
├─ app.py                # Flask 入口
├─ requirements.txt      # 相依套件
│
├─ templates/            # Jinja2 樣板
│   ├─ index.html        # 首頁面板
│   └─ result.html       # 結果頁
│
├─ static/
│   └─ style.css         # 全站樣式
│
└─ docs/
    └─ mockup.png        # UI 示意圖（可替換）
```