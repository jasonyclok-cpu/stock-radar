"""
Telegram bot layer: webhook update handling, subscriber management,
per-chat daily usage limits, and daily summary broadcast.
"""

import os
import sqlite3
from pathlib import Path

import requests

import agent

TG_BOT_TOKEN = os.getenv("TG_BOT_TOKEN", "")
DAILY_MSG_LIMIT = int(os.getenv("AGENT_DAILY_MSG_LIMIT", "50"))
TG_API = f"https://api.telegram.org/bot{TG_BOT_TOKEN}"
TG_MAX_LEN = 4096

DB_PATH = str(Path("./output") / "cache.db")

HELP_TEXT = (
    "📡 Stock Radar — 你嘅股票監察 agent\n\n"
    "直接打字問我就得,例如:\n"
    "· 700 而家技術面點睇?\n"
    "· 掃描下我個 watchlist 有咩訊號\n"
    "· AAPL 用均線策略回測兩年表現點?\n"
    "· 邊隻股票模型評分最高?\n\n"
    "指令:\n"
    "/start - 訂閱每日收市摘要\n"
    "/stop - 取消訂閱\n"
    "/summary - 即刻攞一份市況摘要\n"
    "/reset - 清空對話記憶\n"
    "/help - 顯示呢個說明\n\n"
    "⚠️ 本 bot 只提供數據分析,並非投資建議"
)


# ── SQLite ────────────────────────────────

def _conn():
    Path("./output").mkdir(exist_ok=True)
    return sqlite3.connect(DB_PATH)


def init_tg_db():
    conn = _conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tg_subscribers (
            chat_id    TEXT PRIMARY KEY,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tg_usage (
            chat_id TEXT,
            day     TEXT,
            count   INTEGER DEFAULT 0,
            PRIMARY KEY (chat_id, day)
        )
    """)
    conn.commit()
    conn.close()


def subscribe(chat_id: str):
    conn = _conn()
    conn.execute("INSERT OR IGNORE INTO tg_subscribers (chat_id) VALUES (?)", (chat_id,))
    conn.commit()
    conn.close()


def unsubscribe(chat_id: str):
    conn = _conn()
    conn.execute("DELETE FROM tg_subscribers WHERE chat_id = ?", (chat_id,))
    conn.commit()
    conn.close()


def list_subscribers() -> list:
    conn = _conn()
    rows = conn.execute("SELECT chat_id FROM tg_subscribers").fetchall()
    conn.close()
    return [r[0] for r in rows]


def check_and_count_usage(chat_id: str) -> bool:
    """Increment today's message count; False when over the daily limit."""
    conn = _conn()
    conn.execute(
        "INSERT INTO tg_usage (chat_id, day, count) VALUES (?, date('now'), 1) "
        "ON CONFLICT(chat_id, day) DO UPDATE SET count = count + 1",
        (chat_id,),
    )
    conn.commit()
    row = conn.execute(
        "SELECT count FROM tg_usage WHERE chat_id = ? AND day = date('now')",
        (chat_id,),
    ).fetchone()
    conn.close()
    return row[0] <= DAILY_MSG_LIMIT


# ── Telegram send ─────────────────────────

def send_message(chat_id: str, text: str):
    if not TG_BOT_TOKEN:
        print("[TG] TG_BOT_TOKEN not set, dropping message")
        return
    for i in range(0, len(text), TG_MAX_LEN):
        chunk = text[i:i + TG_MAX_LEN]
        try:
            resp = requests.post(
                f"{TG_API}/sendMessage",
                json={"chat_id": chat_id, "text": chunk},
                timeout=15,
            )
            if not resp.ok:
                print(f"[TG] sendMessage failed {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"[TG] sendMessage error: {e}")


def send_chat_action(chat_id: str, action: str = "typing"):
    if not TG_BOT_TOKEN:
        return
    try:
        requests.post(f"{TG_API}/sendChatAction",
                      json={"chat_id": chat_id, "action": action}, timeout=10)
    except Exception:
        pass


# ── Update handling ───────────────────────

_seen_update_ids: set = set()


def _is_duplicate(update_id) -> bool:
    if update_id in _seen_update_ids:
        return True
    _seen_update_ids.add(update_id)
    if len(_seen_update_ids) > 1000:
        for uid in sorted(_seen_update_ids)[:500]:
            _seen_update_ids.discard(uid)
    return False


def handle_update(update: dict):
    """Process one Telegram update. Blocking; run in a worker thread."""
    if _is_duplicate(update.get("update_id")):
        return
    message = update.get("message") or {}
    chat_id = str((message.get("chat") or {}).get("id", ""))
    text = (message.get("text") or "").strip()
    if not chat_id or not text:
        return

    if text.startswith("/start"):
        subscribe(chat_id)
        send_message(chat_id, "✅ 已訂閱每日收市摘要!\n\n" + HELP_TEXT)
        return
    if text.startswith("/stop"):
        unsubscribe(chat_id)
        send_message(chat_id, "已取消訂閱每日摘要。想返嚟隨時 /start。")
        return
    if text.startswith("/help"):
        send_message(chat_id, HELP_TEXT)
        return
    if text.startswith("/reset"):
        agent.reset_history(chat_id)
        send_message(chat_id, "✅ 對話記憶已清空。")
        return
    if text.startswith("/summary"):
        send_chat_action(chat_id)
        try:
            send_message(chat_id, agent.generate_daily_summary())
        except Exception as e:
            print(f"[TG] summary error: {e}")
            send_message(chat_id, "整摘要嗰陣出咗問題,遲啲再試。")
        return

    # Free-form chat → agent
    if not check_and_count_usage(chat_id):
        send_message(chat_id, f"今日對話已達上限({DAILY_MSG_LIMIT} 條),聽日再傾!")
        return
    send_chat_action(chat_id)
    try:
        reply = agent.chat(chat_id, text)
    except Exception as e:
        print(f"[TG] agent error: {e}")
        reply = "系統出咗少少問題,請遲啲再試。"
    send_message(chat_id, reply)


# ── Daily summary broadcast ───────────────

def broadcast_daily_summary():
    """Generate one LLM summary and push to every subscriber. Blocking."""
    subscribers = list_subscribers()
    if not subscribers:
        print("[TG] No subscribers, skipping daily summary")
        return
    try:
        summary = agent.generate_daily_summary()
    except Exception as e:
        print(f"[TG] daily summary generation failed: {e}")
        return
    for chat_id in subscribers:
        send_message(chat_id, summary)
    print(f"[TG] Daily summary sent to {len(subscribers)} subscriber(s)")
