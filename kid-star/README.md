# ⭐ 星星學園(Star School)

為香港小二學生而設的中英數遊戲化學習應用。答題儲星星、解鎖關卡、玩小遊戲,
家長可以喺隱藏後台睇學習進度。

- React 18 + Vite + Tailwind CSS
- PWA(iPad「加至主畫面」後可全螢幕離線運行)
- 所有進度存喺 localStorage(`starschool_` 前綴),唔使登入

## 本地運行

```bash
cd kid-star
npm install
npm run dev
```

打開終端機顯示嘅網址(預設 http://localhost:5173)。

想喺 iPad 試:電腦同 iPad 連同一個 Wi-Fi,跑 `npm run dev -- --host`,
然後喺 iPad Safari 開 `http://<電腦IP>:5173`。

> PWA 離線功能只會喺 `npm run build` 之後嘅正式版生效(`npm run preview` 可本地測試)。

## 部署到 GitHub Pages(免費,唔使開新帳號)

Repo 入面已經有自動部署 workflow(`.github/workflows/deploy-kid-star.yml`):

1. 去 GitHub repo → **Settings → Pages**,**Source** 揀 **GitHub Actions**
2. push 任何 `kid-star/` 嘅改動上 `main`(或者去 **Actions** tab 手動撳
   **Deploy 星星學園 to GitHub Pages → Run workflow**)
3. 等一兩分鐘,網址就係:
   **https://jasonyclok-cpu.github.io/stock-radar/**

之後每次 push 上 `main` 會自動重新部署。

> 技術細節:GitHub Pages 部署喺子路徑 `/stock-radar/`,workflow 會用
> 環境變數 `BASE_PATH=/stock-radar/` build;本地開發同 Vercel 唔受影響。

## 部署到 Vercel(另一選擇)

1. 將呢個 repo push 上 GitHub
2. 去 [vercel.com](https://vercel.com) → **Add New Project** → 揀呢個 repo
3. **Root Directory** 設做 `kid-star`(因為 app 喺子目錄)
4. Framework 揀 **Vite**(通常會自動偵測),Build Command `npm run build`,Output `dist`
5. 撳 **Deploy**,完成後會有一條 `https://xxx.vercel.app` 網址

之後每次 push,Vercel 會自動重新部署。

## 喺 iPad 安裝成 PWA(逐步)

1. 用 **Safari** 開部署好嘅網址(例如 `https://xxx.vercel.app`)
2. 撳 Safari 工具列嘅 **分享掣**(□↑ 嗰個圖示)
3. 向下捲,撳 **「加至主畫面」**
4. 名稱會係「星星學園」,撳 **「加入」**
5. 主畫面會出現黃色星星 icon,撳入去就係全螢幕、冇網址列嘅 app
6. 開過一次之後,冇網絡都照玩(進度存喺機入面)

> 注意:一定要用 Safari,Chrome on iOS 冇「加至主畫面」嘅完整 PWA 支援。

## 點樣加題目

題庫喺 `src/data/questions/`,每科一個 JSON 檔:

- `math.json` 數學
- `chinese.json` 中文
- `english.json` 英文

喺對應檔案嘅 array 加一個物件就得。共通欄位:

| 欄位 | 說明 |
|---|---|
| `id` | 唯一識別碼,例如 `math-add-009`(唔好同現有重複) |
| `subject` | `math` / `chinese` / `english` |
| `topic` | 課題名,**必須**同 `src/data/levels.js` 入面關卡嘅 `topics` 一樣,否則唔會出題 |
| `difficulty` | 1(易)、2(中)、3(難),自適應難度會用到 |
| `type` | 題型,見下面四種 |
| `answer` | 正確答案(字串) |
| `explanation` | 答錯時顯示嘅講解,用小朋友明嘅語言寫 |

### 四種題型

**1. 四選一 `multiple_choice`**

```json
{
  "id": "math-add-009",
  "subject": "math",
  "topic": "兩位數加法",
  "difficulty": 2,
  "type": "multiple_choice",
  "question": "26 + 38 = ?",
  "options": ["64", "54", "63", "614"],
  "answer": "64",
  "explanation": "個位 6+8=14,寫 4 進 1;十位 2+3+1=6,所以係 64。"
}
```

**2. 填充 `fill_blank`** — `inputMode: "numeric"` 出數字鍵盤,`"choices"` 出選字掣:

```json
{
  "id": "chi-mw-009",
  "subject": "chinese",
  "topic": "量詞",
  "difficulty": 1,
  "type": "fill_blank",
  "inputMode": "choices",
  "choices": ["間", "條", "本", "朵"],
  "question": "一__學校",
  "answer": "間",
  "explanation": "屋企、學校呢啲建築物用「間」。"
}
```

**3. 配對 `matching`** — 建議 3 對,左右會自動打亂:

```json
{
  "id": "chi-match-007",
  "subject": "chinese",
  "topic": "詞語配對",
  "difficulty": 2,
  "type": "matching",
  "question": "把意思相反的詞語配對",
  "pairs": [
    { "left": "快", "right": "慢" },
    { "left": "冷", "right": "熱" },
    { "left": "哭", "right": "笑" }
  ],
  "answer": "快↔慢、冷↔熱、哭↔笑",
  "explanation": "快同慢相反,冷同熱相反,哭同笑相反。"
}
```

**4. 重組句子 `reorder`** — `words` 係詞語(會自動打亂),`answer` 係全部詞語順序駁埋嘅句子:

```json
{
  "id": "chi-re-009",
  "subject": "chinese",
  "topic": "重組句子",
  "difficulty": 2,
  "type": "reorder",
  "question": "重組句子",
  "words": ["弟弟", "在", "客廳", "玩耍", "。"],
  "answer": "弟弟在客廳玩耍。",
  "explanation": "「在客廳」講喺邊度,放喺「玩耍」之前。"
}
```

### 加新關卡 / 新課題(按年級分組)

關卡按年級分組,結構係 `LEVELS[科目][年級]`。開 `src/data/levels.js`,
喺對應科目 + 年級嘅 array 加一項:

```js
math: {
  小二: [ /* ... */ { id: 9, name: '金錢小舖', emoji: '💰', topics: ['認識金錢'] } ],
  小三: [ /* ... */ ],
},
```

然後喺題庫 JSON 加 `topic: "認識金錢"` 嘅題目(建議每個課題至少 6 題,
咁先夠一回合;有 difficulty 1-3 嘅分佈,自適應難度先有得揀)。
想加新年級(例如「小四」),喺 `GRADES` 加一項,再喺各科加對應 array 就得。

### 加記憶配對遊戲嘅詞語

開 `src/data/memoryPairs.js`,加 `{ zh: '香蕉', en: 'banana' }` 就得,遊戲每次隨機抽 8 對。

## 遊戲規則速覽

- **年級組別**:主頁可自由切換「小一 / 小二 / 小三」,每個年級各有一條關卡路線
- **小遊戲**:分「學習」(10 個)同「專注力」(7 個)兩類;每次入主頁**隨機推介各 2 個**,其餘摺疊(撳「仲有 N 個遊戲」展開)
  - 清單同設定喺 `src/games/registry.js`(`cost: 0` = 免費賺星、`10` = 用 10⭐ 入場)
  - **免費遊戲**:學習類 4 個(限時心算、快問快答、真定假、湊十)、專注力類 2 個(紅綠燈、數字快搜);全部限時,而且 **5 分鐘內最多玩 3 次**(`src/lib/playlimit.js`),避免一直刷星
  - **競速答題遊戲**(快問快答 / 數學閃電 / 英文閃卡 / 中文挑戰 / 量詞王 / 時間王)共用 `src/games/ArcadeQuiz.jsx`,直接抽現有題庫,加遊戲只需喺 registry 加一項
  - 每次答啱 / 闖關都有鼓勵說話(`src/lib/encourage.js`)
- 每回合 6 題,答對 +1 ⭐;連對 3 題起每題 +2 ⭐(Combo)
- 答錯唔扣分,即時講解,回合尾重出一條類似題;有「🔊 讀題目」語音朗讀
- 正確率 ≥ 80% 過關,解鎖同年級下一關(唔會跳出該年級範圍)
- 連續答對 2 題會出深啲嘅題;連錯 2 題會出淺啲(每科獨立計;靈敏度同難題比例可喺 `src/lib/quizEngine.js` 調)
- 同一組題目唔會連續重複(引擎記住每科最近出過嘅題)
- 儲夠 10 ⭐ 可以玩「記憶配對」(會扣星,翻牌會讀出該詞)
- **家長後台**:喺主頁**長按「星星學園」logo 3 秒**進入
- 連續學習日數:當日完成至少一個回合先算

## 專注力遊戲(🧠 專注力大挑戰)

放喺小遊戲區,每個 10 ⭐ 入場。**設計原則:小朋友端絕不顯示分數、評級或
「測驗」字眼,只當好玩闖關;表現數據靜默記錄,只喺家長後台顯示。**

| 遊戲 | 玩法 | 自動遞進 | 靜默記錄(家長後台) |
|---|---|---|---|
| 🔢 數字快搜(舒爾特方格) | 亂序 1..N²,順序點擊;點錯只搖晃唔扣分 | 3×3 → 4×4 → 5×5 | 各格數最快完成時間 |
| 🚦 紅綠燈 | 綠燈快撳、紅燈唔好撳;60 秒一回合 | 表現好會加速出燈 | 平均反應時間、紅燈誤點次數 |
| 🧠 記憶翻牌 | 短暫預覽後蓋牌,搵返成對圖案 | 4×4 → 4×5 | 可完成嘅最大格數 |
| 👂 聽指令 | zh-HK 語音 + 文字讀出指令(含「要做 / 不要做」),點啱啲彩色形狀 | 第 4 回合起加「不要做」、加形狀 | 正確率、錯點次數 |
| 🎶 圖案接龍 | 閃示彩色圖案(同時讀出顏色),順序點返;答對序列加長 | 答啱長一位 | 可達到嘅最長序列 |
| 🔍 找不同 | 並排兩幅 emoji 場景,搵出 3-5 處不同,點中高亮 | level 越高差異越多、換場景 | 找對數、錯點次數 |
| 🧩 走迷宮 | Canvas 迷宮,手指由起點拖去終點,碰牆即重來 | 迷宮 6→8→10 越嚟越大 | 碰牆次數、完成時間 |

- 語音用 `src/lib/speech.js` 嘅 `speak(text, 'zh-HK')`;裝置唔支援語音時自動以文字降級
- 「找不同」場景喺 `src/data/spotScenes.js`,加場景方法檔案內有說明(加一個 `{name, cols, base, pool}` 物件)
- 遊戲元件喺 `src/games/`(`SchulteTable`、`TrafficLight`、`MemoryFlipAdvanced`、`ListenAndDo`、`SequenceRecall`、`SpotDifference`、`Maze`)

### 家長後台「🧠 專注力分析」分頁(小朋友睇唔到)

讀取以上遊戲嘅靜默記錄,計**近兩週趨勢**(最近 7 日 vs 之前 7 日,↑進步 / →持平 / ↓退步 + 白話解讀):

| 指標 | 來源 | 意思 |
|---|---|---|
| 平均反應時間 | 紅綠燈、舒爾特 | 反應快唔快 |
| 反應穩定度 | 反應時間波動 | 係咪時快時慢 |
| 持續力 | 一回合前半 vs 後半 | 撐唔撐得耐 |
| 抑制控制 | 紅綠燈、聽指令誤觸率 | 忍唔忍到手亂撳 |
| 工作記憶廣度 | 接龍最長序列、翻牌格數 | 記得到幾多 |

- 分析邏輯喺 `src/lib/analysis.js`(`buildAnalysis(focus)`)
- **備份 / 匯出**:家長後台有「⬇️ 匯出備份 / ⬆️ 匯入備份」,匯出全部 `starschool_` 資料做 JSON,換機可還原(`src/lib/storage.js` 嘅 `exportAll` / `importAll`)
- 目前單一 Profile(即呢部裝置嘅資料);如要多個小朋友分開記錄,可日後加 Profile 切換
- 靜默紀錄經 `src/lib/focus.js`(`recordFocus` / `getFocus`)存喺 localStorage(`starschool_focus`),沿用現有 Profile 結構
- 鼓勵文案喺 `src/lib/encourage.js`(成長型思維,讚努力唔講分數)
- 翻牌圖案喺 `src/data/focusCards.js`(加 emoji 就得)

## 建議後續改進方向

1. **題庫擴充**:每課題加到 20+ 題,避免重複;加入睇圖題(可加 `image` 欄位)
2. **真時鐘圖**:看時鐘題用 SVG 畫指針時鐘代替文字描述
3. **語音**:用 Web Speech API 朗讀英文生字同中文句子,幫助認讀
4. **每日任務**:「今日做 3 個回合」之類嘅目標,完成有額外星星
5. **獎勵商店**:星星可以換頭像、主題色、新吉祥物,加強經濟循環
6. **錯題重練模式**:家長後台一掣生成「錯題特訓」回合
7. **數據匯出/同步**:匯出 JSON 或接 Firebase,換機唔會冇晒進度
8. **更多小遊戲**:句子接龍、聽寫等,維持新鮮感
9. **多 Profile**:俾幾個小朋友各自一份進度同專注力紀錄,分開分析

### 後續可加嘅專注力遊戲建議

- **Stroop 字色遊戲**:字寫「紅」但係藍色,要揀顏色唔係字 —— 練抑制控制
- **聲音方向 / 聽聲記序**:純聽覺版接龍,練聽覺工作記憶(配合 zh-HK 語音)
- **持續注意(CPT)**:一連串圖案中,淨係特定目標出現先撳,練持續專注
- **雙重任務**:一邊數星星一邊避障,練分配注意力
- **N-back**:睇住一串,要記住「兩個之前」嗰個 —— 練高階工作記憶
- **節奏拍打**:跟住節奏拍,練時間知覺同自我調節
