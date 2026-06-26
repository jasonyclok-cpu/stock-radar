import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { addStars } from '../lib/progress'
import { playCorrect, playWrong, playLevelClear, playClick } from '../lib/audio'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'

const GAME_SECONDS = 60
const rnd = (n) => Math.floor(Math.random() * n)
// 主題情境(emoji + 名詞),令題目唔淨係乾數字
const THEMES = [
  { e: '🍎', n: '蘋果' },
  { e: '⭐', n: '星星' },
  { e: '🚗', n: '車仔' },
  { e: '🍬', n: '糖' },
  { e: '🐟', n: '魚' },
  { e: '🎈', n: '氣球' },
  { e: '🍪', n: '餅' },
]

// 隨機出一條心算題:有標準式、填空式、三個數、主題應用題,增加變化。
// 答案一律係數字(用數字鍵盤作答)。
function makeQuestion() {
  const r = Math.random()

  // 填空式:a + ? = c / a - ? = c
  if (r < 0.25) {
    if (Math.random() < 0.6) {
      const a = 2 + rnd(40)
      const b = 2 + rnd(40)
      return { prompt: `${a} + ? = ${a + b}`, answer: b }
    }
    const a = 20 + rnd(60)
    const b = 2 + rnd(a - 2)
    return { prompt: `${a} − ? = ${a - b}`, answer: b }
  }

  // 主題應用題(emoji 情境)
  if (r < 0.5) {
    const t = THEMES[rnd(THEMES.length)]
    if (Math.random() < 0.5) {
      const a = 2 + rnd(9)
      const b = 2 + rnd(9)
      return { prompt: `${t.e} 有 ${a} 個,再嚟 ${b} 個,共幾多?`, answer: a + b }
    }
    const a = 6 + rnd(12)
    const b = 1 + rnd(5)
    return { prompt: `${t.e} 有 ${a} 個,走咗 ${b} 個,仲有幾多?`, answer: a - b }
  }

  // 三個數連加
  if (r < 0.62) {
    const a = 1 + rnd(20)
    const b = 1 + rnd(20)
    const c = 1 + rnd(10)
    return { prompt: `${a} + ${b} + ${c} = ?`, answer: a + b + c }
  }

  // 標準式 a op b = ?
  const ops = ['+', '+', '−', '×']
  const op = ops[rnd(ops.length)]
  if (op === '+') {
    const a = 1 + rnd(49)
    const b = 1 + rnd(99 - a)
    return { prompt: `${a} + ${b} = ?`, answer: a + b }
  }
  if (op === '−') {
    const a = 10 + rnd(89)
    const b = 1 + rnd(a)
    return { prompt: `${a} − ${b} = ?`, answer: a - b }
  }
  const a = 2 + rnd(8)
  const b = 2 + rnd(8)
  return { prompt: `${a} × ${b} = ?`, answer: a * b }
}

// 限時心算:60 秒內答得越多越叻,答啱攞分,終結按分數賺星星
export default function MathGame({ go }) {
  // 記住最近出過嘅題,撞到就重新生成(避免重複或太似)
  const recentRef = useRef([])
  const freshQuestion = () => {
    let q
    let guard = 0
    do {
      q = makeQuestion()
      guard += 1
    } while (recentRef.current.includes(q.prompt) && guard < 30)
    recentRef.current.push(q.prompt)
    if (recentRef.current.length > 16) recentRef.current.shift()
    return q
  }

  const [q, setQ] = useState(freshQuestion)
  const [value, setValue] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [flash, setFlash] = useState(null) // 'right' | 'wrong'
  const [over, setOver] = useState(false)
  const scoreRef = useRef(0)

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

  const finish = () => {
    setOver(true)
    const earned = Math.floor(scoreRef.current / 3)
    if (earned > 0) addStars(earned)
    playLevelClear()
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
  }

  const press = (k) => {
    if (over) return
    playClick()
    if (k === '⌫') {
      setValue((v) => v.slice(0, -1))
    } else if (k === '✓') {
      if (value === '') return
      const correct = Number(value) === q.answer
      if (correct) {
        scoreRef.current += 1
        setScore(scoreRef.current)
        playCorrect()
        setFlash('right')
      } else {
        playWrong()
        setFlash('wrong')
      }
      setValue('')
      setTimeout(() => setFlash(null), 350)
      setQ(freshQuestion())
    } else if (value.length < 4) {
      setValue((v) => v + k)
    }
  }

  if (over) {
    const earned = Math.floor(score / 3)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">時間到!⏰</h2>
        <p className="mt-3 text-3xl font-extrabold text-amber-500">答啱 {score} 題!</p>
        <p className="mt-2 text-2xl text-slate-600">
          {earned > 0 ? `叻仔!賺到 ⭐ ${earned} 粒星!` : '再快啲,就有星星攞喇!'}
        </p>
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => go('mathgame')}
            className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900"
          >
            再玩一次 🔁
          </button>
          <button
            onClick={() => go('home', { toast: '心算練得好,繼續努力!💪' })}
            className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white"
          >
            返回 🏠
          </button>
        </div>
      </div>
    )
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <span className="kid-card px-4 py-2 text-2xl font-extrabold text-amber-500">答啱 {score}</span>
        <span
          className={`kid-card px-4 py-2 text-2xl font-extrabold ${timeLeft <= 10 ? 'text-red-500' : 'text-sky-600'}`}
        >
          ⏰ {timeLeft}
        </span>
      </header>

      <div
        className={`kid-card mt-4 flex flex-col items-center py-8 transition ${
          flash === 'right' ? 'ring-4 ring-green-400' : flash === 'wrong' ? 'ring-4 ring-rose-400' : ''
        }`}
      >
        <p className="text-lg font-bold text-sky-500">快啲計!</p>
        <p className={`mt-2 px-3 text-center font-extrabold text-slate-800 ${q.prompt.length > 12 ? 'text-3xl' : 'text-5xl'}`}>
          {q.prompt}
        </p>
        <div className="mt-4 flex min-h-[60px] min-w-[120px] items-center justify-center rounded-2xl bg-sky-50 px-6 text-4xl font-extrabold tracking-widest text-sky-700 ring-2 ring-sky-300">
          {value || <span className="text-sky-300">?</span>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`kid-btn py-4 text-3xl ${
              k === '✓'
                ? 'bg-green-400 text-white'
                : k === '⌫'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-white text-sky-700 ring-2 ring-sky-200'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
