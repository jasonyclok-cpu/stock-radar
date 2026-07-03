"""
Market Regime (市場溫度計) — US Stock Radar Phase 1.

Computes a daily market "light" (GREEN / YELLOW / RED) from four indicators:
  1. Trend     : SPY close vs MA50 / MA200
  2. Fear      : ^VIX level + 5-day change
  3. Breadth   : % of 11 SPDR sector ETFs above their MA50
                 (proxy until the Phase-2 full universe exists)
  4. Momentum  : QQQ 20-day return

Plus the design's 3.4A "genuine rally" checks — when SPY is rising but the
rise looks like a bear-market rally (narrow breadth / equal-weight lagging /
shrinking volume / below MA200), the light is capped at YELLOW.

Dow-theory tide: weekly MA30 direction of SPY (major trend).
"""

import json
import sqlite3

import numpy as np
import pandas as pd
import yfinance as yf


def _fetch(symbol: str, period: str) -> pd.DataFrame:
    # 自帶輕量 fetch，唔 import analysis_engine：
    # 一嚟避免拖入 ta/akshare/matplotlib 等重依賴，二嚟避免循環 import
    # （analysis_engine 嘅晨報反過嚟 import 本模組）
    try:
        df = yf.Ticker(symbol).history(period=period)
        if df.empty:
            return pd.DataFrame()
        return df[["Open", "High", "Low", "Close", "Volume"]]
    except Exception as e:
        print(f"[ERROR] regime fetch ({symbol}): {e}")
        return pd.DataFrame()


SECTOR_ETFS = ["XLK", "XLF", "XLE", "XLV", "XLI",
               "XLP", "XLY", "XLU", "XLB", "XLRE", "XLC"]

LIGHT_META = {
    "GREEN":  {"emoji": "🟢", "name": "綠燈", "advice": "正常執行買入訊號"},
    "YELLOW": {"emoji": "🟡", "name": "黃燈", "advice": "只做強訊號，倉位減半"},
    "RED":    {"emoji": "🔴", "name": "紅燈", "advice": "唔開新倉，只提示沽出訊號"},
}


def _round(v, n=2):
    try:
        f = float(v)
        return None if np.isnan(f) else round(f, n)
    except Exception:
        return None


# ── Indicator helpers ─────────────────────


def _trend_indicator(spy: pd.DataFrame) -> dict:
    close = spy["Close"]
    ma50 = close.rolling(50).mean().iloc[-1]
    ma200 = close.rolling(200).mean().iloc[-1]
    ma200_prev = close.rolling(200).mean().iloc[-21] if len(close) >= 221 else np.nan
    last = close.iloc[-1]
    healthy = bool(last > ma200)
    return {
        "healthy": healthy,
        "close": _round(last),
        "ma50": _round(ma50),
        "ma200": _round(ma200),
        "ma200_rising": bool(ma200 > ma200_prev) if not np.isnan(ma200_prev) else None,
        "text": f"SPY {last:.0f} {'>' if healthy else '<'} MA200 {ma200:.0f}",
    }


def _vix_indicator(vix: pd.DataFrame) -> dict:
    close = vix["Close"]
    level = float(close.iloc[-1])
    chg5d = level - float(close.iloc[-6]) if len(close) >= 6 else 0.0
    healthy = bool(level < 25 and chg5d < 5)
    return {
        "healthy": healthy,
        "level": _round(level),
        "chg5d": _round(chg5d),
        "text": f"VIX {level:.1f}（5日{chg5d:+.1f}）",
    }


def _breadth_indicator(sector_dfs: dict) -> dict:
    def pct_above_ma50(offset: int) -> tuple:
        above, total = 0, 0
        for df in sector_dfs.values():
            close = df["Close"]
            if len(close) < 50 + offset:
                continue
            end = len(close) - offset
            ma50 = close.iloc[:end].rolling(50).mean().iloc[-1]
            if np.isnan(ma50):
                continue
            total += 1
            if close.iloc[end - 1] > ma50:
                above += 1
        return above, total

    above_now, total = pct_above_ma50(0)
    above_5d, total_5d = pct_above_ma50(5)
    pct_now = above_now / total * 100 if total else np.nan
    pct_5d = above_5d / total_5d * 100 if total_5d else np.nan
    healthy = bool(pct_now >= 60) if not np.isnan(pct_now) else False
    return {
        "healthy": healthy,
        "pct_above_ma50": _round(pct_now, 1),
        "pct_5d_ago": _round(pct_5d, 1),
        "sectors_above": above_now,
        "sectors_total": total,
        "text": f"{above_now}/{total} 板塊企穩MA50（{pct_now:.0f}%）",
    }


def _momentum_indicator(qqq: pd.DataFrame) -> dict:
    close = qqq["Close"]
    ret20 = float(close.iloc[-1] / close.iloc[-21] - 1) * 100 if len(close) >= 21 else np.nan
    healthy = bool(ret20 > 0) if not np.isnan(ret20) else False
    return {
        "healthy": healthy,
        "qqq_ret20_pct": _round(ret20),
        "text": f"QQQ 20日 {ret20:+.1f}%",
    }


# ── Genuine-rally checks (design 3.4A) ────


def _rally_checks(spy: pd.DataFrame, rsp: pd.DataFrame, breadth: dict) -> dict:
    close = spy["Close"]
    ret20 = float(close.iloc[-1] / close.iloc[-21] - 1) if len(close) >= 21 else 0.0
    is_rising = ret20 > 0

    # 1. Breadth confirms: breadth not falling while index rises
    b_now, b_5d = breadth.get("pct_above_ma50"), breadth.get("pct_5d_ago")
    breadth_ok = bool(b_now is not None and b_5d is not None and b_now >= b_5d)

    # 2. Equal-weight participates: RSP 20-day return also positive
    rsp_close = rsp["Close"]
    rsp_ret20 = float(rsp_close.iloc[-1] / rsp_close.iloc[-21] - 1) if len(rsp_close) >= 21 else np.nan
    equal_weight_ok = bool(rsp_ret20 > 0) if not np.isnan(rsp_ret20) else False

    # 3. Volume supports: up-days in last 10 sessions not drying up vs 20d avg
    vol = spy["Volume"]
    vol_ma20 = vol.rolling(20).mean().iloc[-1]
    recent = spy.tail(10)
    up_days = recent[recent["Close"] > recent["Close"].shift(1).fillna(recent["Close"])]
    up_vol = float(up_days["Volume"].mean()) if len(up_days) else np.nan
    volume_ok = bool(up_vol >= 0.9 * vol_ma20) if not (np.isnan(up_vol) or np.isnan(vol_ma20)) else False

    # 4. Structure: rally above MA200 is a trend, below is a bounce
    ma200 = close.rolling(200).mean().iloc[-1]
    above_ma200 = bool(close.iloc[-1] > ma200) if not np.isnan(ma200) else False

    checks = {
        "breadth_confirms": breadth_ok,
        "equal_weight_participates": equal_weight_ok,
        "volume_supports": volume_ok,
        "above_ma200": above_ma200,
    }
    passed = sum(checks.values())
    return {
        "is_rising": bool(is_rising),
        "spy_ret20_pct": _round(ret20 * 100),
        "rsp_ret20_pct": _round(rsp_ret20 * 100) if not np.isnan(rsp_ret20) else None,
        "checks": checks,
        "passed": int(passed),
        "genuine": bool(passed >= 3),
    }


# ── Dow tide (weekly major trend) ─────────


def _dow_tide(spy: pd.DataFrame) -> dict:
    weekly = spy["Close"].resample("W-FRI").last().dropna()
    if len(weekly) < 34:
        return {"direction": "UNKNOWN", "text": "數據不足"}
    wma30 = weekly.rolling(30).mean()
    last, ma_now, ma_prev = weekly.iloc[-1], wma30.iloc[-1], wma30.iloc[-5]
    up = bool(last > ma_now and ma_now > ma_prev)
    down = bool(last < ma_now and ma_now < ma_prev)
    direction = "UP" if up else ("DOWN" if down else "FLAT")
    label = {"UP": "潮汐向上", "DOWN": "潮汐向下", "FLAT": "潮汐橫行"}[direction]
    return {
        "direction": direction,
        "weekly_close": _round(last),
        "weekly_ma30": _round(ma_now),
        "text": f"{label}（週線 {last:.0f} vs MA30 {ma_now:.0f}）",
    }


# ── State description ─────────────────────


def _state_text(light: str, indicators: dict, rally: dict, tide: dict, capped: bool) -> str:
    parts = []
    if capped:
        parts.append("指數升緊但升勢質素差（" + "、".join(
            name for name, ok in zip(
                ["市寬冇跟", "等權落後", "縮量", "MA200之下"],
                [not rally["checks"]["breadth_confirms"],
                 not rally["checks"]["equal_weight_participates"],
                 not rally["checks"]["volume_supports"],
                 not rally["checks"]["above_ma200"]],
            ) if ok) + "），具窄升／熊市反彈特徵")
    elif light == "GREEN":
        parts.append("趨勢、市寬、動量配合，屬健康升市")
    elif light == "RED":
        vix = indicators["vix"]
        breadth = indicators["breadth"]
        if vix["level"] and vix["level"] > 30 and (breadth["pct_above_ma50"] or 100) < 20:
            parts.append("VIX 飆升兼市寬極低，具恐慌拋售特徵（可能接近尾聲，但唔好接刀）")
        else:
            parts.append("多項指標轉弱，防守為主")
    else:
        trend = indicators["trend"]
        breadth = indicators["breadth"]
        if trend["healthy"] and not breadth["healthy"]:
            parts.append("指數企穩但市寬轉弱，具派發特徵，謹慎樂觀")
        else:
            parts.append("好淡爭持，等訊號明朗")
    parts.append(tide["text"])
    return "；".join(parts)


# ── Main entry ────────────────────────────


def compute_market_regime() -> dict:
    spy = _fetch("SPY", "2y")
    qqq = _fetch("QQQ", "6mo")
    vix = _fetch("^VIX", "6mo")
    rsp = _fetch("RSP", "6mo")
    if spy.empty or qqq.empty or vix.empty:
        raise RuntimeError("regime data fetch failed (SPY/QQQ/^VIX empty)")

    sector_dfs = {}
    for etf in SECTOR_ETFS:
        df = _fetch(etf, "6mo")
        if not df.empty:
            sector_dfs[etf] = df
    if len(sector_dfs) < 8:
        raise RuntimeError(f"breadth data insufficient ({len(sector_dfs)}/11 sector ETFs)")

    indicators = {
        "trend": _trend_indicator(spy),
        "vix": _vix_indicator(vix),
        "breadth": _breadth_indicator(sector_dfs),
        "momentum": _momentum_indicator(qqq),
    }
    score = sum(1 for ind in indicators.values() if ind["healthy"])
    light = "GREEN" if score >= 3 else ("YELLOW" if score == 2 else "RED")

    rally = _rally_checks(spy, rsp if not rsp.empty else spy, indicators["breadth"])
    capped = bool(light == "GREEN" and rally["is_rising"] and not rally["genuine"])
    if capped:
        light = "YELLOW"

    tide = _dow_tide(spy)
    meta = LIGHT_META[light]

    return {
        "date": str(spy.index[-1].date()),
        "computed_at": pd.Timestamp.now().isoformat(),
        "light": light,
        "emoji": meta["emoji"],
        "light_name": meta["name"],
        "advice": meta["advice"],
        "score": int(score),
        "capped_by_rally_quality": capped,
        "indicators": indicators,
        "rally_check": rally,
        "tide": tide,
        "state_text": _state_text(light, indicators, rally, tide, capped),
    }


# ── SQLite daily cache ────────────────────


def init_regime_table(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS regime (
            date        TEXT PRIMARY KEY,
            light       TEXT,
            data        TEXT,
            computed_at TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_regime(db_path: str, regime: dict) -> None:
    init_regime_table(db_path)
    conn = sqlite3.connect(db_path)
    conn.execute(
        "INSERT OR REPLACE INTO regime (date, light, data, computed_at) VALUES (?,?,?,?)",
        (regime["date"], regime["light"], json.dumps(regime, ensure_ascii=False),
         regime["computed_at"]),
    )
    conn.commit()
    conn.close()


def load_cached_regime(db_path: str, max_age_hours: float = 12.0) -> dict | None:
    """Return the most recent cached regime if fresh enough, else None."""
    init_regime_table(db_path)
    conn = sqlite3.connect(db_path)
    row = conn.execute(
        "SELECT data, computed_at FROM regime ORDER BY date DESC LIMIT 1"
    ).fetchone()
    conn.close()
    if not row:
        return None
    age_h = (pd.Timestamp.now() - pd.Timestamp(row[1])).total_seconds() / 3600
    if age_h > max_age_hours:
        return None
    return json.loads(row[0])


def get_market_regime(db_path: str, refresh: bool = False) -> dict:
    """Cached accessor used by the API and the morning report."""
    if not refresh:
        cached = load_cached_regime(db_path)
        if cached:
            return cached
    regime = compute_market_regime()
    save_regime(db_path, regime)
    return regime


def format_regime_message(regime: dict) -> str:
    """Plain-text block for the Telegram/Email morning report."""
    ind = regime["indicators"]
    mark = lambda ok: "✅" if ok else "❌"
    lines = [
        f"🌡️ 市場溫度計 {regime['date']}",
        f"{regime['emoji']} {regime['light_name']}"
        f"（{regime['score']}/4 健康{'，升勢質素降級' if regime['capped_by_rally_quality'] else ''}）"
        f"— {regime['advice']}",
        f"・趨勢：{ind['trend']['text']} {mark(ind['trend']['healthy'])}",
        f"・恐慌：{ind['vix']['text']} {mark(ind['vix']['healthy'])}",
        f"・市寬：{ind['breadth']['text']} {mark(ind['breadth']['healthy'])}",
        f"・動量：{ind['momentum']['text']} {mark(ind['momentum']['healthy'])}",
    ]
    rally = regime["rally_check"]
    if rally["is_rising"]:
        tag = "真升市" if rally["genuine"] else "⚠️ 疑似假升勢"
        lines.append(f"・升勢質素：{rally['passed']}/4 通過（{tag}）")
    if regime["capped_by_rally_quality"]:
        lines.append("・⚠️ 升勢質素唔過關，燈號已降級")
    lines.append(f"狀態：{regime['state_text']}")
    return "\n".join(lines)


if __name__ == "__main__":
    r = compute_market_regime()
    print(format_regime_message(r))
    print("\n--- raw ---")
    print(json.dumps(r, ensure_ascii=False, indent=2))
