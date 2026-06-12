// 用 Web Audio API 即場生成音效,唔使任何外部音效檔。
let ctx = null

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // iOS Safari 要喺用戶互動後 resume
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, startAt, duration, { type = 'sine', volume = 0.25 } = {}) {
  const ac = getCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = ac.currentTime + startAt
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

// 答對:輕快上升雙音
export function playCorrect() {
  tone(523.25, 0, 0.15) // C5
  tone(783.99, 0.12, 0.25) // G5
}

// 答錯:溫和低音,唔嚇親小朋友
export function playWrong() {
  tone(220, 0, 0.35, { type: 'triangle', volume: 0.18 })
}

// 過關:上行和弦琶音 C-E-G-C
export function playLevelClear() {
  tone(523.25, 0, 0.2)
  tone(659.25, 0.15, 0.2)
  tone(783.99, 0.3, 0.2)
  tone(1046.5, 0.45, 0.5)
}

// 小遊戲接到星星:短促「叮」
export function playPop() {
  tone(880, 0, 0.1, { volume: 0.2 })
}

// 小遊戲踩中炸彈:短促低音
export function playBomb() {
  tone(130.81, 0, 0.3, { type: 'sawtooth', volume: 0.15 })
}

// 按鈕點擊
export function playClick() {
  tone(660, 0, 0.06, { volume: 0.12 })
}
