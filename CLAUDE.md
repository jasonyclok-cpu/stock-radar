# stock-radar — 每個 session 的入口

## 這個 repo 有兩個獨立專案（先確認你在做哪個）

| 路徑 | 專案 | 技術 | merge 到 main 的後果 |
|---|---|---|---|
| `/`（root） | stock-radar 股票分析 | Python 3.11 + FastAPI | Railway 自動部署 |
| `/kid-star` | 星星學園 兒童學習 PWA | React 18 + Vite + Tailwind | GitHub Pages 自動部署（真的小孩在用） |

`kid-star/public/reading` 與 `kid-star/public/shop` 是獨立的 vanilla JS 子 app，不經 React build，原樣複製部署。kid-star 細節見 `kid-star/CLAUDE.md`（接觸該目錄時自動載入）。

## 開工必做
1. 先寫一句「本任務屬於哪個專案」，再動手。
2. 超過 3 步的任務：用 TaskCreate 記下目標＋驗收條件（context 壓縮後靠它找回方向）。
3. 大量讀檔、掃 repo、查網頁、批次改檔 → 派 subagent，主對話只收結論。門檻與做法：讀 `.claude/playbook/dispatch.md`。

## 完工必做（沒跑過驗證不得說「完成」）
- root Python 改動：`python3 -m py_compile app.py analysis_engine.py`
- kid-star 改動：`cd kid-star && npm ci && npm run build`
- 題庫 JSON：`node -e "JSON.parse(require('fs').readFileSync('<路徑>','utf8'));console.log('JSON OK')"`；`.js` 資料檔：`node --check <路徑>`
- 一律 `claude/*` 分支＋PR，永遠不直接 push main，不代替用戶 merge。
- 這是遠端 ephemeral 環境：沒 commit+push 的東西 session 結束就消失。每完成一個可驗證單位就 commit+push。

## 深入規則（按情境用 Read 讀對應檔，不要一次全讀）

| 情境 | 讀這個檔 |
|---|---|
| 要派 subagent、選 model/effort、驗收別人的工作 | `.claude/playbook/dispatch.md` |
| 不確定完成沒有／要不要問用戶／卡住、方向疑似錯了 | `.claude/playbook/judgment.md` |
| 要寫派工 prompt（搜尋/實作/重構/研究/審查） | `.claude/playbook/templates.md` |
| 想修改 CLAUDE.md 或 playbook 任何檔 | `.claude/playbook/maintenance.md`（先讀，有紅線） |
| 新 session 想快速了解這個環境的坑 | `.claude/playbook/letter.md` |
| 剛踩了坑 | 教訓寫進 `.claude/playbook/lessons.md`（格式見 maintenance.md） |

## 溝通
- 對用戶：繁體中文（廣東話為主）。commit 訊息跟 git log 現有風格（廣東話短句）。
- 代碼註解、變數名：英文。
- GitHub 操作用 `mcp__github__*` 工具（本環境沒有 gh CLI）。
