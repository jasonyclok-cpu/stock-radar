import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { getArcadePool, optionsOf, shuffle } from '../lib/quizEngine'
import { addStars } from '../lib/progress'
import { CHEERS, pick } from '../lib/encourage'
import { playCorrect, playWrong, playLevelClear } from '../lib/audio'

const SECONDS = 60

// 競速答題:60 秒內鬥快答,免費版(reward)按答啱數量賺星。
// config: { subjects?, topics?, title };  reward: 係咪免費版會賺星
export default function ArcadeQuiz({ go, config = {}, reward = false }) {
  const pool = useMemo(() => getArcadePool(config), [])
  // 洗牌袋:整個題庫洗勻後逐條派,派晒先再洗 → 未出晒全部都唔會重複
  const bagRef = useRef([])
  const lastRef = useRef(null)
  const draw = () => {
    if (!pool.length) return null
    if (bagRef.current.length === 0) {
      const bag = shuffle(pool)
      // 接縫位:新一袋第一條若同上一條一樣,同第二條對調,避免感覺重複
      if (lastRef.current && bag.length > 1 && bag[0].id === lastRef.current) {
        const t = bag[0]
        bag[0] = bag[1]
        bag[1] = t
      }
      bagRef.current = bag
    }
    const nq = bagRef.current.shift()
    lastRef.current = nq.id
    return nq
  }

  const [q, setQ] = useState(() => draw())
  const [opts, setOpts] = useState(() => (q ? shuffle(optionsOf(q)) : []))
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(null)
  const [cheer, setCheer] = useState('')
  const [timeLeft, setTimeLeft] = useState(SECONDS)
  const [over, setOver] = useState(false)
  const scoreRef = useRef(0)
  const lockRef = useRef(false)

  useEffect(() => {
    if (over) return
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          finish()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  function next() {
    const nq = draw()
    setQ(nq)
    setOpts(nq ? shuffle(optionsOf(nq)) : [])
    lockRef.current = false
  }

  function finish() {
    setOver(true)
    const earned = reward ? Math.floor(scoreRef.current / 3) : 0
    if (earned > 0) addStars(earned)
    playLevelClear()
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
  }

  const answer = (opt) => {
    if (lockRef.current || over) return
    lockRef.current = true
    if (opt === q.answer) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      setFlash('right')
      setCheer(pick(CHEERS))
      playCorrect()
      setTimeout(() => {
        setFlash(null)
        next()
      }, 350)
    } else {
      setFlash('wrong')
      setCheer('')
      playWrong()
      setTimeout(() => {
        setFlash(null)
        next()
      }, 650)
    }
  }

  if (!q) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <p className="text-2xl text-sky-700">呢個遊戲暫時冇題目 🙈</p>
        <button onClick={() => go('home')} className="kid-btn mt-4 bg-sky-400 px-8 py-3 text-2xl text-white">
          返回
        </button>
      </div>
    )
  }

  if (over) {
    const earned = Math.floor(score / 3)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">時間到!🎉</h2>
        <p className="mt-3 text-3xl font-extrabold text-amber-500">答啱 {score} 題!</p>
        <p className="mt-2 max-w-xs text-center text-2xl text-slate-600">
          {reward ? (earned > 0 ? `好叻!賺到 ⭐ ${earned} 粒!` : '再快啲就有星星喇!') : pick(CHEERS)}
        </p>
        <div className="mt-6 flex gap-4">
          <button onClick={() => go('home', { toast: '練得好,繼續加油!💪' })} className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white">
            返回 🏠
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <span className="kid-card px-4 py-2 text-xl font-extrabold text-amber-500">答啱 {score}</span>
        <span className={`kid-card px-4 py-2 text-xl font-extrabold ${timeLeft <= 10 ? 'text-red-500' : 'text-sky-600'}`}>
          ⏰ {timeLeft}
        </span>
      </header>

      <div
        className={`kid-card mt-4 p-5 sm:p-8 transition ${
          flash === 'right' ? 'ring-4 ring-green-400' : flash === 'wrong' ? 'ring-4 ring-rose-400' : ''
        }`}
      >
        <p className="min-h-[48px] text-2xl font-bold text-slate-800 sm:text-3xl">{q.question}</p>
        {flash === 'right' && cheer && <p className="mt-1 text-xl font-extrabold text-green-600">{cheer}</p>}
        {flash === 'wrong' && <p className="mt-1 text-xl font-bold text-rose-500">正確:{q.answer}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="kid-btn bg-white px-4 py-4 text-2xl text-sky-700 ring-2 ring-sky-200 sm:text-3xl"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
