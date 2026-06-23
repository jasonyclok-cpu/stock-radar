"""Watchlist:逐隻抓數據算分數排序 + 每位用戶各自儲存清單。

純技術分析教育用途,非投資建議。
排序清單存喺 data/watchlist_<username>.json。
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .data_fetch import fetch_data
from .indicators import add_indicators, score_signals

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_TICKERS = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN"]

COLUMNS = ["代號", "現價", "日內變化%", "分數", "偏向", "RSI", "5日動量%"]


def _path(username: str) -> Path:
    safe = "".join(c for c in (username or "") if c.isalnum() or c in ("_", "-")) or "default"
    return DATA_DIR / f"watchlist_{safe}.json"


def load_watchlist(username: str) -> list[str]:
    p = _path(username)
    if not p.exists():
        return list(DEFAULT_TICKERS)
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        tickers = [str(t).strip().upper() for t in data if str(t).strip()]
        return tickers or list(DEFAULT_TICKERS)
    except (json.JSONDecodeError, OSError):
        return list(DEFAULT_TICKERS)


def save_watchlist(username: str, tickers: list[str]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    clean = []
    for t in tickers:
        t = str(t).strip().upper()
        if t and t not in clean:
            clean.append(t)
    with open(_path(username), "w", encoding="utf-8") as f:
        json.dump(clean, f, ensure_ascii=False, indent=2)


def rank(tickers: list[str], period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """逐隻抓數據、算指標、跑 score_signals(),回傳按分數降序的 DataFrame。

    個別代號失敗(代號錯/抓唔到)會 skip,唔會令成個排序爆掉。
    """
    rows = []
    for t in tickers:
        t = str(t).strip().upper()
        if not t:
            continue
        try:
            df = fetch_data(t, period=period, interval=interval)
            ind = add_indicators(df)
            sig = score_signals(ind)
            last = ind.iloc[-1]
            close = float(last["Close"])
            prev_close = float(ind["Close"].iloc[-2]) if len(ind) >= 2 else close
            change = (close / prev_close - 1) * 100 if prev_close else 0.0
            rows.append({
                "代號": t,
                "現價": round(close, 2),
                "日內變化%": round(change, 2),
                "分數": sig["score"],
                "偏向": sig["bias"],
                "RSI": round(sig["rsi"], 1),
                "5日動量%": round(sig["mom5"], 2),
            })
        except Exception:
            # 個別失敗 skip,繼續排其餘
            continue

    out = pd.DataFrame(rows, columns=COLUMNS)
    if not out.empty:
        out = out.sort_values("分數", ascending=False).reset_index(drop=True)
    return out
