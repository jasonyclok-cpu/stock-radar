"""資料抓取層:用 yfinance 抓美股 OHLCV。

純技術分析教育用途,非投資建議。只用免費 yfinance,唔接付費實時 API。
"""
from __future__ import annotations

import pandas as pd
import yfinance as yf

DEFAULT_PERIOD = "1y"
DEFAULT_INTERVAL = "1d"

# 常見可揀的時間範圍 / K 線週期(俾 UI 用)
PERIODS = ["3mo", "6mo", "1y", "2y", "5y"]
INTERVALS = ["1d", "1h", "1wk"]


def fetch_data(ticker: str, period: str = DEFAULT_PERIOD, interval: str = DEFAULT_INTERVAL) -> pd.DataFrame:
    """抓單一美股 OHLCV,回傳 DataFrame(index=日期,欄位 Open/High/Low/Close/Volume)。

    抓唔到(代號錯、無網絡、被擋)會 raise ValueError,由呼叫方決定點處理。
    """
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("代號不能為空")

    df = yf.download(
        ticker,
        period=period,
        interval=interval,
        progress=False,
        auto_adjust=True,
    )
    if df is None or df.empty:
        raise ValueError(f"抓不到 {ticker} 的資料(代號錯誤或暫時無法連線)")

    # 單一代號時 yfinance 有機會回傳 MultiIndex 欄位,攤平佢
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.rename(columns=str.title)
    keep = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
    df = df[keep].dropna()
    if df.empty:
        raise ValueError(f"{ticker} 的資料不足以分析")
    df.index.name = "Date"
    return df


def latest_price(ticker: str, period: str = "5d", interval: str = "1d") -> float:
    """攞最近收市價(俾模擬倉估值用)。"""
    df = fetch_data(ticker, period=period, interval=interval)
    return float(df["Close"].iloc[-1])
