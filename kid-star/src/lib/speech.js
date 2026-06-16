// 用瀏覽器內置 Web Speech API 朗讀,毋須任何外部檔案或網絡。
// 中文用廣東話(zh-HK),英文用英語。iPad Safari 內置 zh-HK 聲音。
let voices = []
function refreshVoices() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    voices = window.speechSynthesis.getVoices() || []
  }
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices()
  window.speechSynthesis.onvoiceschanged = refreshVoices
}

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function hasChinese(text) {
  return /[一-鿿]/.test(text)
}

// 朗讀一段文字;langHint 可指定 'zh-HK' / 'en-US',唔指定就按內容自動判斷
export function speak(text, langHint) {
  if (!speechSupported() || !text) return
  const synth = window.speechSynthesis
  synth.cancel() // 停咗上一句先講新嘅
  const clean = String(text).replace(/__+/g, ' ').replace(/[?_🔢📖🔤]/g, ' ').trim()
  if (!clean) return
  const utter = new SpeechSynthesisUtterance(clean)
  const lang = langHint || (hasChinese(clean) ? 'zh-HK' : 'en-US')
  utter.lang = lang
  utter.rate = 0.85 // 慢少少,細路聽得清楚
  const base = lang.split('-')[0]
  const v =
    voices.find((vo) => vo.lang === lang) ||
    voices.find((vo) => vo.lang && vo.lang.replace('_', '-').startsWith(base))
  if (v) utter.voice = v
  synth.speak(utter)
}
