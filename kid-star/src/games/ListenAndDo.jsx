import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { shuffle } from '../lib/quizEngine'
import { speak, speechSupported } from '../lib/speech'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 聽指令做動作:zh-HK 讀出指令 + 同步文字,含「要做 / 不要做」。
// 唔支援語音就淨係顯示文字(降級)。正確率、錯點靜默記錄。
const COLORS = [
  { id: 'red', name: '紅色', hex: '#ef4444' },
  { id: 'blue', name: '藍色', hex: '#3b82f6' },
  { id: 'yellow', name: '黃色', hex: '#eab308' },
  { id: 'green', name: '綠色', hex: '#22c55e' },
]
const SHAPES = [
  { id: 'circle', name: '圓形' },
  { id: 'square', name: '方形' },
  { id: 'triangle', name: '三角形' },
]
const ROUNDS = 8

function makeRound(level) {
  const complex = level >= 3 // 第 4 回合起加「不要做」
  const color = pick(COLORS)
  let predicate, text, targetMaker
  if (!complex) {
    const shape = pick(SHAPES)
    predicate = (c) => c.color === color.id && c.shape === shape.id
    text = `點${color.name}嘅${shape.name}!`
    targetMaker = () => ({ color: color.id, shape: shape.id })
  } else {
    const excl = pick(SHAPES)
    const okShapes = SHAPES.filter((s) => s.id !== excl.id)
    predicate = (c) => c.color === color.id && c.shape !== excl.id
    text = `點晒${color.name}色嘅嘢,但唔好點${excl.name}!`
    targetMaker = () => ({ color: color.id, shape: pick(okShapes).id })
  }
  const boardSize = Math.min(9, 4 + level)
  const targetCount = 1 + Math.floor(Math.random() * (complex ? 3 : 2))
  const cells = []
  for (let i = 0; i < targetCount; i++) cells.push(targetMaker())
  let guard = 0
  while (cells.length < boardSize && guard++ < 200) {
    const c = { color: pick(COLORS).id, shape: pick(SHAPES).id }
    if (!predicate(c)) cells.push(c)
  }
  return { text, predicate, cells: shuffle(cells).map((c, i) => ({ ...c, key: i })) }
}

export default function ListenAndDo({ go }) {
  const [level, setLevel] = useState(0)
  const round = useMemo(() => makeRound(level), [level])
  const [tapped, setTapped] = useState(new Set())
  const [wrongKey, setWrongKey] = useState(null)
  const [done, setDone] = useState(false)
  const stat = useRef({ correct: 0, wrong: 0 })

  const targets = round.cells.filter(round.predicate)

  useEffect(() => {
    setTapped(new Set())
    speak(round.text, 'zh-HK')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const finish = () => {
    setDone(true)
    recordFocus('listen', { correct: stat.current.correct, wrong: stat.current.wrong, rounds: ROUNDS })
    playLevelClear()
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } })
  }

  const tap = (cell) => {
    if (done || tapped.has(cell.key)) return
    if (round.predicate(cell)) {
      playPop()
      stat.current.correct += 1
      const nt = new Set(tapped)
      nt.add(cell.key)
      setTapped(nt)
      const got = round.cells.filter((c) => round.predicate(c) && nt.has(c.key)).length
      if (got === targets.length) {
        // 完成呢回合
        setTimeout(() => {
          if (level < ROUNDS - 1) setLevel(level + 1)
          else finish()
        }, 600)
      }
    } else {
      playWrong() // 錯點唔扣分,只搖晃
      stat.current.wrong += 1
      setWrongKey(cell.key)
      setTimeout(() => setWrongKey(null), 320)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">全部做完喇!🎉</h2>
        <p className="mt-3 max-w-xs text-center text-2xl text-slate-600">{pick(EFFORT)}</p>
        <div className="mt-6 flex gap-4">
          <button onClick={() => go('listen')} className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900">
            再玩 🔁
          </button>
          <button
            onClick={() => go('home', { toast: '聽得好專心,叻!💪' })}
            className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white"
          >
            返回 🏠
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">👂 聽指令</h2>
        <span className="w-16" />
      </header>

      <div className="mt-3 flex items-center gap-2">
        <Mascot size={48} mood="happy" />
        <button
          onClick={() => speak(round.text, 'zh-HK')}
          className="kid-card flex-1 px-4 py-3 text-left text-2xl font-extrabold text-sky-700"
        >
          {round.text} {speechSupported() && <span className="text-xl">🔊</span>}
        </button>
      </div>
      {!speechSupported() && (
        <p className="mt-1 text-center text-sm text-slate-400">(裝置唔支援語音,睇文字指令就得)</p>
      )}

      <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-3 gap-3">
        {round.cells.map((cell) => (
          <ShapeButton
            key={cell.key}
            cell={cell}
            tapped={tapped.has(cell.key)}
            wrong={wrongKey === cell.key}
            onClick={() => tap(cell)}
          />
        ))}
      </div>
    </div>
  )
}

function ShapeButton({ cell, tapped, wrong, onClick }) {
  const hex = COLORS.find((c) => c.id === cell.color).hex
  const common = { width: '70%', height: '70%', backgroundColor: hex }
  let shapeStyle = { ...common, borderRadius: '9999px' }
  if (cell.shape === 'square') shapeStyle = { ...common, borderRadius: '12px' }
  if (cell.shape === 'triangle')
    shapeStyle = { ...common, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: 0 }
  return (
    <button
      onClick={onClick}
      className={`kid-btn flex aspect-square items-center justify-center bg-white ring-2 ${
        tapped ? 'ring-green-400 opacity-50' : 'ring-sky-200'
      } ${wrong ? 'animate-shake ring-4 ring-rose-400' : ''}`}
    >
      <span style={shapeStyle} />
    </button>
  )
}
