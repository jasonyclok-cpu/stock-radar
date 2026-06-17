// 遊戲次數限制:5 分鐘內同一個遊戲最多玩 3 次(主要用喺免費遊戲,
// 避免一直刷免費遊戲攞星)。沿用現有 starschool_ localStorage 結構。
import { load, save } from './storage'

const WINDOW = 5 * 60 * 1000
const MAX = 3

function recent(id) {
  const all = load('plays', {})
  return (all[id] || []).filter((t) => Date.now() - t < WINDOW)
}

export function playsLeft(id) {
  return Math.max(0, MAX - recent(id).length)
}

export function canPlay(id) {
  return playsLeft(id) > 0
}

export function recordPlay(id) {
  const all = load('plays', {})
  all[id] = [...recent(id), Date.now()]
  save('plays', all)
}

// 重新可玩仲要等幾耐(秒),俾提示用
export function cooldownSeconds(id) {
  const r = recent(id)
  if (r.length < MAX) return 0
  const earliest = Math.min(...r)
  return Math.max(0, Math.ceil((WINDOW - (Date.now() - earliest)) / 1000))
}
