import { useMemo, useState } from 'react'
import { shuffle } from '../../lib/quizEngine'
import { playClick } from '../../lib/audio'

// 填充題:inputMode="numeric" 顯示數字鍵盤;inputMode="choices" 顯示選字按鈕
export default function FillBlank({ question, disabled, onAnswer }) {
  const [value, setValue] = useState('')

  // 選字模式:撳一下即作答
  if (question.inputMode === 'choices') {
    return <ChoiceChars question={question} disabled={disabled} onAnswer={onAnswer} />
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']
  const press = (k) => {
    playClick()
    if (k === '⌫') setValue((v) => v.slice(0, -1))
    else if (k === '✓') {
      if (value !== '') onAnswer(value, value === String(question.answer))
    } else if (value.length < 4) setValue((v) => v + k)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex min-h-[64px] min-w-[140px] items-center justify-center rounded-2xl bg-sky-50 px-6 text-4xl font-bold tracking-widest text-sky-700 ring-2 ring-sky-300">
        {value || <span className="text-sky-300">?</span>}
      </div>
      <div className="grid w-full max-w-xs grid-cols-3 gap-2 sm:gap-3">
        {keys.map((k) => (
          <button
            key={k}
            disabled={disabled || (k === '✓' && value === '')}
            onClick={() => press(k)}
            className={`kid-btn py-3 text-2xl sm:text-3xl ${
              k === '✓'
                ? 'bg-green-400 text-white'
                : k === '⌫'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-white text-sky-700 ring-2 ring-sky-200'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChoiceChars({ question, disabled, onAnswer }) {
  const choices = useMemo(() => shuffle(question.choices), [question.id])
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {choices.map((c) => (
        <button
          key={c}
          disabled={disabled}
          onClick={() => onAnswer(c, c === question.answer)}
          className="kid-btn bg-white px-6 py-4 text-3xl text-rose-600 ring-2 ring-rose-200 hover:ring-rose-400"
        >
          {c}
        </button>
      ))}
    </div>
  )
}
