"""
抓取市場溫度計需要嘅真實市場數據快照，存做 tests/fixtures/market/*.csv。

用途：將某一日嘅真實數據固定落 repo，等離線環境（例如網絡受限嘅
Claude Code 沙盒）都可以用真數據跑回歸測試（tests/test_regime_fixtures.py）。

用法（需要可以連到 Yahoo Finance 嘅網絡）：
    python scripts/snapshot_market_data.py

跑完之後：
    git add tests/fixtures && git commit -m "更新市場數據快照" && git push
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from market_regime import SECTOR_ETFS  # noqa: E402

TICKERS = ["SPY", "QQQ", "^VIX", "RSP", *SECTOR_ETFS]
FIXTURE_DIR = REPO_ROOT / "tests" / "fixtures" / "market"


def main() -> int:
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    ok, failed = [], []
    for sym in TICKERS:
        try:
            df = yf.Ticker(sym).history(period="2y")
            if df.empty:
                raise ValueError("empty dataframe")
            df = df[["Open", "High", "Low", "Close", "Volume"]]
            fname = sym.replace("^", "") + ".csv"
            df.to_csv(FIXTURE_DIR / fname)
            ok.append(sym)
            print(f"  [OK]   {sym}: {len(df)} rows -> {fname}")
        except Exception as e:
            failed.append(sym)
            print(f"  [FAIL] {sym}: {e}")

    manifest = {
        "snapshot_at": datetime.now(timezone.utc).isoformat(),
        "period": "2y",
        "tickers_ok": ok,
        "tickers_failed": failed,
    }
    (FIXTURE_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False)
    )
    print(f"\n{len(ok)}/{len(TICKERS)} 隻成功，快照存喺 {FIXTURE_DIR}")
    if failed:
        print(f"失敗：{failed}（retry 一次通常搞掂）")
        return 1
    print("下一步：git add tests/fixtures && git commit && git push")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
