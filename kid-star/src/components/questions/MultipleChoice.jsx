import { useMemo } from 'react'
import { shuffle } from '../../lib/quizEngine'

export default function MultipleChoice({ question, disabled, onAnswer }) {
  const options = useMemo(() => shuffle(question.options), [question.id])
  const cols = options.some((o) => String(o).length > 8) ? 'grid-cols-1' : 'grid-cols-2'
  return (
    <div className={`grid gap-3 ${cols} sm:gap-4`}>
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onAnswer(opt, opt === question.answer)}
          className="kid-btn bg-white px-4 py-4 text-2xl text-sky-700 ring-2 ring-sky-200 hover:ring-sky-400 sm:text-3xl"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
