// 用瀏覽器內置 Web Speech API 朗讀,毋須任何外部檔案或網絡。
// 中文用廣東話(zh-HK),英文用英語。iPad Safari 內置 zh-HK 聲音。
import { isMuted } from './sound'

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

function cleanText(text) {
  return String(text).replace(/__+/g, ' ').replace(/[?_🔢📖🔤]/g, ' ').trim()
}

function makeUtter(text, lang) {
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.85 // 慢少少,細路聽得清楚
  const base = lang.split('-')[0]
  const v =
    voices.find((vo) => vo.lang === lang) ||
    voices.find((vo) => vo.lang && vo.lang.replace('_', '-').startsWith(base))
  if (v) utter.voice = v
  return utter
}

// 朗讀一段文字;langHint 可指定 'zh-HK' / 'en-US',唔指定就按內容自動判斷
export function speak(text, langHint) {
  if (!speechSupported() || !text || isMuted()) return
  const synth = window.speechSynthesis
  synth.cancel() // 停咗上一句先講新嘅
  const clean = cleanText(text)
  if (!clean) return
  const lang = langHint || (hasChinese(clean) ? 'zh-HK' : 'en-US')
  synth.speak(makeUtter(clean, lang))
}

// 中英夾雜嘅句子(例:「蘋果」的英文是 apple):
// 自動切開中文段用廣東話讀、英文段用英文讀,逐段排隊播。
export function speakMixed(text) {
  if (!speechSupported() || !text || isMuted()) return
  const clean = cleanText(text)
  if (!clean) return
  // 按「有冇中文字」切段:連續嘅中文(連標點)一段、連續嘅拉丁字母/數字一段
  const segments = clean.match(/[一-鿿][^A-Za-z]*|[A-Za-z][A-Za-z0-9 .,'!?/-]*/g) || [clean]
  const synth = window.speechSynthesis
  synth.cancel()
  segments.forEach((seg) => {
    const s = seg.trim()
    if (!s) return
    synth.speak(makeUtter(s, hasChinese(s) ? 'zh-HK' : 'en-US'))
  })
}
