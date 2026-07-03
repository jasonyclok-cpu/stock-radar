import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { DICTATION_WORDS } from '../data/dictationWords'
import { shuffle } from '../lib/quizEngine'
import { speak, speechSupported } from '../lib/speech'
import { CHEERS, EFFORT, pick } from '../lib/encourage'
import { playPop, playWrong, playCorrect, playLevelClear, playClick } from '../lib/audio'

const ROUND_WORDS = 8
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

// 英文默書:讀出一個字(顯示中文意思),用亂序字母砌返個字。
// 答錯唔懲罰,清空再試,可以隨時再聽。
export default function Dictation({ go }) {
  const words = useMemo(() => shuffle(DICTATION_WORDS).slice(0, ROUND_WORDS), [])
  const [idx, setIdx] = useState(0)
  const [placed, setPlaced] = useState([]) // 已揀字母 {key, ch}
  const [msg, setMsg] = useState('')
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const word = words[idx]

  // 字母掣:個字嘅字母 + 2 個干擾字母,洗勻
  const letters = useMemo(() => {
    const base = word.en.split('')
    const extras = []
    while (extras.length < 2) {
      const c = ALPHABET[Math.floor(Math.random() * 26)]
      if (!base.includes(c) && !extras.includes(c)) extras.push(c)
    }
    return shuffle([...base, ...extras].map((ch, i) => ({ ch, key: i })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  useEffect(() => {
    setPlaced([])
    setMsg('')
    speak(word.en, 'en-US')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const tapLetter = (it) => {
    if (done || placed.some((p) => p.key === it.key)) return
    playClick()
    const next = [...placed, it]
    setPlaced(next)
    if (next.length === word.en.length) {
      const guess = next.map((p) => p.ch).join('')
      if (guess === word.en) {
        playCorrect()
        setMsg(pick(CHEERS))
        setTimeout(() => {
          if (idx < words.length - 1) setIdx(idx + 1)
          else finish()
        }, 900)
      } else {
        playWrong()
        setShake(true)
        setMsg('唔啱呀,聽多次再試!')
        setTimeout(() => {
          setShake(false)
          setPlaced([])
          speak(word.en, 'en-US')
        }, 700)
      }
    } else {
      playPop()
    }
  }

  const undo = () => {
    playClick()
    setPlaced((p) => p.slice(0, -1))
  }

  const finish = () => {
    setDone(true)
    playLevelClear()
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } })
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Backdrop />
        <Mascot mood="cheer" size={110} />
        <h2 className="mt-2 text-4xl font-extrabold text-sky-700">默書完成!🎉</h2>
        <p className="mt-3 max-w-xs text-center text-2xl text-slate-600">{pick(EFFORT)}</p>
        <div className="mt-6 flex gap-4">
          <button onClick={() => go('dictation')} className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900">
            再玩 🔁
          </button>
          <button
            onClick={() => go('home', { toast: '默書練得好,聽日返學唔怕喇!💪' })}
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
        <h2 className="title-pop text-2xl">✏️ 英文默書</h2>
        <span className="kid-card px-4 py-2 text-xl font-extrabold text-sky-600">
          {idx + 1} / {words.length}
        </span>
      </header>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Mascot size={56} mood={msg && msg !== '唔啱呀,聽多次再試!' ? 'happy' : 'idle'} />
        <div className="kid-card px-5 py-3 text-center">
          <p className="text-lg font-bold text-sky-500">聽住讀音,串返個字!</p>
          <p className="text-3xl font-extrabold text-slate-800">{word.zh}</p>
        </div>
        {speechSupported() && (
          <button
            onClick={() => speak(word.en, 'en-US')}
            className="kid-btn bg-sky-100 px-4 py-3 text-3xl ring-2 ring-sky-200"
            aria-label="再聽一次"
          >
            🔊
          </button>
        )}
      </div>

      {msg && (
        <p className="mt-3 animate-pop text-center text-2xl font-extrabold text-green-600">{msg}</p>
      )}

      {/* 答案格 */}
      <div className={`mx-auto mt-5 flex gap-2 ${shake ? 'animate-shake' : ''}`}>
        {word.en.split('').map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-12 items-center justify-center rounded-xl bg-white text-3xl font-extrabold text-sky-700 ring-2 ring-sky-300"
          >
            {placed[i] ? placed[i].ch : ''}
          </div>
        ))}
        <button onClick={undo} disabled={!placed.length} className="kid-btn bg-amber-200 px-4 text-2xl text-amber-800">
          ⌫
        </button>
      </div>

      {/* 字母掣 */}
      <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
        {letters.map((it) => {
          const used = placed.some((p) => p.key === it.key)
          return (
            <button
              key={it.key}
              onClick={() => tapLetter(it)}
              disabled={used}
              className={`kid-btn h-14 w-14 text-3xl font-extrabold ${
                used ? 'bg-slate-200 text-slate-400' : 'bg-white text-sky-700 ring-2 ring-sky-200'
              }`}
            >
              {it.ch}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-center text-lg text-sky-600">撳 🔊 可以再聽;砌錯唔緊要,再試過!</p>
    </div>
  )
}
