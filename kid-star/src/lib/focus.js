// 專注力遊戲嘅「靜默紀錄」:只存起,唔會喺小朋友端顯示。
// 沿用現有 starschool_ Profile 結構,供家長後台日後分析。
import { load, save } from './storage'

const KEEP = 60

// game: 'schulte' | 'reaction' | 'memory';  data: 任意指標物件
export function recordFocus(game, data) {
  const all = load('focus', {})
  const list = all[game] || []
  list.push({ ts: Date.now(), ...data })
  if (list.length > KEEP) list.splice(0, list.length - KEEP)
  all[game] = list
  save('focus', all)
}

export function getFocus() {
  return load('focus', {})
}

// 取某遊戲嘅個人最佳(由 picker 決定點樣叫做「最好」)
export function getBest(game, picker) {
  const list = getFocus()[game] || []
  if (!list.length) return null
  return list.reduce((best, cur) => (picker(cur) ? (picker(cur) > picker(best) ? cur : best) : best))
}
