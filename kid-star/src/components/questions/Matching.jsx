import { useMemo, useState } from 'react'
import { shuffle } from '../../lib/quizEngine'
import { playClick, playPop, playWrong } from '../../lib/audio'

// 配對題:左右兩欄,撳一左一右配對。全部配啱先算完成;
// 中途配錯唔會停,但會記低,有錯就當呢題答錯(會有講解+重練)。
export default function Matching({ question, disabled, onAnswer }) {
  const lefts = useMemo(() => shuffle(question.pairs.map((p) => p.left)), [question.id])
  const rights = useMemo(() => shuffle(question.pairs.map((p) => p.right)), [question.id])
  const [selectedLeft, setSelectedLeft] = useState(null)
  const [done, setDone] = useState(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)

  const isMatch = (l, r) => question.pairs.some((p) => p.left === l && p.right === r)

  const tapLeft = (l) => {
    if (disabled || done.has('L' + l)) return
    playClick()
    setSelectedLeft(l === selectedLeft ? null : l)
  }

  const tapRight = (r) => {
    if (disabled || !selectedLeft || done.has('R' + r)) return
    if (isMatch(selectedLeft, r)) {
      playPop()
      const next = new Set(done)
      next.add('L' + selectedLeft)
      next.add('R' + r)
      setDone(next)
      setSelectedLeft(null)
      if (next.size === question.pairs.length * 2) {
        const correct = mistakes === 0
        onAnswer(correct ? '全部配對正確' : `配錯了 ${mistakes} 次`, correct)
      }
    } else {
      playWrong()
      setMistakes((m) => m + 1)
      setShakeKey((k) => k + 1)
      setSelectedLeft(null)
    }
  }

  const btnCls = (active, finished) =>
    `kid-btn w-full px-4 py-3 text-2xl sm:text-3xl ${
      finished
        ? 'bg-green-100 text-green-600 ring-2 ring-green-300'
        : active
          ? 'bg-yellow-300 text-yellow-900 ring-4 ring-yellow-400'
          : 'bg-white text-sky-700 ring-2 ring-sky-200'
    }`

  return (
    <div key={shakeKey} className={mistakes > 0 && shakeKey > 0 ? 'animate-shake' : ''}>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="flex flex-col gap-3">
          {lefts.map((l) => (
            <button key={l} disabled={disabled} onClick={() => tapLeft(l)} className={btnCls(selectedLeft === l, done.has('L' + l))}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rights.map((r) => (
            <button key={r} disabled={disabled} onClick={() => tapRight(r)} className={btnCls(false, done.has('R' + r))}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-lg text-sky-600">先點左邊,再點右邊配對</p>
    </div>
  )
}
