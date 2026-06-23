# 📈 美股短線分析器 v2

純技術分析教育用途的 Streamlit app。用免費 yfinance 抓美股資料,計技術指標同綜合評分,
提供回測、Watchlist 排序、兩人各自獨立的模擬倉,以及可選的 Claude AI 評語。

> ⚠️ **純技術分析教育用途,並非投資建議。** 資料來自 yfinance(可能延遲),唔接任何真實券商或下單。

## 功能

- **📊 分析** — 揀股 + 時間範圍/週期 → 現價、綜合分數、RSI、5 日動量、價格/EMA 圖、評分明細、AI 評語。
- **📉 回測** — 由第 50 根 K 線起逐根用 `score_signals()` 重算分數:分 ≥ 買入門檻且空倉→全倉買入;分 ≤ 賣出門檻且持倉→全部賣出。畫權益曲線 vs Buy&Hold,顯示總報酬/年化/最大回撤/勝率/交易次數/超額。
- **⭐ Watchlist** — 逐行輸入代號(預設 AAPL/NVDA/TSLA/MSFT/AMZN),抓數據算分數排序;每位用戶各自儲存清單;每行「分析」掣可跳去分析分頁。
- **💼 模擬交易** — 每位用戶各自的模擬倉(初始 $100,000),可市價/手動價買賣,顯示持倉、估值、交易紀錄,可重設。

## 結構

```
us-stock-analyzer/
├── app.py                      # Streamlit 主程式(登入閘 + 四分頁)
├── core/
│   ├── data_fetch.py           # yfinance 抓 OHLCV
│   ├── indicators.py           # 技術指標 + score_signals()
│   ├── backtest.py             # run_backtest()
│   ├── watchlist.py            # rank() + per-user 清單儲存
│   ├── portfolio.py            # per-user 模擬倉(JSON)
│   └── claude_layer.py         # 可選 Claude AI 評語
├── requirements.txt
├── .streamlit/secrets.toml.example
└── data/                       # 執行時自動建立(已 gitignore)
```

## 本地運行

```bash
cd us-stock-analyzer
python -m venv .venv && source .venv/bin/activate   # 可選
pip install -r requirements.txt
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# 編輯 .streamlit/secrets.toml 填入 API key 同兩個用戶密碼
streamlit run app.py
```

預設兩個用戶 `jason` / `shirley`,密碼喺 `secrets.toml` 的 `[users]` 設定。
模擬倉同 watchlist 各自獨立存喺 `data/portfolio_<username>.json`、`data/watchlist_<username>.json`。

## 部署到 Streamlit Community Cloud(免費)

1. 將呢個資料夾 push 上 GitHub。
2. 喺 [share.streamlit.io](https://share.streamlit.io) 新增 app,指向 `us-stock-analyzer/app.py`。
3. 喺 app 的 **Settings → Secrets** 貼上(對應 `secrets.toml.example` 格式):

   ```toml
   ANTHROPIC_API_KEY = "sk-ant-..."

   [users]
   jason = "你的密碼"
   shirley = "你的密碼"
   ```

4. **重要:開 viewer allow-list 只准 jason / shirley 兩個 email**(Settings → Sharing →
   設為私人並加入兩個允許的 Google email)。咁先避免 app 公開、被陌生人狂用而燒爆你的 Claude API 額度。

> 註:本 app 自己的登入閘(用戶名+密碼)係第一層;Streamlit Cloud 的 viewer allow-list 係第二層。
> 兩層都開先最穩陣。

## 設計約束

- 只用 JSON 儲存,唔引入資料庫。
- 只用免費 yfinance,唔接付費實時 API。
- 唔加真實下單或券商連接 —— 全部係模擬。
- 全 UI 繁體中文,保留「非投資建議」提示。

## AI 評語(可選)

`core/claude_layer.py` 會優先讀 `st.secrets["ANTHROPIC_API_KEY"]`,fallback `os.environ`。
冇 key 或 API 出錯時會自動略過,唔影響其餘功能。預設模型 `claude-opus-4-8`,
可用 secrets 的 `ANTHROPIC_MODEL` 覆寫。
