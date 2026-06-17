// 星星、連續學習日數、解鎖進度、答題紀錄(俾家長後台用)
import { load, save } from './storage'

const MAX_LOG = 500

export function getStars() {
  return load('stars', 0)
}

export function addStars(n) {
  const total = Math.max(0, getStars() + n)
  save('stars', total)
  return total
}

export function spendStars(n) {
  if (getStars() < n) return false
  save('stars', getStars() - n)
  return true
}

// ---- 連續學習日數 ----
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getStreak() {
  const { count = 0, lastDate = null } = load('streak', {})
  if (!lastDate) return 0
  const last = new Date(lastDate)
  const diffDays = Math.round((new Date(todayStr()) - last) / 86400000)
  // 噚日或者今日有學過先算連續;斷咗就由 0 開始
  return diffDays <= 1 ? count : 0
}

// 完成一個回合時呼叫:當日第一個回合先會 +1
export function bumpStreak() {
  const today = todayStr()
  const { count = 0, lastDate = null } = load('streak', {})
  if (lastDate === today) return count
  const diffDays = lastDate ? Math.round((new Date(today) - new Date(lastDate)) / 86400000) : Infinity
  const next = diffDays === 1 ? count + 1 : 1
  save('streak', { count: next, lastDate: today })
  return next
}

// ---- 關卡解鎖(按 科目 + 年級 分開記錄) ----
export function getUnlocked(subject, grade) {
  const u = load('unlocked', {})
  const key = subject + ':' + grade
  if (key in u) return u[key]
  // 舊版本資料(只按科目記)相容:當作小二進度
  if (grade === '小二' && typeof u[subject] === 'number') return u[subject]
  return 1
}

export function unlockNext(subject, grade, levelId, maxLevel) {
  const unlocked = load('unlocked', {})
  const key = subject + ':' + grade
  const current = unlocked[key] !== undefined ? unlocked[key] : getUnlocked(subject, grade)
  if (levelId === current && current < maxLevel) {
    unlocked[key] = current + 1
    save('unlocked', unlocked)
  }
}

// ---- 答題紀錄(家長後台統計用) ----
export function logAnswer(entry) {
  const log = load('answerLog', [])
  log.push({ ts: Date.now(), ...entry })
  if (log.length > MAX_LOG) log.splice(0, log.length - MAX_LOG)
  save('answerLog', log)
}

export function getAnswerLog() {
  return load('answerLog', [])
}
