# GitHub 發布指南

目前僅整理本機原始碼與首次提交，沒有建立遠端倉庫、push 或公開部署。

## 上傳前

1. 決定名稱（建議 2026-8-collection）及 Private／Public。
2. 人工確認 docs/sources/ 的摘要、數據與 PDF 可分享。Private 仍會上傳資料到第三方。
3. 確認整體授權，本專案未預設 MIT。
4. 執行 npm test、Windows 建置及啟動器測試。
5. 檢查 git status --short。EXE、暫存檔、環境設定和套件資料夾均應被忽略。

## 確認後才執行

在此倉庫根目錄，下列命令會建立私人倉庫並上傳：

```sh
gh repo create 2026-8-collection --private --source=. --remote=origin --push
```

若已有倉庫，先取得確切 URL，再設定 origin 並推送 main；不要覆蓋未知 remote 或 force push。

## EXE 下載與發布

推送後查看 Actions → Windows portable build。流程執行 Node 測試、建置與啟動器測試，上傳 axis09-windows-portable artifact。相同步驟已在本機驗證，尚未在 GitHub runner 執行。

下載 artifact 並解壓縮後，只需要 EXE 即可使用。SHA256SUMS 可供核對。若需長期公開下載網址，另行明確建立 Release 並附 EXE／雜湊；流程不會自行建立 Release 或 GitHub Pages。

使用 GitHub 官方 [checkout](https://github.com/actions/checkout)、[setup-node](https://github.com/actions/setup-node)、[upload-artifact](https://github.com/actions/upload-artifact)，工作流程僅授予 contents: read。

