"""
FastAPI backend for Stock Analysis System.
Serves PWA frontend and REST API endpoints.
"""

import os
import json
import sqlite3
import asyncio
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from analysis_engine import (
    analyze_stock,
    scan_watchlist,
    backtest,
    compare_strategies,
    kelly_position_sizer,
    monte_carlo_simulation,
    plot_dashboard,
    predict_score,
    fetch_price_data,
    calc_technical_indicators,
    daily_scan_and_alert,
    WATCHLIST,
)

# ── App setup ────────────────────────────
app = FastAPI(title="Stock Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("./output")
OUTPUT_DIR.mkdir(exist_ok=True)

# ── SQLite cache ──────────────────────────
DB_PATH = str(OUTPUT_DIR / "cache.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scan_results (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol    TEXT,
            scan_time TEXT,
            data      TEXT
        )
    """)
    conn.commit()
    conn.close()


init_db()

# ── Pydantic models ───────────────────────

class ScanRequest(BaseModel):
    symbols: list
    period: str = "6mo"
    min_buy_score: int = 2


class BacktestRequest(BaseModel):
    symbol: str
    period: str = "2y"
    strategy: str = "COMBINED"
    initial_capital: float = 100_000.0


# ── Serve PWA ─────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def serve_pwa():
    return FileResponse("static/index.html")


# ── Health check ──────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": pd.Timestamp.now().isoformat()}


# ── Single stock analysis ─────────────────
@app.get("/api/analyze/{symbol}")
async def api_analyze(symbol: str, period: str = "1y"):
    try:
        result = analyze_stock(symbol, period)
        if not result:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")

        tech    = result["technical"]
        latest  = tech.iloc[-1]
        fund    = result["fundamentals"]

        def safe(v):
            try:
                f = float(v)
                return None if (f != f) else round(f, 4)   # NaN check
            except Exception:
                return None

        return {
            "symbol": symbol,
            "period": period,
            "latest": {
                "date":       str(tech.index[-1].date()),
                "close":      safe(latest["Close"]),
                "ma20":       safe(latest.get("MA20")),
                "ma60":       safe(latest.get("MA60")),
                "rsi14":      safe(latest.get("RSI14")),
                "macd_hist":  safe(latest.get("MACD_Hist")),
                "atr14":      safe(latest.get("ATR14")),
                "buy_score":  int(latest.get("BUY_SCORE",  0)),
                "sell_score": int(latest.get("SELL_SCORE", 0)),
                "strong_buy": bool(latest.get("STRONG_BUY",  False)),
                "strong_sell":bool(latest.get("STRONG_SELL", False)),
            },
            "fundamentals": fund.to_dict(orient="records")[0] if not fund.empty else {},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Batch scan ────────────────────────────
@app.post("/api/scan")
async def api_scan(req: ScanRequest):
    try:
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, lambda: scan_watchlist(
                req.symbols, period=req.period,
                min_buy_score=req.min_buy_score
            )
        )
        data = result.to_dict(orient="records") if not result.empty else []

        conn = sqlite3.connect(DB_PATH)
        for row in data:
            conn.execute(
                "INSERT INTO scan_results (symbol, scan_time, data) VALUES (?,?,?)",
                (row.get("Symbol", ""), pd.Timestamp.now().isoformat(),
                 json.dumps({k: (None if (isinstance(v, float) and v != v) else v)
                             for k, v in row.items()}))
            )
        conn.commit()
        conn.close()
        return {"count": len(data), "results": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Backtest ──────────────────────────────
@app.post("/api/backtest")
async def api_backtest(req: BacktestRequest):
    try:
        loop = asyncio.get_event_loop()
        bt   = await loop.run_in_executor(
            None, lambda: backtest(
                req.symbol, period=req.period,
                strategy=req.strategy,
                initial_capital=req.initial_capital
            )
        )
        if not bt:
            raise HTTPException(status_code=404, detail="Backtest returned no data")

        summary = bt["summary"].to_dict(orient="records")[0]

        # Kelly sizing
        price_df   = fetch_price_data(req.symbol, "3mo")
        tech_df    = calc_technical_indicators(price_df)
        close      = float(tech_df["Close"].iloc[-1])
        atr        = float(tech_df["ATR14"].iloc[-1]) if "ATR14" in tech_df.columns else 1.0
        kelly_df   = kelly_position_sizer(bt["trades"], req.initial_capital, close, atr)

        return {
            "summary":      summary,
            "kelly":        kelly_df.to_dict(orient="records")[0],
            "trades_count": len(bt["trades"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── LightGBM scoring ──────────────────────
@app.get("/api/ml/score")
async def api_ml_score(
    symbols: str = Query(..., description="Comma-separated symbols, e.g. AAPL,MSFT"),
    top_n: int = 10,
):
    try:
        sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, lambda: predict_score(sym_list, top_n=top_n)
        )
        return {
            "count":   len(result),
            "results": result.to_dict(orient="records") if not result.empty else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Monte Carlo ───────────────────────────
@app.get("/api/montecarlo/{symbol}")
async def api_montecarlo(symbol: str, period: str = "1y", days: int = 30):
    try:
        save_path = str(OUTPUT_DIR / f"{symbol.replace('.','_')}_mc.png")
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, lambda: monte_carlo_simulation(
                symbol, period=period, forecast_days=days,
                n_simulations=1000, save_path=save_path
            )
        )
        if not result:
            raise HTTPException(status_code=500, detail="Simulation failed")
        return {
            "risk":     result["risk"].to_dict(orient="records"),
            "chart_url": f"/api/chart-file/{symbol.replace('.','_')}_mc.png",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Chart PNG ─────────────────────────────
@app.get("/api/chart/{symbol}")
async def api_chart(symbol: str, period: str = "1y"):
    try:
        chart_path = str(OUTPUT_DIR / f"{symbol.replace('.','_')}_dashboard.png")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, lambda: plot_dashboard(symbol, period=period, save_path=chart_path)
        )
        return FileResponse(chart_path, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chart-file/{filename}")
async def api_chart_file(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Chart not found")
    return FileResponse(str(path), media_type="image/png")


# ── Scan history ──────────────────────────
@app.get("/api/history/scans")
async def api_scan_history(limit: int = 30):
    try:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT symbol, scan_time, data FROM scan_results "
            "ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [{"symbol": r[0], "time": r[1], **json.loads(r[2])} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Default watchlist ─────────────────────
@app.get("/api/watchlist")
async def api_watchlist():
    return WATCHLIST


# ── Scheduler ────────────────────────────
scheduler = AsyncIOScheduler()


@scheduler.scheduled_job("cron", hour=16, minute=5, day_of_week="mon-fri")
async def scheduled_scan():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, daily_scan_and_alert)


@app.on_event("startup")
async def startup():
    scheduler.start()
    print("[APScheduler] Started - daily scan at 16:05 Mon-Fri")
