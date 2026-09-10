# 單檔版交付驗證

日期：2026-09-10，Windows 本機。啟動器版本 1.1.0，原工作台版本 5.0.0。

- 乾淨來源資料夾執行 Node 回歸測試：22/22 通過。
- PowerShell 7 建置成功，86 個網站資源內嵌，EXE 14,831,616 bytes。
- 將 EXE 複製到只有 EXE、含中文及空格的資料夾：20/20 啟動器檢查通過。
- 測試涵蓋內嵌資源、GLB Range、HEAD、404、Host／路徑防護、唯讀方法、重複啟動及預設埠衝突。
- 正常啟動後 instance.json 回報 browserOpened=true，成功呼叫系統預設瀏覽器。
- 另外以可見瀏覽器開啟 EXE 本機服务，572×838 窄視窗顯示 compact-motion + has-3d。
- 實際滾輪：scrollY 由 0 到 838.4，scene 由 1 到 2，rotation 由 -0.2700 到 1.5250；畫面確認模型旋轉與展開。
- 本次沒有重新執行完整 19 組歷史瀏覽器測試；它們屬先前版本證據。
- Windows PowerShell 5.1 在本機受既有執行原則阻擋，未修改安全設定；開發／CI 說明使用已驗證的 PowerShell 7。
- EXE 未簽章；尚未在另一台實體電腦或 GitHub runner 驗證。

本次 EXE SHA-256：
`df7fd7b3dc78e2a1557577fd62c8919e6354d3b790f0f9e0708a23ff49c835c5`
