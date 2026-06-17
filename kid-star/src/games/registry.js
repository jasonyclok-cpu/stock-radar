// 所有小遊戲嘅單一清單(主頁同 App 都讀呢度)。
// cat: 'learn' 學習 | 'focus' 專注力
// cost: 0 = 免費(會按表現賺星,但 5 分鐘最多玩 3 次);10 = 用 10⭐ 入場
// arcade: 有此欄 = 用 ArcadeQuiz 競速答題遊戲(config 指定科目/課題)
//
// 加新遊戲:喺呢度加一項;arcade 類唔使寫新元件,specific 類就喺 App.jsx
// 嘅 SPECIFIC 對應表加返個元件。
export const GAMES = [
  // ===== 學習遊戲(共 10 個,其中 4 個免費限時)=====
  { id: 'mathgame', cat: 'learn', title: '限時心算', emoji: '⚡', desc: '60 秒鬥快計數!', cost: 0, from: 'from-amber-400', to: 'to-orange-500' },
  { id: 'quickquiz', cat: 'learn', title: '快問快答', emoji: '⚡', desc: '中英數混合,鬥快答!', cost: 0, from: 'from-sky-400', to: 'to-blue-500', arcade: { title: '快問快答' } },
  { id: 'truefalse', cat: 'learn', title: '真定假', emoji: '✅', desc: '睇算式,啱就 ✓、錯就 ✗!', cost: 0, from: 'from-green-400', to: 'to-emerald-500' },
  { id: 'maketen', cat: 'learn', title: '湊十', emoji: '🔟', desc: '揀兩個加埋等於 10!', cost: 0, from: 'from-pink-400', to: 'to-rose-500' },
  { id: 'memory', cat: 'learn', title: '記憶配對', emoji: '🃏', desc: '配對中英文詞語,會讀出嚟!', cost: 10, from: 'from-violet-400', to: 'to-fuchsia-500' },
  { id: 'arcade-math', cat: 'learn', title: '數學閃電', emoji: '➗', desc: '數學題鬥快答!', cost: 10, from: 'from-orange-400', to: 'to-red-500', arcade: { subjects: ['math'], title: '數學閃電' } },
  { id: 'arcade-eng', cat: 'learn', title: '英文閃卡', emoji: '🔤', desc: '英文題鬥快答!', cost: 10, from: 'from-indigo-400', to: 'to-violet-500', arcade: { subjects: ['english'], title: '英文閃卡' } },
  { id: 'arcade-chi', cat: 'learn', title: '中文挑戰', emoji: '📖', desc: '中文題鬥快答!', cost: 10, from: 'from-rose-400', to: 'to-pink-500', arcade: { subjects: ['chinese'], title: '中文挑戰' } },
  { id: 'arcade-mw', cat: 'learn', title: '量詞王', emoji: '🐶', desc: '一隻狗、一本書…揀啱量詞!', cost: 10, from: 'from-teal-400', to: 'to-cyan-500', arcade: { topics: ['量詞'], title: '量詞王' } },
  { id: 'arcade-clock', cat: 'learn', title: '時間王', emoji: '🕐', desc: '睇時鐘、星期月曆鬥快!', cost: 10, from: 'from-cyan-400', to: 'to-sky-500', arcade: { topics: ['看時鐘', '星期和月曆'], title: '時間王' } },

  // ===== 專注力遊戲(共 7 個,其中 2 個免費限時)=====
  { id: 'traffic', cat: 'focus', title: '紅綠燈', emoji: '🚦', desc: '綠燈快撳,紅燈唔好撳!', cost: 0, from: 'from-green-400', to: 'to-emerald-500' },
  { id: 'schulte', cat: 'focus', title: '數字快搜', emoji: '🔢', desc: '由細到大順住點!', cost: 0, from: 'from-sky-400', to: 'to-cyan-500' },
  { id: 'memoryplus', cat: 'focus', title: '記憶翻牌', emoji: '🧠', desc: '睇清楚就蓋牌,搵成對!', cost: 10, from: 'from-rose-400', to: 'to-pink-500' },
  { id: 'listen', cat: 'focus', title: '聽指令', emoji: '👂', desc: '聽小星講,做啱動作!', cost: 10, from: 'from-teal-400', to: 'to-cyan-500' },
  { id: 'sequence', cat: 'focus', title: '圖案接龍', emoji: '🎶', desc: '記住啲燈,順住㩒返!', cost: 10, from: 'from-indigo-400', to: 'to-blue-500' },
  { id: 'spot', cat: 'focus', title: '找不同', emoji: '🔍', desc: '搵出兩幅圖唔同嘅地方!', cost: 10, from: 'from-lime-400', to: 'to-green-500' },
  { id: 'maze', cat: 'focus', title: '走迷宮', emoji: '🧩', desc: '手指由起點行去終點!', cost: 10, from: 'from-orange-400', to: 'to-amber-500' },
]

export const GAME_COST = 10

export function gamesByCat(cat) {
  return GAMES.filter((g) => g.cat === cat)
}

export function findGame(id) {
  return GAMES.find((g) => g.id === id)
}
