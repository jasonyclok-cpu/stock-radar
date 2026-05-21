"""
Stock Analysis Engine
Supports A-shares (akshare), HK stocks and US stocks (yfinance).
Modules: Technical indicators, signals, batch scan, backtest,
         Kelly sizing, Monte Carlo, LightGBM scoring, charting, notifications.
"""

import warnings
import time as time_module
import json
import smtplib
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd
import requests
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.gridspec import GridSpec
from scipy.stats import norm
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

import yfinance as yf
import akshare as ak
from ta.trend import MACD, EMAIndicator
from ta.momentum import RSIIndicator
from ta.volatility import AverageTrueRange

warnings.filterwarnings("ignore")

plt.rcParams["font.family"] = ["Arial Unicode MS", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

OUTPUT_DIR = Path("./output")
OUTPUT_DIR.mkdir(exist_ok=True)


# ─────────────────────────────────────────
# MODULE A：Data Fetching
# ─────────────────────────────────────────

def fetch_price_data(symbol: str, period: str = "1y") -> pd.DataFrame:
    try:
        if symbol.startswith(("sh", "sz")):
            return _fetch_a_share(symbol, period)
        else:
            return _fetch_yfinance(symbol, period)
    except Exception as e:
        print(f"[ERROR] fetch_price_data ({symbol}): {e}")
        return pd.DataFrame()


def _fetch_a_share(symbol: str, period: str) -> pd.DataFrame:
    try:
        code = symbol[2:]
        raw = ak.stock_zh_a_hist(symbol=code, period="daily", adjust="qfq")
        raw = raw.rename(columns={
            "日期": "Date", "开盘": "Open", "最高": "High",
            "最低": "Low", "收盘": "Close", "成交量": "Volume"
        })
        raw["Date"] = pd.to_datetime(raw["Date"])
        raw = raw.set_index("Date").sort_index()
        period_map = {"1y": 252, "6mo": 126, "3mo": 63, "2y": 504, "3y": 756}
        n = period_map.get(period, 252)
        return raw[["Open", "High", "Low", "Close", "Volume"]].tail(n)
    except Exception as e:
        raise RuntimeError(f"akshare failed: {e}")


def _fetch_yfinance(symbol: str, period: str) -> pd.DataFrame:
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
        if df.empty:
            raise ValueError(f"Empty data for {symbol}")
        return df[["Open", "High", "Low", "Close", "Volume"]]
    except Exception as e:
        raise RuntimeError(f"yfinance failed: {e}")


def fetch_fundamentals(symbol: str) -> pd.DataFrame:
    try:
        if symbol.startswith(("sh", "sz")):
            return _fetch_a_share_fundamentals(symbol)
        else:
            return _fetch_yf_fundamentals(symbol)
    except Exception as e:
        print(f"[ERROR] fetch_fundamentals ({symbol}): {e}")
        return pd.DataFrame()


def _fetch_a_share_fundamentals(symbol: str) -> pd.DataFrame:
    try:
        code = symbol[2:]
        valuation = ak.stock_a_lg_indicator(symbol=code)
        pe = valuation["pe"].iloc[-1] if "pe" in valuation.columns else np.nan
        pb = valuation["pb"].iloc[-1] if "pb" in valuation.columns else np.nan
        return pd.DataFrame([{
            "Market": "A股", "Symbol": symbol,
            "PE_TTM": pe, "PB": pb,
            "ROE_Latest": np.nan, "FCF_Latest": np.nan,
        }])
    except Exception as e:
        raise RuntimeError(f"A-share fundamentals failed: {e}")


def _fetch_yf_fundamentals(symbol: str) -> pd.DataFrame:
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        try:
            cf = ticker.cashflow
            cfo   = cf.loc["Operating Cash Flow"].iloc[0] if "Operating Cash Flow" in cf.index else np.nan
            capex = cf.loc["Capital Expenditure"].iloc[0]  if "Capital Expenditure" in cf.index else np.nan
            fcf = (cfo + capex) if not (np.isnan(cfo) or np.isnan(capex)) else np.nan
        except Exception:
            fcf = np.nan
        return pd.DataFrame([{
            "Market": "HK" if symbol.endswith(".HK") else "US",
            "Symbol": symbol,
            "PE_TTM": info.get("trailingPE", np.nan),
            "PB":     info.get("priceToBook", np.nan),
            "ROE_Latest": info.get("returnOnEquity", np.nan),
            "FCF_Latest": fcf,
        }])
    except Exception as e:
        raise RuntimeError(f"yfinance fundamentals failed: {e}")


# ─────────────────────────────────────────
# MODULE B：Technical Indicators & Signals
# ─────────────────────────────────────────

def calc_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or len(df) < 60:
        return df
    try:
        result = df.copy()
        result["MA20"] = result["Close"].rolling(20).mean()
        result["MA60"] = result["Close"].rolling(60).mean()
        result["MA5"]  = result["Close"].rolling(5).mean()
        rsi = RSIIndicator(close=result["Close"], window=14)
        result["RSI14"] = rsi.rsi()
        macd = MACD(close=result["Close"], window_slow=26, window_fast=12, window_sign=9)
        result["MACD"]        = macd.macd()
        result["MACD_Signal"] = macd.macd_signal()
        result["MACD_Hist"]   = macd.macd_diff()
        atr = AverageTrueRange(
            high=result["High"], low=result["Low"],
            close=result["Close"], window=14
        )
        result["ATR14"] = atr.average_true_range()
        return result
    except Exception as e:
        print(f"[ERROR] calc_technical_indicators: {e}")
        return df


def generate_trade_signals(df: pd.DataFrame) -> pd.DataFrame:
    required = {"MA20", "MA60", "RSI14", "MACD", "MACD_Signal"}
    if not required.issubset(df.columns):
        return df
    try:
        d = df.copy()
        d["BUY_MA"]   = (d["MA20"] > d["MA60"]) & (d["MA20"].shift(1) <= d["MA60"].shift(1))
        d["SELL_MA"]  = (d["MA20"] < d["MA60"]) & (d["MA20"].shift(1) >= d["MA60"].shift(1))
        d["BUY_RSI"]  = (d["RSI14"] > 30) & (d["RSI14"].shift(1) <= 30)
        d["SELL_RSI"] = (d["RSI14"] < 70) & (d["RSI14"].shift(1) >= 70)
        d["BUY_MACD"]  = (d["MACD"] > d["MACD_Signal"]) & (d["MACD"].shift(1) <= d["MACD_Signal"].shift(1))
        d["SELL_MACD"] = (d["MACD"] < d["MACD_Signal"]) & (d["MACD"].shift(1) >= d["MACD_Signal"].shift(1))
        d["BUY_SCORE"]  = d[["BUY_MA",  "BUY_RSI",  "BUY_MACD"]].sum(axis=1)
        d["SELL_SCORE"] = d[["SELL_MA", "SELL_RSI", "SELL_MACD"]].sum(axis=1)
        d["STRONG_BUY"]  = d["BUY_SCORE"]  >= 2
        d["STRONG_SELL"] = d["SELL_SCORE"] >= 2
        return d
    except Exception as e:
        print(f"[ERROR] generate_trade_signals: {e}")
        return df


def analyze_stock(symbol: str, period: str = "1y") -> dict:
    print(f"\n{'='*50}\n  {symbol}  |  {period}\n{'='*50}")
    price_df = fetch_price_data(symbol, period)
    if price_df.empty:
        return {}
    tech_df = calc_technical_indicators(price_df)
    tech_df = generate_trade_signals(tech_df)
    fund_df = fetch_fundamentals(symbol)
    cols = ["Close", "MA20", "MA60", "RSI14", "MACD_Hist", "ATR14",
            "BUY_SCORE", "SELL_SCORE", "STRONG_BUY", "STRONG_SELL"]
    avail = [c for c in cols if c in tech_df.columns]
    latest = tech_df[avail].tail(5).round(4)
    print("\n[Technical - Last 5 Days]")
    print(latest.to_string())
    return {"technical": tech_df, "fundamentals": fund_df, "latest_signals": latest}


# ─────────────────────────────────────────
# MODULE C：Batch Scanner
# ─────────────────────────────────────────

def scan_watchlist(
    symbols: list,
    period: str = "6mo",
    min_buy_score: int = 2,
    max_workers: int = 3,
    sleep_between: float = 0.5,
) -> pd.DataFrame:
    records = []

    def _scan_one(sym: str):
        try:
            price_df = fetch_price_data(sym, period)
            if price_df.empty or len(price_df) < 60:
                return None
            tech_df = calc_technical_indicators(price_df)
            tech_df = generate_trade_signals(tech_df)
            latest  = tech_df.iloc[-1]
            ma20 = latest.get("MA20", np.nan)
            return {
                "Symbol":      sym,
                "Close":       round(float(latest["Close"]), 3),
                "MA20":        round(float(ma20), 3) if not np.isnan(float(ma20)) else None,
                "RSI14":       round(float(latest.get("RSI14", 0)), 2),
                "MACD_Hist":   round(float(latest.get("MACD_Hist", 0)), 4),
                "ATR14":       round(float(latest.get("ATR14", 0)), 3),
                "VOL_RATIO":   round(float(latest["Volume"] / tech_df["Volume"].rolling(20).mean().iloc[-1]), 2)
                               if "Volume" in tech_df.columns else None,
                "BUY_SCORE":   int(latest.get("BUY_SCORE", 0)),
                "SELL_SCORE":  int(latest.get("SELL_SCORE", 0)),
                "STRONG_BUY":  bool(latest.get("STRONG_BUY", False)),
                "STRONG_SELL": bool(latest.get("STRONG_SELL", False)),
            }
        except Exception as e:
            print(f"  [SKIP] {sym}: {e}")
            return None

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_scan_one, s): s for s in symbols}
        for future in as_completed(futures):
            result = future.result()
            if result:
                records.append(result)
            time_module.sleep(sleep_between)

    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records).sort_values(
        ["BUY_SCORE", "RSI14"], ascending=[False, True]
    ).reset_index(drop=True)
    screened = df[df["BUY_SCORE"] >= min_buy_score].copy()
    print(f"\n[Scan] {len(df)} scanned, {len(screened)} with BUY_SCORE >= {min_buy_score}")
    return screened


# ─────────────────────────────────────────
# MODULE D：Backtest Engine
# ─────────────────────────────────────────

def backtest(
    symbol: str,
    period: str = "2y",
    strategy: str = "COMBINED",
    initial_capital: float = 100_000.0,
    position_pct: float = 0.95,
    stop_loss_pct: float = 0.07,
    take_profit_pct: float = 0.20,
) -> dict:
    price_df = fetch_price_data(symbol, period)
    if price_df.empty:
        return {}
    df = calc_technical_indicators(price_df)
    df = generate_trade_signals(df)
    df = df.dropna(subset=["MA20", "MA60"]).copy()

    strategy_map = {
        "MA_CROSS":   ("BUY_MA",      "SELL_MA"),
        "RSI_BOUNCE": ("BUY_RSI",     "SELL_RSI"),
        "MACD_CROSS": ("BUY_MACD",    "SELL_MACD"),
        "COMBINED":   ("STRONG_BUY",  "STRONG_SELL"),
    }
    buy_col, sell_col = strategy_map.get(strategy, ("STRONG_BUY", "STRONG_SELL"))

    cash = initial_capital
    position = 0.0
    entry_price = 0.0
    trades = []
    equity_curve = []

    for date, row in df.iterrows():
        price = row["Close"]
        in_position = position > 0

        if in_position:
            pnl_pct = (price - entry_price) / entry_price
            if pnl_pct <= -stop_loss_pct:
                proceeds = position * price
                cash += proceeds
                trades.append({"Date": date, "Action": "STOP_LOSS",
                               "Price": round(price, 4), "Shares": round(position, 4),
                               "PnL": round(proceeds - position * entry_price, 2),
                               "PnL%": round(pnl_pct * 100, 2), "Trigger": "stop_loss"})
                position, entry_price = 0.0, 0.0
                in_position = False
            elif pnl_pct >= take_profit_pct:
                proceeds = position * price
                cash += proceeds
                trades.append({"Date": date, "Action": "TAKE_PROFIT",
                               "Price": round(price, 4), "Shares": round(position, 4),
                               "PnL": round(proceeds - position * entry_price, 2),
                               "PnL%": round(pnl_pct * 100, 2), "Trigger": "take_profit"})
                position, entry_price = 0.0, 0.0
                in_position = False

        if row.get(buy_col, False) and not in_position and cash > 0:
            invest = cash * position_pct
            shares = invest / price
            cash -= invest
            position, entry_price = shares, price
            trades.append({"Date": date, "Action": "BUY",
                           "Price": round(price, 4), "Shares": round(shares, 4),
                           "PnL": 0.0, "PnL%": 0.0, "Trigger": buy_col})
        elif row.get(sell_col, False) and in_position:
            proceeds = position * price
            pnl = proceeds - position * entry_price
            cash += proceeds
            trades.append({"Date": date, "Action": "SELL",
                           "Price": round(price, 4), "Shares": round(position, 4),
                           "PnL": round(pnl, 2),
                           "PnL%": round(pnl / (position * entry_price) * 100, 2),
                           "Trigger": sell_col})
            position, entry_price = 0.0, 0.0

        equity_curve.append({
            "Date": date,
            "Equity": round(cash + position * price, 2),
            "Cash": round(cash, 2),
            "Holdings": round(position * price, 2),
        })

    equity_df  = pd.DataFrame(equity_curve).set_index("Date")
    trades_df  = pd.DataFrame(trades) if trades else pd.DataFrame()
    final_eq   = equity_df["Equity"].iloc[-1]
    total_ret  = (final_eq - initial_capital) / initial_capital * 100
    bh_ret     = (df["Close"].iloc[-1] - df["Close"].iloc[0]) / df["Close"].iloc[0] * 100
    rolling_max = equity_df["Equity"].cummax()
    max_dd      = ((equity_df["Equity"] - rolling_max) / rolling_max * 100).min()
    days        = (equity_df.index[-1] - equity_df.index[0]).days
    ann_ret     = ((final_eq / initial_capital) ** (365 / max(days, 1)) - 1) * 100
    daily_ret   = equity_df["Equity"].pct_change().dropna()
    sharpe      = (daily_ret.mean() - 0.03/252) / daily_ret.std() * (252**0.5) \
                  if daily_ret.std() > 0 else 0

    closed = trades_df[trades_df["Action"].isin(["SELL","STOP_LOSS","TAKE_PROFIT"])] \
             if not trades_df.empty else pd.DataFrame()
    win_rate = (closed["PnL"] > 0).mean() * 100 if not closed.empty else 0

    summary = pd.DataFrame([{
        "Symbol": symbol, "Strategy": strategy, "Period": period,
        "Initial_Capital": initial_capital,
        "Final_Equity": round(final_eq, 2),
        "Total_Return%": round(total_ret, 2),
        "Ann_Return%": round(ann_ret, 2),
        "BuyHold_Return%": round(bh_ret, 2),
        "Max_Drawdown%": round(max_dd, 2),
        "Sharpe_Ratio": round(sharpe, 3),
        "Total_Trades": len(closed),
        "Win_Rate%": round(win_rate, 2),
    }])
    return {"summary": summary, "trades": trades_df, "equity_curve": equity_df}


def compare_strategies(symbol: str, period: str = "2y") -> pd.DataFrame:
    results = []
    for s in ["MA_CROSS", "RSI_BOUNCE", "MACD_CROSS", "COMBINED"]:
        try:
            r = backtest(symbol, period=period, strategy=s)
            if r:
                results.append(r["summary"])
        except Exception as e:
            print(f"  [SKIP] {s}: {e}")
    if results:
        return pd.concat(results, ignore_index=True)
    return pd.DataFrame()


# ─────────────────────────────────────────
# MODULE E：Kelly Position Sizer
# ─────────────────────────────────────────

def kelly_position_sizer(
    trades_df: pd.DataFrame,
    capital: float,
    current_price: float,
    atr: float,
    kelly_fraction: float = 0.5,
    max_position_pct: float = 0.25,
    min_position_pct: float = 0.02,
) -> pd.DataFrame:
    closed = trades_df[trades_df["Action"].isin(["SELL","STOP_LOSS","TAKE_PROFIT"])].copy() \
             if not trades_df.empty else pd.DataFrame()
    wins  = (closed[closed["PnL"] > 0]["PnL%"] / 100) if not closed.empty else pd.Series(dtype=float)
    loses = (closed[closed["PnL"] < 0]["PnL%"] / 100) if not closed.empty else pd.Series(dtype=float)
    p = len(wins) / max(len(closed), 1)
    q = 1 - p
    avg_win  = wins.mean()        if len(wins)  > 0 else 0.10
    avg_loss = abs(loses.mean())  if len(loses) > 0 else 0.05
    b = avg_win / avg_loss if avg_loss > 0 else 1.0
    kelly_full   = (b * p - q) / b if b > 0 else 0
    kelly_half   = kelly_full * kelly_fraction
    kelly_capped = max(min_position_pct, min(kelly_half, max_position_pct))
    kelly_capital = capital * kelly_capped
    kelly_shares  = int(kelly_capital / current_price) if current_price > 0 else 0
    risk_per_trade = capital * 0.01
    atr_shares = int(risk_per_trade / atr) if atr > 0 else 0
    return pd.DataFrame([{
        "Win_Rate%": round(p * 100, 2),
        "Payoff_Ratio": round(b, 3),
        "Kelly_Full%": round(kelly_full * 100, 2),
        f"Kelly_{int(kelly_fraction*100)}%": round(kelly_half * 100, 2),
        "Kelly_Capped%": round(kelly_capped * 100, 2),
        "Kelly_Shares": kelly_shares,
        "ATR_Risk_Shares": atr_shares,
        "Recommended_Shares": min(kelly_shares, atr_shares),
    }])


# ─────────────────────────────────────────
# MODULE F：Monte Carlo Simulation
# ─────────────────────────────────────────

def monte_carlo_simulation(
    symbol: str,
    period: str = "1y",
    forecast_days: int = 30,
    n_simulations: int = 2000,
    confidence_levels: list = None,
    save_path: str = None,
) -> dict:
    if confidence_levels is None:
        confidence_levels = [0.95, 0.99]

    price_df = fetch_price_data(symbol, period)
    if price_df.empty:
        return {}
    close    = price_df["Close"].dropna()
    returns  = np.log(close / close.shift(1)).dropna()
    mu, sigma, S0 = returns.mean(), returns.std(), close.iloc[-1]

    np.random.seed(42)
    drift     = (mu - 0.5 * sigma**2)
    diffusion = sigma
    rand_shocks  = np.random.normal(0, 1, (forecast_days, n_simulations))
    log_returns  = drift + diffusion * rand_shocks
    price_paths  = S0 * np.exp(np.cumsum(log_returns, axis=0))
    price_paths  = np.vstack([np.full(n_simulations, S0), price_paths])
    final_prices = price_paths[-1]
    pnl_pct      = (final_prices - S0) / S0 * 100
    percentiles  = [5, 25, 50, 75, 95]
    price_quants = np.percentile(price_paths, percentiles, axis=1)

    risk_rows = []
    for cl in confidence_levels:
        var  = np.percentile(pnl_pct, (1 - cl) * 100)
        cvar = pnl_pct[pnl_pct <= var].mean() if (pnl_pct <= var).any() else var
        risk_rows.append({
            "Confidence": f"{int(cl*100)}%",
            "VaR%": round(var, 3),
            "CVaR%": round(cvar, 3),
            "Prob_Gain%": round((final_prices > S0).mean() * 100, 2),
        })

    forecast_df = pd.DataFrame(price_quants.T,
                               columns=[f"P{p}" for p in percentiles])
    forecast_df["Day"] = range(forecast_days + 1)

    # Chart
    fig, axes = plt.subplots(1, 2, figsize=(14, 5), facecolor="#0d1117")
    fig.suptitle(f"{symbol} Monte Carlo ({n_simulations:,} simulations)",
                 color="white", fontsize=13, fontweight="bold")
    for ax in axes:
        ax.set_facecolor("#161b22")
        ax.tick_params(colors="#8b949e", labelsize=8)
        [s.set_edgecolor("#30363d") for s in ax.spines.values()]

    days_arr = np.arange(forecast_days + 1)
    sample_idx = np.random.choice(n_simulations, min(200, n_simulations), replace=False)
    for i in sample_idx:
        axes[0].plot(price_paths[:, i], color="#58a6ff", alpha=0.04, lw=0.5)
    axes[0].fill_between(days_arr, price_quants[0], price_quants[4],
                         alpha=0.2, color="#e3b341", label="P5-P95")
    axes[0].fill_between(days_arr, price_quants[1], price_quants[3],
                         alpha=0.35, color="#3fb950", label="P25-P75")
    axes[0].plot(days_arr, price_quants[2], color="#f0883e", lw=1.5, label="Median")
    axes[0].axhline(S0, color="#f85149", lw=1, linestyle="--", label="Start")
    axes[0].set_title("Price Paths", color="#8b949e", fontsize=9)
    axes[0].legend(fontsize=7, framealpha=0.3, labelcolor="white", facecolor="#161b22")

    axes[1].hist(pnl_pct, bins=80, color="#58a6ff", alpha=0.6, density=True)
    x_r = np.linspace(pnl_pct.min(), pnl_pct.max(), 200)
    axes[1].plot(x_r, norm.pdf(x_r, pnl_pct.mean(), pnl_pct.std()),
                 color="#f0883e", lw=1.5)
    for cl in confidence_levels:
        var_val = np.percentile(pnl_pct, (1 - cl) * 100)
        axes[1].axvline(var_val, color="#f85149", lw=1.2, linestyle="--",
                        label=f"VaR {int(cl*100)}%: {var_val:.1f}%")
    axes[1].axvline(0, color="#484f58", lw=0.8)
    axes[1].set_title("Return Distribution", color="#8b949e", fontsize=9)
    axes[1].legend(fontsize=7, framealpha=0.3, labelcolor="white", facecolor="#161b22")

    plt.tight_layout()
    sp = save_path or str(OUTPUT_DIR / f"{symbol.replace('.','_')}_mc.png")
    fig.savefig(sp, dpi=120, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)

    return {"risk": pd.DataFrame(risk_rows), "forecast": forecast_df}


# ─────────────────────────────────────────
# MODULE G：LightGBM Factor Model
# ─────────────────────────────────────────

FEATURE_COLS = [
    "MOM_5", "MOM_10", "MOM_20", "MOM_60",
    "BIAS_20", "BIAS_60",
    "RSI14", "RSI_ZONE",
    "MACD", "MACD_Hist", "MACD_MOMENTUM",
    "ATR14", "ATR_RATIO", "VOLATILITY_20",
    "VOL_RATIO", "OBV_BIAS",
    "POS_52W", "MA_SCORE",
    "BUY_SCORE", "SELL_SCORE",
]


def build_features(symbol: str, period: str = "3y") -> pd.DataFrame:
    price_df = fetch_price_data(symbol, period)
    if price_df.empty or len(price_df) < 120:
        return pd.DataFrame()
    df = calc_technical_indicators(price_df)
    df = generate_trade_signals(df)
    for n in [5, 10, 20, 60]:
        df[f"MOM_{n}"] = df["Close"].pct_change(n)
    df["BIAS_20"] = (df["Close"] - df["MA20"]) / df["MA20"]
    df["BIAS_60"] = (df["Close"] - df["MA60"]) / df["MA60"]
    df["VOL_MA20"]  = df["Volume"].rolling(20).mean()
    df["VOL_RATIO"] = df["Volume"] / df["VOL_MA20"]
    df["OBV"]       = (np.sign(df["Close"].diff()) * df["Volume"]).cumsum()
    df["OBV_MA10"]  = df["OBV"].rolling(10).mean()
    df["OBV_BIAS"]  = (df["OBV"] - df["OBV_MA10"]) / df["OBV_MA10"].abs().replace(0, np.nan)
    df["VOLATILITY_20"] = df["Close"].pct_change().rolling(20).std() * (252**0.5)
    df["ATR_RATIO"]     = df["ATR14"] / df["Close"]
    df["RSI_ZONE"] = pd.cut(df["RSI14"], bins=[0, 30, 50, 70, 100],
                            labels=[0, 1, 2, 3]).astype(float)
    df["MACD_MOMENTUM"] = df["MACD_Hist"].diff(3)
    df["HIGH_52W"] = df["Close"].rolling(min(252, len(df))).max()
    df["LOW_52W"]  = df["Close"].rolling(min(252, len(df))).min()
    df["POS_52W"]  = (df["Close"] - df["LOW_52W"]) / (df["HIGH_52W"] - df["LOW_52W"] + 1e-9)
    df["MA_SCORE"] = (
        (df["MA5"] > df["MA20"]).astype(int) +
        (df["MA20"] > df["MA60"]).astype(int) +
        (df["Close"] > df["MA20"]).astype(int)
    )
    df["FUTURE_RET_20"] = df["Close"].shift(-20) / df["Close"] - 1
    df["LABEL"] = (df["FUTURE_RET_20"] > 0.05).astype(int)
    df["Symbol"] = symbol
    return df.dropna()


def predict_score(
    symbols: list,
    model_path: str = "./output/lgbm_model.pkl",
    top_n: int = 10,
) -> pd.DataFrame:
    try:
        import joblib
        artifact = joblib.load(model_path)
        model, scaler = artifact["model"], artifact["scaler"]
    except Exception as e:
        print(f"[WARN] Model not found ({e}), returning empty scores")
        return pd.DataFrame()

    records = []
    for sym in symbols:
        try:
            df = build_features(sym, period="6mo")
            if df.empty:
                continue
            avail = [c for c in FEATURE_COLS if c in df.columns]
            latest = df[avail].dropna().iloc[[-1]]
            X_sc = scaler.transform(latest)
            prob = model.predict_proba(X_sc)[0, 1]
            last_row = df.iloc[-1]
            records.append({
                "Symbol":    sym,
                "BUY_PROB%": round(prob * 100, 2),
                "Close":     round(float(last_row["Close"]), 3),
                "RSI14":     round(float(last_row["RSI14"]), 2),
                "POS_52W":   round(float(last_row["POS_52W"]), 3),
                "MA_SCORE":  int(last_row["MA_SCORE"]),
                "MOM_20":    round(float(last_row["MOM_20"]) * 100, 2),
            })
        except Exception as e:
            print(f"  [SKIP] {sym}: {e}")

    if not records:
        return pd.DataFrame()
    return pd.DataFrame(records).sort_values("BUY_PROB%", ascending=False).head(top_n)


# ─────────────────────────────────────────
# MODULE H：Dashboard Chart
# ─────────────────────────────────────────

def plot_dashboard(
    symbol: str,
    period: str = "1y",
    backtest_result: dict = None,
    save_path: str = None,
) -> str:
    price_df = fetch_price_data(symbol, period)
    if price_df.empty:
        return ""
    tech_df = calc_technical_indicators(price_df)
    tech_df = generate_trade_signals(tech_df)

    fig = plt.figure(figsize=(16, 9), facecolor="#0d1117")
    fig.suptitle(f"{symbol}  Technical Dashboard  ({period})",
                 fontsize=14, color="white", fontweight="bold", y=0.98)
    gs = GridSpec(3, 2, figure=fig, height_ratios=[3, 1, 1],
                  hspace=0.08, wspace=0.12,
                  left=0.06, right=0.97, top=0.93, bottom=0.06)

    ax_price  = fig.add_subplot(gs[0, 0])
    ax_equity = fig.add_subplot(gs[0, 1])
    ax_rsi    = fig.add_subplot(gs[1, 0], sharex=ax_price)
    ax_macd   = fig.add_subplot(gs[2, 0], sharex=ax_price)
    ax_vol    = fig.add_subplot(gs[1:, 1])

    def _style(ax):
        ax.set_facecolor("#161b22")
        ax.tick_params(colors="#8b949e", labelsize=8)
        [s.set_edgecolor("#30363d") for s in ax.spines.values()]
    for ax in [ax_price, ax_equity, ax_rsi, ax_macd, ax_vol]:
        _style(ax)

    dates = tech_df.index
    ax_price.plot(dates, tech_df["Close"], color="#58a6ff", lw=1.2, label="Close", zorder=3)
    if "MA20" in tech_df.columns:
        ax_price.plot(dates, tech_df["MA20"], color="#f0883e", lw=1, label="MA20", alpha=0.8)
    if "MA60" in tech_df.columns:
        ax_price.plot(dates, tech_df["MA60"], color="#7ee787", lw=1, label="MA60", alpha=0.8)
    if "STRONG_BUY" in tech_df.columns:
        buy_sig  = tech_df[tech_df["STRONG_BUY"]  == True]
        sell_sig = tech_df[tech_df["STRONG_SELL"] == True]
        ax_price.scatter(buy_sig.index,  buy_sig["Close"]  * 0.975, marker="^",
                         color="#3fb950", s=70, zorder=5, label="Strong Buy")
        ax_price.scatter(sell_sig.index, sell_sig["Close"] * 1.025, marker="v",
                         color="#f85149", s=70, zorder=5, label="Strong Sell")
    if "ATR14" in tech_df.columns:
        ax_price.fill_between(dates,
                              tech_df["Close"] - tech_df["ATR14"],
                              tech_df["Close"] + tech_df["ATR14"],
                              alpha=0.10, color="#58a6ff", label="±ATR")
    ax_price.set_ylabel("Price", color="#8b949e", fontsize=9)
    ax_price.legend(loc="upper left", fontsize=7, framealpha=0.3,
                    labelcolor="white", facecolor="#161b22")
    plt.setp(ax_price.get_xticklabels(), visible=False)

    if backtest_result and "equity_curve" in backtest_result:
        eq = backtest_result["equity_curve"]
        initial = eq["Equity"].iloc[0]
        ax_equity.plot(eq.index, eq["Equity"], color="#a5d6ff", lw=1.3)
        ax_equity.axhline(initial, color="#484f58", lw=0.8, linestyle="--")
        ax_equity.fill_between(eq.index, initial, eq["Equity"],
                               where=(eq["Equity"] >= initial), alpha=0.2, color="#3fb950")
        ax_equity.fill_between(eq.index, initial, eq["Equity"],
                               where=(eq["Equity"] < initial), alpha=0.2, color="#f85149")
        ax_equity.set_title("Backtest Equity", color="#8b949e", fontsize=9, pad=4)
    else:
        ax_equity.text(0.5, 0.5, "No backtest data", ha="center", va="center",
                       color="#8b949e", transform=ax_equity.transAxes)
    ax_equity.yaxis.tick_right()

    if "RSI14" in tech_df.columns:
        ax_rsi.plot(dates, tech_df["RSI14"], color="#d2a8ff", lw=1)
        ax_rsi.axhline(70, color="#f85149", lw=0.8, linestyle="--", alpha=0.7)
        ax_rsi.axhline(30, color="#3fb950", lw=0.8, linestyle="--", alpha=0.7)
        ax_rsi.fill_between(dates, 30, tech_df["RSI14"],
                            where=(tech_df["RSI14"] < 30), alpha=0.2, color="#3fb950")
        ax_rsi.fill_between(dates, 70, tech_df["RSI14"],
                            where=(tech_df["RSI14"] > 70), alpha=0.2, color="#f85149")
        ax_rsi.set_ylim(0, 100)
        ax_rsi.set_ylabel("RSI(14)", color="#8b949e", fontsize=9)
    plt.setp(ax_rsi.get_xticklabels(), visible=False)

    if "MACD" in tech_df.columns:
        ax_macd.plot(dates, tech_df["MACD"],        color="#58a6ff", lw=1, label="MACD")
        ax_macd.plot(dates, tech_df["MACD_Signal"], color="#f0883e", lw=1, label="Signal")
        colors = ["#3fb950" if v >= 0 else "#f85149" for v in tech_df["MACD_Hist"]]
        ax_macd.bar(dates, tech_df["MACD_Hist"], color=colors, alpha=0.6, width=1.5)
        ax_macd.axhline(0, color="#484f58", lw=0.6)
        ax_macd.set_ylabel("MACD", color="#8b949e", fontsize=9)
        ax_macd.legend(loc="upper left", fontsize=7, framealpha=0.3,
                       labelcolor="white", facecolor="#161b22")
        ax_macd.xaxis.set_major_formatter(mdates.DateFormatter("%y/%m"))

    if "ATR14" in tech_df.columns:
        ax_vol.plot(tech_df.index, tech_df["ATR14"], color="#e3b341", lw=1)
        ax_vol.fill_between(tech_df.index, 0, tech_df["ATR14"],
                            alpha=0.2, color="#e3b341")
        ax_vol.set_title("ATR(14) Volatility", color="#8b949e", fontsize=9, pad=4)
        ax_vol.yaxis.tick_right()
        ax_vol.xaxis.set_major_formatter(mdates.DateFormatter("%y/%m"))

    sp = save_path or str(OUTPUT_DIR / f"{symbol.replace('.','_')}_dashboard.png")
    fig.savefig(sp, dpi=120, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    return sp


# ─────────────────────────────────────────
# MODULE I：Signal Notifier
# ─────────────────────────────────────────

@dataclass
class NotifyConfig:
    tg_bot_token: str = ""
    tg_chat_id:   str = ""
    smtp_host:    str = "smtp.gmail.com"
    smtp_port:    int = 587
    smtp_user:    str = ""
    smtp_pass:    str = ""
    email_to:     list = field(default_factory=list)
    min_buy_score_to_alert: int = 2
    cooldown_minutes: int = 240


class SignalNotifier:
    def __init__(self, config: NotifyConfig):
        self.cfg = config
        self._sent_log: dict = {}

    def _is_cooled_down(self, symbol: str) -> bool:
        last = self._sent_log.get(symbol)
        if last is None:
            return True
        return (pd.Timestamp.now() - last).total_seconds() / 60 >= self.cfg.cooldown_minutes

    @staticmethod
    def _format_message(symbol, signal_type, close, rsi, macd_hist,
                        buy_score, sell_score) -> str:
        action = "STRONG BUY" if "BUY" in signal_type else "STRONG SELL"
        return (
            f"[{action}] {symbol}\n"
            f"Close: {close:.4f} | RSI: {rsi:.2f} | MACD Hist: {macd_hist:.4f}\n"
            f"Buy Score: {buy_score}/3 | Sell Score: {sell_score}/3\n"
            f"Time: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')}"
        )

    def send_telegram(self, message: str) -> bool:
        if not self.cfg.tg_bot_token or not self.cfg.tg_chat_id:
            return False
        try:
            url = f"https://api.telegram.org/bot{self.cfg.tg_bot_token}/sendMessage"
            resp = requests.post(url, json={"chat_id": self.cfg.tg_chat_id,
                                            "text": message}, timeout=10)
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"[ERROR] Telegram: {e}")
            return False

    def send_telegram_photo(self, image_path: str, caption: str = "") -> bool:
        if not self.cfg.tg_bot_token:
            return False
        try:
            url = f"https://api.telegram.org/bot{self.cfg.tg_bot_token}/sendPhoto"
            with open(image_path, "rb") as f:
                resp = requests.post(url, data={"chat_id": self.cfg.tg_chat_id,
                                                "caption": caption[:1024]},
                                     files={"photo": f}, timeout=30)
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"[ERROR] Telegram photo: {e}")
            return False

    def send_email(self, subject: str, body: str, attachments: list = None) -> bool:
        if not self.cfg.smtp_user or not self.cfg.email_to:
            return False
        try:
            msg = MIMEMultipart("related")
            msg["From"]    = self.cfg.smtp_user
            msg["To"]      = ", ".join(self.cfg.email_to)
            msg["Subject"] = subject
            msg.attach(MIMEText(f"<pre>{body}</pre>", "html", "utf-8"))
            if attachments:
                for path in attachments:
                    p = Path(path)
                    if p.exists():
                        with open(p, "rb") as f:
                            img = MIMEImage(f.read(), name=p.name)
                            img.add_header("Content-Disposition", "attachment",
                                           filename=p.name)
                            msg.attach(img)
            with smtplib.SMTP(self.cfg.smtp_host, self.cfg.smtp_port) as server:
                server.starttls()
                server.login(self.cfg.smtp_user, self.cfg.smtp_pass)
                server.sendmail(self.cfg.smtp_user, self.cfg.email_to, msg.as_string())
            return True
        except Exception as e:
            print(f"[ERROR] Email: {e}")
            return False

    def notify_if_signal(self, symbol: str, tech_df: pd.DataFrame,
                         chart_path: str = None) -> None:
        if tech_df.empty:
            return
        latest = tech_df.iloc[-1]
        buy_score  = int(latest.get("BUY_SCORE",  0))
        sell_score = int(latest.get("SELL_SCORE", 0))
        signal_type = None
        if buy_score  >= self.cfg.min_buy_score_to_alert:
            signal_type = "STRONG_BUY"
        elif sell_score >= self.cfg.min_buy_score_to_alert:
            signal_type = "STRONG_SELL"
        if signal_type is None or not self._is_cooled_down(symbol):
            return
        message = self._format_message(
            symbol, signal_type,
            float(latest.get("Close", 0)),
            float(latest.get("RSI14", 0)),
            float(latest.get("MACD_Hist", 0)),
            buy_score, sell_score,
        )
        tg_ok    = self.send_telegram(message)
        email_ok = self.send_email(
            subject=f"[Signal] {signal_type} - {symbol}",
            body=message,
            attachments=[chart_path] if chart_path else None,
        )
        if tg_ok and chart_path and Path(chart_path).exists():
            self.send_telegram_photo(chart_path, caption=f"{symbol} Chart")
        if tg_ok or email_ok:
            self._sent_log[symbol] = pd.Timestamp.now()


# ─────────────────────────────────────────
# Daily Scan Task
# ─────────────────────────────────────────

WATCHLIST = {
    "A": ["sh600519", "sh601318", "sh600036"],
    "HK": ["0700.HK", "9988.HK", "1810.HK"],
    "US": ["AAPL", "MSFT", "NVDA", "TSLA", "META"],
}


def get_notify_config() -> NotifyConfig:
    import os
    return NotifyConfig(
        tg_bot_token=os.getenv("TG_BOT_TOKEN", ""),
        tg_chat_id=os.getenv("TG_CHAT_ID", ""),
        smtp_user=os.getenv("SMTP_USER", ""),
        smtp_pass=os.getenv("SMTP_PASS", ""),
        email_to=[os.getenv("ALERT_EMAIL", "")],
    )


def daily_scan_and_alert():
    print(f"\n{'='*60}")
    print(f"  Daily scan started: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    notifier = SignalNotifier(get_notify_config())
    all_symbols = [s for syms in WATCHLIST.values() for s in syms]
    screened = scan_watchlist(all_symbols, period="6mo", min_buy_score=2)
    if screened.empty:
        print("[INFO] No strong signals today")
        return

    for _, row in screened.iterrows():
        symbol = row["Symbol"]
        try:
            result = analyze_stock(symbol, period="1y")
            if not result:
                continue
            chart_path = plot_dashboard(symbol, period="1y")
            notifier.notify_if_signal(symbol, result["technical"], chart_path)
            time_module.sleep(2)
        except Exception as e:
            print(f"  [ERROR] {symbol}: {e}")
