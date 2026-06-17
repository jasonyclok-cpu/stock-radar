// 成長型思維鼓勵文案:讚努力、讚進步,唔講「叻/蠢」「測驗」「分數」。
export const CHEERS = ['好叻呀!', '答得好!', '勁呀!', '太棒了!', '叻仔!']

export const EFFORT = [
  '好努力呀!',
  '越練越掂!',
  '再試多次,你得嘅!',
  '進步咗喎!',
  '繼續加油,你做得到!',
  '專心啲就更快!',
]

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
