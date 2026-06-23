"""簡單回測引擎:用 score_signals() 的分數做全倉進出。

純技術分析教育用途,非投資建議。只示範訊號歷史表現,過往表現唔代表未來。
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .indicators import add_indicators, score_signals

WARMUP = 50  # 由第 50 根 K 線起先開始有足夠歷史計指標


def _max_drawdown(equity: pd.Series) -> float:
    """回傳最大回撤(負數百分比,例如 -23.4)。"""
    if equity.empty:
        return 0.0
    running_max = equity.cummax()
    drawdown = (equity - running_max) / running_max
    return float(drawdown.min() * 100)


def run_backtest(df: pd.DataFrame, score_buy: int = 40, score_sell: int = -40, capital: float = 100_000) -> dict:
    """由第 50 根 K 線起逐根重算 score_signals():

      分數 >= score_buy 且空倉  → 全倉買入
      分數 <= score_sell 且持倉 → 全部賣出

    回傳 dict:
      equity      : DataFrame(index=日期,strategy / buy_hold / price)
      trades      : DataFrame(交易清單)
      performance : dict(總報酬% / 年化% / 最大回撤% / 勝率% / 交易次數 / 超額%)
    """
    if df is None or len(df) <= WARMUP:
        raise ValueError(f"資料太短,至少要 {WARMUP + 1} 根 K 線先可以回測")

    ind = add_indicators(df)
    n = len(ind)
    cash = float(capital)
    shares = 0.0
    entry_price = 0.0

    dates, strat_equity = [], []
    trades: list[dict] = []
    closed_pnls: list[float] = []

    for i in range(WARMUP, n):
        window = ind.iloc[: i + 1]
        price = float(ind["Close"].iloc[i])
        date = ind.index[i]
        sc = score_signals(window)["score"]

        if sc >= score_buy and shares == 0:
            shares = cash / price
            entry_price = price
            cash = 0.0
            trades.append({
                "日期": date, "動作": "買入", "價格": round(price, 2),
                "股數": round(shares, 4), "分數": sc, "盈虧": np.nan,
            })
        elif sc <= score_sell and shares > 0:
            proceeds = shares * price
            pnl = (price - entry_price) * shares
            closed_pnls.append(pnl)
            cash = proceeds
            trades.append({
                "日期": date, "動作": "賣出", "價格": round(price, 2),
                "股數": round(shares, 4), "分數": sc, "盈虧": round(pnl, 2),
            })
            shares = 0.0
            entry_price = 0.0

        dates.append(date)
        strat_equity.append(cash + shares * price)

    # buy & hold 基準:第 50 根就全倉買入,一直持有
    price_start = float(ind["Close"].iloc[WARMUP])
    prices = ind["Close"].iloc[WARMUP:].astype(float)
    buy_hold = (capital / price_start) * prices.values

    equity = pd.DataFrame({
        "strategy": strat_equity,
        "buy_hold": buy_hold,
        "price": prices.values,
    }, index=pd.Index(dates, name="Date"))

    trades_df = pd.DataFrame(trades)

    final_equity = float(strat_equity[-1])
    total_return = (final_equity / capital - 1) * 100
    bh_return = (buy_hold[-1] / capital - 1) * 100

    years = max(len(equity) / 252.0, 1e-9)
    annualized = ((final_equity / capital) ** (1 / years) - 1) * 100 if final_equity > 0 else -100.0

    wins = sum(1 for p in closed_pnls if p > 0)
    win_rate = (wins / len(closed_pnls) * 100) if closed_pnls else 0.0

    performance = {
        "總報酬%": round(total_return, 2),
        "年化報酬%": round(annualized, 2),
        "最大回撤%": round(_max_drawdown(equity["strategy"]), 2),
        "勝率%": round(win_rate, 2),
        "交易次數": len(trades_df),
        "完成回合": len(closed_pnls),
        "Buy&Hold報酬%": round(bh_return, 2),
        "相對Buy&Hold超額%": round(total_return - bh_return, 2),
    }

    return {"equity": equity, "trades": trades_df, "performance": performance}
