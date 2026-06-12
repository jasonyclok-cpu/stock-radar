// 關卡定義:每科一條路線,topics 對應題庫 JSON 入面嘅 topic 欄位。
// 加新關卡:喺對應科目 array 加一項,並確保題庫有該 topic 嘅題目。
export const SUBJECTS = [
  { id: 'math', name: '數學', emoji: '🔢', color: 'bg-orange-400', light: 'bg-orange-100' },
  { id: 'chinese', name: '中文', emoji: '📖', color: 'bg-rose-400', light: 'bg-rose-100' },
  { id: 'english', name: '英文', emoji: '🔤', color: 'bg-violet-400', light: 'bg-violet-100' },
]

export const LEVELS = {
  math: [
    { id: 1, name: '加法小路', emoji: '➕', topics: ['兩位數加法'] },
    { id: 2, name: '減法森林', emoji: '➖', topics: ['兩位數減法'] },
    { id: 3, name: '乘法山丘', emoji: '✖️', topics: ['乘法表'] },
    { id: 4, name: '時鐘塔', emoji: '🕐', topics: ['看時鐘'] },
    { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['兩位數加法', '兩位數減法', '乘法表', '看時鐘'] },
  ],
  chinese: [
    { id: 1, name: '量詞樂園', emoji: '🐶', topics: ['量詞'] },
    { id: 2, name: '配對小屋', emoji: '🔗', topics: ['詞語配對'] },
    { id: 3, name: '標點小鎮', emoji: '❓', topics: ['標點符號'] },
    { id: 4, name: '句子工場', emoji: '📝', topics: ['重組句子'] },
    { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['量詞', '詞語配對', '標點符號', '重組句子'] },
  ],
  english: [
    { id: 1, name: '拼字海灘', emoji: '🏖️', topics: ['拼寫'] },
    { id: 2, name: 'a/an 果園', emoji: '🍎', topics: ['a/an 用法'] },
    { id: 3, name: '複數農場', emoji: '🐑', topics: ['單複數'] },
    { id: 4, name: '句子城堡', emoji: '🏰', topics: ['句子填充'] },
    { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['拼寫', 'a/an 用法', '單複數', '句子填充'] },
  ],
}
