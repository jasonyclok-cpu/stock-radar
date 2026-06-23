"""AI 評語層:用 Claude 對技術指標做簡短中文解讀(純技術、非投資建議)。

Key 優先讀 st.secrets["ANTHROPIC_API_KEY"],fallback os.environ。
未設定 key / 未安裝 anthropic / API 出錯,都會優雅降級,唔會令 app 崩潰。
"""
from __future__ import annotations

import os

DEFAULT_MODEL = "claude-opus-4-8"

_DISCLAIMER = "以下為純技術分析教育用途的指標解讀,並非投資建議。"


def _get_api_key() -> str | None:
    """優先 st.secrets,再 fallback 環境變數。"""
    try:
        import streamlit as st  # 只喺 Streamlit 環境先有

        if "ANTHROPIC_API_KEY" in st.secrets:
            key = st.secrets["ANTHROPIC_API_KEY"]
            if key:
                return str(key)
    except Exception:
        pass
    return os.environ.get("ANTHROPIC_API_KEY")


def _get_model() -> str:
    try:
        import streamlit as st

        if "ANTHROPIC_MODEL" in st.secrets:
            return str(st.secrets["ANTHROPIC_MODEL"])
    except Exception:
        pass
    return os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)


def available() -> bool:
    """有冇 key,俾 UI 決定要唔要顯示 AI 評語區。"""
    return _get_api_key() is not None


def comment(ticker: str, score_info: dict, latest: dict | None = None) -> str:
    """就單一股票的評分/指標,叫 Claude 生成一段繁體中文解讀。

    score_info: score_signals() 的回傳。
    latest: 可選,最近一根 K 線的重點數值(現價/RSI 等)。
    """
    key = _get_api_key()
    if not key:
        return f"(未設定 ANTHROPIC_API_KEY,略過 AI 評語。){_DISCLAIMER}"

    try:
        import anthropic
    except ImportError:
        return f"(未安裝 anthropic 套件,略過 AI 評語。){_DISCLAIMER}"

    reasons = "\n".join(f"- {r}" for r in score_info.get("reasons", []))
    facts = [
        f"代號:{ticker}",
        f"綜合分數:{score_info.get('score')}(偏向:{score_info.get('bias')})",
        f"RSI:{score_info.get('rsi'):.1f}",
        f"5日動量:{score_info.get('mom5'):.2f}%",
    ]
    if latest:
        facts.append(f"現價:{latest.get('price')}")
    facts_text = "\n".join(facts)

    prompt = (
        "你係一個技術分析教學助手。以下係某美股的技術指標摘要。"
        "請用繁體中文寫 3 至 4 句精簡解讀,講下短線技術面偏向同要留意嘅地方。"
        "必須喺結尾加一句『純技術分析教育用途,並非投資建議』。"
        "唔好俾明確買賣指令或目標價。\n\n"
        f"{facts_text}\n\n指標貢獻:\n{reasons}"
    )

    try:
        client = anthropic.Anthropic(api_key=key)
        resp = client.messages.create(
            model=_get_model(),
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        if getattr(resp, "stop_reason", None) == "refusal":
            return f"(AI 評語被安全機制略過。){_DISCLAIMER}"
        parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
        text = "".join(parts).strip()
        return text or f"(AI 未回覆內容。){_DISCLAIMER}"
    except Exception as e:  # 網絡 / 認證 / 額度等
        return f"(AI 評語暫時無法產生:{e}){_DISCLAIMER}"
