import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { shuffle } from '../lib/quizEngine'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 舒爾特方格:亂序 1..N²,順序點擊。3×3 漸進到 5×5。
// 計時靜默記錄,唔顯示俾小朋友(只當搵數字闖關遊戲)。
const SIZES = [3, 4, 5]

export default function SchulteTable({ go }) {
  const [sizeIdx, setSizeIdx] = useState(0)
  const size = SIZES[sizeIdx]
  const total = size * size
  const [roundKey, setRoundKey] = useState(0)
  const numbers = useMemo(
    () => shuffle([...Array(total)].map((_, i) => i + 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, roundKey],
  )
  const [next, setNext] = useState(1)
  const [shakeCell, setShakeCell] = useState(null)
  const [locked, setLocked] = useState(false)
  const [msg, setMsg] = useState('')
  const startRef = useRef(performance.now())

  useEffect(() => {
    startRef.current = performance.now()
    setNext(1)
    setLocked(false)
  }, [size, roundKey])

  const tap = (n) => {
    if (locked) return
    if (n !== next) {
      playWrong() // 撳錯只搖晃,唔扣分
      setShakeCell(n)
      setTimeout(() => setShakeCell(null), 320)
      return
    }
    playPop()
    if (n === total) {
      setLocked(true)
      recordFocus('schulte', { size, ms: Math.round(performance.now() - startRef.current) })
      playLevelClear()
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
      setMsg(size < 5 ? '勁呀!試下大啲嘅格!' : pick(EFFORT))
      setTimeout(() => {
        setMsg('')
        if (sizeIdx < SIZES.length - 1) setSizeIdx(sizeIdx + 1)
        else setRoundKey((k) => k + 1)
      }, 1500)
    } else {
      setNext(next + 1)
    }
  }

  // 字體隨格數縮細
  const fontCls = size >= 5 ? 'text-2xl' : size === 4 ? 'text-3xl' : 'text-4xl'

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🔢 數字快搜</h2>
        <span className="w-16" />
      </header>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={48} mood="idle" />
        <div className="kid-card px-5 py-3 text-2xl font-extrabold text-sky-700">
          順住㩒:搵 <span className="text-amber-500">{next}</span>!
        </div>
      </div>

      {msg && (
        <div className="mt-3 animate-pop rounded-2xl bg-green-100 px-4 py-3 text-center text-2xl font-extrabold text-green-600">
          {msg} 🎉
        </div>
      )}

      <div
        className="mx-auto mt-4 grid w-full max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {numbers.map((n) => {
          const done = n < next
          return (
            <button
              key={n}
              onClick={() => tap(n)}
              className={`kid-btn flex aspect-square items-center justify-center font-extrabold ${fontCls} ${
                done
                  ? 'bg-green-200 text-green-500'
                  : 'bg-white text-sky-700 ring-2 ring-sky-200'
              } ${shakeCell === n ? 'animate-shake ring-4 ring-rose-300' : ''}`}
            >
              {n}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-center text-lg text-sky-600">由 1 順住點到 {total},睇你幾快搵到!</p>
    </div>
  )
}
