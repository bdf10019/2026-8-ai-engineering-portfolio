# 2026_8月合輯 · AXIS-09

九個專案模組、一個可互動的 3D 主體、八段可逆滾動敘事。支援窄視窗、鼠標互動、情境切換與證據面板。

![AXIS-09](assets/scenes/axis-scene-01.png)

## Windows：雙擊即開

使用建置產物 `2026_8月合輯.exe`，雙擊自動開啟預設瀏覽器。**不需 Node.js、不必解壓素材、不需連網載入模型。** 結束時使用右下角 AXIS-09 圖示 →「結束 AXIS-09」。

需要 Windows 10／11、.NET Framework 4.x 與現代瀏覽器。3D 動画需 WebGL 2；減少動態開啟時顯示靜態版本。EXE 尚未簽章，不放進 Git 歷史。詳見 [桌面版說明](desktop/README.md)。

## 開發預覽

安裝 Node.js 22+，在原始碼資料夾執行 `npm start`，開啟 http://127.0.0.1:4173/ 。網站執行不需安裝 npm 套件。也可使用 Start-Showcase.cmd（需要 PATH 中已有 Node.js）。

- showcase.html：九模組滾動展示。
- storyboard.html：分鏡、模組素材與歷史驗證畫面。
- index.html：保留原有八模組工作台 v5.0.0。
- docs/showcase-evidence.md：來源、限制與模型比較。
- output/pdf/：既有八模組手冊，不是九模組新版測試報告。

## 測試與 Windows 建置

建置使用 PowerShell 7（pwsh），並遵循電腦既有的指令碼執行原則；EXE 使用者不需 PowerShell。

```powershell
npm test
pwsh -File tools/build-windows.ps1
pwsh -File tools/test-windows.ps1
```

產物位於 dist：EXE、SHA256SUMS.txt、launcher-test-results.json。測試前先從系統匣結束正在使用的 AXIS-09。

22 項 Node 回歸測試檢查原工作台與核心指紋；20 項 Windows 檢查涵蓋單檔資源、HTTP、重複啟動與連接埠衝突。歷史瀏覽器驗證及窄視窗修正見 [版本記錄](docs/SCROLL-EDITION.md)、[滾動修正](docs/SCROLL-HOTFIX.md)。HTTP 測試不能替代視覺驗證。

選用的素材重製／瀏覽器驗證工具需要 `npm install --no-save playwright@1.62.1`、Microsoft Edge 及執行中的開發伺服器；並非使用網站或建置 EXE 的必要依賴。手冊重製另需 Python、reportlab 及 Windows 微軟正黑體。

## 客製化

| 檔案 | 負責內容 |
| --- | --- |
| showcase-data.js | 作品、來源、模型與情境 |
| showcase.js / showcase.css | 滾動、面板、鼠標、排版、動態偏好 |
| axis-model.js / axis-renderer.js | 3D 幾何、姿態、相機與降級 |
| desktop/Launcher.cs | 單檔啟動器、唯讀本機 HTTP |
| tools/build-windows.ps1 | 內嵌資源清單及编譯 |

本作品展示合成情境與已有來源，不等同部署完整 LLM 訓練平台，不含模型權重、GPU 推論服務或雲端帳號憑證。

## GitHub

已附 Windows 自動建置流程：測試後產出 Actions artifact，不會自動公開網站或建立 Release。見 [發布指南](docs/GITHUB-PUBLISH.md)。

整體開源授權尚未指定，未擅自套用 MIT。Three.js 授權保留於 [第三方通知](THIRD-PARTY-NOTICES.md)。公開前需由擁有者確認來源快照與內容可公開。
