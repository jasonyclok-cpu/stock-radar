/* ============================================================
   kid-star ・ reading 模組｜題庫 (passages.js)
   ------------------------------------------------------------
   呢個檔淨係「內容」，唔含遊戲邏輯。想加文章就照下面格式加入 READING_DATA 陣列。

   程度基準（香港小二 P2）：
   - 中文：每篇 100–150 字書面語，4 條理解題
   - 英文：每篇約 10 句，P2 文法（現在式／現在進行式／過去式），3–4 條理解題
   - 文章句子一律不得有 emoji（頂部插圖 emoji 除外）

   每篇文章格式：
   {
     id:    "zh-5",          // 唯一編號（lang 前綴 + 數字）
     lang:  "zh",            // "zh"（繁體書面語）或 "en"
     level: 1,               // 難度 1=最淺，數字越大越深
     title: "標題",
     emoji: "🐱",            // 一個代表插圖嘅 emoji（只用喺文章頂部）
     text:  ["第一句。","第二句。"],   // 逐句一個元素
     glossary: { "生字":"解釋", ... }, // 生字解釋（撳一下出意思 + 讀音）
     questions: [
       { q:"問題？", choices:["A","B","C"], answer:0 },  // answer 係正確選項索引（由 0 開始，位置要有變化）
       { q:"判斷句。", type:"tf", answer:false }          // 是非題
     ]
   }

   注意：閱讀理解唔可以自動亂生成，文章同題目要人手寫先準確。
   ============================================================ */
window.READING_DATA = [

  /* ---------------- 中文（繁體・書面語，100–150 字） ---------------- */
  {
    id:"zh-1", lang:"zh", level:1, title:"我的小狗", emoji:"🐶",
    text:[
      "我家有一隻小狗，名叫豆豆。",
      "牠全身長着啡色的短毛，耳朵大大的，尾巴短短的。",
      "每天放學回家，豆豆都會跑到門口迎接我，搖着尾巴團團轉。",
      "我拿出皮球，牠就跳來跳去，想跟我玩。",
      "晚飯後，我會帶豆豆到樓下散步。",
      "牠是我最好的朋友，我要好好照顧牠。"
    ],
    glossary:{ "迎接":"出來歡迎、接人。", "團團轉":"不停地轉圈。", "照顧":"小心看管、愛護。" },
    questions:[
      { q:"小狗叫甚麼名字？", choices:["豆豆","波波","毛毛"], answer:0 },
      { q:"豆豆的毛是甚麼顏色？", choices:["白色","啡色","黑色"], answer:1 },
      { q:"我放學回家，豆豆會怎樣？", choices:["躲起來睡覺","不理睬我","跑到門口迎接我"], answer:2 },
      { q:"晚飯後我帶豆豆做甚麼？", choices:["散步","洗澡","看醫生"], answer:0 }
    ]
  },
  {
    id:"zh-2", lang:"zh", level:1, title:"開心的生日會", emoji:"🎂",
    text:[
      "今天是妹妹六歲的生日。",
      "媽媽一早起牀，做了一個大大的草莓蛋糕。",
      "下午，姨媽和表哥都來到我家，大家一起唱生日歌。",
      "妹妹閉上眼睛許願，然後一口氣吹熄了蠟燭，大家都拍手歡呼。",
      "我們吃蛋糕、玩遊戲，客廳裏充滿了笑聲。",
      "妹妹說，這是她最開心的一天。"
    ],
    glossary:{ "許願":"心裏想一個願望。", "吹熄":"用口把火吹滅。", "歡呼":"開心地大聲叫好。" },
    questions:[
      { q:"妹妹今年幾多歲？", choices:["五歲","六歲","七歲"], answer:1 },
      { q:"蛋糕是誰做的？", choices:["媽媽","姨媽","表哥"], answer:0 },
      { q:"蛋糕是甚麼味道？", choices:["朱古力","芒果","草莓"], answer:2 },
      { q:"妹妹吹蠟燭之前先做甚麼？", choices:["唱歌","許願","吃蛋糕"], answer:1 }
    ]
  },
  {
    id:"zh-3", lang:"zh", level:2, title:"聰明的小螞蟻", emoji:"🐜",
    text:[
      "一個下午，小螞蟻在草地上找到一粒又大又香的花生。",
      "牠想把花生搬回家，可是花生實在太重了，牠推了半天也推不動。",
      "小螞蟻沒有放棄，牠急忙跑回家，請來十多個好朋友幫忙。",
      "大家一起用力，有的推，有的拉，終於把花生搬回家了。",
      "螞蟻們圍在一起，開開心心地分享食物。",
      "原來只要團結合作，再難的事情也能做到。"
    ],
    glossary:{ "放棄":"不再繼續做。", "急忙":"很快、趕緊。", "團結合作":"大家齊心一起做事。" },
    questions:[
      { q:"小螞蟻在草地上找到甚麼？", choices:["一粒花生","一塊餅乾","一顆糖果"], answer:0 },
      { q:"為甚麼小螞蟻推不動花生？", choices:["牠想睡覺","花生太重","下大雨"], answer:1 },
      { q:"小螞蟻請誰來幫忙？", choices:["小鳥","大象","好朋友"], answer:2 },
      { q:"這個故事教我們甚麼道理？", choices:["團結合作","早睡早起","節省金錢"], answer:0 }
    ]
  },
  {
    id:"zh-4", lang:"zh", level:2, title:"秋天的落葉", emoji:"🍂",
    text:[
      "秋天到了，天氣漸漸變得涼快。",
      "公園裏的樹葉變成黃色和紅色，一片一片地落下來，好像蝴蝶在空中跳舞。",
      "小文和爸爸到公園散步，他撿起一片金黃色的落葉，夾在圖書裏做書籤。",
      "爸爸告訴他，樹木脫掉葉子，是為了留住水分，準備過冬。",
      "小文點點頭，覺得大自然真是奇妙。"
    ],
    glossary:{ "漸漸":"慢慢地、一點一點地。", "書籤":"夾在書裏做記號的小卡。", "奇妙":"神奇又有趣。" },
    questions:[
      { q:"秋天公園裏的樹葉變成甚麼顏色？", choices:["黃色和紅色","藍色和綠色","黑色和白色"], answer:0 },
      { q:"落葉落下來好像甚麼在跳舞？", choices:["小鳥","蝴蝶","蜜蜂"], answer:1 },
      { q:"小文用落葉做甚麼？", choices:["摺飛機","做扇子","做書籤"], answer:2 },
      { q:"樹木為甚麼要脫掉葉子？", choices:["留住水分準備過冬","葉子太醜","想快點長高"], answer:0 }
    ]
  },
  {
    id:"zh-5", lang:"zh", level:3, title:"圖書館的一天", emoji:"📚",
    text:[
      "星期六早上，小健和媽媽一起到圖書館看書。",
      "圖書館裏十分安靜，大家都專心地閱讀。",
      "小健挑選了一本關於恐龍的圖書，坐在窗邊慢慢地看。",
      "他一邊看，一邊把有趣的地方記在小本子上。",
      "快到中午，小健把圖書放回原來的書架，又向管理員借了兩本書回家。",
      "媽媽稱讚他是個愛閱讀又有禮貌的好孩子。",
      "小健說，書本就像一位老師，教會他很多知識。"
    ],
    glossary:{ "專心":"集中精神做一件事。", "挑選":"揀選、選擇。", "稱讚":"讚美人做得好。", "知識":"學到的道理和學問。" },
    questions:[
      { q:"小健星期六去了哪裏？", choices:["圖書館","公園","超級市場"], answer:0 },
      { q:"小健挑選了關於甚麼的圖書？", choices:["太空","恐龍","海洋"], answer:1 },
      { q:"看完書，小健把圖書放回哪裏？", choices:["書包裏","枱面上","原來的書架"], answer:2 },
      { q:"小健覺得書本像甚麼？", choices:["一位老師","一個朋友","一件玩具"], answer:0 }
    ]
  },
  {
    id:"zh-6", lang:"zh", level:3, title:"第一次坐電車", emoji:"🚋",
    text:[
      "星期日，爸爸帶小美去坐電車。",
      "電車在馬路中間慢慢行駛，發出「叮叮」的聲音，所以人們都叫它「叮叮」。",
      "小美坐在上層靠窗的位置，看見街道兩旁有高高的大廈，也有古老的小店。",
      "爸爸說，電車已經有超過一百年歷史，雖然行得慢，但是車費便宜，又不會排放廢氣，十分環保。",
      "小美覺得這次旅程又新奇又有趣。",
      "她說，下次要帶同學一起來坐。"
    ],
    glossary:{ "行駛":"車輛在路上行走。", "古老":"很久以前留下來的、很舊的。", "排放廢氣":"放出污染空氣的氣體。", "環保":"愛護環境、不弄髒地球。" },
    questions:[
      { q:"人們叫電車做甚麼？", choices:["隆隆","叮叮","嘟嘟"], answer:1 },
      { q:"小美坐在電車的哪個位置？", choices:["下層門口","司機旁邊","上層靠窗"], answer:2 },
      { q:"電車有幾多年歷史？", choices:["超過一百年","大約十年","五十年"], answer:0 },
      { q:"為甚麼說電車環保？", choices:["因為它行得快","因為它不會排放廢氣","因為它是紅色的"], answer:1 }
    ]
  },

  /* ---------------- English（香港小二 P2 程度，約 10 句） ---------------- */
  {
    id:"en-1", lang:"en", level:1, title:"My Dog Lucky", emoji:"🐶",
    text:[
      "I have a dog.",
      "His name is Lucky.",
      "He is two years old.",
      "He has brown fur, short legs and a long tail.",
      "Lucky likes to run in the park.",
      "He can catch a ball and bring it back to me.",
      "Every day I give him food and clean water.",
      "After school, I play with him in the garden.",
      "At night, he sleeps in his little bed near the door.",
      "Lucky is my best friend and I love him very much."
    ],
    glossary:{ "fur":"動物嘅毛", "catch":"接住", "garden":"花園", "near the door":"喺門口附近" },
    questions:[
      { q:"How old is Lucky?", choices:["two years old","three years old","five years old"], answer:0 },
      { q:"What can Lucky catch?", choices:["a kite","a ball","a fish"], answer:1 },
      { q:"Where does Lucky sleep at night?", choices:["in the park","on my bed","in his little bed"], answer:2 },
      { q:"What do I give Lucky every day?", choices:["food and clean water","toys and books","cake and tea"], answer:0 }
    ]
  },
  {
    id:"en-2", lang:"en", level:1, title:"My School", emoji:"🏫",
    text:[
      "I go to school five days a week.",
      "My school is big and clean.",
      "There are many classrooms, a library and a playground.",
      "My classroom is on the second floor.",
      "There are twenty-five pupils in my class.",
      "My class teacher is Miss Chan.",
      "She is kind and she tells us funny stories.",
      "I like reading books in the library.",
      "At recess, I play with my friends in the playground.",
      "I am happy at school every day."
    ],
    glossary:{ "pupils":"學生", "second floor":"二樓", "recess":"小息", "funny":"好笑、有趣" },
    questions:[
      { q:"How many days a week do I go to school?", choices:["seven","five","three"], answer:1 },
      { q:"Who is my class teacher?", choices:["Miss Chan","Miss Wong","Mr Lee"], answer:0 },
      { q:"How many pupils are there in my class?", choices:["twenty","thirty","twenty-five"], answer:2 },
      { q:"Where do I play at recess?", choices:["in the playground","in the library","in the classroom"], answer:0 }
    ]
  },
  {
    id:"en-3", lang:"en", level:2, title:"A Day at the Beach", emoji:"🏖️",
    text:[
      "It is a hot and sunny day.",
      "My family goes to the beach in the morning.",
      "The sky is blue and the sea is clean.",
      "Dad and I swim in the sea.",
      "Mum sits under a big umbrella and reads a book.",
      "My little sister makes a sandcastle with her bucket and spade.",
      "At noon, we eat sandwiches and drink orange juice.",
      "Then we look for pretty shells on the beach.",
      "In the afternoon, we go home by bus.",
      "We are tired but very happy."
    ],
    glossary:{ "sandcastle":"沙堡", "bucket and spade":"小桶同鏟", "shells":"貝殼", "at noon":"中午" },
    questions:[
      { q:"How is the weather?", choices:["hot and sunny","cold and rainy","windy and cloudy"], answer:0 },
      { q:"What does Mum do at the beach?", choices:["swims in the sea","reads a book","makes a sandcastle"], answer:1 },
      { q:"What do we eat at noon?", choices:["noodles","rice","sandwiches"], answer:2 },
      { q:"How do we go home?", choices:["by bus","by train","by car"], answer:0 }
    ]
  },
  {
    id:"en-5", lang:"en", level:2, title:"In the Playground", emoji:"🛝",
    text:[
      "The sun is shining and the wind is soft.",
      "Many children are playing in the playground after school.",
      "Tom is flying a new kite with his sister.",
      "The kite is red and yellow, and it goes up very high.",
      "Two girls are skipping under the big tree.",
      "Some boys are playing football on the grass.",
      "A little boy is sitting on the swing.",
      "His mother is standing behind him.",
      "The children are laughing and shouting happily.",
      "Everyone is having a good time."
    ],
    glossary:{ "shining":"照耀緊、好猛", "skipping":"跳緊繩", "swing":"韆鞦", "grass":"草地" },
    questions:[
      { q:"Who is flying a kite with Tom?", choices:["his mother","his friend","his sister"], answer:2 },
      { q:"What colour is the kite?", choices:["red and yellow","blue and green","black and white"], answer:0 },
      { q:"Where are the boys playing football?", choices:["under the tree","on the grass","on the swing"], answer:1 },
      { q:"Who is standing behind the little boy?", choices:["his mother","his teacher","his sister"], answer:0 }
    ]
  },
  {
    id:"en-4", lang:"en", level:3, title:"The Little Seed", emoji:"🌱",
    text:[
      "Amy finds a little seed in the garden.",
      "She puts it in a pot with some soil.",
      "She waters it every morning before school.",
      "She also puts the pot near the window because plants need sunlight.",
      "After two weeks, a small green plant comes out.",
      "Amy is excited and takes good care of it.",
      "One month later, the plant has a pretty pink flower.",
      "It smells nice and looks lovely.",
      "Amy shows the flower to her mum and dad.",
      "She is very proud of her little plant."
    ],
    glossary:{ "seed":"種子", "soil":"泥土", "sunlight":"陽光", "takes good care of":"好好照顧", "proud":"自豪、好滿足" },
    questions:[
      { q:"Where does Amy put the seed?", choices:["in a pot","in her bag","in the sea"], answer:0 },
      { q:"Why does Amy put the pot near the window?", choices:["to make it look pretty","because plants need sunlight","because the pot is heavy"], answer:1 },
      { q:"What colour is the flower?", choices:["yellow","white","pink"], answer:2 },
      { q:"How does Amy feel at the end?", choices:["proud","angry","scared"], answer:0 }
    ]
  },
  {
    id:"en-6", lang:"en", level:3, title:"My Birthday Party", emoji:"🎂",
    text:[
      "Yesterday was my eighth birthday.",
      "Mum made a big chocolate cake for me.",
      "Dad put up balloons in the living room.",
      "In the afternoon, my friends came to my home.",
      "They gave me cards and lovely presents.",
      "We played games and sang songs together.",
      "Then we ate the cake and drank lemon tea.",
      "My best friend Amy won the game and we all clapped.",
      "Before they went home, I said thank you to everyone.",
      "It was the happiest day of the year."
    ],
    glossary:{ "put up":"掛起、佈置", "presents":"禮物", "clapped":"拍手", "the happiest day":"最開心嘅一日" },
    questions:[
      { q:"How old am I now?", choices:["seven","eight","nine"], answer:1 },
      { q:"Who put up the balloons?", choices:["Dad","Mum","Amy"], answer:0 },
      { q:"What did we drink?", choices:["orange juice","milk","lemon tea"], answer:2 },
      { q:"Who won the game?", choices:["Amy","Tom","I"], answer:0 }
    ]
  }

];
