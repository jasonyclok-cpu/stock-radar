import { useEffect, useRef, useState } from 'react'
import { SUBJECTS, LEVELS } from '../data/levels'
import { getStars, getStreak, spendStars } from '../lib/progress'
import { getUnlocked } from '../lib/progress'
import { playClick, playLevelClear } from '../lib/audio'
import Mascot from '../components/Mascot'

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
      {/* 頂欄 */}
      <header className="flex items-center justify-between">
        <div
          className="flex cursor-pointer select-none items-center gap-2"
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Mascot size={56} />
          <h1 className="text-3xl font-extrabold text-sky-700 sm:text-4xl">星星學園</h1>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <span className="kid-card flex items-center gap-1 px-4 py-2 text-xl font-bold text-amber-500">
            ⭐ {stars}
          </span>
          <span className="kid-card flex items-center gap-1 px-4 py-2 text-xl font-bold text-orange-500">
            🔥 {streak} 日
          </span>
        </div>
      </header>

      {message && (
        <div className="mt-3 animate-pop rounded-2xl bg-yellow-100 px-4 py-3 text-center text-xl font-bold text-yellow-800 shadow">
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
        <h2 className="text-2xl font-extrabold text-sky-700">🎮 小遊戲樂園</h2>
        <p className="mt-1 text-lg text-sky-600">用 {GAME_COST} 粒 ⭐ 玩一次!</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => playGame('catch')}
            className={`kid-btn kid-card flex items-center gap-4 p-5 text-left ${stars < GAME_COST ? 'opacity-60' : ''}`}
          >
            <span className="text-5xl">🧺</span>
            <span>
              <span className="block text-2xl font-extrabold text-sky-700">接星星</span>
              <span className="block text-lg text-slate-500">60 秒內接住跌落嘅星星!</span>
            </span>
            <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-lg font-bold text-amber-600">
              ⭐ {GAME_COST}
            </span>
          </button>
          <button
            onClick={() => playGame('memory')}
            className={`kid-btn kid-card flex items-center gap-4 p-5 text-left ${stars < GAME_COST ? 'opacity-60' : ''}`}
          >
            <span className="text-5xl">🃏</span>
            <span>
              <span className="block text-2xl font-extrabold text-sky-700">記憶配對</span>
              <span className="block text-lg text-slate-500">翻卡配對中英文詞語!</span>
            </span>
            <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-lg font-bold text-amber-600">
              ⭐ {GAME_COST}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}

function SubjectCard({ subject, go }) {
  const levels = LEVELS[subject.id]
  const unlocked = getUnlocked(subject.id)
  return (
    <div className={`kid-card overflow-hidden`}>
      <div className={`${subject.color} flex items-center gap-3 px-5 py-4`}>
        <span className="text-4xl">{subject.emoji}</span>
        <span className="text-2xl font-extrabold text-white sm:text-3xl">{subject.name}</span>
      </div>
      {/* 蜿蜒小路:關卡左右交錯排列 */}
      <div className={`${subject.light} relative px-5 py-4`}>
        {levels.map((lv, i) => {
          const isUnlocked = lv.id <= unlocked
          const isCurrent = lv.id === unlocked
          return (
            <div key={lv.id} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} ${i > 0 ? 'mt-2' : ''}`}>
              <button
                disabled={!isUnlocked}
                onClick={() => {
                  playClick()
                  go('quiz', { subject: subject.id, levelId: lv.id })
                }}
                className={`kid-btn flex items-center gap-3 px-4 py-3 ${
                  isUnlocked ? 'bg-white' : 'bg-slate-200'
                } ${isCurrent ? 'ring-4 ring-yellow-400' : ''}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    isUnlocked ? 'bg-yellow-300' : 'bg-slate-300'
                  } ${isCurrent ? 'animate-floaty' : ''}`}
                >
                  {isUnlocked ? lv.emoji : '🔒'}
                </span>
                <span className={`text-xl font-bold ${isUnlocked ? 'text-slate-700' : 'text-slate-400'}`}>
                  第 {lv.id} 關 {lv.name}
                </span>
                {lv.id < unlocked && <span className="text-xl">✅</span>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
