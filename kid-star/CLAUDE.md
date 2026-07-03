# kid-star（星星學園）— 專案事實

小二中英數遊戲化學習 PWA（zh-HK）。React 18 + Vite 5 + Tailwind 3。merge 到 main 即自動部署 GitHub Pages，**真的小孩在用**，壞了直接影響用戶。

## 結構要點
- `src/games/` 每個遊戲一個 JSX，統一在 `src/games/registry.js` 註冊。
- `src/data/questions/*.json` 是手寫題庫（chinese/math/english）；`src/data/*.js` 是其他遊戲資料。改壞一個逗號整個遊戲掛。
- `src/lib/playlimit.js` 是免費限時限次邏輯——**動它之前先問用戶**（影響產品規則）。
- `public/reading/`、`public/shop/` 是獨立 vanilla JS 子 app，有各自的 service worker；Vite 的 PWA 設定刻意不 precache、不做 SPA fallback 到這兩個路徑（見 vite.config.js）。改它們不需要碰 React。
- base path 由環境變數 `BASE_PATH` 控制（GitHub Pages 用 `/stock-radar/`）；寫死絕對路徑 `/xxx` 會在 Pages 上 404。

## 驗證（改完必跑）
1. `cd kid-star && npm ci && npm run build`
2. 改了題庫 JSON：`node -e "JSON.parse(require('fs').readFileSync('src/data/questions/<檔>.json','utf8'));console.log('JSON OK')"`
3. 改了 `public/reading|shop` 的 `.js`：`node --check <路徑>`
4. 新增題目：先 grep 題幹關鍵字確認不重複（歷史上出過重複題目的問題）。

## 慣例
- UI 文案用廣東話（zh-HK），跟現有寫法。
- 遊戲要防「背節奏/背答案」：出題有隨機性、不重複（見 git log 45889c6、943ff94 的先例）。
- 目標用戶是小學二年級：任何新題目難度要對齊現有題庫，不確定就問用戶。
