import { useMemo, useState } from 'react'
import { shuffle } from '../../lib/quizEngine'
import { playClick } from '../../lib/audio'

// 重組句子:逐個詞語撳落答案區,撳已選嘅詞可以放返落去
export default function Reorder({ question, disabled, onAnswer }) {
  const initial = useMemo(() => {
    // 打亂到同答案唔一樣為止(避免一開波已經啱晒)
    let w = shuffle(question.words)
    let guard = 0
    while (w.join('') === question.answer && guard++ < 10) w = shuffle(question.words)
    return w.map((word, i) => ({ word, key: i }))
  }, [question.id])
  const [placed, setPlaced] = useState([])

  const remaining = initial.filter((it) => !placed.some((p) => p.key === it.key))

  const place = (it) => {
    playClick()
    setPlaced((p) => [...p, it])
  }
  const unplace = (it) => {
    playClick()
    setPlaced((p) => p.filter((x) => x.key !== it.key))
  }
  const submit = () => {
    const sentence = placed.map((p) => p.word).join('')
    onAnswer(sentence, sentence === question.answer)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex min-h-[64px] w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-sky-50 p-3 ring-2 ring-sky-300">
        {placed.length === 0 && <span className="text-xl text-sky-300">點下面的詞語砌句子</span>}
        {placed.map((it) => (
          <button
            key={it.key}
            disabled={disabled}
            onClick={() => unplace(it)}
            className="kid-btn animate-pop bg-yellow-300 px-4 py-2 text-2xl text-yellow-900 sm:text-3xl"
          >
            {it.word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {remaining.map((it) => (
          <button
            key={it.key}
            disabled={disabled}
            onClick={() => place(it)}
            className="kid-btn bg-white px-4 py-2 text-2xl text-sky-700 ring-2 ring-sky-200 sm:text-3xl"
          >
            {it.word}
          </button>
        ))}
      </div>
      <button
        disabled={disabled || remaining.length > 0}
        onClick={submit}
        className="kid-btn bg-green-400 px-10 py-3 text-2xl text-white"
      >
        完成 ✓
      </button>
    </div>
  )
}
