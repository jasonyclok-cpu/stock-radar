import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 紅綠燈反應:綠燈快啲撳,紅燈唔好撳。回合 60 秒。
// 平均反應時間、紅燈誤點靜默記錄,唔顯示俾小朋友。
const ROUND_MS = 60000

export default function TrafficLight({ go }) {
  const [phase, setPhase] = useState('ready') // ready | yellow | green | red
  const [hint, setHint] = useState('預備…')
  const [timeFrac, setTimeFrac] = useState(1)
  const [over, setOver] = useState(false)

  const phaseRef = useRef('ready')
  const greenAtRef = useRef(0)
  const rtsRef = useRef([])
  const falseRef = useRef(0)
  const timers = useRef([])
  const startRef = useRef(0)
  const speedRef = useRef(1200) // 等待上限,表現好會縮短(加速);已調快

  const setP = (p) => {
    phaseRef.current = p
    setPhase(p)
  }
  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const goGreen = () => {
    greenAtRef.current = performance.now()
    setP('green')
    setHint('🟢 撳!')
  }
  const goRed = (msg) => {
    setP('red')
    setHint(msg)
    addTimer(() => schedule(), 600 + Math.random() * 600)
  }

  // 出燈次序刻意冇規律,等小朋友冇得靠「背節奏」預測綠燈:
  // - 有時直接紅燈
  // - 有時完全冇黃燈,綠燈突然彈出
  // - 黃燈長短隨機,而且黃燈之後有機會反轉做紅燈(奇兵!)
  const schedule = () => {
    setP('ready')
    setHint('預備…')
    const wait = 350 + Math.random() * speedRef.current
    addTimer(() => {
      const roll = Math.random()
      if (roll < 0.2) {
        goRed('🔴 停!唔好撳')
      } else if (roll < 0.38) {
        // 突襲:冇黃燈,直接綠燈
        goGreen()
      } else {
        setP('yellow')
        setHint('🟡 小心睇住…')
        const yellowDur = 250 + Math.random() * 1300 // 長短好隨機
        addTimer(() => {
          if (Math.random() < 0.35) {
            // 奇兵:黃燈之後轉紅燈,唔係綠燈!
            goRed('🔴 呃唔到你?唔好撳!')
          } else {
            goGreen()
          }
        }, yellowDur)
      }
    }, wait)
  }

  const finish = () => {
    clearTimers()
    setOver(true)
    const rts = rtsRef.current
    const n = rts.length
    const mean = n ? rts.reduce((a, b) => a + b, 0) / n : null
    const sd = n > 1 ? Math.sqrt(rts.reduce((s, x) => s + (x - mean) ** 2, 0) / n) : null
    const half = Math.floor(n / 2)
    const firstAvg = half ? Math.round(rts.slice(0, half).reduce((a, b) => a + b, 0) / half) : null
    const secondAvg = n - half ? Math.round(rts.slice(half).reduce((a, b) => a + b, 0) / (n - half)) : null
    recordFocus('reaction', {
      avgMs: mean != null ? Math.round(mean) : null,
      sdMs: sd != null ? Math.round(sd) : null,
      hits: n,
      falseTaps: falseRef.current,
      firstAvg,
      secondAvg,
    })
    playLevelClear()
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } })
  }

  useEffect(() => {
    startRef.current = performance.now()
    schedule()
    const tick = setInterval(() => {
      const frac = 1 - (performance.now() - startRef.current) / ROUND_MS
      if (frac <= 0) {
        clearInterval(tick)
        setTimeFrac(0)
        finish()
      } else {
        setTimeFrac(frac)
      }
    }, 100)
    timers.current.push(tick)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTap = () => {
    if (over) return
    const p = phaseRef.current
    if (p === 'green') {
      const rt = performance.now() - greenAtRef.current
      rtsRef.current.push(rt)
      playPop()
      setHint(rt < 450 ? '⚡ 好快!' : '叻!')
      // 表現好就加速(等待上限再收窄)
      if (rt < 500) speedRef.current = Math.max(500, speedRef.current - 120)
      clearTimers()
      addTimer(() => schedule(), 350)
    } else if (p === 'red') {
      falseRef.current += 1
      playWrong() // 誤點唔扣分,只搖晃提示
      setHint('🔴 紅燈唔好撳呀!')
    } else if (p === 'yellow') {
      falseRef.current += 1
      playWrong() // 黃燈太早撳,要等綠燈
      setHint('🟡 等綠燈先至撳!')
    } else {
      setHint('等綠燈先!')
    }
  }

  if (over) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">玩完喇!🎉</h2>
        <p className="mt-3 max-w-xs text-center text-2xl text-slate-600">{pick(EFFORT)}</p>
        <div className="mt-6 flex gap-4">
          <button onClick={() => go('traffic')} className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900">
            再玩 🔁
          </button>
          <button
            onClick={() => go('home', { toast: '反應練得好,繼續加油!💪' })}
            className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white"
          >
            返回 🏠
          </button>
        </div>
      </div>
    )
  }

  const bg =
    phase === 'green'
      ? 'bg-green-400'
      : phase === 'red'
        ? 'bg-rose-500'
        : phase === 'yellow'
          ? 'bg-amber-400'
          : 'bg-slate-300'

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🚦 紅綠燈</h2>
        <span className="w-16" />
      </header>

      {/* 時間進度條(唔用數字,當遊戲時間) */}
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/70">
        <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${timeFrac * 100}%` }} />
      </div>

      <button
        onClick={onTap}
        className={`mt-4 flex flex-1 flex-col items-center justify-center rounded-[36px] ${bg} text-white shadow-lg transition active:scale-[0.98] ${
          phase === 'red' ? 'animate-shake' : ''
        }`}
      >
        <span className="text-[96px] leading-none">
          {phase === 'green' ? '🟢' : phase === 'red' ? '🔴' : phase === 'yellow' ? '🟡' : '⚪'}
        </span>
        <span className="mt-4 text-4xl font-extrabold drop-shadow">{hint}</span>
      </button>

      <p className="mt-3 text-center text-lg text-sky-700">
        只有綠燈 🟢 先至撳!小心呀——黃燈 🟡 之後唔一定係綠燈㗎!
      </p>
    </div>
  )
}
