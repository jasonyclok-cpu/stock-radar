/* ============================================================
   kid-star ・ 共用車庫系統 (garage.js)
   依賴 cars.js（window.CARS / window.drawCar）。
   收集進度經 localStorage key「kidstarGarage_v1」跨模組共用。
   用法（模組）：
     <script src="./cars.js"></script>
     <script src="./garage.js"></script>
     Garage.drop('small'|'medium'|'big')  // 在答啱／完成一關／升級時呼叫
     Garage 會自動在 .chips 列加一個 🅿️ 車庫按鈕（撳開圖鑑）
   ============================================================ */
(function(){
  const KEY="kidstarGarage_v1";
  const CARS = window.CARS || [];
  const RNAME=["","普通","少有","稀有","傳說"];
  const RCOL =["","#9aa6b8","#3FB36B","#4D96FF","#FFB300"];
  const BOX_COST=10;

  let G = load();
  function load(){ try{ const o=JSON.parse(localStorage.getItem(KEY)); if(o&&o.owned) return o; }catch(e){} return {owned:{}, keys:0}; }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(G)); }catch(e){} }
  const ownedCount=()=>Object.keys(G.owned).length;
  const has=id=>!!G.owned[id];

  // ---- 注入樣式 ----
  function injectCSS(){
    if(document.getElementById('gx-style')) return;
    const css=`
    .gx-btn{background:#fff;border:none;border-radius:18px;padding:6px 11px;font-weight:900;font-size:14px;
      box-shadow:0 3px 0 rgba(0,0,0,.10);cursor:pointer;color:#33415C;}
    .gx-btn:active{transform:translateY(2px);}
    .gx-ov{position:fixed;inset:0;background:rgba(40,55,80,.55);backdrop-filter:blur(3px);z-index:60;
      display:flex;align-items:center;justify-content:center;padding:16px;}
    .gx-card{background:#fff;border-radius:26px;max-width:560px;width:100%;max-height:90vh;overflow:auto;
      padding:18px;box-shadow:0 12px 0 rgba(0,0,0,.18);font-family:inherit;color:#33415C;}
    .gx-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
    .gx-h h2{font-size:20px;margin:0;font-weight:900;}
    .gx-stat{margin-left:auto;font-weight:900;font-size:14px;color:#7B89A3;}
    .gx-box{border:none;border-radius:16px;padding:10px 14px;font-weight:900;font-size:15px;cursor:pointer;
      background:#FFB300;color:#5a4632;box-shadow:0 4px 0 #d9920c;width:100%;margin:6px 0 12px;}
    .gx-box:disabled{opacity:.5;}
    .gx-box:active{transform:translateY(2px);box-shadow:0 2px 0 #d9920c;}
    .gx-sec{font-weight:900;margin:12px 0 6px;font-size:15px;}
    .gx-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
    .gx-cell{border-radius:16px;padding:8px;text-align:center;box-shadow:0 3px 0 rgba(0,0,0,.10);cursor:pointer;
      background:#F3F7FF;border:3px solid #e3e9f3;}
    .gx-cell.own{background:#fff;}
    .gx-cell .gx-svg{height:46px;}
    .gx-cell .gx-svg svg{height:46px;}
    .gx-name{font-size:12px;font-weight:800;margin-top:4px;line-height:1.2;}
    .gx-lock{height:46px;display:flex;align-items:center;justify-content:center;font-size:30px;color:#b9c2d2;}
    .gx-close{border:none;border-radius:18px;padding:13px;font-weight:900;font-size:17px;width:100%;
      background:#4D96FF;color:#fff;box-shadow:0 5px 0 #3a78d0;cursor:pointer;margin-top:14px;}
    .gx-close:active{transform:translateY(2px);box-shadow:0 3px 0 #3a78d0;}
    .gx-pop{position:fixed;inset:0;background:rgba(40,55,80,.6);z-index:70;display:flex;align-items:center;justify-content:center;padding:20px;}
    .gx-pcard{background:#fff;border-radius:26px;max-width:340px;width:100%;padding:24px;text-align:center;
      box-shadow:0 12px 0 rgba(0,0,0,.18);animation:gxpop .4s;}
    @keyframes gxpop{0%{transform:scale(.7)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
    .gx-pcard .gx-big{height:90px;margin:4px 0;}
    .gx-pcard .gx-big svg{height:90px;}
    .gx-tag{display:inline-block;border-radius:12px;padding:2px 10px;color:#fff;font-weight:900;font-size:13px;margin:6px 0;}
    .gx-pn{font-size:22px;font-weight:900;margin:4px 0;}
    .gx-pb{font-size:15px;color:#7B89A3;font-weight:700;line-height:1.5;}
    .gx-ok{border:none;border-radius:18px;padding:13px;font-weight:900;font-size:18px;width:100%;
      background:#3FC56B;color:#fff;box-shadow:0 5px 0 #2fa257;cursor:pointer;margin-top:14px;}
    .gx-ok:active{transform:translateY(2px);box-shadow:0 3px 0 #2fa257;}`;
    const st=document.createElement('style'); st.id='gx-style'; st.textContent=css; document.head.appendChild(st);
  }

  // ---- 跌車 ----
  const WEIGHTS={ small:[0,80,18,2,0], medium:[0,30,48,18,4], big:[0,5,30,50,15] };
  const SMALL_CHANCE=0.30; // 答啱有 30% 先跌車
  const KEYS_BY_R=[0,2,3,5,8];

  function pickRarity(tier){
    const w=WEIGHTS[tier]||WEIGHTS.small; const tot=w.reduce((a,b)=>a+b,0);
    let x=Math.random()*tot; for(let r=1;r<=4;r++){ if(x<w[r]) return r; x-=w[r]; } return 1;
  }
  function carsOfRarity(r){ return CARS.filter(c=>c.r===r); }

  function grant(tier){
    let r=pickRarity(tier);
    // 由所選稀有度開始，若該稀有度已收集齊就向下／向上找有未收集嘅
    let order=[r, r-1, r+1, r-2, r+2].filter(x=>x>=1&&x<=4);
    let car=null;
    for(const rr of order){ const pool=carsOfRarity(rr).filter(c=>!has(c.id)); if(pool.length){ car=pool[Math.floor(Math.random()*pool.length)]; break; } }
    if(car){ G.owned[car.id]=1; save(); updateBadge(); return {car, isNew:true, keys:0}; }
    // 全部已收集 → 重複，換車匙
    const any=carsOfRarity(r); const dup=any[Math.floor(Math.random()*any.length)] || CARS[0];
    const k=KEYS_BY_R[dup?dup.r:1]; G.keys=(G.keys||0)+k; save(); updateBadge();
    return {car:dup, isNew:false, keys:k};
  }

  // 對外：跌車（small 有機率，medium/big 必中），並彈出提示
  function drop(tier){
    if(!CARS.length) return null;
    if(tier==='small' && Math.random()>SMALL_CHANCE) return null;
    const res=grant(tier); showEarned(res); return res;
  }

  // ---- 提示彈窗 ----
  function showEarned(res){
    injectCSS();
    const car=res.car;
    const pop=document.createElement('div'); pop.className='gx-pop';
    pop.innerHTML=`<div class="gx-pcard">
      <div class="gx-big">${window.drawCar(car.s)}</div>
      <div class="gx-tag" style="background:${RCOL[car.r]}">${RNAME[car.r]}</div>
      <div class="gx-pn">${car.n}</div>
      <div class="gx-pb">${res.isNew?('新車入手！已泊入車庫 🅿️<br>'+car.b):('已有呢架，換到 🔑 車匙 ×'+res.keys)}</div>
      <button class="gx-ok">${res.isNew?'好嘢！':'收下車匙'}</button>
    </div>`;
    document.body.appendChild(pop);
    pop.querySelector('.gx-ok').onclick=()=>pop.remove();
  }

  // ---- 圖鑑 ----
  function open(){
    injectCSS();
    const ov=document.createElement('div'); ov.className='gx-ov';
    const card=document.createElement('div'); card.className='gx-card';
    function render(){
      let h=`<div class="gx-h"><h2>🅿️ 我的車庫</h2>
        <span class="gx-stat">已收集 ${ownedCount()} / ${CARS.length}　🔑 ${G.keys||0}</span></div>`;
      h+=`<button class="gx-box" ${(G.keys||0)<BOX_COST?'disabled':''}>開神秘寶箱（🔑 ${BOX_COST}）— 解鎖一架未有嘅車</button>`;
      for(let r=4;r>=1;r--){
        const list=carsOfRarity(r); if(!list.length) continue;
        const got=list.filter(c=>has(c.id)).length;
        h+=`<div class="gx-sec" style="color:${RCOL[r]}">${RNAME[r]}（${got}/${list.length}）</div><div class="gx-grid">`;
        list.forEach(c=>{
          if(has(c.id)) h+=`<div class="gx-cell own" data-id="${c.id}" style="border-color:${RCOL[r]}"><div class="gx-svg">${window.drawCar(c.s)}</div><div class="gx-name">${c.n}</div></div>`;
          else h+=`<div class="gx-cell"><div class="gx-lock">❓</div><div class="gx-name" style="color:#b9c2d2">未收集</div></div>`;
        });
        h+=`</div>`;
      }
      h+=`<button class="gx-close">關閉</button>`;
      card.innerHTML=h;
      card.querySelector('.gx-close').onclick=()=>ov.remove();
      const boxBtn=card.querySelector('.gx-box');
      boxBtn.onclick=()=>{
        if((G.keys||0)<BOX_COST) return;
        G.keys-=BOX_COST; save();
        // 寶箱：優先未收集，偏向稀有/傳說
        const res=grant('big'); showEarned(res); updateBadge(); render();
      };
      card.querySelectorAll('.gx-cell.own').forEach(el=>{
        el.onclick=()=>{ const c=CARS.find(x=>x.id===el.dataset.id); if(c) showEarned({car:c,isNew:true,keys:0}); };
      });
    }
    render();
    ov.appendChild(card); document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });
  }

  // ---- 注入車庫按鈕 ----
  let badgeBtn=null;
  function updateBadge(){ if(badgeBtn) badgeBtn.textContent=`🅿️ ${ownedCount()}`; }
  function mountButton(){
    injectCSS();
    const host=document.querySelector('.chips');
    badgeBtn=document.createElement('button'); badgeBtn.className='gx-btn'; badgeBtn.title='我的車庫';
    badgeBtn.textContent=`🅿️ ${ownedCount()}`; badgeBtn.onclick=open;
    if(host) host.appendChild(badgeBtn);
    else { badgeBtn.style.cssText='position:fixed;right:12px;bottom:12px;z-index:50;'; document.body.appendChild(badgeBtn); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountButton); else mountButton();

  window.Garage={ drop, open, grant, get owned(){return G.owned;}, get keys(){return G.keys||0;} };
})();
