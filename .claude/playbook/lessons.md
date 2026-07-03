# 踩坑記錄（格式見 maintenance.md §3；規則檔才是 source of truth，這裡是 changelog）

## 2026-07-03 制度建立日的已知坑（種子條目）
- 情境：Fable 5 建立本套制度時實測環境。
- 坑：(1) `.claude/rules/` 會自動載入，不是普通目錄；(2) CLAUDE.md 的 `@import` 是開場全載，省不了 token；(3) Write 工具偶發 "permission stream closed" 錯誤，重試同樣內容即可；(4) MCP server 會中途斷線重連，工具暫時消失屬正常，等重連或用 ToolSearch 重載。
- 教訓：機制問題先問 claude-code-guide agent 查官方文件，不要憑記憶。
- 規則改動：已寫入 maintenance.md §2、dispatch.md §2。

---

# Backlog（任務中發現但不屬於當前任務的事，一行一項，動手前先跟用戶確認要不要做）

- 兩個專案都沒有測試套件。最高複利的投資是給 kid-star 題庫加一個 schema 驗證腳本、給 analysis_engine 核心計分函數加 smoke test——要用戶點頭才開工。
