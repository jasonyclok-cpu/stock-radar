// 故事小劇場故事庫。加新故事:加一個物件就得 ——
// scenes:一幕幕場景,text 會逐句朗讀+高亮(用。!?分句),
//   actors 係場景入面識郁嘅 emoji(anim: bob | floaty | cheer | twinkle)
// questions:睇完故事嘅理解題(四選一),explanation 用淺白廣東話。
export const STORIES = [
  {
    id: 'story-picnic',
    title: '小兔子的野餐',
    emoji: '🐰',
    scenes: [
      {
        text: '今天天氣很好,小兔子帶着籃子去野餐。',
        bg: 'from-sky-200 to-green-100',
        actors: [
          { e: '☀️', anim: 'twinkle' },
          { e: '🐰', anim: 'bob' },
          { e: '🧺', anim: 'floaty' },
        ],
      },
      {
        text: '牠在草地上遇見小松鼠。小松鼠說:「我可以一起吃嗎?」',
        bg: 'from-green-100 to-lime-100',
        actors: [
          { e: '🐰', anim: 'bob' },
          { e: '🐿️', anim: 'cheer' },
          { e: '🌳', anim: 'floaty' },
        ],
      },
      {
        text: '小兔子說:「當然可以!」牠們一起分享紅蘿蔔和果仁。',
        bg: 'from-lime-100 to-amber-100',
        actors: [
          { e: '🥕', anim: 'floaty' },
          { e: '🐰', anim: 'cheer' },
          { e: '🐿️', anim: 'cheer' },
          { e: '🌰', anim: 'floaty' },
        ],
      },
      {
        text: '大家吃得很開心。分享食物,朋友會更多!',
        bg: 'from-amber-100 to-pink-100',
        actors: [
          { e: '🐰', anim: 'cheer' },
          { e: '🐿️', anim: 'cheer' },
          { e: '💖', anim: 'twinkle' },
        ],
      },
    ],
    questions: [
      {
        question: '小兔子帶着甚麼去野餐?',
        options: ['籃子', '雨傘', '書包', '足球'],
        answer: '籃子',
        explanation: '故事一開始講「小兔子帶着籃子去野餐」。',
      },
      {
        question: '小兔子在草地上遇見誰?',
        options: ['小松鼠', '小貓', '小狗', '小鳥'],
        answer: '小松鼠',
        explanation: '第二幕講「牠在草地上遇見小松鼠」。',
      },
      {
        question: '這個故事教我們甚麼?',
        options: ['要分享', '要早睡', '要跑步', '要儲錢'],
        answer: '要分享',
        explanation: '結尾講「分享食物,朋友會更多」,即係教我哋要分享。',
      },
    ],
  },
  {
    id: 'story-ant',
    title: '小螞蟻搬餅乾',
    emoji: '🐜',
    scenes: [
      {
        text: '一隻小螞蟻發現了一塊大餅乾。',
        bg: 'from-amber-100 to-orange-100',
        actors: [
          { e: '🐜', anim: 'bob' },
          { e: '🍪', anim: 'floaty' },
        ],
      },
      {
        text: '餅乾太大了,牠一個人搬不動。',
        bg: 'from-orange-100 to-rose-100',
        actors: [
          { e: '🐜', anim: 'bob' },
          { e: '🍪', anim: 'floaty' },
          { e: '💦', anim: 'twinkle' },
        ],
      },
      {
        text: '牠回家叫來十個朋友,大家一起用力搬。',
        bg: 'from-rose-100 to-violet-100',
        actors: [
          { e: '🐜', anim: 'bob' },
          { e: '🐜', anim: 'cheer' },
          { e: '🐜', anim: 'bob' },
          { e: '🍪', anim: 'floaty' },
        ],
      },
      {
        text: '餅乾終於搬回家了!團結力量大。',
        bg: 'from-violet-100 to-sky-100',
        actors: [
          { e: '🎉', anim: 'twinkle' },
          { e: '🐜', anim: 'cheer' },
          { e: '🏠', anim: 'floaty' },
        ],
      },
    ],
    questions: [
      {
        question: '小螞蟻發現了甚麼?',
        options: ['一塊大餅乾', '一粒糖', '一個蘋果', '一塊蛋糕'],
        answer: '一塊大餅乾',
        explanation: '第一幕講「小螞蟻發現了一塊大餅乾」。',
      },
      {
        question: '為甚麼小螞蟻搬不動餅乾?',
        options: ['餅乾太大', '牠太肚餓', '牠想睡覺', '落大雨'],
        answer: '餅乾太大',
        explanation: '故事講「餅乾太大了,牠一個人搬不動」。',
      },
      {
        question: '這個故事教我們甚麼?',
        options: ['團結力量大', '餅乾好味', '要自己一個做事', '螞蟻很小'],
        answer: '團結力量大',
        explanation: '結尾講「團結力量大」,大家一齊做,難事都做到。',
      },
    ],
  },
  {
    id: 'story-rainbow',
    title: '彩虹的秘密',
    emoji: '🌈',
    scenes: [
      {
        text: '下了一場大雨,小青蛙躲在荷葉下面。',
        bg: 'from-slate-200 to-sky-200',
        actors: [
          { e: '🌧️', anim: 'twinkle' },
          { e: '🐸', anim: 'bob' },
          { e: '🍃', anim: 'floaty' },
        ],
      },
      {
        text: '雨停了,太陽出來了。天空出現了一道彩虹!',
        bg: 'from-sky-200 to-yellow-100',
        actors: [
          { e: '☀️', anim: 'twinkle' },
          { e: '🌈', anim: 'floaty' },
          { e: '🐸', anim: 'cheer' },
        ],
      },
      {
        text: '小青蛙數一數,彩虹有紅、橙、黃、綠、藍、靛、紫七種顏色。',
        bg: 'from-yellow-100 to-pink-100',
        actors: [
          { e: '🌈', anim: 'floaty' },
          { e: '🐸', anim: 'bob' },
          { e: '✨', anim: 'twinkle' },
        ],
      },
      {
        text: '原來雨後有陽光,就有機會看見彩虹。',
        bg: 'from-pink-100 to-violet-100',
        actors: [
          { e: '🌈', anim: 'floaty' },
          { e: '☀️', anim: 'twinkle' },
          { e: '🐸', anim: 'cheer' },
        ],
      },
    ],
    questions: [
      {
        question: '下大雨時,小青蛙躲在哪裏?',
        options: ['荷葉下面', '石頭上面', '樹屋裏面', '水底'],
        answer: '荷葉下面',
        explanation: '第一幕講「小青蛙躲在荷葉下面」。',
      },
      {
        question: '彩虹有幾多種顏色?',
        options: ['七種', '五種', '三種', '十種'],
        answer: '七種',
        explanation: '故事講彩虹有「紅、橙、黃、綠、藍、靛、紫」七種顏色。',
      },
      {
        question: '甚麼時候有機會看見彩虹?',
        options: ['雨後有陽光', '半夜', '落雪時', '打風時'],
        answer: '雨後有陽光',
        explanation: '結尾講「雨後有陽光,就有機會看見彩虹」。',
      },
    ],
  },
  {
    id: 'story-morning',
    title: '小明的早上',
    emoji: '⏰',
    scenes: [
      {
        text: '早上七時正,鬧鐘響了。小明自己起牀,不用媽媽叫。',
        bg: 'from-sky-100 to-amber-100',
        actors: [
          { e: '⏰', anim: 'cheer' },
          { e: '🧒', anim: 'bob' },
          { e: '🛏️', anim: 'floaty' },
        ],
      },
      {
        text: '他先刷牙洗臉,然後吃早餐。早餐有麵包和牛奶。',
        bg: 'from-amber-100 to-orange-100',
        actors: [
          { e: '🪥', anim: 'bob' },
          { e: '🍞', anim: 'floaty' },
          { e: '🥛', anim: 'floaty' },
        ],
      },
      {
        text: '七時半,小明背起書包,和媽媽說再見。',
        bg: 'from-orange-100 to-green-100',
        actors: [
          { e: '🎒', anim: 'bob' },
          { e: '🧒', anim: 'cheer' },
          { e: '👩', anim: 'bob' },
        ],
      },
      {
        text: '他準時回到學校,老師稱讚他是個守時的好孩子。',
        bg: 'from-green-100 to-sky-100',
        actors: [
          { e: '🏫', anim: 'floaty' },
          { e: '🧒', anim: 'cheer' },
          { e: '⭐', anim: 'twinkle' },
        ],
      },
    ],
    questions: [
      {
        question: '鬧鐘幾點鐘響?',
        options: ['七時正', '八時正', '六時半', '七時半'],
        answer: '七時正',
        explanation: '第一幕講「早上七時正,鬧鐘響了」。',
      },
      {
        question: '小明早餐吃甚麼?',
        options: ['麵包和牛奶', '粥和油條', '蛋糕和果汁', '飯和湯'],
        answer: '麵包和牛奶',
        explanation: '故事講「早餐有麵包和牛奶」。',
      },
      {
        question: '老師稱讚小明是個怎樣的孩子?',
        options: ['守時', '高大', '好動', '愛睡覺'],
        answer: '守時',
        explanation: '結尾講老師稱讚佢係「守時的好孩子」,因為佢準時返學。',
      },
    ],
  },
]
