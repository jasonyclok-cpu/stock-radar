// 出題引擎:題庫載入、按關卡篩選、自適應難度抽題、答案核對。
import { load, save } from './storage'
import mathQuestions from '../data/questions/math.json'
import chineseQuestions from '../data/questions/chinese.json'
import englishQuestions from '../data/questions/english.json'
import { LEVELS } from '../data/levels'

const BANKS = { math: mathQuestions, chinese: chineseQuestions, english: englishQuestions }

export const ROUND_SIZE = 6
export const PASS_RATE = 0.8

export function getLevelPool(subject, levelId) {
  const level = LEVELS[subject].find((l) => l.id === levelId)
  if (!level) return []
  return BANKS[subject].filter((q) => level.topics.includes(q.topic))
}

// ---- 自適應難度(按科目分開記錄) ----
// bias: -1 偏易、0 正常、+1 偏難
export function getAdaptive(subject) {
  return load('adaptive', {})[subject] || { bias: 0, correctStreak: 0, wrongStreak: 0 }
}

export function recordAdaptive(subject, correct) {
  const all = load('adaptive', {})
  const s = all[subject] || { bias: 0, correctStreak: 0, wrongStreak: 0 }
  if (correct) {
    s.correctStreak += 1
    s.wrongStreak = 0
    if (s.correctStreak >= 2) s.bias = 1
  } else {
    s.wrongStreak += 1
    s.correctStreak = 0
    if (s.wrongStreak >= 2) s.bias = -1
  }
  // 連續紀錄斷咗之後,慢慢回到正常難度
  if (correct && s.bias === -1 && s.correctStreak >= 2) s.bias = 0
  if (!correct && s.bias === 1) s.bias = 0
  all[subject] = s
  save('adaptive', all)
  return s
}

// 加權隨機:目標難度 = 2 + bias,愈接近目標愈大機會抽中
export function pickQuestion(pool, usedIds, bias) {
  const candidates = pool.filter((q) => !usedIds.has(q.id))
  if (candidates.length === 0) return null
  const target = Math.min(3, Math.max(1, 2 + bias))
  const weighted = candidates.map((q) => {
    const dist = Math.abs(q.difficulty - target)
    // 提高難題比例:命中目標難度權重更高,偏離就更細
    return { q, w: dist === 0 ? 6 : dist === 1 ? 1.5 : 0.4 }
  })
  let r = Math.random() * weighted.reduce((s, x) => s + x.w, 0)
  for (const { q, w } of weighted) {
    r -= w
    if (r <= 0) return q
  }
  return weighted[weighted.length - 1].q
}

// ---- 減少重複:記住每科最近出過嘅題目 ----
const RECENT_KEEP = 12

export function getRecentlySeen(subject) {
  return load('recentSeen', {})[subject] || []
}

export function recordSeen(subject, ids) {
  const all = load('recentSeen', {})
  const prev = all[subject] || []
  // 新題排前,只保留最近 RECENT_KEEP 條
  all[subject] = [...ids, ...prev.filter((id) => !ids.includes(id))].slice(0, RECENT_KEEP)
  save('recentSeen', all)
}

// 答錯後搵一條「類似題」:同 topic、難度最接近;搵唔到就重出原題
export function pickSimilar(question, pool, usedIds) {
  const candidates = pool
    .filter((q) => !usedIds.has(q.id) && q.topic === question.topic)
    .sort((a, b) => Math.abs(a.difficulty - question.difficulty) - Math.abs(b.difficulty - question.difficulty))
  return candidates[0] || question
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
