import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Backdrop from '../components/Backdrop'
import Mascot from '../components/Mascot'
import { STORIES } from '../data/stories'
import { shuffle } from '../lib/quizEngine'
import { speechSupported } from '../lib/speech'
import { isMuted } from '../lib/sound'
import { addStars } from '../lib/progress'
import { CHEERS, pick } from '../lib/encourage'
import { playCorrect, playWrong, playLevelClear, playClick } from '../lib/audio'

// 故事小劇場:動畫繪本 —— emoji 場景識郁、廣東話逐句朗讀+高亮,
// 睇完故事即答理解題。答啱 +1⭐。
const ANIM = { bob: 'anim-bob', floaty: 'animate-floaty', cheer: 'animate-cheer', twinkle: 'anim-twinkle' }

const splitSentences = (text) => text.match(/[^。!?]+[。!?]?/g) || [text]

export default function StoryTheater({ go }) {
  const [phase, setPhase] = useState('pick') // pick | play | quiz | end
  const [story, setStory] = useState(null)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [sentIdx, setSentIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [qOpts, setQOpts] = useState([])
  const [qFeedback, setQFeedback] = useState(null) // {correct, explanation}
  const [correctCount, setCorrectCount] = useState(0)
  const aliveRef = useRef(true)
  const timersRef = useRef([])

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (speechSupported()) window.speechSynthesis.cancel()
  }
  useEffect(
    () => () => {
      aliveRef.current = false
      clearAll()
    },
    [],
  )
  const later = (fn, ms) => {
    const id = setTimeout(() => aliveRef.current && fn(), ms)
    timersRef.current.push(id)
  }

  // 讀一句(zh-HK);讀完(或者靜音/唔支援時等一陣)叫 done()
  const speakSentence = (text, done) => {
    const fallback = () => later(done, Math.max(1600, text.length * 260))
    if (!speechSupported() || isMuted()) {
      fallback()
      return
    }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-HK'
    u.rate = 0.85
    const v = window.speechSynthesis.getVoices().find((vo) => vo.lang && vo.lang.replace('_', '-').startsWith('zh'))
    if (v) u.voice = v
    u.onend = () => aliveRef.current && later(done, 350)
    u.onerror = fallback
    window.speechSynthesis.speak(u)
  }

  // 播一幕:逐句讀+高亮,讀晒成幕就過下一幕
  const playScene = (s, si) => {
    setSceneIdx(si)
    const sentences = splitSentences(s.scenes[si].text)
    const step = (i) => {
      if (!aliveRef.current) return
      setSentIdx(i)
      speakSentence(sentences[i], () => {
        if (i + 1 < sentences.length) step(i + 1)
        else if (si + 1 < s.scenes.length) later(() => playScene(s, si + 1), 900)
        else later(() => startQuiz(s), 1100)
      })
    }
    step(0)
  }

  const startStory = (s) => {
    playClick()
    setStory(s)
    setPhase('play')
    playScene(s, 0)
  }

  const startQuiz = (s) => {
    clearAll()
    setPhase('quiz')
    setQIdx(0)
    setCorrectCount(0)
    setQOpts(shuffle(s.questions[0].options))
    setQFeedback(null)
  }

  const answerQ = (opt) => {
    if (qFeedback) return
    const q = story.questions[qIdx]
    const correct = opt === q.answer
    if (correct) {
      playCorrect()
      addStars(1)
      setCorrectCount((c) => c + 1)
    } else {
      playWrong()
    }
    setQFeedback({ correct, explanation: q.explanation, answer: q.answer })
  }

  const nextQ = () => {
    playClick()
    const ni = qIdx + 1
    if (ni < story.questions.length) {
      setQIdx(ni)
      setQOpts(shuffle(story.questions[ni].options))
      setQFeedback(null)
    } else {
      playLevelClear()
      confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } })
      setPhase('end')
    }
  }

  // ===== 揀故事 =====
  if (phase === 'pick') {
    return (
      <Shell go={go}>
        <p className="mt-2 text-center text-xl font-bold text-sky-700">揀一個故事,一齊睇一齊聽!</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {STORIES.map((s) => (
            <button
              key={s.id}
              onClick={() => startStory(s)}
              className="candy-btn flex items-center gap-4 bg-gradient-to-br from-pink-400 to-rose-500 p-5 text-left"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-4xl">
                {s.emoji}
              </span>
              <span className="text-2xl font-extrabold text-white drop-shadow">{s.title}</span>
              <span className="ml-auto text-2xl">▶️</span>
            </button>
          ))}
        </div>
      </Shell>
    )
  }

  // ===== 播放故事 =====
  if (phase === 'play') {
    const scene = story.scenes[sceneIdx]
    const sentences = splitSentences(scene.text)
    return (
      <Shell go={go} title={story.title}>
        {/* 動畫場景 */}
        <div
          className={`mt-3 flex min-h-[220px] items-center justify-center gap-6 rounded-[28px] bg-gradient-to-br ${scene.bg} p-6 ring-2 ring-white shadow-lg`}
        >
          {scene.actors.map((a, i) => (
            <span
              key={i}
              className={`${ANIM[a.anim] || 'anim-bob'} text-6xl sm:text-7xl`}
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              {a.e}
            </span>
          ))}
        </div>

        {/* 逐句高亮文字 */}
        <div className="kid-card mt-4 p-5 text-2xl font-bold leading-relaxed sm:text-3xl">
          {sentences.map((sen, i) => (
            <span
              key={i}
              className={
                i === sentIdx ? 'rounded-lg bg-yellow-200 px-1 text-slate-900' : 'text-slate-400'
              }
            >
              {sen}
            </span>
          ))}
        </div>

        {/* 進度 + 控制 */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {story.scenes.map((_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full ${i <= sceneIdx ? 'bg-sky-500' : 'bg-white/70'}`} />
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={() => {
              playClick()
              clearAll()
              playScene(story, sceneIdx)
            }}
            className="kid-btn bg-white px-5 py-2 text-xl text-sky-600"
          >
            🔁 重播呢幕
          </button>
          <button
            onClick={() => {
              playClick()
              clearAll()
              if (sceneIdx + 1 < story.scenes.length) playScene(story, sceneIdx + 1)
              else startQuiz(story)
            }}
            className="kid-btn bg-sky-400 px-5 py-2 text-xl text-white"
          >
            ⏭ 下一幕
          </button>
        </div>
      </Shell>
    )
  }

  // ===== 理解題 =====
  if (phase === 'quiz') {
    const q = story.questions[qIdx]
    return (
      <Shell go={go} title={story.title}>
        <div className="mt-3 flex items-center gap-2">
          <Mascot size={52} mood={qFeedback?.correct ? 'happy' : 'idle'} />
          <div className="kid-card flex-1 px-4 py-3 text-xl font-extrabold text-sky-700">
            考考你({qIdx + 1}/{story.questions.length}):{q.question}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {qOpts.map((o) => (
            <button
              key={o}
              onClick={() => answerQ(o)}
              disabled={!!qFeedback}
              className={`kid-btn px-4 py-4 text-2xl ring-2 ${
                qFeedback && o === q.answer
                  ? 'bg-green-100 text-green-700 ring-green-400'
                  : 'bg-white text-sky-700 ring-sky-200'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {qFeedback && (
          <div className="mt-4 animate-pop rounded-3xl bg-amber-50 px-5 py-4 ring-2 ring-amber-300">
            <p className="text-2xl font-extrabold text-green-600">
              {qFeedback.correct ? `${pick(CHEERS)} ⭐ +1` : `正確答案:${qFeedback.answer}`}
            </p>
            <p className="mt-1 text-xl text-slate-600">{qFeedback.explanation}</p>
            <button onClick={nextQ} className="kid-btn mt-3 w-full bg-sky-400 py-3 text-2xl text-white">
              {qIdx + 1 < story.questions.length ? '下一題 →' : '睇成績 🎉'}
            </button>
          </div>
        )}
      </Shell>
    )
  }

  // ===== 結算 =====
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Backdrop />
      <Mascot mood="cheer" size={110} />
      <h2 className="mt-2 text-4xl font-extrabold text-sky-700">故事睇完喇!🎬</h2>
      <p className="mt-3 text-2xl font-extrabold text-amber-500">
        答啱 {correctCount} / {story.questions.length} 題,⭐ +{correctCount}
      </p>
      <p className="mt-2 max-w-xs text-center text-2xl text-slate-600">{pick(CHEERS)}</p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => {
            setPhase('pick')
            setStory(null)
          }}
          className="kid-btn bg-yellow-400 px-8 py-4 text-2xl text-yellow-900"
        >
          再睇一個 📚
        </button>
        <button
          onClick={() => go('home', { toast: '睇故仔學嘢,一流!💪' })}
          className="kid-btn bg-sky-400 px-8 py-4 text-2xl text-white"
        >
          返回 🏠
        </button>
      </div>
    </div>
  )
}

function Shell({ go, title, children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-6 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-xl text-sky-600">
          ← 離開
        </button>
        <h2 className="title-pop text-2xl">🎬 {title || '故事小劇場'}</h2>
        <span className="w-16" />
      </header>
      {children}
    </div>
  )
}
