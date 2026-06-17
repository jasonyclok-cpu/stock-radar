// 關卡定義:每科按年級分組(小二、小三),每組一條由淺到深嘅關卡路線。
// topics 對應題庫 JSON 入面嘅 topic 欄位。
// 加新關卡:喺對應科目+年級嘅 array 加一項,並確保題庫有該 topic 嘅題目。
export const SUBJECTS = [
  { id: 'math', name: '數學', emoji: '🔢', color: 'bg-orange-400', light: 'bg-orange-100' },
  { id: 'chinese', name: '中文', emoji: '📖', color: 'bg-rose-400', light: 'bg-rose-100' },
  { id: 'english', name: '英文', emoji: '🔤', color: 'bg-violet-400', light: 'bg-violet-100' },
]

// 年級組別(自由切換)
export const GRADES = [
  { id: '小一', name: '小一', emoji: '🐥' },
  { id: '小二', name: '小二', emoji: '🐣' },
  { id: '小三', name: '小三', emoji: '🦉' },
]

export const LEVELS = {
  math: {
    小一: [
      { id: 1, name: '星期月曆', emoji: '📅', topics: ['星期和月曆'] },
      { id: 2, name: '圖形樂園', emoji: '🔺', topics: ['平面圖形'] },
    ],
    小二: [
      { id: 1, name: '加法小路', emoji: '➕', topics: ['兩位數加法'] },
      { id: 2, name: '減法森林', emoji: '➖', topics: ['兩位數減法'] },
      { id: 3, name: '乘法山丘', emoji: '✖️', topics: ['乘法表'] },
      { id: 4, name: '時鐘塔', emoji: '🕐', topics: ['看時鐘'] },
      { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['兩位數加法', '兩位數減法', '乘法表', '看時鐘'] },
      { id: 6, name: '乘法山谷', emoji: '✖️', topics: ['乘法表(3、4)'] },
      { id: 7, name: '金錢小舖', emoji: '💰', topics: ['認識金錢'] },
      { id: 8, name: '應用題森林', emoji: '🌲', topics: ['加減應用題'] },
      { id: 9, name: '乘法表 6-9', emoji: '✖️', topics: ['乘法表(6、7、8、9)'] },
      { id: 10, name: '終極挑戰', emoji: '👑', topics: ['兩位數加法', '兩位數減法', '乘法表', '看時鐘', '乘法表(3、4)', '認識金錢', '加減應用題', '乘法表(6、7、8、9)'] },
    ],
    小三: [
      { id: 1, name: '三位數加法', emoji: '➕', topics: ['三位數加法'] },
      { id: 2, name: '三位數減法', emoji: '➖', topics: ['三位數減法'] },
      { id: 3, name: '乘法大樓', emoji: '✖️', topics: ['乘法(二位數×一位數)'] },
      { id: 4, name: '除法花園', emoji: '➗', topics: ['除法入門'] },
      { id: 5, name: '終極挑戰', emoji: '👑', topics: ['三位數加法', '三位數減法', '乘法(二位數×一位數)', '除法入門'] },
    ],
  },
  chinese: {
    小一: [
      { id: 1, name: '人稱代詞', emoji: '🙋', topics: ['人稱代詞'] },
      { id: 2, name: '專名號', emoji: '📍', topics: ['專名號'] },
    ],
    小二: [
      { id: 1, name: '量詞樂園', emoji: '🐶', topics: ['量詞'] },
      { id: 2, name: '配對小屋', emoji: '🔗', topics: ['詞語配對'] },
      { id: 3, name: '標點小鎮', emoji: '❓', topics: ['標點符號'] },
      { id: 4, name: '句子工場', emoji: '📝', topics: ['重組句子'] },
      { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['量詞', '詞語配對', '標點符號', '重組句子'] },
      { id: 6, name: '詞語魔法', emoji: '🪄', topics: ['詞語填充'] },
      { id: 7, name: '部首花園', emoji: '🌳', topics: ['部首'] },
      { id: 8, name: '終極挑戰', emoji: '👑', topics: ['量詞', '詞語配對', '標點符號', '重組句子', '詞語填充', '部首'] },
    ],
    小三: [
      { id: 1, name: '成語花園', emoji: '🌸', topics: ['成語'] },
      { id: 2, name: '關聯詞橋', emoji: '🌉', topics: ['關聯詞'] },
      { id: 3, name: '比喻工房', emoji: '🎨', topics: ['修辭(比喻)'] },
      { id: 4, name: '終極挑戰', emoji: '👑', topics: ['成語', '關聯詞', '修辭(比喻)'] },
    ],
  },
  english: {
    小一: [
      { id: 1, name: '顏色數字', emoji: '🌈', topics: ['顏色數字'] },
      { id: 2, name: 'this / that', emoji: '👉', topics: ['this/that'] },
    ],
    小二: [
      { id: 1, name: '拼字海灘', emoji: '🏖️', topics: ['拼寫'] },
      { id: 2, name: 'a/an 果園', emoji: '🍎', topics: ['a/an 用法'] },
      { id: 3, name: '複數農場', emoji: '🐑', topics: ['單複數'] },
      { id: 4, name: '句子城堡', emoji: '🏰', topics: ['句子填充'] },
      { id: 5, name: '星星挑戰', emoji: '🌟', topics: ['拼寫', 'a/an 用法', '單複數', '句子填充'] },
      { id: 6, name: '時光機', emoji: '⏰', topics: ['過去式'] },
      { id: 7, name: '位置探險', emoji: '🧭', topics: ['介詞'] },
      { id: 8, name: '終極挑戰', emoji: '👑', topics: ['拼寫', 'a/an 用法', '單複數', '句子填充', '過去式', '介詞'] },
    ],
    小三: [
      { id: 1, name: '進行式車站', emoji: '🚂', topics: ['現在進行式'] },
      { id: 2, name: '比較級山', emoji: '⛰️', topics: ['比較級'] },
      { id: 3, name: '問句樂園', emoji: '❓', topics: ['問句'] },
      { id: 4, name: '終極挑戰', emoji: '👑', topics: ['現在進行式', '比較級', '問句'] },
    ],
  },
}
