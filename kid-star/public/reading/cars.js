/* ============================================================
   kid-star ・ 共用車款庫 (cars.js)
   原創卡通車 SVG（參考世界各地車型創作，非真實品牌/相片，無商標）。
   提供 window.CARS（車款資料）與 window.drawCar(spec)（回傳 SVG 字串）。
   兩個模組各放一份；收集進度經 localStorage 共用（見 garage.js）。
   ============================================================ */
(function(){
  function shade(hex,amt){
    amt = amt==null?-34:amt;
    let n=parseInt(hex.slice(1),16);
    let r=(n>>16)+amt, g=((n>>8)&255)+amt, b=(n&255)+amt;
    r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  const WIN="#cfeaff", TIRE="#2b2b2b", HUB="#dfe5ee";
  const R=(x,y,w,h,r,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"/>`;
  const C=(cx,cy,r,f)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
  const P=(d,f)=>`<path d="${d}" fill="${f}"/>`;
  function wheel(cx,r){ return C(cx,52,r,TIRE)+C(cx,52,r*0.42,HUB); }
  function wheelsAt(arr,r){ r=r||9; return arr.map(cx=>wheel(cx,r)).join(''); }

  function drawCar(s){
    const c=s.body||"#4D96FF", r=s.roof||shade(c), ex=s.extras||[];
    let g="";
    switch(s.shape){
      case 'sedan': g=R(14,38,92,12,6,c)+P("M30 38 L42 27 H78 L92 38 Z",r)+R(46,29,12,8,2,WIN)+R(62,29,12,8,2,WIN)+wheelsAt([34,86]); break;
      case 'hatch': g=R(16,38,84,12,6,c)+P("M30 38 L40 27 H80 L86 38 Z",r)+R(44,29,14,8,2,WIN)+R(62,29,14,8,2,WIN)+wheelsAt([34,82]); break;
      case 'suv':   g=R(14,33,94,17,5,c)+R(28,24,62,12,4,r)+R(32,26,24,8,2,WIN)+R(60,26,24,8,2,WIN)+wheelsAt([34,86],10); break;
      case 'van':   g=R(12,24,98,26,5,c)+P("M104 26 L110 36 V49 H96 V26 Z",r)+R(98,28,9,9,2,WIN)+R(20,28,20,9,2,WIN)+R(46,28,20,9,2,WIN)+R(72,28,18,9,2,WIN)+wheelsAt([34,88],9); break;
      case 'pickup':g=R(70,28,32,22,4,c)+R(74,31,18,9,2,WIN)+R(14,40,58,10,3,shade(c))+wheelsAt([36,86]); break;
      case 'sports':g=P("M8 47 Q12 40 32 38 L52 30 H78 Q98 32 112 47 Z",c)+P("M54 31 L74 31 L84 38 L57 38 Z",WIN)+wheelsAt([34,88],8); break;
      case 'bug':   g=P("M14 49 Q14 25 60 23 Q106 25 106 49 Z",c)+P("M38 28 Q60 23 82 28 L82 38 L38 38 Z",WIN)+wheelsAt([34,86]); break;
      case 'jeep':  g=R(14,33,92,16,3,c)+R(70,25,10,9,1,WIN)+R(28,30,40,4,1,shade(c))+wheelsAt([34,86],11); break;
      case 'kei':   g=R(32,25,56,25,4,c)+R(38,28,44,10,2,WIN)+wheelsAt([46,74],8); break;
      case 'convertible': g=R(14,38,92,12,6,c)+P("M66 38 L74 29 L78 38 Z",WIN)+R(40,33,20,6,2,shade(c))+wheelsAt([34,86]); break;
      case 'bus':   g=R(8,20,104,30,6,c)+[16,32,48,64,80,96].map(x=>R(x,24,12,10,2,WIN)).join('')+R(8,40,104,3,0,shade(c))+wheelsAt([28,92],9); break;
      case 'double':g=R(8,12,104,40,6,c)+[16,32,48,64,80,96].map(x=>R(x,15,12,9,2,WIN)).join('')+[16,32,48,64,80,96].map(x=>R(x,34,12,9,2,WIN)).join('')+wheelsAt([28,92],9); break;
      case 'truckbox': g=R(64,26,42,24,3,c)+R(94,30,11,9,2,WIN)+R(12,22,52,28,3,shade(c))+wheelsAt([30,78,96],8); break;
      case 'dump':  g=R(78,28,28,22,3,c)+R(82,31,16,9,2,WIN)+P("M12 44 L20 24 L74 30 L74 44 Z",shade(c))+wheelsAt([34,76,96],9); break;
      case 'mixer': g=R(80,28,26,22,3,c)+R(84,31,15,9,2,WIN)+`<ellipse cx="44" cy="34" rx="32" ry="15" fill="${shade(c)}"/>`+`<path d="M20 30 L60 40 M28 24 L66 36" stroke="${shade(c,-20)}" stroke-width="3" fill="none"/>`+wheelsAt([32,74,96],9); break;
      case 'fire':  g=R(10,28,100,22,3,c)+R(80,24,30,26,3,c)+R(84,28,22,9,2,WIN)+`<rect x="14" y="22" width="66" height="5" rx="2" fill="#e6e6e6" transform="rotate(-3 14 22)"/>`+wheelsAt([30,70,96],9); break;
      case 'tractor': g=R(38,30,42,16,3,c)+R(56,17,24,19,3,c)+R(60,20,16,10,2,WIN)+R(40,18,6,12,1,shade(c))+C(34,50,8,TIRE)+C(34,50,3.5,HUB)+C(88,46,14,TIRE)+C(88,46,6,HUB); break;
      case 'monster': g=R(20,30,80,14,5,c)+R(36,22,42,12,4,r)+R(40,24,16,8,2,WIN)+R(60,24,16,8,2,WIN)+C(34,48,14,TIRE)+C(34,48,6,HUB)+C(86,48,14,TIRE)+C(86,48,6,HUB); break;
      case 'tuktuk': g=P("M40 23 H84 L88 40 H36 Z",c)+R(40,38,46,10,3,shade(c))+R(46,26,30,10,2,WIN)+C(36,52,7,TIRE)+C(36,52,3,HUB)+wheel(74,8)+wheel(88,8); break;
      case 'tram':  g=R(10,22,100,28,4,c)+[18,36,54,72,90].map(x=>R(x,26,12,10,2,WIN)).join('')+`<line x1="60" y1="22" x2="60" y2="7" stroke="#666" stroke-width="2"/>`+C(60,7,2,"#666")+wheelsAt([26,94],7); break;
      case 'train': g=P("M8 30 Q40 22 110 24 L110 50 H8 Z",c)+P("M14 31 Q42 25 70 27 L70 35 L14 35 Z",WIN)+R(8,44,102,3,0,shade(c))+wheelsAt([28,64,96],6); break;
      case 'limo':  g=R(8,38,104,12,6,c)+P("M24 38 L34 28 H98 L106 38 Z",r)+[40,56,72,88].map(x=>R(x,30,12,7,2,WIN)).join('')+wheelsAt([26,98]); break;
      case 'race':  g=P("M10 47 H102 L98 41 H72 L68 37 H54 L50 41 H30 Z",c)+C(58,40,5,"#222")+R(8,33,9,13,1,shade(c))+R(96,45,14,4,1,c)+wheelsAt([28,92],9); break;
      case 'moto':  g=C(30,52,10,TIRE)+C(30,52,4,HUB)+C(90,52,10,TIRE)+C(90,52,4,HUB)+P("M26 44 Q40 33 62 35 L84 38 Q92 39 92 46 L36 46 Z",c)+R(40,32,20,6,3,shade(c))+`<path d="M84 38 L96 29" stroke="#333" stroke-width="3" fill="none"/>`; break;
      case 'bike':  g=`<circle cx="32" cy="50" r="12" fill="none" stroke="#333" stroke-width="3"/><circle cx="88" cy="50" r="12" fill="none" stroke="#333" stroke-width="3"/>`+`<path d="M32 50 L56 30 L88 50 M56 30 L64 50 M32 50 L64 50" stroke="${c}" stroke-width="3" fill="none"/>`+R(50,26,14,4,2,shade(c))+`<path d="M84 50 L92 26 L100 26" stroke="#333" stroke-width="3" fill="none"/>`; break;
      case 'cart':  g=R(36,21,46,4,2,c)+R(38,22,4,17,1,shade(c))+R(76,22,4,17,1,shade(c))+R(32,38,54,10,3,c)+R(40,31,22,7,2,WIN)+wheelsAt([46,76],7); break;
      case 'shuttle': g=P("M8 40 L86 29 Q112 31 114 40 L114 47 L8 47 Z",c)+P("M40 47 L58 58 L78 47 Z",shade(c))+C(98,38,4,WIN)+R(20,33,40,4,2,shade(c,-15))+P("M8 40 L2 43 L8 47 Z","#FF8C2B"); break;
      default:      g=R(14,38,92,12,6,c)+P("M30 38 L42 27 H78 L92 38 Z",r)+R(46,29,12,8,2,WIN)+R(62,29,12,8,2,WIN)+wheelsAt([34,86]);
    }
    // ---- 配件 ----
    const roofY = (s.shape==='van'||s.shape==='bus'||s.shape==='double')?18 : (s.shape==='suv'?22:24);
    ex.forEach(e=>{
      if(e==='lightbar'){ g+=R(48,roofY-4,11,4,1,'#e4453b')+R(60,roofY-4,11,4,1,'#3a78d0'); }
      else if(e==='cross'){ g+=R(40,30,4,12,1,'#e4453b')+R(34,34,16,4,1,'#e4453b'); }
      else if(e==='sign'){ g+=R(52,roofY-7,18,8,2,'#fff')+R(53,roofY-6,16,6,1,shade(s.body||'#4D96FF',-10)); }
      else if(e==='checker'){ g+=[16,26,36,46,56,66,76,86].map((x,i)=>R(x,43,10,4,0, i%2?'#222':'#fff')).join(''); }
      else if(e==='sprinkle'){ g+=['#e4453b','#3a78d0','#3FB36B','#FF8FC8'].map((col,i)=>C(28+i*16,30,2.2,col)).join(''); }
      else if(e==='stripe'){ g+=R(14,43,92,3,0,shade(s.body||'#4D96FF',-50)); }
    });
    return `<svg viewBox="0 0 120 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
  }

  // rarity: 1 普通 / 2 少有 / 3 稀有 / 4 傳說
  const CARS = [
    // ---- 普通 ----
    {id:"c1", n:"藍色房車",   r:1, b:"最常見嘅家庭房車，坐得舒服。", s:{shape:'sedan', body:'#4D96FF'}},
    {id:"c2", n:"紅色掀背車", r:1, b:"細細粒，泊車一流！",          s:{shape:'hatch', body:'#FF6B6B'}},
    {id:"c3", n:"綠色越野車", r:1, b:"底盤高，去邊都得。",          s:{shape:'suv',   body:'#3FB36B'}},
    {id:"c4", n:"銀色轎車",   r:1, b:"閃令令嘅銀色，好易襯。",      s:{shape:'sedan', body:'#B6BCC8'}},
    {id:"c5", n:"橙色麵包車", r:1, b:"載得多嘢，搬屋好幫手。",      s:{shape:'van',   body:'#FF9F40'}},
    {id:"c6", n:"開斗貨車",   r:1, b:"後面斗位裝嘢超方便。",        s:{shape:'pickup',body:'#2EC4C4'}},
    {id:"c7", n:"粉紅小車",   r:1, b:"可愛粉紅，街上好搶眼。",      s:{shape:'hatch', body:'#FF8FC8'}},
    {id:"c8", n:"天藍房車",   r:1, b:"天空一樣嘅藍色，好舒服。",    s:{shape:'sedan', body:'#6BCBE0'}},
    {id:"c9", n:"青檸小車",   r:1, b:"鮮明嘅青檸色，好醒神。",      s:{shape:'hatch', body:'#B6E04F'}},
    // ---- 少有 ----
    {id:"u1", n:"日本輕型車", r:2, b:"日本街頭嘅迷你方盒車，慳油又靈活。", s:{shape:'kei', body:'#8FD16B'}},
    {id:"u2", n:"香港紅的士", r:2, b:"香港紅色的士，揚手即停。",          s:{shape:'sedan', body:'#E0453B', extras:['sign']}},
    {id:"u3", n:"紐約黃計程車",r:2,b:"紐約街頭黃色 taxi，車身有格仔。",   s:{shape:'sedan', body:'#FFC93C', extras:['checker']}},
    {id:"u4", n:"倫敦黑計程車",r:2,b:"圓圓哋嘅經典黑色計程車。",        s:{shape:'bug', body:'#33373F'}},
    {id:"u5", n:"軍綠吉普車", r:2, b:"開篷越野，行山探險啱晒。",        s:{shape:'jeep', body:'#7E7A3C'}},
    {id:"u6", n:"露營車",     r:2, b:"車尾就係流動小屋，露營必備。",    s:{shape:'van', body:'#C58CF0'}},
    {id:"u7", n:"開篷跑車",   r:2, b:"冇車頂，兜風好爽。",            s:{shape:'convertible', body:'#FF5DA2'}},
    {id:"u8", n:"深藍越野車", r:2, b:"穩陣大隻，落雨落雪都唔怕。",      s:{shape:'suv', body:'#3C6EE0'}},
    {id:"u9", n:"雪糕車",     r:2, b:"叮叮叮～雪糕車嚟啦！",          s:{shape:'van', body:'#FFE08A', extras:['sign','sprinkle']}},
    // ---- 稀有 ----
    {id:"r1", n:"警車",       r:3, b:"閃住藍紅燈，保護大家安全。",      s:{shape:'sedan', body:'#F2F4F8', extras:['lightbar']}},
    {id:"r2", n:"救護車",     r:3, b:"救人要緊，快快趕到！",          s:{shape:'van', body:'#F2F4F8', extras:['cross','lightbar']}},
    {id:"r3", n:"消防車",     r:3, b:"紅色長車，仲有長長雲梯。",        s:{shape:'fire', body:'#E0453B', extras:['lightbar']}},
    {id:"r4", n:"泥頭車",     r:3, b:"車斗一翻，泥沙嘩啦啦倒落嚟。",    s:{shape:'dump', body:'#F2B23C'}},
    {id:"r5", n:"石屎車",     r:3, b:"後面個大鼓不停轉，攪拌石屎。",    s:{shape:'mixer', body:'#9AA4B0'}},
    {id:"r6", n:"黃色跑車",   r:3, b:"低低扁扁，跑得超快。",          s:{shape:'sports', body:'#FFD23F'}},
    {id:"r7", n:"大腳怪車",   r:3, b:"四個超大車轆，碾過乜都得。",      s:{shape:'monster', body:'#6B4FBF'}},
    {id:"r8", n:"農夫拖拉機", r:3, b:"農場大力士，後轆好大個。",        s:{shape:'tractor', body:'#4FB36B'}},
    {id:"r9", n:"貨櫃車",     r:3, b:"長長車身運送貨櫃，馬路常客。",    s:{shape:'truckbox', body:'#3C6EE0'}},
    // ---- 傳說 ----
    {id:"L1", n:"倫敦雙層巴士", r:4, b:"兩層嘅紅色巴士，上層望落去風景一流！", s:{shape:'double', body:'#E0453B'}},
    {id:"L2", n:"香港叮叮電車", r:4, b:"香港最有風味嘅綠色電車，叮叮叮～",   s:{shape:'tram', body:'#2E9E5B'}},
    {id:"L3", n:"一級方程式賽車",r:4,b:"賽道之王，快到一陣風。",              s:{shape:'race', body:'#E0453B'}},
    {id:"L4", n:"子彈火車",   r:4, b:"尖尖車頭，快得好似子彈。",            s:{shape:'train', body:'#DCE6F5'}},
    {id:"L5", n:"泰國嘟嘟車", r:4, b:"三個轆嘅小車，泰國街頭好熱鬧。",      s:{shape:'tuktuk', body:'#F2C14E'}},
    {id:"L6", n:"加長禮車",   r:4, b:"超長黑色禮車，大人物先坐得。",        s:{shape:'limo', body:'#1F2330'}},
    // ---- 追加：普通 ----
    {id:"c10", n:"紫色房車",   r:1, b:"神秘紫色，好有型。",            s:{shape:'sedan', body:'#9B6BE0'}},
    {id:"c11", n:"灰色掀背車", r:1, b:"低調灰色，街上好常見。",        s:{shape:'hatch', body:'#9AA6B8'}},
    {id:"c12", n:"軍綠小貨車", r:1, b:"墨綠色斗車，幫手運嘢。",        s:{shape:'pickup', body:'#6F7A4D'}},
    {id:"c13", n:"單車",       r:1, b:"踏吓踏吓就走得，最環保。",      s:{shape:'bike', body:'#3FB36B'}},
    // ---- 追加：少有 ----
    {id:"u10", n:"香港紅色小巴", r:2, b:"紅色車頂嘅公共小巴，落車要嗌「有落」！", s:{shape:'van', body:'#E0453B'}},
    {id:"u11", n:"香港綠色小巴", r:2, b:"綠色專線小巴，有固定路線同站頭。",     s:{shape:'van', body:'#2E9E5B'}},
    {id:"u12", n:"黃色校巴",   r:2, b:"接送小朋友返學放學嘅校巴。",      s:{shape:'bus', body:'#FFC93C'}},
    {id:"u13", n:"郵政車",     r:2, b:"幫手派信派包裹嘅郵車。",        s:{shape:'van', body:'#1E6FB0'}},
    {id:"u14", n:"電單車",     r:2, b:"兩個轆嘅電單車，鑽嚟鑽去好靈活。", s:{shape:'moto', body:'#E0453B'}},
    {id:"u15", n:"高爾夫球車", r:2, b:"球場上嘅細細架代步車。",        s:{shape:'cart', body:'#8FD16B'}},
    {id:"u16", n:"老爺車",     r:2, b:"圓圓哋嘅古董車，好有懷舊味。",    s:{shape:'bug', body:'#8A5A2B'}},
    // ---- 追加：稀有 ----
    {id:"r10", n:"垃圾車",     r:3, b:"日日收集垃圾，城市先咁乾淨。",    s:{shape:'truckbox', body:'#4FB36B'}},
    {id:"r11", n:"灑水車",     r:3, b:"沿住馬路灑水洗街。",          s:{shape:'truckbox', body:'#2EA0C4'}},
    {id:"r12", n:"重型拖頭",   r:3, b:"大力拖頭，拉得起成個貨櫃。",      s:{shape:'truckbox', body:'#E0453B'}},
    {id:"r13", n:"警察電單車", r:3, b:"閃燈嘅電單車，開路追截最快。",    s:{shape:'moto', body:'#F2F4F8', extras:['lightbar']}},
    // ---- 追加：傳說 ----
    {id:"L7", n:"太空穿梭機", r:4, b:"識飛出太空嘅穿梭機，咻——升空！",  s:{shape:'shuttle', body:'#E8EDF5'}},
    {id:"L8", n:"開篷觀光巴士", r:4, b:"冇上層車頂嘅觀光巴士，坐上層睇盡風景。", s:{shape:'double', body:'#F2A33C'}}
  ];

  window.drawCar = drawCar;
  window.CARS = CARS;
})();
