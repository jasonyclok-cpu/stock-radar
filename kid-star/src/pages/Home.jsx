import { useEffect, useMemo, useRef, useState } from 'react'
import { SUBJECTS, LEVELS, GRADES } from '../data/levels'
import { getStars, getStreak, spendStars, getUnlocked } from '../lib/progress'
import { load, save } from '../lib/storage'
import { playClick, playLevelClear } from '../lib/audio'
import { GAME_COST, gamesByCat } from '../games/registry'
import { canPlay, recordPlay, cooldownSeconds } from '../lib/playlimit'
import Mascot from '../components/Mascot'
import Backdrop from '../components/Backdrop'

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

  const playGame = (game) => {
    if (game.cost === 0) {
      // 免費遊戲:5 分鐘最多玩 3 次
      if (!canPlay(game.id)) {
        playClick()
        setMessage(`呢個遊戲玩咗好多次喇,唞 ${Math.max(1, Math.ceil(cooldownSeconds(game.id) / 60))} 分鐘先,試下第二個啦!😊`)
        return
      }
      recordPlay(game.id)
      playLevelClear()
      go(game.id)
      return
    }
    // 收費遊戲:10⭐ 入場
    if (spendStars(game.cost)) {
      playLevelClear()
      go(game.id)
    } else {
      playClick()
      setMessage(`要儲夠 ${game.cost} 粒星先可以玩呀!繼續加油!💪`)
    }
  }

  // 每次入主頁隨機推介各類 2 個遊戲
  const featLearn = useMemo(() => sample(gamesByCat('learn'), 2), [])
  const featFocus = useMemo(() => sample(gamesByCat('focus'), 2), [])
  const [showAllLearn, setShowAllLearn] = useState(false)
  const [showAllFocus, setShowAllFocus] = useState(false)

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

      {/* 學習小遊戲:每次隨機推介 2 個,其餘可展開 */}
      <GameSection
        title="🎮 小遊戲樂園"
        subtitle="每次隨機推介 2 個!免費遊戲做得好賺星星 ⭐"
        cat="learn"
        featured={featLearn}
        showAll={showAllLearn}
        setShowAll={setShowAllLearn}
        stars={stars}
        onPlay={playGame}
      />

      {/* 專注力遊戲:同樣隨機推介 2 個 */}
      <GameSection
        title="🧠 專注力大挑戰"
        subtitle="每次隨機推介 2 個!考眼力、記性同反應!"
        cat="focus"
        featured={featFocus}
        showAll={showAllFocus}
        setShowAll={setShowAllFocus}
        stars={stars}
        onPlay={playGame}
      />

      {/* 獨立學習模組(各自一個 PWA,連去自己嘅資料夾) */}
      <section className="mt-8">
        <h2 className="title-pop text-3xl">🎒 學習小天地</h2>
        <p className="mt-1 text-lg font-bold text-sky-700">仲有更多好玩學習,一齊儲車仔!🚗</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ExternalCard
            emoji="🛒"
            title="升呢小老闆"
            desc="買買賣賣學數學,收銀、找贖、採購!"
            from="from-rose-400"
            to="to-pink-500"
            href={`${import.meta.env.BASE_URL}shop/`}
          />
          <ExternalCard
            emoji="📖"
            title="閱讀小天地"
            desc="中英分級閱讀,有朗讀同生字解釋!"
            from="from-emerald-400"
            to="to-teal-500"
            href={`${import.meta.env.BASE_URL}reading/`}
          />
        </div>
      </section>
    </div>
  )
}

// 連去獨立模組(整頁跳轉);沿用 GameCard 一致風格
function ExternalCard({ emoji, title, desc, from, to, href }) {
  return (
    <a
      href={href}
      className={`candy-btn flex items-center gap-4 bg-gradient-to-br ${from} ${to} p-5 text-left`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-4xl">
        {emoji}
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-white drop-shadow">{title}</span>
        <span className="block text-base text-white/90">{desc}</span>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-white/90 px-3 py-1 text-lg font-extrabold text-amber-600">
        GO →
      </span>
    </a>
  )
}

// 隨機抽 n 個
function sample(arr, n) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function GameSection({ title, subtitle, cat, featured, showAll, setShowAll, stars, onPlay }) {
  const featIds = new Set(featured.map((g) => g.id))
  const rest = gamesByCat(cat).filter((g) => !featIds.has(g.id))
  return (
    <section className="mt-8">
      <h2 className="title-pop text-3xl">{title}</h2>
      <p className="mt-1 text-lg font-bold text-sky-700">{subtitle}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {featured.map((g) => (
          <GameCard key={g.id} game={g} stars={stars} onPlay={onPlay} />
        ))}
      </div>
      {rest.length > 0 && (
        <>
          <button
            onClick={() => setShowAll(!showAll)}
            className="kid-btn mt-3 bg-white px-5 py-2 text-lg font-bold text-sky-600"
          >
            {showAll ? '收起 ▲' : `仲有 ${rest.length} 個遊戲 ▼`}
          </button>
          {showAll && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {rest.map((g) => (
                <GameCard key={g.id} game={g} stars={stars} onPlay={onPlay} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function GameCard({ game, stars, onPlay }) {
  const free = game.cost === 0
  const locked = !free && stars < game.cost
  return (
    <button
      onClick={() => onPlay(game)}
      className={`candy-btn flex items-center gap-4 bg-gradient-to-br ${game.from} ${game.to} p-5 text-left ${
        locked ? 'opacity-60' : ''
      }`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-4xl">
        {game.emoji}
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-white drop-shadow">{game.title}</span>
        <span className="block text-base text-white/90">{game.desc}</span>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-white/90 px-3 py-1 text-lg font-extrabold text-amber-600">
        {free ? '免費' : `⭐ ${game.cost}`}
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
