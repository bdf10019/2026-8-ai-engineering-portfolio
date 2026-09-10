# 2026_8月合輯 · AXIS-09 滾動互動完整版

交付日期：2026-09-10（Asia/Taipei）

## 使用

於合輯資料夾執行 `node server.mjs`，瀏覽 `http://127.0.0.1:4173/`。

- `showcase.html`：八段完整滾動敘事、九模組互動展示。
- `storyboard.html`：八段實際桌面畫面、九個模組主圖與流程圖、手機畫面。
- `index.html`：既有八模組工作台，保持原始 v5.0.0 核心檔案與發布指紋。
- `docs/showcase-evidence.md`：九模組來源索引與三模型完整文字比較；無 JavaScript 也可閱讀。

## 本次完成

1. 八段敘事：遭遇、問題、感知、理解、決策、模型工程、證據、交付。
2. 原創 AXIS-09 程序化 3D 模型：中央核心與九個具名模組，隨滾動改變觀察角度、間距與選取狀態；精細鼠標提供小幅視角偏移。
3. 兩種感知模式、三層資料／知識流程、三種合成決策情境、NF4／Q8／Q4 三模型比較。
4. 十二個證據入口與九個作品面板：来源快照、測量條件、限制、原創模組主圖與流程視覺。
5. 窄視窗／手機保留上方固定 3D 展示區，滾動控制姿態與模組；八張靜態關鍵畫面用於減少動態或 WebGL 失敗。切換支援點按、鍵盤和可返回焦點的原生對話框。實際 418px 修正驗證見 `SCROLL-HOTFIX.md`。
6. 系統與手動減少動態，無 JavaScript／無 WebGL 的閱讀替代方案。
7. 可下載的 GLB、三模型比較 SVG、九張模組 PNG、九張流程 SVG、八張場景 PNG。

## 已驗證

19 組瀏覽器驗證已通過，結果見 `output/showcase-qa/results.json`。使用本機無頭 Microsoft Edge；桌面 1440×900、筆電 1366×768、手機模擬 390×844 與 844×390。

- 全部八段桌面主要文案與控制項皆在 viewport 內，無導覽列重疊。
- 感知、流程、情境與三模型切換同步更新內容；方向鍵可操作頁籤。
- 12 個證據面板與 9 個作品面板均有內容，Escape 關閉，焦點回到觸發控制項。
- 3D 模組熱點可開啟對應作品；滾動改變場景，上滾回到第一章。
- 手機無橫向溢出，支援點按與方向變化。
- 系統／手動減少動態，無 JavaScript、無 WebGL 模式均驗證。
- GLB 包含 decision-core 與九個具名模組；手冊、來源與模型下載均可取得。
- 桌面無 JavaScript 執行錯誤或 console error。

既有工作台的 22 項 Node 測試全部通過，包括原始六個核心檔案的 SHA-256 快照；未重新簽署舊版成果。

以上為模擬視窗與本機瀏覽器測試，尚未用實體手機或生產流量測量。互動網頁已於本機交付，未公開部署。

## 視覺、來源與授權

- 遵循本專案 `scroll-effect-website`：同一主體連接章節、原生可逆滾動、明暗節奏、狀態切換同時更新主體和證據。
- 原參考觀察記錄見 `C:/chatgpt_work/skill/scroll-effect-website/references/aevion-pattern-language.md`；只借用互動語法，未使用 Riotters／Aevion 品牌、圖片、模型或文案。
- 初始 AXIS-09 ImageGen 概念圖保留於 `assets/axis-09-concept-v1.png`。實作模型與靜態圖是程式建立的幾何視覺抽象，不宣稱等同原概念圖的高精細工業建模。
- Three.js 固定為 0.180.0，本地載入，MIT 授權保留於 `assets/vendor/THREE-LICENSE.txt`。GLTFExporter 唯一套件修改是將裸模組 import 改成本地 vendor 路徑。
- 字體使用裝置提供的 Arial／Microsoft JhengHei／PingFang TC 與 Cascadia Code／Consolas 系統回退；不散布商業字體檔。
- API 參考：[WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)、[GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)。

## 修改與重製

- `showcase-data.js`：九作品、來源、模型與情境的單一內容狀態。
- `showcase.js`：原生滾動协调、頁籤、熱點、面板與動態偏好。
- `axis-model.js`：可重用幾何與八段相機／模組姿態。
- `axis-renderer.js`：燈光、鏡頭、陰影與 WebGL 失敗回退。
- `showcase.css`：配色、排版、手機重排與減少動態。
- `node tools/export-axis.mjs`：輸出 GLB。
- `node tools/render-axis-assets.cjs`、`node tools/render-project-assets.cjs`：以同一 3D 模型輸出場景與模組圖片。
- `node tools/verify-showcase.cjs`：瀏覽器互動驗證與桌面／手機截圖。
- `node --test tests/*.test.mjs`：原工作台回歸測試。

瀏覽器工具腳本使用專案可解析的 Playwright 套件與 Microsoft Edge；安裝方式見根目錄 README。單檔 EXE 展示不需 Node 或 Playwright，也不需外部字體、API、模型權重。

## 保留的版本界線

本次完整範圍是九模組滾動互動網站。原工作台與原 PDF 為八模組版本，本頁清楚標示；ModelForge 在新頁提供獨立完整互動與證據。沒有把未發生的九模組後端整合、目標硬體驗證、真實資料接入或公開部署標示為完成。
