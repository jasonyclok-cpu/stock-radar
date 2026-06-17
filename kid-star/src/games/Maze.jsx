import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { shuffle } from '../lib/quizEngine'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 專心走迷宮:Canvas 迷宮,手指由起點(綠)拖到終點(紅)。
// 碰牆 → 該次重來 + 靜默記錄碰牆次數。難度漸進(迷宮越嚟越大)。
const SIZES = [6, 8, 10] // 每邊房間數,漸進

// 遞迴回溯生成完美迷宮,回傳 (2n+1)×(2n+1) 格(1=牆,0=通道)
function genMaze(n) {
  const dim = 2 * n + 1
  const g = Array.from({ length: dim }, () => Array(dim).fill(1))
  const visited = Array.from({ length: n }, () => Array(n).fill(false))
  const carve = (cx, cy) => {
    visited[cy][cx] = true
    g[2 * cy + 1][2 * cx + 1] = 0
    for (const [dx, dy] of shuffle([[0, -1], [0, 1], [-1, 0], [1, 0]])) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx >= 0 && nx < n && ny >= 0 && ny < n && !visited[ny][nx]) {
        g[2 * cy + 1 + dy][2 * cx + 1 + dx] = 0
        carve(nx, ny)
      }
    }
  }
  carve(0, 0)
  return g
}

export default function Maze({ go }) {
  const [sizeIdx, setSizeIdx] = useState(0)
  const [roundKey, setRoundKey] = useState(0)
  const [won, setWon] = useState(false)
  const [msg, setMsg] = useState('用手指由 🟢 拖去 🔴!')
  const canvasRef = useRef(null)
  const stateRef = useRef({ grid: null, dim: 0, cell: 0, trail: [], started: false, walls: 0 })
  const startRef = useRef(0)

  useEffect(() => {
    const n = SIZES[sizeIdx]
    const grid = genMaze(n)
    const dim = grid.length
    const canvas = canvasRef.current
    const px = Math.min(canvas.clientWidth, 460)
    canvas.width = px
    canvas.height = px
    const cell = px / dim
    stateRef.current = { grid, dim, cell, trail: [], started: false, walls: 0, end: [dim - 2, dim - 2] }
    startRef.current = 0
    setWon(false)
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeIdx, roundKey])

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { grid, dim, cell, trail, end } = stateRef.current
    ctx.clearRect(0, 0, c.width, c.height)
    for (let r = 0; r < dim; r++) {
      for (let col = 0; col < dim; col++) {
        ctx.fillStyle = grid[r][col] === 1 ? '#0369a1' : '#e0f2fe'
        ctx.fillRect(col * cell, r * cell, cell + 0.5, cell + 0.5)
      }
    }
    // 路徑
    ctx.fillStyle = '#fde047'
    trail.forEach(([col, r]) => ctx.fillRect(col * cell + cell * 0.2, r * cell + cell * 0.2, cell * 0.6, cell * 0.6))
    // 起點 / 終點
    ctx.font = `${cell * 0.9}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🟢', 1 * cell + cell / 2, 1 * cell + cell / 2)
    ctx.fillText('🔴', end[0] * cell + cell / 2, end[1] * cell + cell / 2)
  }

  const cellAt = (e) => {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (c.width / rect.width)
    const y = (e.clientY - rect.top) * (c.height / rect.height)
    const { cell } = stateRef.current
    return [Math.floor(x / cell), Math.floor(y / cell)]
  }

  const onDown = (e) => {
    const s = stateRef.current
    const [col, r] = cellAt(e)
    if (col === 1 && r === 1) {
      s.started = true
      s.trail = [[1, 1]]
      if (!startRef.current) startRef.current = performance.now()
      setMsg('好!跟住通道行,唔好掂牆!')
      draw()
    }
  }

  const onMove = (e) => {
    const s = stateRef.current
    if (!s.started || won) return
    e.preventDefault()
    const [col, r] = cellAt(e)
    if (col < 0 || r < 0 || col >= s.dim || r >= s.dim) return
    const last = s.trail[s.trail.length - 1]
    if (last && last[0] === col && last[1] === r) return
    if (s.grid[r][col] === 1) {
      // 碰牆:該次重來
      s.walls += 1
      s.started = false
      s.trail = []
      playWrong()
      setMsg('掂到牆喇!返去 🟢 再嚟過。')
      draw()
      return
    }
    s.trail.push([col, r])
    draw()
    if (col === s.end[0] && r === s.end[1]) winNow()
  }

  const winNow = () => {
    const s = stateRef.current
    setWon(true)
    playLevelClear()
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } })
    recordFocus('maze', {
      size: SIZES[sizeIdx],
      walls: s.walls,
      ms: startRef.current ? Math.round(performance.now() - startRef.current) : null,
    })
    setMsg(sizeIdx < SIZES.length - 1 ? '勁!試下大啲嘅迷宮!' : pick(EFFORT))
    setTimeout(() => {
      if (sizeIdx < SIZES.length - 1) setSizeIdx(sizeIdx + 1)
      else setRoundKey((k) => k + 1)
    }, 1500)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🧩 走迷宮</h2>
        <span className="w-16" />
      </header>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Mascot size={44} mood={won ? 'cheer' : 'idle'} />
        <div className="kid-card px-4 py-2 text-xl font-extrabold text-sky-700">{msg}</div>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        className="mx-auto mt-4 w-full max-w-[460px] touch-none rounded-2xl ring-4 ring-white shadow-lg"
        style={{ aspectRatio: '1 / 1' }}
      />
      <p className="mt-3 text-center text-lg text-sky-600">由綠色起點,沿住淺色通道,慢慢行去紅色終點!</p>
    </div>
  )
}
