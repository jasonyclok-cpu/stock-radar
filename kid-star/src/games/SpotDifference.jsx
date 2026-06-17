import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { shuffle } from '../lib/quizEngine'
import { SPOT_SCENES } from '../data/spotScenes'
import { recordFocus } from '../lib/focus'
import { EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playLevelClear } from '../lib/audio'

// 找不同:並排兩幅相似圖(emoji 砌),程式生成 3-5 處不同,點中高亮。
// 唔顯示分數;正確率、錯點靜默記錄。難度漸進(level 越高差異越多)。
function buildRound(scene, diffCount) {
  const left = [...scene.base]
  const right = [...scene.base]
  const idxs = shuffle(left.map((_, i) => i)).slice(0, diffCount)
  idxs.forEach((i) => {
    // 揀一個同原本唔同嘅 emoji 換入右圖
    let rep = pick(scene.pool)
    let guard = 0
    while (rep === right[i] && guard++ < 10) rep = pick(scene.pool)
    right[i] = rep
  })
  return { left, right, diffs: new Set(idxs) }
}

export default function SpotDifference({ go }) {
  const [level, setLevel] = useState(0)
  const sceneIdx = level % SPOT_SCENES.length
  const scene = SPOT_SCENES[sceneIdx]
  const diffCount = Math.min(5, 3 + Math.floor(level / 2)) // 3 → 5
  const round = useMemo(() => buildRound(scene, diffCount), [level]) // eslint-disable-line react-hooks/exhaustive-deps

  const [found, setFound] = useState(new Set())
  const [wrong, setWrong] = useState(null)
  const stat = useMemo(() => ({ ok: 0, bad: 0 }), [])
  const [done, setDone] = useState(false)

  const tap = (i) => {
    if (done) return
    if (round.diffs.has(i)) {
      if (found.has(i)) return
      playPop()
      stat.ok += 1
      const nf = new Set(found)
      nf.add(i)
      setFound(nf)
      if (nf.size === round.diffs.size) {
        playLevelClear()
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } })
        setTimeout(() => {
          setFound(new Set())
          if (level < 9) setLevel(level + 1)
          else finish()
        }, 900)
      }
    } else {
      playWrong() // 點錯唔扣分,只搖晃
      stat.bad += 1
      setWrong(i)
      setTimeout(() => setWrong(null), 320)
    }
  }

  const finish = () => {
    setDone(true)
    recordFocus('spot', { found: stat.ok, wrong: stat.bad })
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">全部搵晒!🎉</h2>
        <p className="mt-3 max-w-xs text-center text-2xl text-slate-600">{pick(EFFORT)}</p>
        <div className="mt-6 flex gap-4">
          <button onClick={() => go('spot')} className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900">
            再玩 🔁
          </button>
          <button onClick={() => go('home', { toast: '眼力好好,叻!💪' })} className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white">
            返回 🏠
          </button>
        </div>
      </div>
    )
  }

  const Grid = ({ side }) => {
    const cells = side === 'L' ? round.left : round.right
    return (
      <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${scene.cols}, minmax(0,1fr))` }}>
        {cells.map((e, i) => {
          const hit = found.has(i)
          const bad = wrong === i
          return (
            <button
              key={side + i}
              onClick={() => tap(i)}
              className={`flex aspect-square items-center justify-center rounded-xl bg-white text-2xl ring-2 sm:text-3xl ${
                hit ? 'ring-green-400 bg-green-100' : 'ring-sky-100'
              } ${bad ? 'animate-shake ring-rose-400' : ''}`}
            >
              {e}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-3 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🔍 找不同</h2>
        <span className="w-16" />
      </header>

      <div className="mt-2 flex items-center justify-center gap-2">
        <Mascot size={44} mood="idle" />
        <div className="kid-card px-4 py-2 text-xl font-extrabold text-sky-700">
          {scene.name}:搵 {round.diffs.size} 處唔同!仲差 {round.diffs.size - found.size} 處
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Grid side="L" />
        <div className="w-1 rounded bg-sky-200" />
        <Grid side="R" />
      </div>
      <p className="mt-3 text-center text-lg text-sky-600">比較左右兩邊,點中唔同嘅圖案!</p>
    </div>
  )
}
