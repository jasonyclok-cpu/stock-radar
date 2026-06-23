"""美股短線分析器 v2 — Streamlit App。

純技術分析教育用途,並非投資建議。資料來源 yfinance(免費、可能延遲)。
四個分頁:📊 分析 / 📉 回測 / ⭐ Watchlist / 💼 模擬交易。
兩人登入,各自獨立模擬倉同 watchlist。
"""
from __future__ import annotations

import pandas as pd
import streamlit as st

from core import backtest, claude_layer, data_fetch, indicators, portfolio, watchlist

st.set_page_config(page_title="美股短線分析器 v2", page_icon="📈", layout="wide")

DISCLAIMER = "⚠️ 純技術分析教育用途,並非投資建議。資料來自 yfinance,可能延遲。"


# ──────────────────────────────────────────────────────────
# 登入閘
# ──────────────────────────────────────────────────────────
def _get_users() -> dict:
    """由 st.secrets[users] 讀 {username: password}。"""
    try:
        users = st.secrets.get("users", {})
        return {str(k): str(v) for k, v in dict(users).items()}
    except Exception:
        return {}


def login_gate() -> bool:
    """未登入就顯示登入表單並回傳 False;已登入回傳 True。"""
    if st.session_state.get("username"):
        return True

    st.title("📈 美股短線分析器 v2")
    st.caption(DISCLAIMER)
    users = _get_users()

    with st.form("login_form"):
        st.subheader("🔐 登入")
        username = st.text_input("用戶名")
        password = st.text_input("密碼", type="password")
        submitted = st.form_submit_button("登入")

    if submitted:
        if not users:
            st.error("尚未設定用戶(請在 .streamlit/secrets.toml 的 [users] 加入帳號)。")
        elif username in users and password == users[username]:
            st.session_state["username"] = username
            st.rerun()
        else:
            st.error("用戶名或密碼錯誤。")
    return False


if not login_gate():
    st.stop()

username = st.session_state["username"]


# ──────────────────────────────────────────────────────────
# 頂部:用戶 + 登出 + 分頁導覽
# ──────────────────────────────────────────────────────────
PAGES = ["📊 分析", "📉 回測", "⭐ Watchlist", "💼 模擬交易"]
if "nav" not in st.session_state:
    st.session_state["nav"] = PAGES[0]

top_left, top_right = st.columns([4, 1])
with top_left:
    st.title("📈 美股短線分析器 v2")
with top_right:
    st.markdown(f"**👤 {username}**")
    if st.button("登出"):
        for k in ("username", "nav", "analyze_ticker"):
            st.session_state.pop(k, None)
        st.rerun()

st.radio("分頁", PAGES, key="nav", horizontal=True, label_visibility="collapsed")
st.caption(DISCLAIMER)
st.divider()

page = st.session_state["nav"]


def _score_color(val) -> str:
    try:
        v = float(val)
    except (TypeError, ValueError):
        return ""
    if v > 0:
        return "color: #1a8f3c; font-weight: 600"
    if v < 0:
        return "color: #c0392b; font-weight: 600"
    return ""


# ──────────────────────────────────────────────────────────
# 📊 分析
# ──────────────────────────────────────────────────────────
if page == "📊 分析":
    st.subheader("📊 個股技術分析")
    c1, c2, c3 = st.columns([2, 1, 1])
    with c1:
        default_ticker = st.session_state.pop("analyze_ticker", "AAPL")
        ticker = st.text_input("股票代號", value=default_ticker).strip().upper()
    with c2:
        period = st.selectbox("時間範圍", data_fetch.PERIODS, index=data_fetch.PERIODS.index("1y"))
    with c3:
        interval = st.selectbox("K 線週期", data_fetch.INTERVALS, index=0)

    if st.button("分析", type="primary") or default_ticker != "AAPL":
        try:
            with st.spinner(f"抓取 {ticker} …"):
                df = data_fetch.fetch_data(ticker, period, interval)
                ind = indicators.add_indicators(df)
                sig = indicators.score_signals(ind)
        except Exception as e:
            st.error(f"抓不到 {ticker} 的資料:{e}")
        else:
            last = ind.iloc[-1]
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("現價", f"${last['Close']:.2f}")
            m2.metric("綜合分數", sig["score"], sig["bias"])
            m3.metric("RSI(14)", f"{sig['rsi']:.1f}")
            m4.metric("5日動量", f"{sig['mom5']:.2f}%")

            st.line_chart(ind[["Close", "EMA20", "EMA50"]], height=320)

            with st.expander("評分明細", expanded=True):
                for r in sig["reasons"]:
                    st.write("•", r)

            if claude_layer.available():
                with st.spinner("產生 AI 評語 …"):
                    st.info(claude_layer.comment(ticker, sig, {"price": round(float(last["Close"]), 2)}))
            else:
                st.caption("(未設定 ANTHROPIC_API_KEY,略過 AI 評語)")


# ──────────────────────────────────────────────────────────
# 📉 回測
# ──────────────────────────────────────────────────────────
elif page == "📉 回測":
    st.subheader("📉 訊號回測(全倉進出)")
    c1, c2, c3 = st.columns([2, 1, 1])
    with c1:
        bt_ticker = st.text_input("股票代號", value="AAPL", key="bt_ticker").strip().upper()
    with c2:
        bt_period = st.selectbox("時間範圍", data_fetch.PERIODS, index=data_fetch.PERIODS.index("2y"), key="bt_period")
    with c3:
        bt_interval = st.selectbox("K 線週期", data_fetch.INTERVALS, index=0, key="bt_interval")

    s1, s2 = st.columns(2)
    with s1:
        score_buy = st.slider("買入門檻(分數 ≥)", 0, 100, 40, 5)
    with s2:
        score_sell = st.slider("賣出門檻(分數 ≤)", -100, 0, -40, 5)

    if st.button("跑回測", type="primary"):
        try:
            with st.spinner(f"回測 {bt_ticker} …"):
                df = data_fetch.fetch_data(bt_ticker, bt_period, bt_interval)
                result = backtest.run_backtest(df, score_buy=score_buy, score_sell=score_sell)
        except Exception as e:
            st.error(f"回測失敗:{e}")
        else:
            perf = result["performance"]
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("總報酬", f"{perf['總報酬%']}%")
            m2.metric("年化報酬", f"{perf['年化報酬%']}%")
            m3.metric("最大回撤", f"{perf['最大回撤%']}%")
            m4.metric("相對 Buy&Hold", f"{perf['相對Buy&Hold超額%']}%")
            m5, m6, m7 = st.columns(3)
            m5.metric("勝率", f"{perf['勝率%']}%")
            m6.metric("交易次數", perf["交易次數"])
            m7.metric("Buy&Hold 報酬", f"{perf['Buy&Hold報酬%']}%")

            st.markdown("**權益曲線 vs Buy & Hold**")
            st.line_chart(result["equity"][["strategy", "buy_hold"]], height=320)

            st.markdown("**績效表**")
            st.dataframe(pd.DataFrame([perf]), use_container_width=True, hide_index=True)

            st.markdown("**交易清單**")
            if result["trades"].empty:
                st.caption("此期間無觸發任何交易(門檻可能太嚴)。")
            else:
                st.dataframe(result["trades"], use_container_width=True, hide_index=True)


# ──────────────────────────────────────────────────────────
# ⭐ Watchlist
# ──────────────────────────────────────────────────────────
elif page == "⭐ Watchlist":
    st.subheader("⭐ Watchlist 排序")
    saved = watchlist.load_watchlist(username)
    text = st.text_area("代號(每行一個)", value="\n".join(saved), height=160)
    tickers = [t.strip().upper() for t in text.splitlines() if t.strip()]

    c1, c2, c3 = st.columns([1, 1, 2])
    with c1:
        wl_period = st.selectbox("時間範圍", data_fetch.PERIODS, index=data_fetch.PERIODS.index("6mo"), key="wl_period")
    with c2:
        wl_interval = st.selectbox("K 線週期", data_fetch.INTERVALS, index=0, key="wl_interval")

    a1, a2 = st.columns([1, 1])
    with a1:
        do_rank = st.button("排序", type="primary")
    with a2:
        if st.button("儲存清單"):
            watchlist.save_watchlist(username, tickers)
            st.success("已儲存。")

    if do_rank:
        watchlist.save_watchlist(username, tickers)
        with st.spinner("抓取並排序 …"):
            ranked = watchlist.rank(tickers, wl_period, wl_interval)
        if ranked.empty:
            st.warning("全部代號都抓不到(代號錯誤或暫時無法連線)。")
        else:
            st.dataframe(
                ranked.style.map(_score_color, subset=["分數", "日內變化%"]),
                use_container_width=True,
                hide_index=True,
            )
            st.markdown("**逐隻分析**")
            for _, row in ranked.iterrows():
                cols = st.columns([3, 1])
                cols[0].write(f"**{row['代號']}** — 分數 {row['分數']}({row['偏向']})")
                if cols[1].button("分析", key=f"analyze_{row['代號']}"):
                    st.session_state["analyze_ticker"] = row["代號"]
                    st.session_state["nav"] = "📊 分析"
                    st.rerun()


# ──────────────────────────────────────────────────────────
# 💼 模擬交易
# ──────────────────────────────────────────────────────────
elif page == "💼 模擬交易":
    st.subheader(f"💼 {username} 的模擬倉")

    # 估值:用持倉現價
    pf = portfolio.load(username)
    prices = {}
    for tkr in pf["positions"]:
        try:
            prices[tkr] = data_fetch.latest_price(tkr)
        except Exception:
            pass
    eq = portfolio.equity(username, prices)

    m1, m2, m3 = st.columns(3)
    m1.metric("現金", f"${eq['cash']:,.2f}")
    m2.metric("持倉市值", f"${eq['holdings_value']:,.2f}")
    m3.metric("總權益", f"${eq['total_equity']:,.2f}")

    st.markdown("**持倉**")
    if eq["positions"]:
        st.dataframe(pd.DataFrame(eq["positions"]), use_container_width=True, hide_index=True)
    else:
        st.caption("目前無持倉。")

    st.divider()
    st.markdown("**下單(模擬)**")
    with st.form("trade_form"):
        c1, c2, c3, c4 = st.columns([2, 1, 1, 1])
        with c1:
            t_ticker = st.text_input("代號", value="AAPL").strip().upper()
        with c2:
            t_shares = st.number_input("股數", min_value=0.0, value=10.0, step=1.0)
        with c3:
            t_action = st.selectbox("動作", ["買入", "賣出"])
        with c4:
            use_market = st.checkbox("用市價", value=True)
        t_price = st.number_input("價格(取消勾選市價時用)", min_value=0.0, value=0.0, step=0.01)
        go = st.form_submit_button("送出")

    if go:
        try:
            price = data_fetch.latest_price(t_ticker) if use_market else float(t_price)
            if price <= 0:
                raise ValueError("價格必須大於 0(取消市價時請手動輸入)")
            today = pd.Timestamp.utcnow().strftime("%Y-%m-%d")
            if t_action == "買入":
                portfolio.buy(username, t_ticker, t_shares, price, today)
            else:
                portfolio.sell(username, t_ticker, t_shares, price, today)
            st.success(f"已{t_action} {t_shares} 股 {t_ticker} @ ${price:.2f}")
            st.rerun()
        except Exception as e:
            st.error(f"下單失敗:{e}")

    st.divider()
    with st.expander("交易紀錄"):
        if eq["history"]:
            st.dataframe(pd.DataFrame(eq["history"]), use_container_width=True, hide_index=True)
        else:
            st.caption("尚無交易紀錄。")

    if st.button("⟲ 重設模擬倉"):
        portfolio.reset(username)
        st.success("已重設為初始資金。")
        st.rerun()
