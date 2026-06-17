// 所有 localStorage 存取都經呢度,key 一律加 starschool_ 前綴。
const PREFIX = 'starschool_'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage 滿咗或者唔可用時靜默失敗,唔好令小朋友見到錯誤
  }
}

// 匯出所有 starschool_ 資料做一個物件(備份用)
export function exportAll() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) {
      try {
        data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k))
      } catch {
        // 略過壞資料
      }
    }
  }
  return { app: 'starschool', version: 1, exportedAt: new Date().toISOString(), data }
}

// 由備份物件還原(覆寫同名 key)
export function importAll(payload) {
  if (!payload || payload.app !== 'starschool' || typeof payload.data !== 'object') return false
  Object.entries(payload.data).forEach(([k, v]) => save(k, v))
  return true
}

export function clearAll() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
