import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { addStars } from '../lib/progress'
import { CHEERS, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

const SECONDS = 60
const SLOTS = 8

// 湊十:撳兩個加埋等於 10 嘅數。免費,60 秒,按湊到幾多對賺星。
function fill(prev) {
  const tiles = prev ? [...prev] : []
  while (tiles.length < SLOTS) tiles.push({ id: Math.random(), n: 1 + Math.floor(Math.random() * 9) })
  // 確保至少有一對可以湊十
  const ns = tiles.map((t) => t.n)
  const ok = ns.some((n, i) => ns.slice(i + 1).includes(10 - n))
  if (!ok && tiles.length) {
    const i = Math.floor(Math.random() * tiles.length)
    let j = Math.floor(Math.random() * tiles.length)
    if (j === i) j = (j + 1) % tiles.length
    tiles[j] = { id: Math.random(), n: 10 - tiles[i].n }
  }
  return tiles
}

export default function MakeTen({ go }) {
  const [tiles, setTiles] = useState(() => fill([]))
  const [sel, setSel] = useState([])
  const [score, setScore] = useState(0)
  const [cheer, setCheer] = useState('')
  const [bad, setBad] = useState(false)
  const [timeLeft, setTimeLeft] = useState(SECONDS)
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

  function finish() {
    setOver(true)
    const earned = Math.floor(scoreRef.current / 2)
    if (earned > 0) addStars(earned)
    playLevelClear()
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
  }

  const tapTile = (tile) => {
    if (over || sel.includes(tile.id)) return
    const ns = [...sel, tile.id]
    if (ns.length < 2) {
      setSel(ns)
      playPop()
      return
    }
    const [a, b] = ns.map((id) => tiles.find((t) => t.id === id))
    if (a.n + b.n === 10) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      setCheer(pick(CHEERS))
      playPop()
      const remain = tiles.filter((t) => t.id !== a.id && t.id !== b.id)
      setTiles(fill(remain))
      setSel([])
    } else {
      setBad(true)
      playWrong()
      setTimeout(() => setBad(false), 320)
      setSel([])
    }
  }

  if (over) {
    const earned = Math.floor(score / 2)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">時間到!🎉</h2>
        <p className="mt-3 text-3xl font-extrabold text-amber-500">湊到 {score} 對!</p>
        <p className="mt-2 text-2xl text-slate-600">{earned > 0 ? `好叻!賺到 ⭐ ${earned} 粒!` : '再加油,湊多啲!'}</p>
        <button onClick={() => go('home', { toast: '心算練得好!💪' })} className="kid-btn mt-6 bg-sky-400 px-8 py-4 text-2xl text-white">
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
        <span className="kid-card px-4 py-2 text-xl font-extrabold text-amber-500">湊到 {score}</span>
        <span className={`kid-card px-4 py-2 text-xl font-extrabold ${timeLeft <= 10 ? 'text-red-500' : 'text-sky-600'}`}>
          ⏰ {timeLeft}
        </span>
      </header>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={44} mood="happy" />
        <div className="kid-card px-4 py-2 text-xl font-extrabold text-sky-700">{cheer || '撳兩個加埋 = 10!'}</div>
      </div>

      <div className={`mt-4 grid grid-cols-4 gap-3 ${bad ? 'animate-shake' : ''}`}>
        {tiles.map((t) => (
          <button
            key={t.id}
            onClick={() => tapTile(t)}
            className={`kid-btn flex aspect-square items-center justify-center text-4xl font-extrabold ${
              sel.includes(t.id) ? 'bg-yellow-300 text-yellow-900 ring-4 ring-yellow-400' : 'bg-white text-sky-700 ring-2 ring-sky-200'
            }`}
          >
            {t.n}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-lg text-sky-600">撳兩個數,加埋啱啱好 10,就消除!</p>
    </div>
  )
}
