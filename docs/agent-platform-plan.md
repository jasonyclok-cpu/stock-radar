# 股票監察 Agent 平台 — 詳細執行方案

> 目標：由 stock-radar 出發,做一個「人人可以開一隻屬於自己嘅股票監察 AI agent」嘅垂直平台。
> 策略:唔同通用平台(GPT Store、Dify)鬥大,鬥「投資監察」呢個範疇做到最深。
> 日期:2026-07-07

---

## 一、產品定位

**一句話:** 每個用戶開一隻 24/7 幫佢睇市嘅 AI agent——自己嘅 watchlist、自己嘅提醒規則、自己嘅風格,喺 Telegram/WhatsApp 直接同佢傾。

**同現有嘢嘅分別:**

| 現有選擇 | 缺口 |
|---|---|
| 券商 app 價位提醒 | 淨係「到價通知」,冇分析、唔識答問題 |
| ChatGPT / Claude 直接問 | 冇實時數據、冇你嘅持倉背景、唔會主動搵你 |
| 通用 agent 平台 (Dify 等) | 要自己砌、冇股票數據源、對散戶太技術性 |
| **本產品** | 開箱即用 + 主動監察 + 識用你嘅數據答你 |

**目標用戶(先後次序):**
1. 香港散戶投資者(港股+美股)——市場熟、渠道近(Telegram 群、投資 KOL)
2. 投資群組主/KOL——一人開 agent 服務成個 group,係天然分銷渠道
3. 之後先諗:台灣/新加坡華語投資者

**stock-radar 現成資產(即係你嘅起跑優勢):**
- `analysis_engine.py`:技術指標、buy/sell score、回測、Kelly 倉位、Monte Carlo、LightGBM 評分
- 數據源已駁通:yfinance(美股/港股)+ akshare(A 股)
- FastAPI + APScheduler 每日掃描提醒骨架
- Railway 部署配置

---

## 二、三階段路線圖

### Phase 0 — 單租戶驗證(約 4–6 星期)

**目標:證明「有人想要一隻咁嘅 agent,而且肯俾錢」,先至郁多租戶。**

要做嘅嘢:
1. **加 agent 對話層**:用 Claude API(tool use),將 `analysis_engine` 現有 function 包做 agent 工具:
   - `analyze_stock` / `scan_watchlist` / `backtest` / `predict_score` / `monte_carlo` 直接變 tool
   - Agent 收到「700 而家值唔值博?」→ 自己調用工具 → 用數據答
2. **駁 Telegram Bot**(唔好一開始搞 WhatsApp,Business API 又貴又麻煩;Telegram bot 免費、一日搞掂)
3. **主動推送**:而家每日 16:05 掃描 → 改成掃完由 LLM 寫一段人話市況摘要推去 Telegram
4. **搵 10–20 個真用戶試**(朋友、投資群),收集:每日開唔開、問啲乜、肯唔肯俾 HK$68/月

**驗證指標(過唔到就唔好起平台):**
- ≥40% 試用者每星期至少用 3 日
- ≥5 個人口頭承諾或實際俾錢訂閱

**技術要點:**
- 唔使改架構,喺而家個 FastAPI 入面加一個 `agent.py` + Telegram webhook endpoint 就得
- LLM 用 Claude Haiku 做日常對話/摘要(平),深度分析先升級 Sonnet
- 呢個階段一個 Railway instance 已經夠

### Phase 1 — 多租戶 MVP(約 2–3 個月)

**目標:任何人註冊 → 3 分鐘內開到自己隻 agent。呢個階段先係「Shopify 化」。**

用戶旅程:
1. 網頁註冊(電話/email)
2. 揀模板:「港股短線」「美股長線」「ETF 月供」「A 股」
3. 設定 watchlist + 提醒規則(到價、buy score、RSI 超買賣、爆量……)
4. 一撳「開通」→ 收到自己專屬 Telegram bot 連結 → 即刻傾到

**架構改動(關鍵決定:應用層多租戶,唔係每人一個 VM):**

```
用戶 Telegram ──┐
用戶 Web PWA ──┤→ API Gateway (FastAPI)
                │     ├─ Auth (Supabase Auth 或 Clerk)
                │     ├─ Agent Runtime(每個請求帶 tenant_id,共享進程)
                │     │    └─ Claude API + 工具層(analysis_engine)
                │     ├─ Scheduler(每日掃描按 tenant 排隊行)
                │     └─ 用量計量 + 限額層(核心!)
                └─ Postgres(tenant 隔離:所有表帶 tenant_id + RLS)
```

- **點解唔係每人一個 container:** 你嘅 agent 唔會幫用戶執行任意代碼,只係調用你寫死嘅分析工具,所以唔需要 VM 級 sandbox——應用層隔離已經夠,成本低幾十倍。呢個係同 OpenClaw 託管嗰類最大分別,亦係你毛利嘅來源。
- **SQLite → Postgres**(Railway/Supabase 有管理式),所有 query 強制帶 tenant_id
- **用量限額層(最重要嘅新代碼):**
  - 每用戶每日訊息上限(免費 10 條/日,付費 100 條/日)
  - 每用戶每月 token 預算,超咗降級去平模型或者停
  - 每工具調用計數(yfinance 都會被 rate limit,要加中央 cache:同一隻股票嘅數據全平台共用,唔好每個 tenant 掃一次)
- **收費**:Stripe(香港支援好)訂閱

**收費建議:**

| Plan | 價錢 | 內容 |
|---|---|---|
| 免費 | $0 | 5 隻股 watchlist、每日 1 次摘要、10 條對話/日 |
| 標準 | HK$68/月 | 30 隻股、實時提醒、100 條對話/日、回測 |
| 進階 | HK$168/月 | 100 隻股、LightGBM 評分、Monte Carlo、自訂策略 |

**成本核算(每個活躍付費用戶/月,用 Haiku 做主力):**
- 每日摘要 ~5k tokens in / 1k out × 22 日 ≈ US$0.3
- 對話 ~30 次/月 × (10k in / 1k out) ≈ US$0.5
- 合計 LLM 成本 ≈ **US$1–2/用戶/月**,對 HK$68(≈US$8.7)有 75%+ 毛利
- 基建(Railway + Postgres):首 500 用戶內 <US$100/月
- **結論:唔使 BYOK 都有數圍**,BYOK 留返俾進階用戶想用自己 key 先開

### Phase 2 — 平台化(6 個月後,視乎 Phase 1 數據)

- **策略模板市場**:高手用戶可以發佈自己嘅提醒規則/策略組合,其他人一鍵套用,平台抽成(參考行規 15–30%)
- **KOL 方案**:群主開「群 agent」,收群費分成
- **自訂工具**:俾進階用戶接自己嘅數據源/webhook(呢個時候先需要認真諗 sandbox)
- **多渠道**:WhatsApp Business、Discord

---

## 三、合規(香港,必須一開始就處理)

**核心風險:SFC 第 4 類受規管活動(就證券提供意見)。** 冇牌唔可以俾個人化投資建議。

處理方法(產品層面寫死,唔係淨係免責聲明):
1. Agent system prompt 明確禁止「你應該買/賣」式輸出——只可以陳述數據、指標訊號、歷史回測結果
2. 所有輸出附免責聲明:「以上為數據分析,並非投資建議」
3. 定位用字全部用「監察工具」「數據分析」,唔用「貼士」「推介」
4. 開 Phase 1 前用一至兩千蚊問一次合規律師意見(值得)
5. 唔掂用戶資金、唔落單——只做資訊層,監管風險大幅下降

---

## 四、風險同對策

| 風險 | 對策 |
|---|---|
| 冇人肯俾錢 | Phase 0 用最平方式驗證,唔過關就唔起平台 |
| 用戶狂問嘢燒爆 token | 限額層行先過所有功能;每日預算 hard cap |
| yfinance/akshare 被封或改版 | 中央 cache 減少調用;預留換數據商(如 Polygon/富途 OpenAPI)嘅抽象層 |
| 巨頭做埋呢瓣 | 佢哋做通用;你贏喺港股語境、廣東話、本地渠道、KOL 網絡 |
| 一個人維護唔切 | 全程 managed service(Railway/Supabase/Stripe),唔自己養 server |

---

## 五、即刻可以做嘅嘢(本星期)

1. 開 `agent.py`:Claude API tool-use 包裝 `analyze_stock` / `scan_watchlist` / `backtest`
2. 申請 Telegram Bot token,加 webhook endpoint
3. 每日掃描結果加 LLM 摘要推送
4. 搵 5 個朋友入 beta group

以上 1–3 都可以直接喺呢個 repo 開工,想開始嘅話下一步就係實作 Phase 0。
