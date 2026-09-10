from __future__ import annotations

import math
from pathlib import Path

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "output" / "pdf" / "2026_8月合輯_作品手冊.pdf"
HERO = PROJECT / "assets" / "deck-industrial-hero-v1.png"
FONT_REGULAR = Path(r"C:\Windows\Fonts\msjh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msjhbd.ttc")

PAGE_W, PAGE_H = A4
M = 42

INK = HexColor("#101216")
BLACK = HexColor("#080B0F")
PAPER = HexColor("#FFFFFF")
GRAY = HexColor("#616975")
GRAY2 = HexColor("#8A919B")
PALE = HexColor("#EDEDED")
PALE_BLUE = HexColor("#EAF6FC")
LINE = HexColor("#B8BCC4")
BLUE = HexColor("#3D8DFF")
CYAN = HexColor("#6DCBF4")
CYAN_DARK = HexColor("#1182B7")
AMBER = HexColor("#F2A64A")
GREEN = HexColor("#34A875")
RED = HexColor("#D85656")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("MSJH", str(FONT_REGULAR), subfontIndex=0))
    pdfmetrics.registerFont(TTFont("MSJH-Bold", str(FONT_BOLD), subfontIndex=0))


def paragraph(c: canvas.Canvas, text: str, x: float, y_top: float, width: float,
              size: float = 10, leading: float | None = None, color=INK,
              bold: bool = False, align=TA_LEFT, max_height: float = 1000) -> float:
    style = ParagraphStyle(
        name="p",
        fontName="MSJH-Bold" if bold else "MSJH",
        fontSize=size,
        leading=leading or size * 1.48,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        splitLongWords=True,
    )
    p = Paragraph(text, style)
    _, h = p.wrap(width, max_height)
    p.drawOn(c, x, y_top - h)
    return h


def label(c: canvas.Canvas, text: str, x: float, y: float, size: float = 7.5,
          color=BLUE, bold: bool = True, tracking: float = 0.9) -> None:
    c.setFillColor(color)
    c.setFont("MSJH-Bold" if bold else "MSJH", size)
    c.drawString(x, y, text)


def title(c: canvas.Canvas, kicker: str, headline: str, page_no: int, subtitle: str = "") -> float:
    label(c, kicker, M, PAGE_H - 44, 7.6, BLUE, True, 0.5)
    paragraph(c, headline, M, PAGE_H - 69, PAGE_W - 2 * M - 26, 23, 30, INK, True)
    c.setFillColor(GRAY2)
    c.setFont("MSJH-Bold", 7.5)
    c.drawRightString(PAGE_W - M, PAGE_H - 44, f"{page_no:02d}")
    y = PAGE_H - 121
    if subtitle:
        h = paragraph(c, subtitle, M, y, PAGE_W - 2 * M, 9.5, 14.5, GRAY)
        y -= h + 14
    c.setStrokeColor(PALE)
    c.setLineWidth(0.8)
    c.line(M, y, PAGE_W - M, y)
    return y - 20


def footer(c: canvas.Canvas, page_no: int, source: str) -> None:
    c.setFillColor(GRAY2)
    c.setFont("MSJH", 6.5)
    c.drawString(M, 23, "2026_8月合輯  -  AUGUST SYSTEMS COLLECTION  -  v5.0.0")
    c.drawRightString(PAGE_W - M, 23, f"{page_no} / 12")
    c.setFont("MSJH", 5.7)
    c.drawString(M, 34, f"SOURCE  {source}")


def metric(c: canvas.Canvas, x: float, y_top: float, width: float, value: str,
           description: str, accent=BLUE, dark: bool = False) -> None:
    c.setFillColor(accent)
    c.rect(x, y_top - 3, 28, 3, stroke=0, fill=1)
    c.setFillColor(PAPER if dark else INK)
    c.setFont("MSJH-Bold", 25)
    c.drawString(x, y_top - 39, value)
    paragraph(c, description, x, y_top - 52, width, 8.5, 12.5,
              HexColor("#B8C0C8") if dark else GRAY)


def rounded(c: canvas.Canvas, x: float, y: float, w: float, h: float,
            fill=PAPER, stroke=LINE, radius: float = 8, line_width: float = 0.8) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(line_width)
    c.roundRect(x, y, w, h, radius, stroke=1 if stroke else 0, fill=1)


def draw_cover(c: canvas.Canvas) -> None:
    c.setFillColor(BLACK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.drawImage(ImageReader(str(HERO)), 0, PAGE_H - PAGE_W, PAGE_W, PAGE_W,
                preserveAspectRatio=True, mask="auto")
    c.setFillColor(Color(0.03, 0.04, 0.06, alpha=0.90))
    c.rect(0, 0, PAGE_W, 265, stroke=0, fill=1)
    c.setFillColor(BLACK)
    c.rect(0, 248, PAGE_W, 38, stroke=0, fill=1)
    label(c, "PORTFOLIO SYSTEM  -  AUGUST 2026", M, 226, 8, CYAN, True, 0.8)
    paragraph(c, "2026_8月合輯", M, 194, PAGE_W - 2 * M, 34, 40, PAPER, True)
    paragraph(c, "八種工程能力，一條可信決策鏈。", M, 139, PAGE_W - 2 * M, 18, 24, PAPER, True)
    paragraph(c, "把感測、品質、預測、知識、治理與發布證據，整合成可操作、可追溯、可持續學習的營運作品。",
              M, 101, PAGE_W - 2 * M, 10, 15, HexColor("#B8C0C8"))
    c.setStrokeColor(HexColor("#34404A"))
    c.line(M, 53, PAGE_W - M, 53)
    label(c, "8 MODULES  -  240 DECISIONS  -  22 TESTS  -  6 SHA-256", M, 36, 6.7, CYAN, True, 0.25)


def draw_thesis(c: canvas.Canvas) -> None:
    y = title(c, "01 / SYSTEM THESIS", "八個作品，解的是同一個營運問題", 2,
              "從感測到行動，每一步都必須能回答：依據是什麼、誰負責、邊界在哪裡。")
    paragraph(c, "合輯不是把功能排在同一個畫面，而是把八項能力放進同一條營運鏈。資料先成為證據，證據再成為決策，決策必須通過治理才能執行；最後以交班與復盤沉澱成下一次可重用的系統記憶。",
              M, y, PAGE_W - 2 * M, 11.5, 18, INK)
    chain_y = y - 112
    nodes = [("01", "觀測"), ("02", "理解"), ("03", "決策"), ("04", "治理"),
             ("05", "執行"), ("06", "交班"), ("07", "學習")]
    x0, step = M + 11, 72
    c.setStrokeColor(PALE)
    c.setLineWidth(2)
    c.line(x0 + 11, chain_y, x0 + 11 + step * 6, chain_y)
    for i, (num, zh) in enumerate(nodes):
        x = x0 + i * step
        c.setFillColor(BLUE if i in (0, 6) else PAPER)
        c.setStrokeColor(BLUE if i in (0, 6) else LINE)
        c.circle(x + 11, chain_y, 11, stroke=1, fill=1)
        c.setFillColor(PAPER if i in (0, 6) else INK)
        c.setFont("MSJH-Bold", 6.5)
        c.drawCentredString(x + 11, chain_y - 2.5, num)
        paragraph(c, zh, x - 8, chain_y - 24, 38, 8.5, 11, INK, True, TA_CENTER)
    c.setStrokeColor(PALE)
    c.line(M, chain_y - 70, PAGE_W - M, chain_y - 70)
    metric(c, M, chain_y - 100, 145, "11", "個關聯物件 - 同一 Trace 串起資料與行動", CYAN)
    metric(c, M + 175, chain_y - 100, 145, "100%", "成果能回到來源、版本或測試", BLUE)
    metric(c, M + 350, chain_y - 100, 145, "8", "項能力具 owner、狀態與邊界", GREEN)
    rounded(c, M, 112, PAGE_W - 2 * M, 104, PALE_BLUE, PALE_BLUE, 8)
    label(c, "核心方法", M + 16, 193, 7, CYAN_DARK, True, 0.2)
    paragraph(c, "可信營運智慧 = 證據 + 邊界 + 責任 + 學習", M + 16, 174,
              PAGE_W - 2 * M - 32, 15, 22, INK, True)
    paragraph(c, "作品價值不是展示更多頁面，而是讓每個結果可被重播、挑戰、批准、回滾與再次學習。",
              M + 16, 142, PAGE_W - 2 * M - 32, 9, 13.5, GRAY)
    footer(c, 2, "README.md; engine.js")


def draw_architecture(c: canvas.Canvas) -> None:
    y = title(c, "02 / ARCHITECTURE", "一條決策鏈，八個能力模組", 3,
              "共同物件、共同證據與共同責任，讓跨域技術不再是孤島。")
    cols = [
        ("PHYSICAL", "實體與品質", AMBER, ["RTSafe Sensor Hub", "Surface AOI Inspector", "SimOps Studio"]),
        ("INTELLIGENCE", "預測與風險", BLUE, ["Demand Planning", "OpenFund Risk"]),
        ("GOVERNANCE", "知識與治理", CYAN_DARK, ["KnowledgeOps Studio", "OpsFlow Agent"]),
        ("FOUNDATION", "資料與發布", GREEN, ["Retail Data Hub", "Release Evidence"]),
    ]
    w = (PAGE_W - 2 * M - 27) / 4
    top = y - 4
    for i, (en, zh, color, items) in enumerate(cols):
        x = M + i * (w + 9)
        rounded(c, x, top - 235, w, 235, PAPER, LINE, 7)
        c.setFillColor(color)
        c.rect(x, top - 4, w, 4, stroke=0, fill=1)
        label(c, en, x + 10, top - 26, 6, color, True, 0.25)
        paragraph(c, zh, x + 10, top - 42, w - 20, 11, 15, INK, True)
        item_y = top - 82
        for idx, item in enumerate(items):
            c.setFillColor(PALE)
            c.circle(x + 14, item_y - 1, 5.5, stroke=0, fill=1)
            c.setFillColor(color)
            c.setFont("MSJH-Bold", 5.5)
            c.drawCentredString(x + 14, item_y - 3, str(idx + 1))
            paragraph(c, item, x + 26, item_y + 7, w - 35, 7.2, 10, GRAY, False)
            item_y -= 38
    flow_top = top - 278
    label(c, "OPERATING CHAIN", M, flow_top, 7, BLUE, True, 0.5)
    stages = ["Observe", "Understand", "Decide", "Govern", "Execute", "Handoff", "Learn"]
    x = M
    widths = [68, 74, 63, 64, 63, 65, 55]
    for i, (stage, sw) in enumerate(zip(stages, widths)):
        c.setFillColor(BLACK if i in (0, 6) else PALE_BLUE)
        c.roundRect(x, flow_top - 57, sw, 35, 5, stroke=0, fill=1)
        c.setFillColor(PAPER if i in (0, 6) else INK)
        c.setFont("MSJH-Bold", 7)
        c.drawCentredString(x + sw / 2, flow_top - 43, stage)
        if i < len(stages) - 1:
            c.setStrokeColor(LINE)
            c.line(x + sw + 3, flow_top - 40, x + sw + 9, flow_top - 40)
        x += sw + 12
    rounded(c, M, 112, PAGE_W - 2 * M, 112, BLACK, BLACK, 8)
    label(c, "COMMON OBJECTS", M + 16, 197, 6.7, CYAN, True, 0.4)
    paragraph(c, "TRACE-0421  -  Plan B  -  POLICY-v8  -  MEMORY-0827-09  -  POST-0827-01",
              M + 16, 178, PAGE_W - 2 * M - 32, 10, 15, PAPER, True)
    paragraph(c, "事件、方案、政策、交班與復盤都使用可追溯識別碼；跨頁互動能回到同一筆營運上下文。",
              M + 16, 146, PAGE_W - 2 * M - 32, 8.3, 12.5, HexColor("#B8C0C8"))
    footer(c, 3, "engine.js - capabilityCatalog; README.md")


def draw_incident(c: canvas.Canvas) -> None:
    y = title(c, "03 / INCIDENT CASE", "24.7 秒異常，還原成五個可驗證節點", 4,
              "力量、安全狀態、AOI、SOP 與排程在同一時間軸重播。")
    metric(c, M, y, 125, "24.7s", "事件影響窗口", AMBER)
    metric(c, M + 165, y, 125, "05", "跨系統關聯訊號", CYAN)
    metric(c, M + 330, y, 125, "94%", "根因與證據信心", BLUE)
    timeline_y = y - 126
    points = [
        ("40.118", "力量升高", "28.4 -> 42.8 N", AMBER),
        ("40.121", "安全停機", "motor off - PWM 0%", RED),
        ("42.806", "AOI 分歧", "2 缺陷 - 1.84 mm²", CYAN),
        ("51.284", "SOP 核對", "2 份來源 - 94%", GREEN),
        ("04.882", "情境重算", "交期風險 +1.8%", BLUE),
    ]
    xs = [M + 16 + i * 112 for i in range(5)]
    c.setStrokeColor(LINE)
    c.setLineWidth(2)
    c.line(xs[0], timeline_y, xs[-1], timeline_y)
    for x, (tm, name, detail, color) in zip(xs, points):
        c.setFillColor(color)
        c.setStrokeColor(PAPER)
        c.setLineWidth(3)
        c.circle(x, timeline_y, 9, stroke=1, fill=1)
        paragraph(c, tm, x - 34, timeline_y + 37, 68, 7, 10, color, True, TA_CENTER)
        paragraph(c, name, x - 44, timeline_y - 23, 88, 8.5, 11.5, INK, True, TA_CENTER)
        paragraph(c, detail, x - 49, timeline_y - 49, 98, 6.7, 9.5, GRAY, False, TA_CENTER)
    rounded(c, M, 289, PAGE_W - 2 * M, 135, PALE_BLUE, PALE_BLUE, 8)
    label(c, "VERIFIABLE FINDING", M + 16, 398, 6.8, CYAN_DARK, True, 0.35)
    paragraph(c, "通訊連續性有效；安全狀態機在同一控制週期收斂；AOI 的規則與模型分歧被保留為人工複檢證據；Plan B 在風險、時間與待複檢數間取得平衡。",
              M + 16, 379, PAGE_W - 2 * M - 32, 11, 17, INK, True)
    rounded(c, M, 113, PAGE_W - 2 * M, 142, PAPER, LINE, 8)
    label(c, "WHY THIS MATTERS", M + 16, 232, 6.8, BLUE, True, 0.35)
    paragraph(c, "異常不是一張紅色通知，而是一個可以重播的決策物件。評審者能逐點查看資料、假設、引用與時間戳，並明確看見哪些結論是確定性規則、哪些仍需要人工判斷。",
              M + 16, 211, PAGE_W - 2 * M - 32, 10, 15.5, GRAY)
    footer(c, 4, "engine.js - incidentFrames; docs/DEMO-RUNBOOK.md")


def draw_force_chart(c: canvas.Canvas, x: float, y: float, w: float, h: float) -> None:
    values = [28.1, 28.4, 31.2, 42.8, 8.2, 2.1, 0]
    labels_ = ["-8", "-5", "-3", "0", "+3", "+6", "+9"]
    for t in range(0, 51, 10):
        py = y + (t / 50) * h
        c.setStrokeColor(PALE)
        c.setLineWidth(0.6)
        c.line(x, py, x + w, py)
        c.setFillColor(GRAY2)
        c.setFont("MSJH", 6)
        c.drawRightString(x - 5, py - 2, str(t))
    pts = []
    for i, value in enumerate(values):
        px = x + i * (w / (len(values) - 1))
        py = y + (value / 50) * h
        pts.append((px, py))
    c.setStrokeColor(AMBER)
    c.setLineWidth(2.2)
    for a, b in zip(pts, pts[1:]):
        c.line(a[0], a[1], b[0], b[1])
    for i, (px, py) in enumerate(pts):
        c.setFillColor(RED if i == 3 else AMBER)
        c.circle(px, py, 2.6 if i != 3 else 4.3, stroke=0, fill=1)
        c.setFillColor(GRAY2)
        c.setFont("MSJH", 5.6)
        c.drawCentredString(px, y - 12, labels_[i])


def draw_safety(c: canvas.Canvas) -> None:
    y = title(c, "04 / PHYSICAL LOOP", "系統先停下，再理解品質影響", 5,
              "安全收斂由確定性狀態機負責；AI 提供品質證據，而不是接管停機。")
    paragraph(c, "力量訊號重播 - N", M, y, 305, 9, 13, INK, True)
    draw_force_chart(c, M + 24, y - 188, 300, 145)
    c.setStrokeColor(PALE)
    c.line(379, y + 4, 379, y - 226)
    metric(c, 402, y, 140, "42.8 N", "3 ms 內力量突升", AMBER)
    metric(c, 402, y - 86, 140, "1 ms", "同一控制週期 SAFE_STOP", RED)
    metric(c, 402, y - 172, 140, "1.84 mm²", "AOI 缺陷 - 9.8 ms 推論", CYAN)
    rounded(c, M, 307, PAGE_W - 2 * M, 118, BLACK, BLACK, 8)
    label(c, "RESPONSIBILITY SPLIT", M + 16, 399, 6.8, CYAN, True, 0.35)
    paragraph(c, "RTSafe 對停機負責", M + 16, 379, 150, 11, 16, PAPER, True)
    paragraph(c, "確定性狀態機、心跳、CRC、序號與 PWM 上限。", M + 16, 351, 202, 8, 12, HexColor("#B8C0C8"))
    paragraph(c, "AOI 對品質證據負責", 309, 379, 190, 11, 16, PAPER, True)
    paragraph(c, "缺陷量測、模型信心、規則分歧與人工複檢路徑。", 309, 351, 210, 8, 12, HexColor("#B8C0C8"))
    rounded(c, M, 113, PAGE_W - 2 * M, 164, PALE_BLUE, PALE_BLUE, 8)
    label(c, "BOUNDARY", M + 16, 251, 6.8, CYAN_DARK, True, 0.35)
    paragraph(c, "展示不連接真實馬達或 PLC；硬體時限仍需在目標板驗證。AOI 量產前必須以實際鏡頭、工作距離、光源、配方與標定板重新校正。",
              M + 16, 230, PAGE_W - 2 * M - 32, 10, 15.5, INK, True)
    paragraph(c, "這些邊界不是缺點備註，而是作品如何避免把 demo 指標誤當成正式產線承諾。",
              M + 16, 174, PAGE_W - 2 * M - 32, 8.5, 13, GRAY)
    footer(c, 5, "engine.js - evaluateSafety, inspectPart, capabilityCatalog")


def draw_pareto(c: canvas.Canvas, x: float, y: float, w: float, h: float) -> None:
    points = [(6, 31), (10, 24), (14, 16), (18, 9), (28, 5), (46, 2)]
    for t in range(0, 36, 5):
        py = y + (t / 35) * h
        c.setStrokeColor(PALE)
        c.line(x, py, x + w, py)
        c.setFillColor(GRAY2)
        c.setFont("MSJH", 5.5)
        c.drawRightString(x - 4, py - 2, str(t))
    mapped = []
    for rx, risk in points:
        mapped.append((x + (rx / 50) * w, y + (risk / 35) * h))
    c.setStrokeColor(CYAN_DARK)
    c.setLineWidth(2)
    for a, b in zip(mapped, mapped[1:]):
        c.line(a[0], a[1], b[0], b[1])
    for i, (px, py) in enumerate(mapped):
        c.setFillColor(BLUE if i == 3 else CYAN_DARK)
        c.circle(px, py, 4.5 if i == 3 else 2.8, stroke=0, fill=1)
    c.setFillColor(GRAY2)
    c.setFont("MSJH", 5.8)
    c.drawCentredString(x + w / 2, y - 15, "復原時間 - 分鐘")


def draw_decision(c: canvas.Canvas) -> None:
    y = title(c, "05 / DECISION SPACE", "決策不是單點答案，而是 240 種取捨", 6,
              "Pareto 邊界讓安全、服務、速度與能源的代價保持可見。")
    paragraph(c, "復原時間 x 複發風險 - 前緣抽樣", M, y, 315, 9, 13, INK, True)
    draw_pareto(c, M + 25, y - 193, 295, 145)
    c.setStrokeColor(PALE)
    c.line(378, y + 4, 378, y - 230)
    metric(c, 401, y, 145, "240", "固定參數網格候選", BLUE)
    label(c, "目前建議", 401, y - 91, 7, CYAN_DARK, True, 0.15)
    paragraph(c, "Plan B", 401, y - 105, 150, 21, 27, INK, True)
    paragraph(c, "校正治具後降速復歸<br/>18 分鐘 - 低風險 - 12 件待複檢<br/>交期風險 +1.8%",
              401, y - 142, 145, 8.5, 13, GRAY)
    table_y = 306
    col_x = [M, 92, 298, 386, 466, PAGE_W - M]
    headers = ["方案", "策略", "時間", "風險", "待複檢"]
    c.setFillColor(BLACK)
    c.rect(M, table_y + 92, PAGE_W - 2 * M, 31, stroke=0, fill=1)
    for i, head in enumerate(headers):
        c.setFillColor(PAPER)
        c.setFont("MSJH-Bold", 7)
        c.drawString(col_x[i] + 7, table_y + 103, head)
    rows = [
        ("A", "立即全線復歸", "6 分", "HIGH", "2"),
        ("B", "校正治具後降速復歸", "18 分", "LOW", "12"),
        ("C", "隔離批次並全面複檢", "46 分", "VERY LOW", "46"),
    ]
    for r, row in enumerate(rows):
        yy = table_y + 61 - r * 31
        c.setFillColor(PALE_BLUE if r == 1 else PAPER)
        c.rect(M, yy, PAGE_W - 2 * M, 31, stroke=0, fill=1)
        c.setStrokeColor(PALE)
        c.line(M, yy, PAGE_W - M, yy)
        for i, value in enumerate(row):
            c.setFillColor(BLUE if r == 1 and i in (0, 3) else INK)
            c.setFont("MSJH-Bold" if r == 1 else "MSJH", 7.2)
            c.drawString(col_x[i] + 7, yy + 11, value)
    rounded(c, M, 113, PAGE_W - 2 * M, 110, PAPER, LINE, 8)
    label(c, "DECISION PRINCIPLE", M + 16, 199, 6.8, BLUE, True, 0.35)
    paragraph(c, "系統保留非支配方案，讓人明確選擇願意承擔的取捨。Plan B 的價值不是分數最高，而是理由可以被重現、批准與追問。",
              M + 16, 178, PAGE_W - 2 * M - 32, 10, 15, INK, True)
    footer(c, 6, "engine.js - optimizeRecovery, recoveryPlans; tests/engine.test.mjs")


def draw_governance(c: canvas.Canvas) -> None:
    y = title(c, "06 / AI GOVERNANCE", "AI 能做什麼，由政策和人一起決定", 7,
              "自主權逐級開放；角色批准、ACL、安全邊界與回滾條件不可繞過。")
    levels = [
        ("01", "觀測", "只能讀取", "Trace、設備、文件"),
        ("02", "建議", "提出選項", "方案與 SOP 引用"),
        ("03", "暫存", "準備動作", "草稿與待批准任務"),
        ("04", "執行", "受批准約束", "已核准且可回滾"),
    ]
    w = (PAGE_W - 2 * M - 27) / 4
    top = y
    for i, (num, name, mode, detail) in enumerate(levels):
        x = M + i * (w + 9)
        active = i == 2
        rounded(c, x, top - 177, w, 177, PALE_BLUE if active else PAPER, BLUE if active else LINE, 7, 1.4 if active else 0.8)
        label(c, num, x + 10, top - 22, 6.5, BLUE if active else GRAY2, True, 0)
        paragraph(c, name, x + 10, top - 42, w - 20, 14, 19, INK, True)
        paragraph(c, mode, x + 10, top - 78, w - 20, 8, 11, BLUE if active else GRAY, True)
        c.setStrokeColor(PALE)
        c.line(x + 10, top - 100, x + w - 10, top - 100)
        paragraph(c, detail, x + 10, top - 117, w - 20, 7.3, 10.5, GRAY)
    matrix_y = top - 209
    label(c, "POLICY MATRIX", M, matrix_y, 7, BLUE, True, 0.4)
    rows = [
        ("讀取 Trace / 文件", "OBSERVE", "允許", "依 ACL 過濾"),
        ("比較復原方案", "RECOMMEND", "允許", "必須顯示依據與代價"),
        ("建立待辦 / 草稿", "STAGE", "允許", "不直接改變外部狀態"),
        ("執行復原動作", "EXECUTE", "條件允許", "角色批准 + 影響範圍 + 回滾"),
    ]
    yy = matrix_y - 28
    for action, minimum, status, guard in rows:
        c.setStrokeColor(PALE)
        c.line(M, yy + 10, PAGE_W - M, yy + 10)
        paragraph(c, action, M, yy, 150, 7.6, 10.5, INK, True)
        paragraph(c, minimum, 201, yy, 80, 6.7, 9.5, CYAN_DARK, True)
        paragraph(c, status, 292, yy, 70, 7.2, 10, GREEN if status == "允許" else AMBER, True)
        paragraph(c, guard, 372, yy, 180, 7.2, 10.5, GRAY)
        yy -= 43
    rounded(c, M, 113, PAGE_W - 2 * M, 105, BLACK, BLACK, 8)
    label(c, "HUMAN GATE", M + 16, 193, 6.8, CYAN, True, 0.35)
    paragraph(c, "批准不是最後一道按鈕，而是決策責任的明確落點。", M + 16, 174,
              PAGE_W - 2 * M - 32, 13, 19, PAPER, True)
    paragraph(c, "角色身份 - 理由必填 - 影響範圍 - 可回滾 - Audit Trace",
              M + 16, 143, PAGE_W - 2 * M - 32, 8.3, 12, HexColor("#B8C0C8"))
    footer(c, 7, "engine.js - evaluateAutonomy; tests/engine.test.mjs")


def draw_learning(c: canvas.Canvas) -> None:
    y = title(c, "07 / LEARNING LOOP", "事故結束後，才開始累積系統記憶", 8,
              "事件從現場處置一路轉成交班、無責復盤、改善行動與黃金案例。")
    steps = [
        ("TRACE-0421", "事件完成", "24.7 秒證據鏈", BLUE),
        ("MEMORY-0827-09", "交班記憶", "未解風險與下一位負責人", BLUE),
        ("POST-0827-01", "無責復盤", "系統條件與決策脈絡", AMBER),
        ("AUGUST-GOLDEN-v4", "第 25 題", "規則進入評測閉環", GREEN),
    ]
    xs = [M + 22 + i * 149 for i in range(4)]
    line_y = y - 82
    c.setStrokeColor(PALE)
    c.setLineWidth(2)
    c.line(xs[0], line_y, xs[-1], line_y)
    for i, (id_, name, detail, color) in enumerate(steps):
        x = xs[i]
        c.setFillColor(color)
        c.circle(x, line_y, 13, stroke=0, fill=1)
        c.setFillColor(PAPER)
        c.setFont("MSJH-Bold", 8)
        c.drawCentredString(x, line_y - 3, str(i + 1))
        paragraph(c, id_, x - 53, line_y + 55, 106, 6, 8.5, color, True, TA_CENTER)
        paragraph(c, name, x - 56, line_y - 31, 112, 9.5, 13, INK, True, TA_CENTER)
        paragraph(c, detail, x - 65, line_y - 61, 130, 6.8, 9.5, GRAY, False, TA_CENTER)
    c.setStrokeColor(PALE)
    c.line(M, y - 180, PAGE_W - M, y - 180)
    metric(c, M, y - 205, 145, "3", "改善行動 - owner、期限與證據", AMBER)
    metric(c, M + 175, y - 205, 145, "25/25", "黃金案例通過 - 0 阻擋退步", GREEN)
    metric(c, M + 350, y - 205, 145, "1 -> N", "一次處置成為下一次能力", BLUE)
    rounded(c, M, 203, PAGE_W - 2 * M, 150, PALE_BLUE, PALE_BLUE, 8)
    label(c, "BLAMELESS POSTMORTEM", M + 16, 327, 6.8, CYAN_DARK, True, 0.35)
    paragraph(c, "復盤聚焦系統條件，而不是追究個人", M + 16, 306,
              PAGE_W - 2 * M - 32, 12, 18, INK, True)
    paragraph(c, "輸入包含事件影響、有效訊號、決策脈絡與未解風險；輸出是三個具 owner、期限、成功指標與證據連結的改善行動。人工確認後，學到的規則可進入黃金題集，成為下一次發布閘門的一部分。",
              M + 16, 274, PAGE_W - 2 * M - 32, 8.8, 13.5, GRAY)
    rounded(c, M, 112, PAGE_W - 2 * M, 70, PAPER, LINE, 8)
    paragraph(c, "方法參考 Google SRE 的無責事故復盤文化；本作品以合成事件展示流程，不代表正式企業事故紀錄。",
              M + 14, 157, PAGE_W - 2 * M - 28, 7.7, 11.5, GRAY)
    footer(c, 8, "engine.js - buildPostmortem; Google SRE postmortem culture")


def draw_catalog(c: canvas.Canvas) -> None:
    y = title(c, "08 / CAPABILITY CATALOG", "八項能力都有 owner、證據與邊界", 9,
              "目錄不是功能清單，而是責任地圖：誰維護、成熟到哪裡、能證明什麼、不能承諾什麼。")
    headers = ["能力", "Owner / 狀態", "證據", "邊界"]
    xcols = [M, 178, 331, 428, PAGE_W - M]
    c.setFillColor(BLACK)
    c.rect(M, y - 27, PAGE_W - 2 * M, 27, stroke=0, fill=1)
    for i, h in enumerate(headers):
        c.setFillColor(PAPER)
        c.setFont("MSJH-Bold", 6.7)
        c.drawString(xcols[i] + 6, y - 17, h)
    rows = [
        ("Surface AOI", "品質智慧 - PROVEN", "97.11% - 9.85 ms", "量產前重做光學校正"),
        ("RTSafe Sensor Hub", "邊緣安全 - PROVEN", "1 ms - 4/4 測試", "目標板時限待驗證"),
        ("Demand Planning", "營運規劃 - VALIDATED", "14 日區間 - 回測", "樣本非真實客戶需求"),
        ("KnowledgeOps", "AI 平台 - VALIDATED", "POLICY-v8 - 0 阻擋", "不宣稱正式 AI 認證"),
        ("SimOps Studio", "設計驗證 - PROTOTYPE", "可重現 PDN 情境", "不是簽核級 SI / PI"),
        ("OpenFund Risk", "風險工程 - PROTOTYPE", "VaR - 回撤 - 壓力", "不構成投資建議"),
        ("OpsFlow Agent", "知識營運 - VALIDATED", "引用白名單 - 四級自主", "不替代 SOP 或專業判斷"),
        ("Retail Data Hub", "資料平台 - PROVEN", "8 來源 - SHA-256", "未連接主資料與個資"),
    ]
    row_h = 48
    top = y - 27
    for r, row in enumerate(rows):
        yy = top - (r + 1) * row_h
        c.setFillColor(PALE_BLUE if r % 2 else PAPER)
        c.rect(M, yy, PAGE_W - 2 * M, row_h, stroke=0, fill=1)
        c.setStrokeColor(PALE)
        c.line(M, yy, PAGE_W - M, yy)
        for i, val in enumerate(row):
            color = CYAN_DARK if i == 1 else INK if i < 3 else GRAY
            paragraph(c, val, xcols[i] + 6, yy + row_h - 10, xcols[i + 1] - xcols[i] - 12,
                      6.8, 9.5, color, i in (0, 1))
    rounded(c, M, 112, PAGE_W - 2 * M, 82, PAPER, LINE, 8)
    paragraph(c, "目錄概念借鏡 Backstage 軟體目錄的所有權與責任觀念，但擴大到資料、模型、硬體與營運模組；不是企業正式 CMDB 或合規登錄。",
              M + 14, 168, PAGE_W - 2 * M - 28, 7.8, 11.5, GRAY)
    footer(c, 9, "engine.js - capabilityCatalog; Backstage Software Catalog")


def draw_release(c: canvas.Canvas) -> None:
    y = title(c, "09 / RELEASE EVIDENCE", "發布候選不是口號，而是一組可重算的證據", 10,
              "實際核心檔案指紋與五道閘門共同決定 v5.0.0 是否可發布。")
    metric(c, M, y, 130, "22/22", "確定性測試通過", GREEN)
    metric(c, M + 170, y, 130, "6", "核心檔案 SHA-256", BLUE)
    metric(c, M + 340, y, 130, "5/5", "發布閘門通過", CYAN)
    gate_y = y - 126
    gates = [("01", "IDENTITY", "代理身份"), ("02", "DATA", "合成資料邊界"),
             ("03", "TEST", "22 項測試"), ("04", "PROVENANCE", "內容指紋"), ("05", "OFFLINE", "PWA 殼層")]
    rounded(c, M, gate_y - 80, PAGE_W - 2 * M, 80, BLACK, BLACK, 7)
    gw = (PAGE_W - 2 * M) / 5
    for i, (num, name, desc) in enumerate(gates):
        x = M + i * gw
        if i:
            c.setStrokeColor(HexColor("#323941"))
            c.line(x, gate_y - 67, x, gate_y - 13)
        label(c, num, x + 9, gate_y - 20, 5.8, CYAN, True, 0)
        paragraph(c, name, x + 9, gate_y - 32, gw - 18, 6.4, 9, PAPER, True)
        paragraph(c, desc, x + 9, gate_y - 54, gw - 18, 6.2, 8.5, HexColor("#AAB2BB"))
    label(c, "ARTIFACT DIGESTS", M, gate_y - 113, 7, BLUE, True, 0.35)
    digests = [
        ("index.html", "b6917d966792...c32df67"),
        ("styles.css", "e97f4b86053e...f61930"),
        ("app.js", "60522c6c6868...c13432"),
        ("engine.js", "499c35c691c8...18d12b"),
        ("manifest.webmanifest", "a740328dfd53...b478a3"),
        ("sw.js", "080fd0f4574c...8d186"),
    ]
    yy = gate_y - 141
    for i, (name, digest) in enumerate(digests):
        x = M + (i % 2) * 255
        if i % 2 == 0 and i:
            yy -= 37
        rounded(c, x, yy - 22, 242, 28, PAPER, PALE, 4)
        c.setFillColor(INK)
        c.setFont("MSJH-Bold", 6.6)
        c.drawString(x + 8, yy - 10, name)
        c.setFillColor(GRAY)
        c.setFont("Courier", 5.9)
        c.drawRightString(x + 234, yy - 10, digest)
    rounded(c, M, 112, PAGE_W - 2 * M, 112, PALE_BLUE, PALE_BLUE, 8)
    label(c, "BOUNDARY", M + 16, 199, 6.8, CYAN_DARK, True, 0.35)
    paragraph(c, "這是受 SLSA 啟發的本機 provenance 視圖，不宣稱 SLSA 認證。",
              M + 16, 181, PAGE_W - 2 * M - 32, 10, 15, INK, True)
    paragraph(c, "目前沒有受信任 builder、簽章、遠端來源證明或企業合規流程；指紋的價值是讓本機版本可重新計算與比對。",
              M + 16, 150, PAGE_W - 2 * M - 32, 8.2, 12.5, GRAY)
    footer(c, 10, "docs/RELEASE-EVIDENCE.json; tests/assets.test.mjs; W3C; SLSA v1.2")


def draw_boundaries(c: canvas.Canvas) -> None:
    y = title(c, "10 / SCOPE & EVALUATION", "可信來自能證明，也來自不過度承諾", 11,
              "每項功能同時寫下驗證方式與刻意保留的範圍。")
    left_w = 244
    rounded(c, M, y - 270, left_w, 270, PALE_BLUE, PALE_BLUE, 8)
    label(c, "THIS WORK PROVES", M + 16, y - 26, 6.8, CYAN_DARK, True, 0.35)
    proves = [
        "跨訊號事件可在同一 Trace 重播",
        "安全狀態與 AI 品質判定責任分離",
        "240 個候選與 Pareto 取捨可重現",
        "AI 自主權受到政策與角色批准限制",
        "事件能沉澱為復盤、改善行動與黃金案例",
        "發布證據能從實際檔案重新計算",
    ]
    py = y - 58
    for item in proves:
        c.setFillColor(GREEN)
        c.circle(M + 18, py + 2, 2.5, stroke=0, fill=1)
        paragraph(c, item, M + 28, py + 9, left_w - 45, 8, 12, INK, True)
        py -= 34
    right_x = M + left_w + 18
    right_w = PAGE_W - M - right_x
    rounded(c, right_x, y - 270, right_w, 270, PAPER, LINE, 8)
    label(c, "THIS WORK DOES NOT CLAIM", right_x + 16, y - 26, 6.8, AMBER, True, 0.35)
    limits = [
        "真實工廠連線、PLC 控制或硬體即時認證",
        "量產 AOI 精度、正式校正或客戶資料代表性",
        "正式 AI 風險、資安、SLSA 或產業合規認證",
        "投資建議、實盤績效或企業正式風險模型",
        "雲端高可用、遠端身份提供者或企業 CMDB",
        "以 AI 取代現場 SOP、專業判斷或最終責任",
    ]
    py = y - 58
    for item in limits:
        c.setFillColor(AMBER)
        c.circle(right_x + 18, py + 2, 2.5, stroke=0, fill=1)
        paragraph(c, item, right_x + 28, py + 9, right_w - 45, 8, 12, INK)
        py -= 34
    label(c, "EVALUATION ROUTE", M, y - 306, 7, BLUE, True, 0.35)
    questions = [
        ("01", "可重播嗎？", "播放 TRACE-0421 並逐點回到資料與時間戳。"),
        ("02", "能解釋取捨嗎？", "切換 Pareto 點，說明風險、時間、服務與能源。"),
        ("03", "能限制 AI 嗎？", "降低自主權層級，確認未授權動作被政策阻擋。"),
        ("04", "能累積學習嗎？", "生成交班與復盤，收錄第 25 題黃金案例。"),
        ("05", "能證明版本嗎？", "在瀏覽器重算六個 SHA-256 並檢查五道閘門。"),
    ]
    qy = y - 338
    for num, question, answer in questions:
        c.setFillColor(PALE)
        c.circle(M + 10, qy + 3, 9, stroke=0, fill=1)
        c.setFillColor(BLUE)
        c.setFont("MSJH-Bold", 6)
        c.drawCentredString(M + 10, qy + 1, num)
        paragraph(c, question, M + 28, qy + 10, 112, 8.2, 11, INK, True)
        paragraph(c, answer, M + 146, qy + 10, PAGE_W - M - (M + 146), 7.5, 10.8, GRAY)
        qy -= 42
    c.setStrokeColor(PALE)
    c.line(M, 119, PAGE_W - M, 119)
    label(c, "EXTERNAL REFERENCES", M, 102, 6.3, BLUE, True, 0.2)
    paragraph(c,
              "sre.google/workbook/postmortem-culture  -  backstage.io/docs/software-catalog/generated-index  -  w3.org/TR/appmanifest  -  slsa.dev/spec/v1.2",
              M, 88, PAGE_W - 2 * M, 5.8, 8.5, GRAY)
    footer(c, 11, "docs/DEMO-RUNBOOK.md; docs/BENCHMARKS.md")


def draw_close(c: canvas.Canvas) -> None:
    c.setFillColor(BLACK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    label(c, "AUGUST SYSTEMS COLLECTION  -  2026", M, PAGE_H - 54, 8, CYAN, True, 0.8)
    paragraph(c, "一個作品，證明一套方法。", M, PAGE_H - 132, PAGE_W - 2 * M, 29, 37, PAPER, True)
    paragraph(c, "可信營運智慧<br/>= 證據 + 邊界 + 責任 + 學習", M, PAGE_H - 250,
              PAGE_W - 2 * M, 23, 31, PAPER, True)
    c.setFillColor(BLUE)
    c.rect(M, PAGE_H - 387, 76, 4, stroke=0, fill=1)
    paragraph(c, "從 42.8 N 的異常，到 240 個決策候選；<br/>從不可繞過的人類批准，到 22/22 測試與六個內容指紋；<br/>所有結果都能回到同一條 Trace。",
              M, PAGE_H - 420, PAGE_W - 2 * M, 12, 19, HexColor("#B8C0C8"))
    rounded(c, M, 154, PAGE_W - 2 * M, 160, HexColor("#0E141A"), HexColor("#26313C"), 9)
    label(c, "EXPLORE THE WORK", M + 18, 287, 6.8, CYAN, True, 0.4)
    paragraph(c, "互動作品", M + 18, 263, 110, 10, 14, PAPER, True)
    paragraph(c, "http://127.0.0.1:4173/", M + 136, 264, 250, 9, 13, CYAN, True)
    paragraph(c, "作品簡報", M + 18, 226, 110, 10, 14, PAPER, True)
    paragraph(c, "2026_8月合輯_作品簡報.pptx", M + 136, 227, 330, 9, 13, HexColor("#B8C0C8"))
    paragraph(c, "建議評審路徑", M + 18, 189, 110, 10, 14, PAPER, True)
    paragraph(c, "事件重播 -> Plan B -> AI 自主權 -> 黃金案例 -> 發布驗證", M + 136, 190, 350, 8.5, 12, HexColor("#B8C0C8"))
    c.setFillColor(GRAY2)
    c.setFont("MSJH", 6.5)
    c.drawString(M, 32, "2026_8月合輯  -  v5.0.0")
    c.drawRightString(PAGE_W - M, 32, "12 / 12")


def build() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("2026_8月合輯 - 作品手冊")
    c.setAuthor("2026_8月合輯")
    c.setSubject("可信營運智慧作品集：證據、邊界、責任與學習")
    pages = [
        draw_cover, draw_thesis, draw_architecture, draw_incident,
        draw_safety, draw_decision, draw_governance, draw_learning,
        draw_catalog, draw_release, draw_boundaries, draw_close,
    ]
    for page in pages:
        page(c)
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
