import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { speak } from '../lib/speech'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 圖案接龍:閃示一串彩色圖案(同時 zh-HK 讀出顏色),玩家順序點擊複述。
// 答對序列加長,靜默記錄可達到嘅最長序列;錯咗唔懲罰,再睇多次。
const PADS = [
  { id: 0, name: '紅色', hex: '#ef4444' },
  { id: 1, name: '藍色', hex: '#3b82f6' },
  { id: 2, name: '黃色', hex: '#eab308' },
  { id: 3, name: '綠色', hex: '#22c55e' },
]
const START_LEN = 2

const randPad = () => Math.floor(Math.random() * PADS.length)

export default function SequenceRecall({ go }) {
  const [seq, setSeq] = useState(() => [randPad(), randPad()])
  const [active, setActive] = useState(null)
  const [phase, setPhase] = useState('show') // show | input
  const [msg, setMsg] = useState('睇清楚!')
  const inputPos = useRef(0)
  const alive = useRef(true)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const sleep = (ms) =>
    new Promise((res) => {
      const id = setTimeout(res, ms)
      timers.current.push(id)
    })

  const playSequence = async (sequence) => {
    setPhase('show')
    setMsg('睇清楚!')
    await sleep(600)
    for (const p of sequence) {
      if (!alive.current) return
      setActive(p)
      playPop()
      speak(PADS[p].name, 'zh-HK')
      await sleep(620)
      if (!alive.current) return
      setActive(null)
      await sleep(240)
    }
    if (!alive.current) return
    inputPos.current = 0
    setPhase('input')
    setMsg('到你喇!跟住㩒')
  }

  useEffect(() => {
    alive.current = true
    playSequence(seq)
    return () => {
      alive.current = false
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (p) => {
    setActive(p)
    playPop()
    setTimeout(() => setActive(null), 220)
  }

  const tap = (p) => {
    if (phase !== 'input') return
    if (p === seq[inputPos.current]) {
      flash(p)
      inputPos.current += 1
      if (inputPos.current === seq.length) {
        // 完成成串 → 加長一位
        recordFocus('sequence', { len: seq.length })
        playLevelClear()
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } })
        setPhase('show')
        setMsg('叻!再長啲!')
        const next = [...seq, randPad()]
        const t = setTimeout(() => {
          setSeq(next)
          playSequence(next)
        }, 1100)
        timers.current.push(t)
      }
    } else {
      // 撳錯:唔懲罰,再睇多次同一串
      playWrong()
      setPhase('show')
      setMsg('差少少,再睇多次!')
      const t = setTimeout(() => playSequence(seq), 1100)
      timers.current.push(t)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🎶 圖案接龍</h2>
        <span className="w-16" />
      </header>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={48} mood={phase === 'show' ? 'happy' : 'idle'} />
        <div className="kid-card px-5 py-3 text-2xl font-extrabold text-sky-700">{msg}</div>
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            onClick={() => tap(pad.id)}
            disabled={phase !== 'input'}
            className="kid-btn aspect-square rounded-3xl transition"
            style={{
              backgroundColor: pad.hex,
              opacity: active === pad.id ? 1 : 0.55,
              transform: active === pad.id ? 'scale(1.04)' : 'none',
            }}
            aria-label={pad.name}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-lg text-sky-600">睇住啲燈閃,再順住次序㩒返!</p>
    </div>
  )
}
