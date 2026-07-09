/* ============================================================
   kid-star ・ reading 模組｜題庫 (passages.js)
   ------------------------------------------------------------
   呢個檔淨係「內容」，唔含遊戲邏輯。想加文章就照下面格式加入 READING_DATA 陣列。

   每篇文章格式：
   {
     id:    "zh-5",          // 唯一編號（lang 前綴 + 數字）
     lang:  "zh",            // "zh"（繁體書面語）或 "en"
     level: 1,               // 難度 1=最淺，數字越大越深
     title: "標題",
     emoji: "🐱",            // 一個代表插圖嘅 emoji
     text:  ["第一句。","第二句。"],   // 逐句一個元素（方便逐句朗讀）
     glossary: { "生字":"解釋", ... }, // 生字解釋（撳一下會出意思 + 朗讀）
     questions: [
       { q:"問題？", choices:["A","B","C"], answer:0 },  // 選擇題，answer 係正確選項索引（由 0 開始）
       { q:"判斷句。", type:"tf", answer:false }          // 是非題，answer 係 true/false
     ]
   }

   注意：閱讀理解唔可以自動亂生成，文章同題目要人手寫先準確。
   ============================================================ */
window.READING_DATA = [

  /* ---------------- 中文（繁體・書面語） ---------------- */
  {
    id:"zh-1", lang:"zh", level:1, title:"肚餓的小貓", emoji:"🐱",
    text:["小貓肚餓了。","牠看見一條魚。","小貓很開心。"],
    glossary:{ "肚餓":"肚子餓，想吃東西。", "開心":"覺得高興、快樂。" },
    questions:[
      { q:"小貓為什麼開心？", choices:["看見一條魚","天上下雨","要去睡覺"], answer:0 },
      { q:"小貓一開始有什麼感覺？", choices:["肚餓","口渴","怕冷"], answer:0 }
    ]
  },
  {
    id:"zh-2", lang:"zh", level:1, title:"下雨天", emoji:"🌧️",
    text:["天下雨了。","小明拿出雨傘。","他沒有淋濕。"],
    glossary:{ "雨傘":"下雨時用來擋雨的工具。", "淋濕":"被水弄濕。" },
    questions:[
      { q:"小明用什麼擋雨？", choices:["雨傘","帽子","報紙"], answer:0 },
      { q:"判斷：小明全身都淋濕了。", type:"tf", answer:false }
    ]
  },
  {
    id:"zh-3", lang:"zh", level:2, title:"唱歌的小鳥", emoji:"🐦",
    text:["早上，小鳥在樹上唱歌。","牠的歌聲很好聽。","妹妹聽見了，走到窗前看牠。","小鳥拍拍翅膀，飛走了。"],
    glossary:{ "歌聲":"唱歌的聲音。", "翅膀":"鳥兒用來飛的部分。", "窗前":"窗子的前面。" },
    questions:[
      { q:"小鳥在哪裏唱歌？", choices:["樹上","屋裏","水裏"], answer:0 },
      { q:"誰走到窗前？", choices:["妹妹","哥哥","媽媽"], answer:0 },
      { q:"小鳥最後做了什麼？", choices:["飛走了","睡着了","繼續唱歌"], answer:0 }
    ]
  },
  {
    id:"zh-4", lang:"zh", level:3, title:"小芳的向日葵", emoji:"🌻",
    text:["小芳在花園種了一棵向日葵。","她每天替它澆水。","過了很多天，向日葵長得比小芳還要高。","它的花朝着太陽，金黃金黃的。","小芳看見了，開心得拍起手來。"],
    glossary:{ "向日葵":"一種會朝着太陽的花。", "澆水":"把水淋在植物上。", "金黃":"像黃金一樣的黃色。" },
    questions:[
      { q:"小芳種了什麼？", choices:["向日葵","玫瑰","小草"], answer:0 },
      { q:"她每天替向日葵做什麼？", choices:["澆水","唱歌","畫畫"], answer:0 },
      { q:"向日葵的花朝着什麼？", choices:["太陽","月亮","星星"], answer:0 },
      { q:"後來向日葵長得怎樣？", choices:["比小芳還高","很矮小","枯萎了"], answer:0 }
    ]
  },

  /* ---------------- English（香港小二 P2 程度） ---------------- */
  {
    id:"en-1", lang:"en", level:1, title:"My Dog Lucky", emoji:"🐶",
    text:["I have a dog.","His name is Lucky.","He has short legs and a long tail.","He likes to run in the park.","I play with him after school every day."],
    glossary:{ "short":"短", "tail":"尾巴", "park":"公園", "after school":"放學之後" },
    questions:[
      { q:"What is the dog's name?", choices:["Bobby","Lucky","Sunny"], answer:1 },
      { q:"What does Lucky like to do?", choices:["run in the park","sleep all day","eat apples"], answer:0 },
      { q:"When do I play with Lucky?", choices:["before breakfast","at night","after school"], answer:2 }
    ]
  },
  {
    id:"en-2", lang:"en", level:1, title:"My School Bag", emoji:"🎒",
    text:["This is my school bag.","It is blue and it is new.","There are three books and a pencil case in it.","I take it to school every morning.","I always keep it clean and tidy."],
    glossary:{ "pencil case":"筆盒", "every morning":"每朝早", "tidy":"整齊" },
    questions:[
      { q:"What colour is the school bag?", choices:["red","blue","green"], answer:1 },
      { q:"How many books are in the bag?", choices:["two","four","three"], answer:2 },
      { q:"How do I keep my bag?", choices:["clean and tidy","old and dirty","open and wet"], answer:0 }
    ]
  },
  {
    id:"en-3", lang:"en", level:2, title:"A Rainy Day", emoji:"🌧️",
    text:["It is raining today.","Ben cannot play football in the park.","He stays at home and reads a storybook.","The story is about a brave lion.","Ben thinks reading is fun too."],
    glossary:{ "raining":"落緊雨", "storybook":"故事書", "brave":"勇敢", "fun":"有趣、好玩" },
    questions:[
      { q:"Why can't Ben play football?", choices:["He is sick.","It is raining.","He has homework."], answer:1 },
      { q:"What does Ben do at home?", choices:["reads a storybook","watches TV","plays games"], answer:0 },
      { q:"What is the story about?", choices:["a clever fox","a big elephant","a brave lion"], answer:2 }
    ]
  },
  {
    id:"en-5", lang:"en", level:2, title:"In the Playground", emoji:"🛝",
    text:["The sun is shining.","Many children are playing in the playground.","Tom is flying a kite with his sister.","Two girls are skipping under the tree.","Everyone is having a good time."],
    glossary:{ "shining":"照耀緊、好猛", "playground":"遊樂場", "skipping":"跳緊繩", "everyone":"每一個人" },
    questions:[
      { q:"How is the weather?", choices:["sunny","rainy","windy"], answer:0 },
      { q:"Who is flying a kite with Tom?", choices:["his mother","his sister","his friend"], answer:1 },
      { q:"What are the two girls doing?", choices:["reading books","eating lunch","skipping"], answer:2 }
    ]
  },
  {
    id:"en-4", lang:"en", level:3, title:"The Little Seed", emoji:"🌱",
    text:["Amy puts a little seed in a pot.","She waters it every day and puts it near the window.","After two weeks, a small green plant comes out.","One month later, it has a pretty pink flower.","Amy is proud of her little plant."],
    glossary:{ "seed":"種子", "waters":"淋水、澆水", "near the window":"喺窗口附近", "proud":"自豪、好滿足" },
    questions:[
      { q:"Where does Amy put the seed?", choices:["in a pot","in the sea","in her bag"], answer:0 },
      { q:"What does Amy do every day?", choices:["sings to it","waters it","cuts it"], answer:1 },
      { q:"What colour is the flower?", choices:["yellow","white","pink"], answer:2 },
      { q:"How does Amy feel at the end?", choices:["proud","angry","scared"], answer:0 }
    ]
  },
  {
    id:"en-6", lang:"en", level:3, title:"My Birthday", emoji:"🎂",
    text:["Yesterday was my birthday.","Mum made a big chocolate cake for me.","My friends came to my home in the afternoon.","We played games and sang songs together.","I said thank you to everyone for the lovely presents."],
    glossary:{ "yesterday":"尋日、昨天", "made":"整咗、做咗", "together":"一齊", "presents":"禮物" },
    questions:[
      { q:"When was my birthday?", choices:["yesterday","today","last year"], answer:0 },
      { q:"Who made the cake?", choices:["my friends","Mum","my teacher"], answer:1 },
      { q:"What did we do together?", choices:["did homework","cleaned the house","played games and sang songs"], answer:2 },
      { q:"What did I say to everyone?", choices:["goodbye","thank you","sorry"], answer:1 }
    ]
  }

];
