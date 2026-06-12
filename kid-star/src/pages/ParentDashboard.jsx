import { useMemo, useState } from 'react'
import { getAnswerLog } from '../lib/progress'
import { clearAll } from '../lib/storage'
import { SUBJECTS } from '../data/levels'

// 家長後台:喺主頁長按 logo 3 秒進入
export default function ParentDashboard({ go }) {
  const log = useMemo(() => getAnswerLog(), [])
  const [confirming, setConfirming] = useState(false)

  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = dayStart - 6 * 86400000

  const todayCount = log.filter((e) => e.ts >= dayStart).length
  const weekCount = log.filter((e) => e.ts >= weekStart).length

  const subjectStats = SUBJECTS.map((s) => {
    const entries = log.filter((e) => e.subject === s.id)
    const correct = entries.filter((e) => e.correct).length
    return {
      ...s,
      total: entries.length,
      rate: entries.length ? Math.round((correct / entries.length) * 100) : null,
    }
  })

  // 最弱 3 個課題:按正確率由低到高(至少答過 3 題先計)
  const topicMap = {}
  for (const e of log) {
    const key = `${e.subject}|${e.topic}`
    topicMap[key] = topicMap[key] || { subject: e.subject, topic: e.topic, total: 0, correct: 0 }
    topicMap[key].total += 1
    if (e.correct) topicMap[key].correct += 1
  }
  const weakest = Object.values(topicMap)
    .filter((t) => t.total >= 3)
    .map((t) => ({ ...t, rate: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)

  const recentWrong = [...log].reverse().filter((e) => !e.correct).slice(0, 20)

  const subjectName = (id) => SUBJECTS.find((s) => s.id === id)?.name || id

  const resetAll = () => {
    clearAll()
    go('home', { toast: '進度已重設' })
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-10 pt-4 text-base">
      <header className="flex items-center justify-between">
        <button onClick={() => go('home')} className="kid-btn bg-white px-4 py-2 text-lg text-sky-600">
          ← 返回
        </button>
        <h1 className="text-2xl font-extrabold text-sky-700">👨‍👩‍👦 家長後台</h1>
        <span className="w-20" />
      </header>

      {/* 答題量 */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="kid-card p-4 text-center">
          <p className="text-slate-500">今日答題</p>
          <p className="text-3xl font-extrabold text-sky-600">{todayCount}</p>
        </div>
        <div className="kid-card p-4 text-center">
          <p className="text-slate-500">本週答題(7 日)</p>
          <p className="text-3xl font-extrabold text-sky-600">{weekCount}</p>
        </div>
      </section>

      {/* 每科正確率 */}
      <section className="mt-5">
        <h2 className="text-xl font-bold text-slate-700">每科正確率</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {subjectStats.map((s) => (
            <div key={s.id} className="kid-card p-4 text-center">
              <p className="text-lg">
                {s.emoji} {s.name}
              </p>
              <p className="text-2xl font-extrabold text-sky-600">{s.rate === null ? '—' : `${s.rate}%`}</p>
              <p className="text-sm text-slate-400">{s.total} 題</p>
            </div>
          ))}
        </div>
      </section>

      {/* 最弱課題 */}
      <section className="mt-5">
        <h2 className="text-xl font-bold text-slate-700">最需要加強的課題</h2>
        {weakest.length === 0 ? (
          <p className="mt-2 text-slate-500">數據未夠(每個課題至少要答 3 題)</p>
        ) : (
          <div className="mt-2 space-y-2">
            {weakest.map((t) => (
              <div key={t.subject + t.topic} className="kid-card flex items-center justify-between px-4 py-3">
                <span>
                  {subjectName(t.subject)} · {t.topic}
                </span>
                <span className={`font-extrabold ${t.rate < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                  {t.rate}%({t.correct}/{t.total})
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 最近錯題 */}
      <section className="mt-5">
        <h2 className="text-xl font-bold text-slate-700">最近錯題(最多 20 條)</h2>
        {recentWrong.length === 0 ? (
          <p className="mt-2 text-slate-500">暫時冇錯題,好叻!</p>
        ) : (
          <div className="mt-2 space-y-2">
            {recentWrong.map((e, i) => (
              <div key={e.ts + '-' + i} className="kid-card px-4 py-3">
                <p className="font-bold text-slate-700">
                  [{subjectName(e.subject)} · {e.topic}] {e.question}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-red-500">他的答案:{e.userAnswer}</span>
                  <span className="ml-3 text-green-600">正確答案:{e.correctAnswer}</span>
                  <span className="ml-3 text-slate-400">{new Date(e.ts).toLocaleString('zh-HK')}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 重設進度 */}
      <section className="mt-8">
        {confirming ? (
          <div className="kid-card border-2 border-red-300 p-4">
            <p className="font-bold text-red-600">確定要重設?所有星星、進度同紀錄都會刪除,無法復原!</p>
            <div className="mt-3 flex gap-3">
              <button onClick={resetAll} className="kid-btn bg-red-500 px-6 py-2 text-lg text-white">
                確定重設
              </button>
              <button onClick={() => setConfirming(false)} className="kid-btn bg-slate-200 px-6 py-2 text-lg">
                取消
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="kid-btn bg-red-100 px-6 py-3 text-lg text-red-600">
            ⚠️ 重設所有進度
          </button>
        )}
      </section>
    </div>
  )
}
