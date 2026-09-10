# 2026_8月合輯 — AXIS-09 完整版證據索引

本頁資料於 2026-09-10 從目前工作區的原始專案核對。來源文件是當日唯讀快照；其中原專案相對路徑需回到原專案使用。網頁的 3D 核心、模組造型、波形與需求曲線是原創能力示意，並非實際硬體或量測影像。

## 九個作品

| 作品 | 流程 | 來源與適用範圍 |
|---|---|---|
| Surface AOI Inspector | 影像 → ONNX → 規則融合 → 人工複核 | [桌面整合報告](sources/aoi-integration.md)：KSDD2 1,004 張官方測試影像，97.11% 準確率，84.55% 瑕疵召回。量產需重新校正。 |
| RTSafe Sensor Hub | 感測 → 狀態機 → 安全輸出 → 遙測 | [原始說明](sources/safe.md)：1 ms / 1 kHz 設計週期；主機測試不等於目標板實時驗證。 |
| Retail Data Hub | 來源 → 契約 → 品質閘門 → 血緣 | [原始說明](sources/data.md)：合輯八來源為展示資料，未連接公司主資料。 |
| KnowledgeOps Studio | 版本 → 題集 → 退步檢查 → 治理 | [原始說明](sources/knowledge.md)：合輯提供 24 題確定性治理情境與追加學習案例，非外部模型實測。 |
| OpsFlow Agent | 問題 → 檢索引用 → 政策 → 回答或接手 | [原始說明](sources/rag.md)：合成文件與回答，未命中拒答，支援人工分流。 |
| Demand Planning Workbench | 歷史 → 回測 → 預測區間 → 產能決策 | [原始說明](sources/planning.md)：14 日窗口。本頁需求指數 100／128／86 是基準／促銷／停機復原敘事用合成數值，不是新實測。 |
| OpenFund Risk Workbench | 資料 → 因子 → 風險 → 壓力比較 | [原始說明](sources/risk.md)：工程展示，不提供即時行情或投資建議。 |
| SimOps Studio | 參數 → 負載 → 模擬 → 餘裕 | [原始說明](sources/eda.md)：EDA 原型，非簽核級分析。 |
| ModelForge-TW | QLoRA → 量化 → 評測 → 登錄 | [評測](sources/forge-evaluation.md)、[證據](sources/forge-evidence.md)、[外部校準](sources/forge-external.md)：本機真實推論，原創與第三方合成資料。 |

AOI 的 9.85 ms 是另一份 AI v1 ONNX 本機 CPU 純推論中位數，不與桌面整合 97.11% 的報告合併成同一測量。本網頁主指標選用桌面整合準確率與其測試影像數。

## ModelForge 三模型完整比較

正式集為 210 test + 14 curated challenge = 224 筆。報告保留 policy-v2、release-metrics-v2 與 192-token 契約，不拿新版診斷回填歷史數據。

| 指標 | QLoRA v5 / NF4 | merged v5 / Q8_0 | merged v5 / Q4_K_M |
|---|---:|---:|---:|
| Event macro-F1 | 86.24% | 85.16% | 74.43% |
| Severity macro-F1 | 95.35% | 85.34% | 91.04% |
| 平均延遲 | 8.333 s | 1.060 s | 0.825 s |
| Raw JSON schema | 99.55% | 100.00% | 100.00% |
| 高風險人工複核召回 | 100% | 100% | 100% |
| GGUF 檔案大小 | 不適用 | 1,834,426,144 bytes | 1,107,408,672 bytes |
| Registry | released | retired / previous-good | blocked |

F16 GGUF 的 3,447,349,024 bytes 是量化來源，不能當成 NF4 路徑的檔案大小。網頁 GB 使用十進位 10⁹ bytes。

NF4 使用 prompt-schema + bounded repair；Q8／Q4 使用 llama.cpp strict JSON Schema。NF4→Q8 只作跨引擎描述性比較。Q8→Q4 的七項契約相容檢查全過，才能判定 Event F1 退化 10.73 個百分點，超過 1.5 點相對上限；Q4 也未達 Event F1 85% 絕對门檻。

## 十二個證據點

1. 影像證據：官方測試集、桌面整合、量產校正邊界。
2. 安全週期：1 ms 控制設計、主機與硬體驗證的界線。
3. 資料契約：來源、驗證規則、標準化输出與血緣。
4. 引用與拒答：白名單、未命中處理與人工分流。
5. 預測區間：基準、促銷、停機復原三種合成情境。
6. 設計餘裕：負載、電壓、溫度與原型限制。
7. 訓練：QLoRA v5，1,467.509 秒；revision、資料與 adapter 指紋見證據索引。
8. 量化：F16／Q8／Q4 bytes、SHA-256 與 llama.cpp 工具血緣。
9. 發布：品質與安全絕對門檻、Q4 相對退步門檻。
10. 外部校準：v5 首次 holdout 98/98 系統通過，但內部 Event F1 69.72%，16.33% holdout 需安全層介入，不發布。
11. 模型登錄：NF4 released、Q8 retired / previous-good、Q4 blocked；歷史登錄不冒充新版前向封鏈。
12. 合輯邊界：實測、合成情境、原型與未部署項目分開。

## 閱讀與操作

- [完整滾動展示](../showcase.html)
- [既有八模組工作台](../index.html)
- [既有八模組作品手冊](../output/pdf/2026_8月合輯_作品手冊.pdf)
- [AXIS-09 GLB](../assets/axis-09.glb)

本展示頁是九模組完整版；原工作台、PWA 與 PDF 保留八模組版本。新增 ModelForge 已在本頁提供三模型切換、量化與發布證據，不假稱曾整合到舊版工作台或手冊。
