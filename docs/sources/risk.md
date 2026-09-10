# OpenFund Risk Workbench

OpenFund Risk Workbench 是一套可在本機執行的基金持倉風險與異常監控工作台。它將
公開申報資料的驗證、特徵工程、時序驗證、ML／DL 比較、風險排序、資料漂移與
可追溯報告整合為一條可重現的流程。

> 定位：研究優先順序與風險決策支援，不是交易系統，不提供買賣建議，不保證報酬。

## 使用情境

投資研究或風險團隊需要從多期基金申報中，找出持倉過度集中、曝險異常、資料品質
不足，或下一期可能進入同類高下行風險的基金。系統先用可解釋基準建立底線，
再比較傳統 ML 與 CPU 可執行的多層神經網路 challenger，只在時序驗證通過品質門檻
時選出 champion。

## 輸入與輸出

| 項目 | 定義 |
|---|---|
| 基金輸入 | `fund_quarters.csv`；一列一檔基金／季度 |
| 持倉輸入 | `holdings.csv`；一列一檔基金／季度／發行人持倉 |
| 公開資料 | 可選 SEC Form N-PORT 扁平檔案；原始壓縮檔不納入 Git |
| 核心處理 | 品質驗證 → 修訂去重 → 特徵 → 未來標籤 → walk-forward → champion |
| 輸出 | CSV／JSON／HTML 報告、模型檔、SHA-256 manifest、SQLite 稽核記錄 |

## 已完成能力

- 可重現的原創合成基金／持倉資料，不需帳號、API key 或付費資料即可完整展示。
- 嚴格的欄位、型別、範圍及關聯驗證；較新申報修訂版取代舊版。
- SEC Form N-PORT 扁平表格轉接器，欄位版本不符時會明確失敗。
- 基金／季度特徵：集中度、前十大持倉、發行人數、資產配置、幣別／國家曝險、
  波動、下行風險、持倉變動及資料品質差距。
- 標籤只使用下一季資訊，並用 expanding-window walk-forward 評估避免隨機切分洩漏。
- 透明規則基準、Logistic Regression、HistGradientBoosting 及雙隱藏層 MLP 神經網路。
- PR-AUC、ROC-AUC、Brier score、Top-K 涵蓋率及 champion／challenger 品質門檻。
- Isolation Forest 異常百分位、透明風險旗標與 PSI 特徵漂移。
- CLI、FastAPI、SQLite 稽核庫、React／TypeScript 儀表板、CSV／JSON／HTML 報告與
  SHA-256 manifest。
- 14 項後端測試、前端互動測試、嚴格型別檢查、正式建置與隱私掃描。

## 快速開始（Windows PowerShell）

需求：Python 3.11 以上、Node.js 及 pnpm。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"

Set-Location frontend
pnpm install --frozen-lockfile
pnpm build
Set-Location ..
```

執行完整離線 Demo：

```powershell
.\scripts\run-demo.ps1
```

Demo 會在 `data/processed/synthetic-demo/` 建立資料，並將每次不可變的執行產出寫入
`outputs/runs/<run-id>/`：

```text
scores.csv       研究優先順序
drift.csv        特徵 PSI 漂移
quality.json     資料品質與排除原因
model-card.json  各模型的 walk-forward 證據
report.html      可離線開啟的研究報告
manifest.json    所有報告產出的 SHA-256
```

啟動 API 與已建置的儀表板：

```powershell
.\.venv\Scripts\python.exe -m openfund_workbench serve --workspace .
```

瀏覽 `http://127.0.0.1:8000`；API 文件位於 `http://127.0.0.1:8000/docs`。

## 使用真實公開資料

SEC 要求自動下載器識別應用與聯絡方式。實際資訊只放在當前 shell 或未追蹤的 `.env`，
不要寫入 Git：

```powershell
$env:SEC_USER_AGENT = "MyResearchTool/1.0 contact@example.com"
.\scripts\Get-NportDataset.ps1 -Quarter 2025Q1

.\.venv\Scripts\python.exe -m openfund_workbench normalize-nport `
  --source data/raw/2025q1 `
  --destination data/processed/2025q1
```

多季正規化資料整併後，可執行：

```powershell
.\.venv\Scripts\python.exe -m openfund_workbench run `
  --fund-file data/processed/fund_quarters.csv `
  --holding-file data/processed/holdings.csv `
  --workspace .
```

## 驗證

```powershell
.\scripts\verify.ps1
```

完整驗證包含依賴一致性、Python 編譯、Ruff、mypy、pytest 與覆蓋率、前端安裝、
TypeScript、Vitest、Vite production build、runtime doctor 及 Git 追蹤檔隱私掃描。

## 專案結構

```text
src/openfund_workbench  資料、特徵、模型、監控、稽核、API
frontend                React / TypeScript 唯讀儀表板
tests                   單元、整合、API 與端到端測試
scripts                 Demo、驗證、隱私掃描、公開資料下載
tools                   信任的本機模型中繼資料檢視工具
docs                    架構、資料、模型治理、Demo 與限制
data/raw                不追蹤原始資料
data/processed          不追蹤特徵與正規化資料
models/local            不追蹤模型產出
outputs                 不追蹤報告與 SQLite
```

## 安全與公開邊界

- 只追蹤原創程式碼、合成測試資料與小型報告。
- `.env`、原始申報、處理後大型資料、SQLite、模型及執行產出均由 Git 排除。
- 下載器的聯絡資訊只從環境變數取得，不寫入程式碼或記錄。
- API 預設僅綁定 loopback，不含身分驗證，不應直接對外網開放。

詳細架構、資料來源、模型治理、Demo 與限制分別見 `docs/ARCHITECTURE.md`、
`docs/DATASET.md`、`docs/MODEL_GOVERNANCE.md`、`docs/DEMO.md` 與 `docs/LIMITATIONS.md`。
