import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { shuffle } from '../lib/quizEngine'
import { FOCUS_EMOJIS } from '../data/focusCards'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear, playClick } from '../lib/audio'

// 記憶翻牌進階:4×4(8 對)漸進到 4×5(10 對),開局短暫預覽後蓋牌。
// 唔顯示步數/分數,只當闖關;最佳表現靜默記錄。
const STAGES = [
  { pairs: 8, label: '4x4' }, // 16 張
  { pairs: 10, label: '4x5' }, // 20 張
]
const PREVIEW_MS = 2600

export default function MemoryFlipAdvanced({ go }) {
  const [stageIdx, setStageIdx] = useState(0)
  const stage = STAGES[stageIdx]
  const [roundKey, setRoundKey] = useState(0)
  const cards = useMemo(() => {
    const chosen = shuffle(FOCUS_EMOJIS).slice(0, stage.pairs)
    return shuffle(chosen.flatMap((e, i) => [{ key: `${i}a`, pairId: i, face: e }, { key: `${i}b`, pairId: i, face: e }]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIdx, roundKey])

  const [preview, setPreview] = useState(true)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [locked, setLocked] = useState(true)
  const [msg, setMsg] = useState('')
  const startRef = useRef(0)

  useEffect(() => {
    setPreview(true)
    setFlipped([])
    setMatched(new Set())
    setLocked(true)
    setMsg('')
    const t = setTimeout(() => {
      setPreview(false)
      setLocked(false)
      startRef.current = performance.now()
    }, PREVIEW_MS)
    return () => clearTimeout(t)
  }, [stageIdx, roundKey])

  const tap = (card) => {
    if (preview || locked || flipped.some((c) => c.key === card.key) || matched.has(card.key)) return
    playClick()
    const nextFlipped = [...flipped, card]
    setFlipped(nextFlipped)
    if (nextFlipped.length === 2) {
      setLocked(true)
      if (nextFlipped[0].pairId === nextFlipped[1].pairId) {
        playPop()
        const nm = new Set(matched)
        nm.add(nextFlipped[0].key)
        nm.add(nextFlipped[1].key)
        setTimeout(() => {
          setMatched(nm)
          setFlipped([])
          setLocked(false)
          if (nm.size === cards.length) win()
        }, 350)
      } else {
        playWrong() // 唔啱唔扣分,蓋返轉頭
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 850)
      }
    }
  }

  const win = () => {
    recordFocus('memory', { grid: stage.label, ms: Math.round(performance.now() - startRef.current) })
    playLevelClear()
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } })
    setMsg(stageIdx < STAGES.length - 1 ? '勁!試下大啲嘅!' : pick(EFFORT))
    setLocked(true)
    setTimeout(() => {
      if (stageIdx < STAGES.length - 1) setStageIdx(stageIdx + 1)
      else setRoundKey((k) => k + 1)
    }, 1500)
  }

  const cols = 4
  const fontCls = stage.pairs >= 10 ? 'text-3xl' : 'text-4xl'

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🧠 記憶翻牌</h2>
        <span className="w-16" />
      </header>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={44} mood={preview ? 'happy' : 'idle'} />
        <div className="kid-card px-4 py-2 text-xl font-extrabold text-sky-700">
          {msg ? `${msg} 🎉` : preview ? '👀 睇清楚啲,就嚟蓋牌喇!' : '搵返一樣嘅一對!'}
        </div>
      </div>

      <div
        className="mx-auto mt-4 grid w-full max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const open = preview || matched.has(card.key) || flipped.some((c) => c.key === card.key)
          return (
            <button
              key={card.key}
              onClick={() => tap(card)}
              className={`kid-btn flex aspect-square items-center justify-center ${fontCls} ${
                matched.has(card.key)
                  ? 'bg-green-100 ring-2 ring-green-300'
                  : open
                    ? 'animate-pop bg-white ring-2 ring-sky-300'
                    : 'bg-sky-400'
              }`}
            >
              {open ? card.face : ''}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-center text-lg text-sky-600">記住每張卡喺邊,搵返成對!</p>
    </div>
  )
}
