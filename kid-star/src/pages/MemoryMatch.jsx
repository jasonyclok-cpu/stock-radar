import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { MEMORY_PAIRS } from '../data/memoryPairs'
import { shuffle } from '../lib/quizEngine'
import { playClick, playPop, playLevelClear } from '../lib/audio'
import { speak } from '../lib/speech'

const PAIR_COUNT = 8 // 8 對 = 16 張卡(比之前難)

// 記憶配對:16 張卡(8 對中英文詞語),翻兩張配對,翻牌會讀出該詞
export default function MemoryMatch({ go }) {
  const cards = useMemo(() => {
    const pairs = shuffle(MEMORY_PAIRS).slice(0, PAIR_COUNT)
    return shuffle(
      pairs.flatMap((p, i) => [
        { key: `zh-${i}`, pairId: i, text: p.zh, lang: 'zh-HK' },
        { key: `en-${i}`, pairId: i, text: p.en, lang: 'en-US' },
      ]),
    )
  }, [])
  const [flipped, setFlipped] = useState([]) // 而家反開緊嘅卡(最多 2 張)
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)

  const done = matched.size === cards.length

  const tap = (card) => {
    if (locked || flipped.some((c) => c.key === card.key) || matched.has(card.key)) return
    playClick()
    speak(card.text, card.lang) // 翻牌即讀出該詞,玩樂中認讀
    const next = [...flipped, card]
    setFlipped(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      if (next[0].pairId === next[1].pairId) {
        playPop()
        const nm = new Set(matched)
        nm.add(next[0].key)
        nm.add(next[1].key)
        setMatched(nm)
        setFlipped([])
        if (nm.size === cards.length) {
          playLevelClear()
          confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } })
        }
      } else {
        setLocked(true)
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 900)
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-6 pt-4">
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="text-2xl font-extrabold text-sky-700">🃏 記憶配對</h2>
        <span className="kid-card px-4 py-2 text-xl font-bold text-sky-600">步數 {moves}</span>
      </header>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-6xl">🏆</p>
          <h3 className="mt-2 text-4xl font-extrabold text-sky-700">全部配對成功!</h3>
          <p className="mt-2 text-2xl text-slate-600">只用咗 {moves} 步,好犀利!</p>
          <p className="mt-1 text-2xl text-slate-600">再儲 10 粒星可以再玩!⭐</p>
          <button
            onClick={() => go('home', { toast: '玩得開心!繼續答題儲星星啦!⭐' })}
            className="kid-btn mt-6 bg-sky-400 px-10 py-4 text-2xl text-white"
          >
            返回練習 →
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-center text-lg text-sky-600">將中文詞語同英文配對!</p>
          <div className="mt-3 grid flex-1 grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card) => {
              const isOpen = matched.has(card.key) || flipped.some((c) => c.key === card.key)
              return (
                <button
                  key={card.key}
                  onClick={() => tap(card)}
                  className={`kid-btn flex items-center justify-center p-2 text-2xl sm:text-3xl ${
                    matched.has(card.key)
                      ? 'bg-green-100 text-green-600 ring-2 ring-green-300'
                      : isOpen
                        ? 'animate-pop bg-white text-sky-700 ring-2 ring-sky-300'
                        : 'bg-sky-400 text-4xl text-white'
                  }`}
                >
                  {isOpen ? card.text : '⭐'}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
