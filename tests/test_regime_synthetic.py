"""
市場溫度計離線回歸測試——合成數據，唔使網絡。

三個情境：健康牛市→綠燈、崩盤→紅燈、假升勢（窄升）→封頂黃燈，
加 SQLite cache round-trip 同 JSON 序列化檢查。

用法：python tests/test_regime_synthetic.py
"""

import json
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

import market_regime as mr  # noqa: E402

N = 600
IDX = pd.bdate_range(end="2026-07-02", periods=N)


def make_df(closes, volumes=None):
    closes = np.asarray(closes, dtype=float)
    vol = np.asarray(volumes, dtype=float) if volumes is not None else np.full(N, 1e6)
    return pd.DataFrame({
        "Open": closes, "High": closes * 1.005, "Low": closes * 0.995,
        "Close": closes, "Volume": vol,
    }, index=IDX[-len(closes):])


def rising(start=100, rate=0.0008, n=N):
    return start * (1 + rate) ** np.arange(n)


def falling(start=100, rate=0.0008, n=N):
    return start * (1 - rate) ** np.arange(n)


def main() -> int:
    # ── 情境 1：健康牛市 → 綠燈、真升市、潮汐向上 ──
    def scenario_bull(symbol, period):
        if symbol == "^VIX":
            return make_df(np.full(N, 15.0))
        return make_df(rising())

    mr._fetch = scenario_bull
    r1 = mr.compute_market_regime()
    assert r1["light"] == "GREEN", f"expect GREEN got {r1['light']}"
    assert r1["score"] == 4, r1["score"]
    assert not r1["capped_by_rally_quality"]
    assert r1["rally_check"]["genuine"]
    assert r1["tide"]["direction"] == "UP", r1["tide"]
    print("PASS 情境 1: 牛市 -> 綠燈 4/4、真升市、潮汐向上")

    # ── 情境 2：崩盤 → 紅燈 ──
    def scenario_bear(symbol, period):
        if symbol == "^VIX":
            v = np.full(N, 18.0)
            v[-10:] = np.linspace(20, 38, 10)
            return make_df(v)
        return make_df(falling())

    mr._fetch = scenario_bear
    r2 = mr.compute_market_regime()
    assert r2["light"] == "RED", f"expect RED got {r2['light']}"
    assert r2["score"] <= 1, r2["score"]
    assert not r2["rally_check"]["is_rising"]
    print("PASS 情境 2: 崩盤 -> 紅燈")

    # ── 情境 3：指數升但窄升（市寬收縮+等權落後+縮量）→ 封頂黃燈 ──
    spy_close = rising()
    spy_vol = np.full(N, 1.5e6)
    tail_close = spy_close[-30:].copy()
    for i in range(1, 30):
        tail_close[i] = tail_close[i - 1] * (1.004 if i % 2 == 0 else 0.999)
    spy_close[-30:] = tail_close
    for i in range(N - 30, N):
        spy_vol[i] = 0.6e6 if spy_close[i] > spy_close[i - 1] else 2.5e6

    etf_calls = {"n": 0}

    def scenario_fake_rally(symbol, period):
        if symbol == "^VIX":
            return make_df(np.full(N, 15.0))
        if symbol == "SPY":
            return make_df(spy_close, spy_vol)
        if symbol == "QQQ":
            return make_df(rising(rate=0.001))
        if symbol == "RSP":
            return make_df(falling(rate=0.001))
        # 板塊 ETF：7 隻升、2 隻長跌、2 隻最近 4 日先跌穿 MA50
        k = etf_calls["n"]
        etf_calls["n"] += 1
        if k < 7:
            return make_df(rising())
        if k < 9:
            return make_df(falling())
        c = rising()
        c[-4:] = c[-5] * 0.85
        return make_df(c)

    mr._fetch = scenario_fake_rally
    r3 = mr.compute_market_regime()
    b = r3["indicators"]["breadth"]
    assert b["healthy"], b
    assert b["pct_above_ma50"] < b["pct_5d_ago"], b
    assert r3["rally_check"]["is_rising"]
    assert not r3["rally_check"]["genuine"], r3["rally_check"]
    assert r3["capped_by_rally_quality"], r3
    assert r3["light"] == "YELLOW", f"expect capped YELLOW got {r3['light']}"
    print(f"PASS 情境 3: 假升勢 -> 封頂黃燈"
          f"（市寬 {b['pct_above_ma50']}% < 5日前 {b['pct_5d_ago']}%，"
          f"升勢質素 {r3['rally_check']['passed']}/4）")

    # ── Cache round-trip ──
    db = os.path.join(tempfile.mkdtemp(), "cache.db")
    mr.save_regime(db, r3)
    cached = mr.load_cached_regime(db)
    assert cached and cached["light"] == "YELLOW"
    got = mr.get_market_regime(db)
    assert got["computed_at"] == r3["computed_at"], "應該行 cache 唔重計"
    print("PASS cache: save/load/get round-trip")

    # ── JSON-safe ──
    json.dumps(r1), json.dumps(r2), json.dumps(r3)
    print("PASS json-serializable")

    print("\n----- 晨報樣式（情境 3 假升勢）-----")
    print(mr.format_regime_message(r3))
    print("\nALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
