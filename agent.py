"""
Claude agent layer for Stock Radar.
Wraps analysis_engine functions as tools so users can chat with the system
(via Telegram) in natural language, plus generates the daily market summary.
"""

import os
import json
import threading

import anthropic

from analysis_engine import (
    analyze_stock,
    scan_watchlist,
    backtest,
    predict_score,
    WATCHLIST,
)

# Per approved Phase 0 plan: Haiku for daily chat/summary to keep unit cost low.
# Override with AGENT_MODEL (e.g. claude-sonnet-5) for deeper analysis quality.
AGENT_MODEL = os.getenv("AGENT_MODEL", "claude-haiku-4-5")
MAX_TOOL_TURNS = 6
HISTORY_MAX_TURNS = 10  # user+assistant pairs kept per chat (in-memory)

_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    return _client


SYSTEM_PROMPT = """你係「Stock Radar」,一個股票數據監察助手,透過 Telegram 同用戶對話。

你有工具可以調用:實時技術指標分析、watchlist 批量掃描、策略回測、機器學習買入機率評分。用戶問股票相關問題時,先調用工具攞真實數據再答,唔好靠估。

規則:
1. 合規(最重要):你唔係持牌投資顧問,絕對唔可以俾個人化投資建議。唔好講「你應該買/賣」「而家係入貨/出貨時機」呢類說話。只可以陳述數據、指標訊號、回測結果,並解釋指標嘅一般含義,買賣決定由用戶自己做。
2. 每次涉及股票數據或分析嘅回覆,結尾另起一行加:「⚠️ 以上為數據分析,並非投資建議」。閒聊唔使加。
3. 用繁體中文(香港廣東話口語)回覆,簡潔、適合手機閱讀。唔好用 Markdown 語法(*、#、`),Telegram 唔會 render,直接用純文字同 emoji。
4. 股票代號格式:美股用代號(AAPL);港股用四位數字加 .HK(0700.HK);A 股用交易所前綴(sh600519、sz000001)。用戶講公司名(例如「騰訊」)你要自己轉做正確代號(0700.HK)。
5. 數據來自 yfinance/akshare,或有延遲。工具攞唔到數據就直接講明,唔好作數。"""


# ── Tool definitions ──────────────────────

TOOLS = [
    {
        "name": "analyze_stock",
        "description": (
            "分析單一股票:回傳最近 5 個交易日嘅收市價、MA20/MA60、RSI14、"
            "MACD、ATR、BUY_SCORE/SELL_SCORE 訊號,以及基本面數據(市盈率等)。"
            "用戶問任何個股現況、值唔值得留意、技術面點睇,都應該調用呢個工具。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string", "description": "股票代號,例如 AAPL、0700.HK、sh600519"},
                "period": {"type": "string", "enum": ["3mo", "6mo", "1y", "2y"], "description": "分析週期,預設 1y"},
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "scan_watchlist",
        "description": (
            "批量掃描多隻股票,回傳每隻嘅最新指標同 BUY_SCORE,按分數排序。"
            "用戶想比較幾隻股票、問「今日有咩訊號」、或想睇成個 watchlist 時調用。"
            "唔指定 symbols 就掃描預設 watchlist(A股+港股+美股共 11 隻)。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbols": {"type": "array", "items": {"type": "string"}, "description": "股票代號列表;省略則用預設 watchlist"},
                "min_buy_score": {"type": "integer", "description": "只回傳 BUY_SCORE 大於等於此值嘅股票,預設 0(全部回傳)"},
            },
        },
    },
    {
        "name": "backtest",
        "description": (
            "用歷史數據回測交易策略,回傳總回報、勝率、最大回撤、交易次數等。"
            "用戶問「呢個策略過去表現點」「XX 用均線策略賺唔賺到」時調用。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string", "description": "股票代號"},
                "strategy": {
                    "type": "string",
                    "enum": ["MA_CROSS", "RSI_BOUNCE", "MACD_CROSS", "COMBINED"],
                    "description": "策略:MA_CROSS 均線交叉 / RSI_BOUNCE 超賣反彈 / MACD_CROSS MACD交叉 / COMBINED 綜合訊號(預設)",
                },
                "period": {"type": "string", "enum": ["1y", "2y", "3y", "5y"], "description": "回測週期,預設 2y"},
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "ml_score",
        "description": (
            "用 LightGBM 模型計多隻股票嘅 20 日上漲機率(BUY_PROB%),由高到低排序。"
            "用戶想要模型評分或者「邊隻機會大」呢類排序比較時調用。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbols": {"type": "array", "items": {"type": "string"}, "description": "股票代號列表;省略則用預設 watchlist"},
                "top_n": {"type": "integer", "description": "回傳頭幾多隻,預設 10"},
            },
        },
    },
]


def _default_watchlist() -> list:
    return [s for syms in WATCHLIST.values() for s in syms]


def _df_records(df) -> list:
    # to_json round-trip converts NaN/Timestamp to null/ISO strings
    return json.loads(df.to_json(orient="records", date_format="iso"))


def _execute_tool(name: str, args: dict) -> str:
    if name == "analyze_stock":
        result = analyze_stock(args["symbol"], args.get("period", "1y"))
        if not result:
            return json.dumps({"error": f"攞唔到 {args['symbol']} 嘅數據,請檢查代號格式"}, ensure_ascii=False)
        tech = result["technical"]
        cols = [c for c in ["Close", "MA20", "MA60", "RSI14", "MACD_Hist", "ATR14",
                            "BUY_SCORE", "SELL_SCORE", "STRONG_BUY", "STRONG_SELL"]
                if c in tech.columns]
        recent = tech[cols].tail(5).reset_index(names="Date")
        fund = result["fundamentals"]
        return json.dumps({
            "recent_5_days": _df_records(recent),
            "fundamentals": _df_records(fund)[0] if not fund.empty else {},
        }, ensure_ascii=False)

    if name == "scan_watchlist":
        symbols = args.get("symbols") or _default_watchlist()
        df = scan_watchlist(symbols, period="6mo", min_buy_score=args.get("min_buy_score", 0))
        if df.empty:
            return json.dumps({"results": [], "note": "冇股票符合條件或攞唔到數據"}, ensure_ascii=False)
        return json.dumps({"results": _df_records(df)}, ensure_ascii=False)

    if name == "backtest":
        bt = backtest(
            args["symbol"],
            period=args.get("period", "2y"),
            strategy=args.get("strategy", "COMBINED"),
        )
        if not bt:
            return json.dumps({"error": f"回測失敗,攞唔到 {args['symbol']} 嘅數據"}, ensure_ascii=False)
        return json.dumps({
            "summary": _df_records(bt["summary"])[0],
            "trades_count": len(bt["trades"]),
        }, ensure_ascii=False)

    if name == "ml_score":
        symbols = args.get("symbols") or _default_watchlist()
        df = predict_score(symbols, top_n=args.get("top_n", 10))
        if df.empty:
            return json.dumps({"error": "模型未訓練或攞唔到數據"}, ensure_ascii=False)
        return json.dumps({"results": _df_records(df)}, ensure_ascii=False)

    return json.dumps({"error": f"unknown tool {name}"}, ensure_ascii=False)


# ── Per-chat conversation memory (in-memory; Phase 0) ──

_histories: dict = {}
_histories_lock = threading.Lock()


def _get_history(chat_id: str) -> list:
    with _histories_lock:
        return list(_histories.get(chat_id, []))


def _append_history(chat_id: str, user_text: str, assistant_text: str):
    with _histories_lock:
        history = _histories.setdefault(chat_id, [])
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": assistant_text})
        del history[:-HISTORY_MAX_TURNS * 2]


def reset_history(chat_id: str):
    with _histories_lock:
        _histories.pop(chat_id, None)


# ── Chat entrypoint ───────────────────────

def chat(chat_id: str, user_text: str) -> str:
    """Run one user turn through the agent loop. Blocking; call off the event loop."""
    client = get_client()
    messages = _get_history(chat_id) + [{"role": "user", "content": user_text}]

    response = None
    for _ in range(MAX_TOOL_TURNS):
        response = client.messages.create(
            model=AGENT_MODEL,
            max_tokens=2048,
            system=[{"type": "text", "text": SYSTEM_PROMPT,
                     "cache_control": {"type": "ephemeral"}}],
            tools=TOOLS,
            messages=messages,
        )
        if response.stop_reason != "tool_use":
            break
        messages.append({"role": "assistant", "content": response.content})
        results = []
        for block in response.content:
            if block.type == "tool_use":
                try:
                    output = _execute_tool(block.name, block.input)
                    results.append({"type": "tool_result", "tool_use_id": block.id,
                                    "content": output})
                except Exception as e:
                    results.append({"type": "tool_result", "tool_use_id": block.id,
                                    "content": f"工具執行出錯: {e}", "is_error": True})
        messages.append({"role": "user", "content": results})

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    if not text:
        text = "唔好意思,呢條問題我處理唔到,可以換個方式問下嗎?"
    _append_history(chat_id, user_text, text)
    return text


# ── Daily market summary ──────────────────

def generate_daily_summary() -> str:
    """Scan the full watchlist and turn the numbers into a plain-language summary."""
    df = scan_watchlist(_default_watchlist(), period="6mo", min_buy_score=0)
    if df.empty:
        return "📡 Stock Radar 每日摘要\n\n今日攞唔到掃描數據,可能係數據源問題,聽日再試。"

    data = json.dumps(_df_records(df), ensure_ascii=False)
    prompt = (
        "以下係今日收市後 watchlist 全部股票嘅掃描結果(JSON):\n"
        f"{data}\n\n"
        "請寫一段 Telegram 每日市況摘要,要求:\n"
        "- 以「📡 Stock Radar 每日摘要」開頭\n"
        "- 先一兩句講整體(幾多隻有買入訊號、整體強弱)\n"
        "- 逐項列出 BUY_SCORE >= 2 或 STRONG_BUY/STRONG_SELL 嘅股票,每隻一行,講埋關鍵指標(RSI、量比等);冇就話今日冇強訊號\n"
        "- 純文字加 emoji,唔用 Markdown,總長度 500 字以內\n"
        "- 結尾加:「⚠️ 以上為數據分析,並非投資建議」"
    )
    response = get_client().messages.create(
        model=AGENT_MODEL,
        max_tokens=1024,
        system=[{"type": "text", "text": SYSTEM_PROMPT,
                 "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in response.content if b.type == "text").strip()
