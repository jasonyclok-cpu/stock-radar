"""每位用戶各自的模擬倉(paper trading)。

純技術分析教育用途,非投資建議。只係模擬,唔接任何真實券商或下單。
讀寫一律 per-user:data/portfolio_<username>.json。
"""
from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INITIAL_CASH = 100_000.0


def _path(username: str) -> Path:
    safe = "".join(c for c in (username or "") if c.isalnum() or c in ("_", "-")) or "default"
    return DATA_DIR / f"portfolio_{safe}.json"


def _empty() -> dict:
    return {"cash": INITIAL_CASH, "positions": {}, "history": []}


def load(username: str) -> dict:
    """讀某用戶的倉,唔存在就回傳初始倉。"""
    p = _path(username)
    if not p.exists():
        return _empty()
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        data.setdefault("cash", INITIAL_CASH)
        data.setdefault("positions", {})
        data.setdefault("history", [])
        return data
    except (json.JSONDecodeError, OSError):
        return _empty()


def save(username: str, data: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(_path(username), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def buy(username: str, ticker: str, shares: float, price: float, date: str | None = None) -> dict:
    """買入:扣現金、加倉、更新平均成本。回傳更新後的倉。"""
    ticker = ticker.strip().upper()
    shares = float(shares)
    price = float(price)
    if shares <= 0 or price <= 0:
        raise ValueError("股數同價格必須大於 0")

    data = load(username)
    cost = shares * price
    if cost > data["cash"] + 1e-6:
        raise ValueError(f"現金不足:需要 ${cost:,.2f},只有 ${data['cash']:,.2f}")

    data["cash"] -= cost
    pos = data["positions"].get(ticker)
    if pos:
        total_shares = pos["shares"] + shares
        pos["avg_cost"] = (pos["avg_cost"] * pos["shares"] + cost) / total_shares
        pos["shares"] = total_shares
    else:
        data["positions"][ticker] = {"shares": shares, "avg_cost": price}

    data["history"].append({
        "date": date, "action": "買入", "ticker": ticker,
        "shares": round(shares, 4), "price": round(price, 2),
    })
    save(username, data)
    return data


def sell(username: str, ticker: str, shares: float, price: float, date: str | None = None) -> dict:
    """賣出:加現金、減倉(歸零就移除持倉)。回傳更新後的倉。"""
    ticker = ticker.strip().upper()
    shares = float(shares)
    price = float(price)
    if shares <= 0 or price <= 0:
        raise ValueError("股數同價格必須大於 0")

    data = load(username)
    pos = data["positions"].get(ticker)
    if not pos or pos["shares"] < shares - 1e-9:
        held = pos["shares"] if pos else 0
        raise ValueError(f"持倉不足:想賣 {shares},只有 {held}")

    data["cash"] += shares * price
    pos["shares"] -= shares
    if pos["shares"] <= 1e-9:
        del data["positions"][ticker]

    data["history"].append({
        "date": date, "action": "賣出", "ticker": ticker,
        "shares": round(shares, 4), "price": round(price, 2),
    })
    save(username, data)
    return data


def equity(username: str, prices: dict | None = None) -> dict:
    """估值:回傳 cash / 持倉市值 / 總權益 / 各持倉明細。

    prices: {ticker: 現價}。冇提供的持倉就用平均成本估(不影響邏輯,只係估值保守)。
    """
    data = load(username)
    prices = prices or {}
    rows = []
    holdings_value = 0.0
    for tkr, pos in data["positions"].items():
        px = float(prices.get(tkr, pos["avg_cost"]))
        mv = pos["shares"] * px
        holdings_value += mv
        rows.append({
            "代號": tkr,
            "股數": round(pos["shares"], 4),
            "平均成本": round(pos["avg_cost"], 2),
            "現價": round(px, 2),
            "市值": round(mv, 2),
            "未實現盈虧": round((px - pos["avg_cost"]) * pos["shares"], 2),
        })
    return {
        "cash": round(data["cash"], 2),
        "holdings_value": round(holdings_value, 2),
        "total_equity": round(data["cash"] + holdings_value, 2),
        "positions": rows,
        "history": data["history"],
    }


def reset(username: str) -> dict:
    """重設某用戶的倉返初始狀態。"""
    data = _empty()
    save(username, data)
    return data
