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

  /* ---------------- English ---------------- */
  {
    id:"en-1", lang:"en", level:1, title:"A Dog", emoji:"🐶",
    text:["I see a dog.","The dog is big."],
    glossary:{ "see":"看見", "dog":"狗", "big":"大" },
    questions:[
      { q:"What do you see?", choices:["a dog","a cat","a bird"], answer:0 },
      { q:"Is the dog big or small?", choices:["big","small"], answer:0 }
    ]
  },
  {
    id:"en-2", lang:"en", level:1, title:"A Red Apple", emoji:"🍎",
    text:["This is an apple.","The apple is red.","I like it."],
    glossary:{ "apple":"蘋果", "red":"紅色", "like":"喜歡" },
    questions:[
      { q:"What is this?", choices:["an apple","an egg","a ball"], answer:0 },
      { q:"What colour is the apple?", choices:["red","blue","green"], answer:0 }
    ]
  },
  {
    id:"en-3", lang:"en", level:2, title:"A Little Fish", emoji:"🐟",
    text:["A little fish lives in the sea.","It likes to swim.","Every day it plays with its friends."],
    glossary:{ "sea":"海", "swim":"游泳", "friends":"朋友" },
    questions:[
      { q:"Where does the fish live?", choices:["in the sea","in a tree","in the sky"], answer:0 },
      { q:"What does the fish like to do?", choices:["swim","run","fly"], answer:0 }
    ]
  },
  {
    id:"en-4", lang:"en", level:3, title:"A Sunny Day", emoji:"☀️",
    text:["It is a sunny day.","Tom and his sister go to the park.","They fly a kite.","The kite goes up high.","They are very happy."],
    glossary:{ "sunny":"晴朗，有太陽", "park":"公園", "kite":"風箏", "happy":"開心" },
    questions:[
      { q:"How is the weather?", choices:["sunny","rainy","snowy"], answer:0 },
      { q:"Where do they go?", choices:["the park","the shop","school"], answer:0 },
      { q:"What do they fly?", choices:["a kite","a plane","a bird"], answer:0 },
      { q:"How do they feel?", choices:["happy","sad","angry"], answer:0 }
    ]
  }

];
