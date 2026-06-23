"""技術指標 + 綜合訊號評分 score_signals()。

純技術分析教育用途,非投資建議。評分純粹係指標組合,唔代表任何買賣推薦。
"""
from __future__ import annotations

import numpy as np
import pandas as pd

_NEEDED = {"EMA20", "EMA50", "SMA200", "RSI", "MACD_hist", "Mom5"}


def _ema(s: pd.Series, span: int) -> pd.Series:
    return s.ewm(span=span, adjust=False).mean()


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - 100 / (1 + rs)
    return rsi.fillna(50.0)


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """計常用技術指標,回傳含指標欄位的新 DataFrame。"""
    out = df.copy()
    close = out["Close"]
    out["EMA20"] = _ema(close, 20)
    out["EMA50"] = _ema(close, 50)
    out["SMA200"] = close.rolling(200, min_periods=1).mean()
    out["RSI"] = _rsi(close, 14)
    ema12 = _ema(close, 12)
    ema26 = _ema(close, 26)
    out["MACD"] = ema12 - ema26
    out["MACD_signal"] = _ema(out["MACD"], 9)
    out["MACD_hist"] = out["MACD"] - out["MACD_signal"]
    out["Mom5"] = close.pct_change(5) * 100
    out["Mom10"] = close.pct_change(10) * 100
    return out


def _bias(score: int) -> str:
    if score >= 20:
        return "偏多"
    if score <= -20:
        return "偏空"
    return "中性"


def score_signals(df: pd.DataFrame) -> dict:
    """由 OHLCV(或已含指標)的 df 計最後一根 K 線的綜合分數。

    回傳 dict:
      score : int  介乎約 -100 ~ +100,越高越偏多
      bias  : str  偏多 / 偏空 / 中性
      rsi   : float 最後一根的 RSI
      mom5  : float 5 日動量 %
      reasons : list[str] 各項貢獻的可讀說明

    回測同 Watchlist 都係叫呢個 function,確保口徑一致。
    """
    if df is None or len(df) == 0:
        return {"score": 0, "bias": "中性", "rsi": float("nan"), "mom5": float("nan"), "reasons": []}

    if not _NEEDED.issubset(df.columns):
        df = add_indicators(df)

    last = df.iloc[-1]
    close = float(last["Close"])
    score = 0
    reasons: list[str] = []

    # 1) 價 vs EMA20(短線趨勢)
    if close > last["EMA20"]:
        score += 15
        reasons.append("價在 EMA20 上方(+15)")
    else:
        score -= 15
        reasons.append("價在 EMA20 下方(-15)")

    # 2) EMA20 vs EMA50(趨勢方向)
    if last["EMA20"] > last["EMA50"]:
        score += 15
        reasons.append("EMA20 在 EMA50 上方,趨勢偏多(+15)")
    else:
        score -= 15
        reasons.append("EMA20 在 EMA50 下方,趨勢偏空(-15)")

    # 3) 價 vs SMA200(長線背景)
    if close > last["SMA200"]:
        score += 15
        reasons.append("價在 SMA200 上方,長線偏多(+15)")
    else:
        score -= 15
        reasons.append("價在 SMA200 下方,長線偏空(-15)")

    # 4) MACD 柱(動能)
    if last["MACD_hist"] > 0:
        score += 15
        reasons.append("MACD 柱為正,動能偏多(+15)")
    else:
        score -= 15
        reasons.append("MACD 柱為負,動能偏空(-15)")

    # 5) RSI(超買超賣)
    rsi = float(last["RSI"])
    if rsi < 30:
        score += 20
        reasons.append(f"RSI {rsi:.0f} 超賣,有反彈傾向(+20)")
    elif rsi > 70:
        score -= 20
        reasons.append(f"RSI {rsi:.0f} 超買,有回吐傾向(-20)")
    elif rsi >= 50:
        score += 10
        reasons.append(f"RSI {rsi:.0f} 偏強(+10)")
    else:
        score -= 10
        reasons.append(f"RSI {rsi:.0f} 偏弱(-10)")

    # 6) 5 日動量
    mom5 = float(last["Mom5"]) if not pd.isna(last["Mom5"]) else 0.0
    if mom5 > 3:
        score += 20
        reasons.append(f"5 日動量 +{mom5:.1f}% 強(+20)")
    elif mom5 > 0:
        score += 10
        reasons.append(f"5 日動量 +{mom5:.1f}%(+10)")
    elif mom5 < -3:
        score -= 20
        reasons.append(f"5 日動量 {mom5:.1f}% 弱(-20)")
    else:
        score -= 10
        reasons.append(f"5 日動量 {mom5:.1f}%(-10)")

    score = int(max(-100, min(100, score)))
    return {
        "score": score,
        "bias": _bias(score),
        "rsi": rsi,
        "mom5": mom5,
        "reasons": reasons,
    }
