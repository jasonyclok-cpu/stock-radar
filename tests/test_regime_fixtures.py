"""
用真實數據快照（tests/fixtures/market/*.csv）跑市場溫度計。

快照未生成嘅話會直接 skip（exit 0）——先跑 scripts/snapshot_market_data.py。

用法：python tests/test_regime_fixtures.py
"""

import json
import sys
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

import market_regime as mr  # noqa: E402

FIXTURE_DIR = REPO_ROOT / "tests" / "fixtures" / "market"
PERIOD_DAYS = {"3mo": 63, "6mo": 126, "1y": 252, "2y": 504}


def fixture_fetch(symbol: str, period: str) -> pd.DataFrame:
    path = FIXTURE_DIR / (symbol.replace("^", "") + ".csv")
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    return df.tail(PERIOD_DAYS.get(period, 252))


def main() -> int:
    if not (FIXTURE_DIR / "SPY.csv").exists():
        print("[SKIP] 未有數據快照，先跑: python scripts/snapshot_market_data.py")
        return 0

    manifest_path = FIXTURE_DIR / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        print(f"快照日期: {manifest.get('snapshot_at', '?')}\n")

    mr._fetch = fixture_fetch
    regime = mr.compute_market_regime()

    # 用真數據做 sanity assertions（唔 assert 具體燈色——市況會變）
    assert regime["light"] in ("GREEN", "YELLOW", "RED"), regime["light"]
    assert 0 <= regime["score"] <= 4, regime["score"]
    ind = regime["indicators"]
    assert ind["breadth"]["sectors_total"] >= 8, "板塊數據唔夠"
    assert ind["trend"]["close"] and ind["trend"]["ma200"], "SPY 趨勢數據缺失"
    assert ind["vix"]["level"] is not None, "VIX 缺失"
    assert regime["tide"]["direction"] in ("UP", "DOWN", "FLAT"), regime["tide"]
    json.dumps(regime)  # JSON-safe

    print(mr.format_regime_message(regime))
    print("\nPASS: 真數據快照全流程通過")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
