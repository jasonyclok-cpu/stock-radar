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

export function clearAll() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
