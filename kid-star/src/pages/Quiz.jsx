import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { LEVELS } from '../data/levels'
import {
  ROUND_SIZE,
  PASS_RATE,
  getLevelPool,
  getAdaptive,
  recordAdaptive,
  pickQuestion,
  pickSimilar,
  getRecentlySeen,
  recordSeen,
} from '../lib/quizEngine'
import { addStars, bumpStreak, logAnswer, unlockNext } from '../lib/progress'
import { playCorrect, playWrong, playLevelClear, playClick } from '../lib/audio'
import Mascot from '../components/Mascot'
import Backdrop from '../components/Backdrop'
import { speak, speechSupported } from '../lib/speech'
import MultipleChoice from '../components/questions/MultipleChoice'
import FillBlank from '../components/questions/FillBlank'
import Matching from '../components/questions/Matching'
import Reorder from '../components/questions/Reorder'

const PRAISES = ['好叻呀!', '答得好!', '勁呀!', '太棒了!', '叻仔!']
const COMFORTS = ['唔緊要,睇下點解!', '差少少咋,一齊學下!', '冇問題,下次得!']

export default function Quiz({ subject, grade, levelId, go }) {
  const pool = useMemo(() => getLevelPool(subject, grade, levelId), [subject, grade, levelId])
  const levelsInGrade = LEVELS[subject][grade]
  const level = levelsInGrade.find((l) => l.id === levelId)
  const mainTotal = Math.min(ROUND_SIZE, pool.length)

  // 回合內可變狀態用 ref,避免事件回呼讀到舊值
  const round = useRef(null)
  if (round.current === null) {
    const usedIds = new Set()
    // 避免同最近幾回合出過嘅題重複(前提係題庫夠大,唔夠就照舊)
    const recent = getRecentlySeen(subject)
    if (pool.length - recent.length >= mainTotal + 2) recent.forEach((id) => usedIds.add(id))
    const first = pickQuestion(pool, usedIds, getAdaptive(subject).bias)
    if (first) usedIds.add(first.id)
    round.current = {
      usedIds,
      retryQueue: [],
      mainAnswered: 0,
      correctCount: 0,
      starsEarned: 0,
      combo: 0,
      shownIds: first ? [first.id] : [],
    }
    // eslint-disable-next-line no-underscore-dangle
    round.current._first = first
  }

  const [current, setCurrent] = useState(() => ({ q: round.current._first, isRetry: false }))
  const [phase, setPhase] = useState('question') // question | correct | wrong | result
  const [feedback, setFeedback] = useState(null)
  const [showCombo, setShowCombo] = useState(false)

  const finishRound = () => {
    const r = round.current
    // 用實際答過嘅主題目數做分母:細題庫時加練題會「借走」題目,主題目可能少過 6 條
    const accuracy = r.mainAnswered > 0 ? r.correctCount / r.mainAnswered : 0
    const passed = accuracy >= PASS_RATE
    recordSeen(subject, r.shownIds) // 記低今回合出過嘅題,下回合儘量唔重複
    bumpStreak()
    if (passed) {
      unlockNext(subject, grade, levelId, levelsInGrade.length)
      playLevelClear()
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } })
      setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.4 } }), 400)
    }
    setPhase('result')
  }

  const advance = () => {
    const r = round.current
    let next = null
    let isRetry = false
    if (r.mainAnswered < mainTotal) {
      next = pickQuestion(pool, r.usedIds, getAdaptive(subject).bias)
      if (next) {
        r.usedIds.add(next.id)
        r.shownIds.push(next.id)
      }
    }
    if (!next && r.retryQueue.length > 0) {
      next = r.retryQueue.shift()
      isRetry = true
    }
    if (!next) {
      finishRound()
      return
    }
    setCurrent({ q: next, isRetry })
    setPhase('question')
    setFeedback(null)
  }

  const handleAnswer = (userAnswer, correct) => {
    if (phase !== 'question') return
    const r = round.current
    const q = current.q
    recordAdaptive(subject, correct)
    logAnswer({
      subject,
      topic: q.topic,
      questionId: q.id,
      question: q.question,
      userAnswer: String(userAnswer),
      correctAnswer: String(q.answer),
      correct,
    })
    if (!current.isRetry) {
      r.mainAnswered += 1
      if (correct) r.correctCount += 1
    }
    if (correct) {
      r.combo += 1
      const gain = r.combo >= 3 ? 2 : 1
      r.starsEarned += gain
      addStars(gain)
      playCorrect()
      setShowCombo(r.combo >= 3)
      setFeedback({ text: PRAISES[Math.floor(Math.random() * PRAISES.length)], gain })
      setPhase('correct')
      setTimeout(advance, 1100)
    } else {
      r.combo = 0
      setShowCombo(false)
      if (!current.isRetry) {
        // 答錯嘅題目,回合尾會重出一條類似題
        const similar = pickSimilar(q, pool, r.usedIds)
        if (similar.id !== q.id) r.usedIds.add(similar.id)
        r.retryQueue.push(similar)
      }
      playWrong()
      setFeedback({ text: COMFORTS[Math.floor(Math.random() * COMFORTS.length)] })
      setPhase('wrong')
    }
  }

  if (!current.q || mainTotal === 0) {
    return (
      <CenterCard>
        <p className="text-2xl">呢一關仲未有題目 🙈</p>
        <button onClick={() => go('home')} className="kid-btn mt-4 bg-sky-400 px-8 py-3 text-2xl text-white">
          返回地圖
        </button>
      </CenterCard>
    )
  }

  if (phase === 'result') {
    return <ResultScreen subject={subject} grade={grade} levelId={levelId} round={round.current} go={go} />
  }

  const r = round.current
  const progress = Math.min(r.mainAnswered + (phase === 'question' && !current.isRetry ? 1 : 0), mainTotal)
  const mood = phase === 'correct' ? 'happy' : phase === 'wrong' ? 'sad' : 'idle'
  const QuestionComp = { multiple_choice: MultipleChoice, fill_blank: FillBlank, matching: Matching, reorder: Reorder }[
    current.q.type
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      {/* 頂欄:返回、進度、星星 */}
      <header className="flex items-center gap-3">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 返回
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${(r.mainAnswered / mainTotal) * 100}%` }}
          />
        </div>
        <span className="kid-card px-3 py-1 text-xl font-bold text-amber-500">⭐ +{r.starsEarned}</span>
      </header>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xl font-bold text-sky-700">
          {level.emoji} {level.name} · {current.isRetry ? '加練題 💪' : `第 ${progress} / ${mainTotal} 題`}
        </span>
        {showCombo && (
          <span className="animate-pop rounded-full bg-orange-400 px-4 py-1 text-xl font-extrabold text-white">
            🔥 COMBO x{r.combo}
          </span>
        )}
      </div>

      {/* 題目卡 + 吉祥物 */}
      <main className="mt-3 flex flex-1 flex-col">
        <div className="kid-card relative p-5 sm:p-8">
          <div className="absolute -top-6 right-4">
            <Mascot mood={mood} size={64} />
          </div>
          <p className="min-h-[56px] pr-16 text-3xl font-bold leading-relaxed text-slate-800 sm:text-4xl">
            {current.q.question}
          </p>
          {speechSupported() && (
            <button
              onClick={() => speak(current.q.question, subject === 'english' ? 'en-US' : 'zh-HK')}
              className="kid-btn mt-3 bg-sky-100 px-4 py-2 text-xl text-sky-700 ring-2 ring-sky-200"
            >
              🔊 讀題目
            </button>
          )}
          <div className="mt-5">
            <QuestionComp key={current.q.id} question={current.q} disabled={phase !== 'question'} onAnswer={handleAnswer} />
          </div>
        </div>

        {/* 答對/答錯回饋 */}
        {phase === 'correct' && feedback && (
          <div className="mt-4 animate-pop rounded-3xl bg-green-100 px-5 py-4 text-center">
            <p className="text-3xl font-extrabold text-green-600">
              {feedback.text} ⭐ +{feedback.gain}
            </p>
          </div>
        )}
        {phase === 'wrong' && feedback && (
          <div className="mt-4 animate-pop rounded-3xl bg-amber-50 px-5 py-4 ring-2 ring-amber-300">
            <p className="text-2xl font-bold text-amber-600">{feedback.text}</p>
            <p className="mt-2 text-xl leading-relaxed text-slate-700">
              💡 正確答案:<span className="font-extrabold text-green-600">{current.q.answer}</span>
            </p>
            <p className="mt-1 text-xl leading-relaxed text-slate-600">{current.q.explanation}</p>
            <button
              onClick={() => {
                playClick()
                advance()
              }}
              className="kid-btn mt-3 w-full bg-sky-400 py-3 text-2xl text-white"
            >
              知道了,下一題 →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function ResultScreen({ subject, grade, levelId, round, go }) {
  const answered = round.mainAnswered || 1
  const accuracy = Math.round((round.correctCount / answered) * 100)
  const passed = round.correctCount / answered >= PASS_RATE
  const isLastLevel = levelId >= LEVELS[subject][grade].length
  return (
    <CenterCard>
      <Mascot mood={passed ? 'cheer' : 'idle'} size={110} />
      <h2 className="mt-2 text-4xl font-extrabold text-sky-700">{passed ? '過關啦!🎉' : '差少少咋!'}</h2>
      <div className="mt-4 flex gap-4">
        <div className="kid-card px-6 py-4 text-center">
          <p className="text-lg text-slate-500">星星</p>
          <p className="text-4xl font-extrabold text-amber-500">⭐ {round.starsEarned}</p>
        </div>
        <div className="kid-card px-6 py-4 text-center">
          <p className="text-lg text-slate-500">正確率</p>
          <p className={`text-4xl font-extrabold ${passed ? 'text-green-500' : 'text-sky-500'}`}>{accuracy}%</p>
        </div>
      </div>
      <p className="mt-4 max-w-sm text-center text-2xl text-slate-600">
        {passed
          ? isLastLevel
            ? '全部關卡完成晒,你係超級小明星!🌟'
            : '下一關解鎖咗喇,繼續衝呀!🚀'
          : '已經好接近喇!再試一次,你一定得!💪'}
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => go('quiz', { subject, grade, levelId })}
          className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900"
        >
          {passed ? '再玩一次' : '再試一次'} 🔁
        </button>
        <button onClick={() => go('home')} className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white">
          返回地圖 🗺️
        </button>
      </div>
    </CenterCard>
  )
}

function CenterCard({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Backdrop />
      {children}
    </div>
  )
}
