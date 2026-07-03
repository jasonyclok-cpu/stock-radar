// 聲音開關:一個掣同時控制音效同語音朗讀。設定存 starschool_muted。
import { load, save } from './storage'

let muted = load('muted', false)

export function isMuted() {
  return muted
}

export function setMuted(v) {
  muted = !!v
  save('muted', muted)
}

export function toggleMuted() {
  setMuted(!muted)
  return muted
}
