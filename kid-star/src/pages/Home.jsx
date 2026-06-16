import { useEffect, useRef, useState } from 'react'
import { SUBJECTS, LEVELS } from '../data/levels'
import { getStars, getStreak, spendStars } from '../lib/progress'
import { getUnlocked } from '../lib/progress'
import { playClick, playLevelClear } from '../lib/audio'
import Mascot from '../components/Mascot'
import Backdrop from '../components/Backdrop'

const GAME_COST = 10

export default function Home({ go, toast }) {
  const stars = getStars()
  const streak = getStreak()
  const [message, setMessage] = useState(toast || '')
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

      {/* 三科關卡地圖 */}
      <main className="mt-6 grid gap-5 md:grid-cols-3">
        {SUBJECTS.map((s) => (
          <SubjectCard key={s.id} subject={s} go={go} />
        ))}
      </main>

      {/* 小遊戲 */}
      <section className="mt-8">
        <h2 className="title-pop text-3xl">🎮 小遊戲樂園</h2>
        <p className="mt-1 text-lg font-bold text-sky-700">用 {GAME_COST} 粒 ⭐ 玩一次!</p>
        <div className="mt-3">
          <GameCard
            emoji="🃏"
            title="記憶配對"
            desc="翻卡配對中英文詞語,翻牌仲會讀出嚟!"
            from="from-violet-400"
            to="to-fuchsia-500"
            cost={GAME_COST}
            locked={stars < GAME_COST}
            onClick={() => playGame('memory')}
          />
        </div>
      </section>
    </div>
  )
}

function GameCard({ emoji, title, desc, from, to, cost, locked, onClick }) {
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
        ⭐ {cost}
      </span>
    </button>
  )
}

function SubjectCard({ subject, go }) {
  const levels = LEVELS[subject.id]
  const unlocked = getUnlocked(subject.id)
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
                    go('quiz', { subject: subject.id, levelId: lv.id })
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
