import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { addStars } from '../lib/progress'
import { CHEERS, pick } from '../lib/encourage'
import { playCorrect, playWrong, playLevelClear } from '../lib/audio'

const SECONDS = 60

// 真定假:顯示一條算式,啱就 ✓、錯就 ✗。免費,60 秒,按答啱賺星。
function makeQ() {
  const ops = ['+', '+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a, b, real
  if (op === '+') {
    a = 1 + Math.floor(Math.random() * 49)
    b = 1 + Math.floor(Math.random() * 49)
    real = a + b
  } else if (op === '-') {
    a = 10 + Math.floor(Math.random() * 89)
    b = 1 + Math.floor(Math.random() * a)
    real = a - b
  } else {
    a = 2 + Math.floor(Math.random() * 8)
    b = 2 + Math.floor(Math.random() * 8)
    real = a * b
  }
  const isTrue = Math.random() < 0.5
  let shown = real
  if (!isTrue) {
    const off = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3))
    shown = real + off
  }
  return { text: `${a} ${op} ${b} = ${shown}`, correct: shown === real }
}

export default function TrueFalse({ go }) {
  const [q, setQ] = useState(makeQ)
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

  function finish() {
    setOver(true)
    const earned = Math.floor(scoreRef.current / 3)
    if (earned > 0) addStars(earned)
    playLevelClear()
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
  }

  const choose = (saysTrue) => {
    if (lockRef.current || over) return
    lockRef.current = true
    if (saysTrue === q.correct) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      setFlash('right')
      setCheer(pick(CHEERS))
      playCorrect()
    } else {
      setFlash('wrong')
      setCheer('')
      playWrong()
    }
    setTimeout(() => {
      setFlash(null)
      setQ(makeQ())
      lockRef.current = false
    }, 450)
  }

  if (over) {
    const earned = Math.floor(score / 3)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">時間到!🎉</h2>
        <p className="mt-3 text-3xl font-extrabold text-amber-500">答啱 {score} 題!</p>
        <p className="mt-2 text-2xl text-slate-600">{earned > 0 ? `好叻!賺到 ⭐ ${earned} 粒!` : '再快啲就有星星喇!'}</p>
        <button onClick={() => go('home', { toast: '練得好,繼續加油!💪' })} className="kid-btn mt-6 bg-sky-400 px-8 py-4 text-2xl text-white">
          返回 🏠
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-6 pt-4">
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
        className={`kid-card mt-4 flex flex-col items-center py-10 transition ${
          flash === 'right' ? 'ring-4 ring-green-400' : flash === 'wrong' ? 'ring-4 ring-rose-400' : ''
        }`}
      >
        <p className="text-lg font-bold text-sky-500">呢條啱唔啱?</p>
        <p className="mt-2 text-5xl font-extrabold text-slate-800">{q.text}</p>
        {flash === 'right' && cheer && <p className="mt-2 text-xl font-extrabold text-green-600">{cheer}</p>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <button onClick={() => choose(true)} className="kid-btn bg-green-400 py-6 text-5xl text-white">
          ✓
        </button>
        <button onClick={() => choose(false)} className="kid-btn bg-rose-400 py-6 text-5xl text-white">
          ✗
        </button>
      </div>
      <p className="mt-3 text-center text-lg text-sky-600">啱就撳綠色 ✓,錯就撳紅色 ✗!</p>
    </div>
  )
}
