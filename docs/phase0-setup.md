# Phase 0 設定指南 — Telegram AI Agent

三步開通:整 Telegram bot → 設定環境變數 → 註冊 webhook。

## 1. 整 Telegram Bot

1. Telegram 搵 **@BotFather** → `/newbot` → 改名(例如 Stock Radar Bot)
2. 攞到 bot token(格式 `123456:ABC-DEF...`),填入 `TG_BOT_TOKEN`

## 2. 環境變數(Railway → Variables)

| 變數 | 說明 |
|---|---|
| `TG_BOT_TOKEN` | BotFather 俾嘅 token |
| `TG_WEBHOOK_SECRET` | 自己作一串隨機字串,防止其他人偽冒 Telegram 打你個 webhook |
| `ANTHROPIC_API_KEY` | 喺 platform.claude.com 開,agent 對話同每日摘要用 |
| `AGENT_MODEL` | 預設 `claude-haiku-4-5`(平,啱日常對話);想更強分析可轉 `claude-sonnet-5` |
| `AGENT_DAILY_MSG_LIMIT` | 每個用戶每日對話上限,預設 50,控制 token 成本 |

## 3. 註冊 Webhook

Deploy 完之後行一次(將 `<TOKEN>`、`<SECRET>`、`<你嘅域名>` 換做真值):

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<你嘅域名>/api/telegram/webhook" \
  -d "secret_token=<SECRET>"
```

檢查有冇成功:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## 用法

- 用戶喺 Telegram 搵你個 bot,`/start` 訂閱
- 直接打字問嘢:「700 技術面點睇」「掃描下有咩訊號」「AAPL 回測兩年」
- 每個交易日 16:05(伺服器時區)自動推送 LLM 市況摘要俾所有訂閱者
- `/summary` 即刻攞摘要 / `/stop` 取消訂閱 / `/reset` 清空對話記憶

## 架構(Phase 0)

```
Telegram 用戶
   │  webhook (POST /api/telegram/webhook, secret token 驗證)
   ▼
app.py ──► telegram_bot.py(指令、訂閱、每日用量限額)
                │  自由對話
                ▼
            agent.py(Claude tool-use loop)
                │  調用工具
                ▼
        analysis_engine.py(指標/掃描/回測/ML 評分)
```

已知限制(Phase 0 刻意從簡):
- 對話記憶存喺記憶體,重新 deploy 會清空
- 全部用戶共用同一個預設 watchlist(自訂 watchlist 係 Phase 1)
- 訂閱者/用量記錄喺 `output/cache.db`(SQLite)

## 驗證指標(跑 4-6 星期)

- 至少 40% 試用者每星期用 3 日以上
- 至少 5 個人肯俾 HK$68/月
- 過唔到呢兩關,唔好起 Phase 1 多租戶平台
