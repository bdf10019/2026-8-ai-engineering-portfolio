# GitHub 發布指南｜GitHub Publishing Guide

公開原始碼倉庫：<https://github.com/bdf10019/2026-8-ai-engineering-portfolio>

`main` 是目前公開分支。GitHub Actions 會在 push、pull request 或手動觸發時執行測試及 Windows 可攜版建置；本專案目前未啟用 GitHub Pages，也不會自動建立 Release。

## 上傳前

1. 確認目標倉庫與遠端 URL，避免推送到錯誤擁有者。
2. 人工確認 `docs/sources/` 的摘要、數據與 PDF 可分享；推送代表資料會上傳至 GitHub。
3. 確認整體授權；本專案目前沒有套用 MIT 或其他倉庫級開源授權。
4. 執行 npm test、Windows 建置及啟動器測試。
5. 檢查 git status --short。EXE、暫存檔、環境設定和套件資料夾均應被忽略。

## 更新公開倉庫

在此倉庫根目錄確認變更、提交並推送：

```sh
git status --short
npm test
git push origin main
```

不要覆蓋未知 remote 或使用 force push。若要變更可見性、增加授權或建立長期 Release，應先確認準確範圍與公開內容。

## EXE 下載與發布

推送後查看 Actions → Windows portable build。流程執行 Node 測試、建置與啟動器測試，上傳 axis09-windows-portable artifact。相同步驟已在本機驗證，尚未在 GitHub runner 執行。

下載 artifact 並解壓縮後，只需要 EXE 即可使用。SHA256SUMS 可供核對。若需長期公開下載網址，另行明確建立 Release 並附 EXE／雜湊；流程不會自行建立 Release 或 GitHub Pages。

使用 GitHub 官方 [checkout](https://github.com/actions/checkout)、[setup-node](https://github.com/actions/setup-node)、[upload-artifact](https://github.com/actions/upload-artifact)，工作流程僅授予 contents: read。

