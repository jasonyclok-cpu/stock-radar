# 快速診斷：本 harness 三大弱點與修法

> 2026-07-03 由 Fable 5 實地盤點寫成。本檔是其他 playbook 檔的依據，其他檔引用這裡的結論時不重複論證。
> 「主對話」= 直接面對用戶的那個模型的 context window。

## 一、最漏 token 的前三名

### 1. 主對話親自大量讀檔、掃 repo
- **實據**：`analysis_engine.py` 有 899 行，一次 Read 全檔就是幾千 token 永久佔住主對話；`kid-star/src` 有 40+ 個源檔；`kid-star/public/reading/passages.js` 等資料檔更大。這些 token 直到 context 壓縮才會清走，而壓縮又會稀釋任務目標（見「失焦 #1」）。
- **修法**：未知位置的搜尋、跨 5 個檔以上的盤點，一律派 Explore agent；主對話只收「結論＋`檔案:行號`」。已知路徑、讀 1–2 個檔，自己讀即可（派工本身也有成本）。詳見 `dispatch.md` §1。

### 2. GitHub MCP 回傳的大 JSON 直落主對話
- **實據**：本環境沒有 `gh` CLI，GitHub 操作全靠 `mcp__github__*` 工具；`list_*` / `search_*` 不設分頁時一次回幾十項完整 JSON。
- **修法**：所有 list/search 帶分頁參數（每頁 5–10）；支援 `minimal_output` 的設 `true`；需要翻大量 GitHub 資料（例如查幾十個 PR 的歷史）時包進 general-purpose subagent，主對話只收摘要。

### 3. 改完重讀全檔「自我確認」＋長產物貼回對話
- **實據**：Edit/Write 失敗時 harness 會直接報錯，改完再整檔重讀是純浪費。subagent 把研究全文貼回主對話，等於派工省下的 token 又全數吐回來。
- **修法**：不重讀剛編輯過的檔。驗證靠命令（`py_compile`、`npm run build`，見下方 §三.1）或 verifier agent。subagent 的長產物一律落檔（scratchpad 或 repo），只回「路徑＋10 行內摘要」。

## 二、最容易失焦的前三名

### 1. 長回合 context 壓縮後，任務目標被稀釋
- **症狀**：做到一半忘了驗收條件，開始做「看起來像完成」的事。注意：子目錄 CLAUDE.md 在壓縮後不會自動重新載入。
- **修法**：超過 3 步的任務，開工先用 TaskCreate 把「目標＋驗收條件」寫進任務描述（task 清單在壓縮後仍在）；每完成一步對照一次；發現 context 被壓縮過，第一件事是跑 TaskList 找回目標。

### 2. 雙專案混淆
- **症狀**：root 是 Python/FastAPI/Railway，`kid-star/` 是 React/Vite/GitHub Pages——命令、依賴、部署後果完全不同。拿錯驗證命令、或誤判改動的上線影響。
- **修法**：root `CLAUDE.md` 開頭有專案路由表；`kid-star/CLAUDE.md` 在接觸該目錄檔案時會自動載入。動手前先寫一句「本任務屬於 X 專案」。

### 3. 順手修無關問題（scope creep）
- **症狀**：找 bug 途中看到別的「可以改善」就動手，diff 越滾越大，原任務爛尾。
- **修法**：非任務內的發現 → 在 `.claude/playbook/lessons.md` 的 Backlog 段寫一行，不動手。一個 PR 只做一件事。

## 三、最容易出錯的前三名

### 1. 沒有測試、沒有 lint，「完成」缺乏機械證據
- **實據**：兩個專案都沒有測試套件。「改了」不等於「對了」。
- **修法**——最低驗證命令（沒跑過不得聲稱完成；2026-07-03 均實測可用）：
  - root Python：`python3 -m py_compile app.py analysis_engine.py`（環境沒裝依賴時的底線；裝了依賴則再加 `python3 -c "import app"`）
  - kid-star：`cd kid-star && npm ci && npm run build`（Node 20+）
  - 題庫 JSON：`node -e "JSON.parse(require('fs').readFileSync('<路徑>','utf8'));console.log('JSON OK')"`（成功會印 JSON OK，無輸出＝沒跑成）
  - `.js` 資料檔（如 `public/reading/passages.js`）：`node --check <路徑>`

### 2. merge 到 main 即自動上線
- **實據**：kid-star merge 進 main → GitHub Actions 自動部署 GitHub Pages（真的小孩在用）；root merge 進 main → Railway 自動部署。
- **修法**：一律開 `claude/*` 分支＋PR，永遠不直接 push main；merge 與否由用戶決定，不代替用戶按 merge。

### 3. 手寫資料檔改壞結構
- **實據**：題庫是手寫 JSON/JS（`kid-star/src/data/questions/*.json` 等）；git 歷史顯示出現過重複題目問題（見 45889c6）；改壞一個逗號整個遊戲就掛。
- **修法**：改資料檔後必跑 §三.1 的對應驗證；新增題目時先 grep 題幹關鍵字查重複；改完在瀏覽器或 build 產物層面抽查一次該遊戲有沒有載入錯誤。
