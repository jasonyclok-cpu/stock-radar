import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { playPop, playBomb, playLevelClear } from '../lib/audio'

const GAME_SECONDS = 60

// 接星星:手指/滑鼠左右拖動籃子,接星加 1 分,接炸彈扣 2 分
export default function CatchStars({ go }) {
  const canvasRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let running = true

    const fit = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio
      canvas.height = canvas.clientHeight * devicePixelRatio
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    fit()
    window.addEventListener('resize', fit)

    const W = () => canvas.clientWidth
    const H = () => canvas.clientHeight
    const state = {
      basketX: W() / 2,
      items: [], // { x, y, speed, bomb }
      lastSpawn: 0,
      score: 0,
      startTime: performance.now(),
    }

    const onPointer = (e) => {
      const rect = canvas.getBoundingClientRect()
      state.basketX = Math.min(W() - 40, Math.max(40, e.clientX - rect.left))
    }
    canvas.addEventListener('pointermove', onPointer)
    canvas.addEventListener('pointerdown', onPointer)

    const draw = (now) => {
      if (!running) return
      const elapsed = (now - state.startTime) / 1000
      const remain = Math.max(0, GAME_SECONDS - Math.floor(elapsed))
      setTimeLeft(remain)
      if (remain <= 0) {
        running = false
        setScore(state.score)
        setOver(true)
        playLevelClear()
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } })
        return
      }

      // 生成新物件,愈玩愈密
      const interval = Math.max(380, 800 - elapsed * 7)
      if (now - state.lastSpawn > interval) {
        state.lastSpawn = now
        state.items.push({
          x: 30 + Math.random() * (W() - 60),
          y: -30,
          speed: 120 + Math.random() * 100 + elapsed * 2,
          bomb: Math.random() < 0.2,
        })
      }

      ctx.clearRect(0, 0, W(), H())

      const basketY = H() - 46
      const dt = 1 / 60
      state.items = state.items.filter((it) => {
        it.y += it.speed * dt
        // 撞到籃子?
        if (it.y > basketY - 26 && it.y < basketY + 20 && Math.abs(it.x - state.basketX) < 52) {
          if (it.bomb) {
            state.score = Math.max(0, state.score - 2)
            playBomb()
          } else {
            state.score += 1
            playPop()
          }
          setScore(state.score)
          return false
        }
        return it.y < H() + 40
      })

      ctx.font = '34px sans-serif'
      ctx.textAlign = 'center'
      for (const it of state.items) ctx.fillText(it.bomb ? '💣' : '⭐', it.x, it.y)
      ctx.font = '52px sans-serif'
      ctx.fillText('🧺', state.basketX, basketY + 16)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  if (over) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-6xl">🧺</p>
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">時間到!</h2>
        <p className="mt-3 text-3xl font-bold text-amber-500">你接到 {score} 分!</p>
        <p className="mt-2 text-2xl text-slate-600">再儲 10 粒星可以再玩!⭐</p>
        <button
          onClick={() => go('home', { toast: '玩得開心!繼續答題儲星星啦!⭐' })}
          className="kid-btn mt-6 bg-sky-400 px-10 py-4 text-2xl text-white"
        >
          返回練習 →
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col px-3 pb-3 pt-3">
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <span className="kid-card px-4 py-2 text-2xl font-extrabold text-amber-500">分數 {score}</span>
        <span className={`kid-card px-4 py-2 text-2xl font-extrabold ${timeLeft <= 10 ? 'text-red-500' : 'text-sky-600'}`}>
          ⏰ {timeLeft}
        </span>
      </header>
      <canvas ref={canvasRef} className="mt-3 w-full flex-1 touch-none rounded-3xl bg-sky-100" />
      <p className="mt-2 text-center text-lg text-sky-700">左右拖動接 ⭐,小心 💣!</p>
    </div>
  )
}
