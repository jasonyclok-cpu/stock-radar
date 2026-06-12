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

## 部署到 Vercel

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

### 加新關卡 / 新課題

開 `src/data/levels.js`,喺對應科目嘅 array 加一項:

```js
{ id: 6, name: '金錢小舖', emoji: '💰', topics: ['認識金錢'] },
```

然後喺題庫 JSON 加 `topic: "認識金錢"` 嘅題目(建議每個課題至少 8 題,
咁先夠一回合 6 題 + 錯題加練)。

### 加記憶配對遊戲嘅詞語

開 `src/data/memoryPairs.js`,加 `{ zh: '香蕉', en: 'banana' }` 就得,遊戲每次隨機抽 6 對。

## 遊戲規則速覽

- 每回合 6 題,答對 +1 ⭐;連對 3 題起每題 +2 ⭐(Combo)
- 答錯唔扣分,即時講解,回合尾重出一條類似題
- 正確率 ≥ 80% 過關,解鎖下一關
- 連續答對 3 題會出深啲嘅題;連錯 2 題會出淺啲(每科獨立計)
- 儲夠 10 ⭐ 可以玩一次小遊戲(會扣星)
- **家長後台**:喺主頁**長按「星星學園」logo 3 秒**進入
- 連續學習日數:當日完成至少一個回合先算

## 建議後續改進方向

1. **題庫擴充**:每課題加到 20+ 題,避免重複;加入睇圖題(可加 `image` 欄位)
2. **真時鐘圖**:看時鐘題用 SVG 畫指針時鐘代替文字描述
3. **語音**:用 Web Speech API 朗讀英文生字同中文句子,幫助認讀
4. **每日任務**:「今日做 3 個回合」之類嘅目標,完成有額外星星
5. **獎勵商店**:星星可以換頭像、主題色、新吉祥物,加強經濟循環
6. **錯題重練模式**:家長後台一掣生成「錯題特訓」回合
7. **數據匯出/同步**:匯出 JSON 或接 Firebase,換機唔會冇晒進度
8. **更多小遊戲**:句子接龍、聽寫等,維持新鮮感
