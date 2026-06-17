import { useEffect, useRef, useState } from 'react'
import { SUBJECTS, LEVELS, GRADES } from '../data/levels'
import { getStars, getStreak, spendStars, getUnlocked } from '../lib/progress'
import { load, save } from '../lib/storage'
import { playClick, playLevelClear } from '../lib/audio'
import Mascot from '../components/Mascot'
import Backdrop from '../components/Backdrop'

const GAME_COST = 10

export default function Home({ go, toast }) {
  const stars = getStars()
  const streak = getStreak()
  const [message, setMessage] = useState(toast || '')
  // 記住上次揀嘅年級(預設小二)
  const [grade, setGrade] = useState(() => load('grade', '小二'))
  const pickGrade = (g) => {
    playClick()
    setGrade(g)
    save('grade', g)
  }
  const pressTimer = useRef(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 3500)
    return () => clearTimeout(t)
  }, [message])

  // 長按 logo 3 秒入家長後台
  const startPress = () => {
    pressTimer.current = setTimeout(() => go('parent'), 3000)
  }
  const cancelPress = () => clearTimeout(pressTimer.current)

  const playGame = (name) => {
    if (spendStars(GAME_COST)) {
      playLevelClear()
      go(name)
    } else {
      playClick()
      setMessage(`要儲夠 ${GAME_COST} 粒星先可以玩呀!繼續加油!💪`)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-10 pt-4">
      <Backdrop />

      {/* 頂欄(直向窄螢幕會自動換行) */}
      <header className="flex flex-wrap items-center justify-between gap-y-2">
        <div
          className="flex cursor-pointer select-none items-center gap-2"
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Mascot size={56} />
          <h1 className="title-pop text-4xl sm:text-5xl">星星學園</h1>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <span className="kid-card flex items-center gap-1 px-4 py-2 text-xl font-extrabold text-amber-500">
            ⭐ {stars}
          </span>
          <span className="kid-card flex items-center gap-1 px-4 py-2 text-xl font-extrabold text-orange-500">
            🔥 {streak} 日
          </span>
        </div>
      </header>

      {/* 吉祥物對話泡泡 */}
      <div className="mt-4 flex items-center gap-3">
        <div className="anim-bob shrink-0">
          <Mascot size={64} mood="happy" />
        </div>
        <div className="kid-card relative px-4 py-3 text-lg font-bold text-sky-700 sm:text-xl">
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white" />
          今日想學邊一科呀?揀一科開始啦!🌈
        </div>
      </div>

      {message && (
        <div className="mt-3 animate-pop rounded-2xl bg-yellow-100 px-4 py-3 text-center text-xl font-bold text-yellow-800 shadow ring-2 ring-yellow-300">
          {message}
        </div>
      )}

      {/* 年級切換 */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-lg font-bold text-sky-700">年級:</span>
        <div className="flex gap-2 rounded-full bg-white/70 p-1 shadow-inner">
          {GRADES.map((g) => (
            <button
              key={g.id}
              onClick={() => pickGrade(g.id)}
              className={`kid-btn px-5 py-2 text-xl ${
                grade === g.id ? 'bg-sky-400 text-white' : 'bg-transparent text-sky-600 shadow-none'
              }`}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* 三科關卡地圖 */}
      <main className="mt-4 grid gap-5 md:grid-cols-3">
        {SUBJECTS.map((s) => (
          <SubjectCard key={s.id} subject={s} grade={grade} go={go} />
        ))}
      </main>

      {/* 小遊戲 */}
      <section className="mt-8">
        <h2 className="title-pop text-3xl">🎮 小遊戲樂園</h2>
        <p className="mt-1 text-lg font-bold text-sky-700">限時心算免費玩,做得好仲有星星!</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <GameCard
            emoji="⚡"
            title="限時心算"
            desc="60 秒鬥快計數,賺星星!"
            from="from-amber-400"
            to="to-orange-500"
            badge="免費玩"
            onClick={() => {
              playClick()
              go('mathgame')
            }}
          />
          <GameCard
            emoji="🃏"
            title="記憶配對"
            desc="翻卡配對中英文詞語,翻牌仲會讀出嚟!"
            from="from-violet-400"
            to="to-fuchsia-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('memory')}
          />
        </div>

        <h3 className="mt-6 text-2xl font-extrabold text-sky-700">🧠 專注力大挑戰</h3>
        <p className="mt-1 text-lg font-bold text-sky-700">考眼力同記性,越玩越叻!</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <GameCard
            emoji="🔢"
            title="數字快搜"
            desc="由細到大,順住點晒啲數字!"
            from="from-sky-400"
            to="to-cyan-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('schulte')}
          />
          <GameCard
            emoji="🚦"
            title="紅綠燈"
            desc="綠燈快啲撳,紅燈唔好撳!"
            from="from-green-400"
            to="to-emerald-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('traffic')}
          />
          <GameCard
            emoji="🧠"
            title="記憶翻牌"
            desc="睇清楚就蓋牌,搵返成對圖案!"
            from="from-rose-400"
            to="to-pink-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('memoryplus')}
          />
          <GameCard
            emoji="👂"
            title="聽指令"
            desc="聽小星講,做啱動作!"
            from="from-teal-400"
            to="to-cyan-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('listen')}
          />
          <GameCard
            emoji="🎶"
            title="圖案接龍"
            desc="記住啲燈,順住次序㩒返!"
            from="from-indigo-400"
            to="to-blue-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('sequence')}
          />
          <GameCard
            emoji="🔍"
            title="找不同"
            desc="比較兩幅圖,搵出唔同嘅地方!"
            from="from-lime-400"
            to="to-green-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('spot')}
          />
          <GameCard
            emoji="🧩"
            title="走迷宮"
            desc="用手指由起點行去終點,唔好掂牆!"
            from="from-orange-400"
            to="to-amber-500"
            badge={`⭐ ${GAME_COST}`}
            locked={stars < GAME_COST}
            onClick={() => playGame('maze')}
          />
        </div>
      </section>
    </div>
  )
}

function GameCard({ emoji, title, desc, from, to, badge, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`candy-btn flex items-center gap-4 bg-gradient-to-br ${from} ${to} p-5 text-left ${
        locked ? 'opacity-60' : ''
      }`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-4xl">
        {emoji}
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-white drop-shadow">{title}</span>
        <span className="block text-base text-white/90">{desc}</span>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-white/90 px-3 py-1 text-lg font-extrabold text-amber-600">
        {badge}
      </span>
    </button>
  )
}

function SubjectCard({ subject, grade, go }) {
  const levels = LEVELS[subject.id][grade]
  const unlocked = getUnlocked(subject.id, grade)
  const cleared = Math.min(unlocked - 1, levels.length)
  return (
    <div className="kid-card overflow-hidden">
      {/* 科目標題列 + 進度 */}
      <div className={`${subject.color} flex items-center gap-3 px-5 py-4`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/30 text-3xl">
          {subject.emoji}
        </span>
        <div>
          <span className="block text-2xl font-extrabold text-white drop-shadow sm:text-3xl">
            {subject.name}
          </span>
          <span className="block text-sm font-bold text-white/90">
            ⭐ 完成 {cleared} / {levels.length} 關
          </span>
        </div>
      </div>

      {/* 蜿蜒小路:關卡左右交錯,中間有虛線連住似一條冒險路 */}
      <div className={`${subject.light} relative px-4 py-5`}>
        <div className="absolute bottom-6 left-1/2 top-6 w-1 -translate-x-1/2 border-l-4 border-dashed border-white/70" />
        <div className="relative flex flex-col gap-3">
          {levels.map((lv, i) => {
            const isUnlocked = lv.id <= unlocked
            const isCurrent = lv.id === unlocked
            const isDone = lv.id < unlocked
            return (
              <div key={lv.id} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <button
                  disabled={!isUnlocked}
                  onClick={() => {
                    playClick()
                    go('quiz', { subject: subject.id, grade, levelId: lv.id })
                  }}
                  className={`kid-btn flex items-center gap-3 px-4 py-3 ${
                    isCurrent
                      ? 'scale-105 bg-white ring-4 ring-yellow-400'
                      : isUnlocked
                        ? 'bg-white'
                        : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-inner ${
                      isDone
                        ? 'bg-green-300'
                        : isUnlocked
                          ? 'bg-yellow-300'
                          : 'bg-slate-300'
                    } ${isCurrent ? 'anim-bob' : ''}`}
                  >
                    {isDone ? '✅' : isUnlocked ? lv.emoji : '🔒'}
                  </span>
                  <span className={`text-lg font-extrabold ${isUnlocked ? 'text-slate-700' : 'text-slate-400'}`}>
                    第 {lv.id} 關
                    <span className="block text-sm font-bold opacity-80">{lv.name}</span>
                  </span>
                  {isCurrent && <span className="ml-1 animate-pop text-xl">👈</span>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
