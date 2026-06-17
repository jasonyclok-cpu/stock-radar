import { useMemo, useRef, useState } from 'react'
import { getAnswerLog } from '../lib/progress'
import { getFocus } from '../lib/focus'
import { buildAnalysis } from '../lib/analysis'
import { clearAll, exportAll, importAll } from '../lib/storage'
import { SUBJECTS } from '../data/levels'

// 家長後台:喺主頁長按 logo 3 秒進入
export default function ParentDashboard({ go }) {
  const log = useMemo(() => getAnswerLog(), [])
  const focus = useMemo(() => getFocus(), [])
  const [confirming, setConfirming] = useState(false)
  const [tab, setTab] = useState('overview')
  const fileRef = useRef(null)

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `星星學園備份_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const doImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        if (importAll(JSON.parse(reader.result))) go('home', { toast: '備份已還原 ✅' })
        else alert('檔案格式唔啱')
      } catch {
        alert('讀取失敗')
      }
    }
    reader.readAsText(file)
  }

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

      {/* 分頁切換 */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTab('overview')}
          className={`kid-btn px-4 py-2 text-lg ${tab === 'overview' ? 'bg-sky-400 text-white' : 'bg-white text-sky-600'}`}
        >
          📚 學習總覽
        </button>
        <button
          onClick={() => setTab('analysis')}
          className={`kid-btn px-4 py-2 text-lg ${tab === 'analysis' ? 'bg-sky-400 text-white' : 'bg-white text-sky-600'}`}
        >
          🧠 專注力分析
        </button>
      </div>

      {tab === 'overview' && (
        <>
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
        </>
      )}

      {tab === 'analysis' && (
        <>
          <AnalysisSection focus={focus} />
          {/* 專注力訓練紀錄(只喺家長後台顯示,小朋友端唔會見到) */}
          <FocusSection focus={focus} />
        </>
      )}

      {/* 資料備份 / 匯入 */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-700">資料備份</h2>
        <p className="text-sm text-slate-400">所有資料只存喺呢部裝置。換機前可匯出備份,之後再匯入還原。</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button onClick={doExport} className="kid-btn bg-sky-100 px-5 py-2 text-lg text-sky-700">
            ⬇️ 匯出備份
          </button>
          <button onClick={() => fileRef.current?.click()} className="kid-btn bg-sky-100 px-5 py-2 text-lg text-sky-700">
            ⬆️ 匯入備份
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={doImport} className="hidden" />
        </div>
      </section>

      {/* 重設進度 */}
      <section className="mt-6">
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

// 專注力訓練統計:完成時間、反應時間、誤點等(供家長分析,小朋友端從不顯示)
function FocusSection({ focus }) {
  const schulte = focus.schulte || []
  const reaction = focus.reaction || []
  const memory = focus.memory || []

  const bestBySize = {}
  schulte.forEach((r) => {
    if (!bestBySize[r.size] || r.ms < bestBySize[r.size]) bestBySize[r.size] = r.ms
  })
  const lastReaction = reaction[reaction.length - 1]
  const bestMemoryGrid = memory.reduce((b, r) => (gridRank(r.grid) > gridRank(b) ? r.grid : b), '—')

  const listen = focus.listen || []
  const sequence = focus.sequence || []
  const lastListen = listen[listen.length - 1]
  const listenAcc =
    lastListen && lastListen.correct + lastListen.wrong > 0
      ? Math.round((lastListen.correct / (lastListen.correct + lastListen.wrong)) * 100)
      : null
  const bestSeq = sequence.reduce((m, r) => Math.max(m, r.len || 0), 0)

  const fmt = (ms) => (ms == null ? '—' : (ms / 1000).toFixed(1) + ' 秒')

  const empty = !schulte.length && !reaction.length && !memory.length && !listen.length && !sequence.length

  return (
    <section className="mt-5">
      <h2 className="text-xl font-bold text-slate-700">專注力訓練紀錄</h2>
      <p className="text-sm text-slate-400">小朋友端只當闖關遊戲,以下數據只供你參考。</p>
      {empty ? (
        <p className="mt-2 text-slate-500">仲未有紀錄,玩過專注力遊戲就會出現。</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="kid-card p-4">
            <p className="font-bold text-sky-700">🔢 數字快搜(最快完成)</p>
            <p className="mt-1 text-sm text-slate-600">3×3:{fmt(bestBySize[3])}</p>
            <p className="text-sm text-slate-600">4×4:{fmt(bestBySize[4])}</p>
            <p className="text-sm text-slate-600">5×5:{fmt(bestBySize[5])}</p>
            <p className="mt-1 text-xs text-slate-400">共玩 {schulte.length} 次</p>
          </div>
          <div className="kid-card p-4">
            <p className="font-bold text-sky-700">🚦 紅綠燈(最近一次)</p>
            <p className="mt-1 text-sm text-slate-600">
              平均反應:{lastReaction && lastReaction.avgMs != null ? lastReaction.avgMs + ' 毫秒' : '—'}
            </p>
            <p className="text-sm text-slate-600">綠燈成功:{lastReaction ? lastReaction.hits : '—'} 次</p>
            <p className="text-sm text-slate-600">紅燈誤點:{lastReaction ? lastReaction.falseTaps : '—'} 次</p>
            <p className="mt-1 text-xs text-slate-400">共玩 {reaction.length} 次</p>
          </div>
          <div className="kid-card p-4">
            <p className="font-bold text-sky-700">🧠 記憶翻牌</p>
            <p className="mt-1 text-sm text-slate-600">最大完成格數:{bestMemoryGrid}</p>
            <p className="mt-1 text-xs text-slate-400">共玩 {memory.length} 次</p>
          </div>
          <div className="kid-card p-4">
            <p className="font-bold text-sky-700">👂 聽指令(最近一次)</p>
            <p className="mt-1 text-sm text-slate-600">正確率:{listenAcc == null ? '—' : listenAcc + '%'}</p>
            <p className="text-sm text-slate-600">錯點:{lastListen ? lastListen.wrong : '—'} 次</p>
            <p className="mt-1 text-xs text-slate-400">共玩 {listen.length} 次</p>
          </div>
          <div className="kid-card p-4">
            <p className="font-bold text-sky-700">🎶 圖案接龍</p>
            <p className="mt-1 text-sm text-slate-600">最長序列:{bestSeq || '—'} 個</p>
            <p className="mt-1 text-xs text-slate-400">共玩 {sequence.length} 次</p>
          </div>
        </div>
      )}
    </section>
  )
}

function gridRank(g) {
  return { '4x4': 1, '4x5': 2 }[g] || 0
}

// 專注力分析:五大指標嘅近兩週趨勢(箭咀 + 白話解讀)
function AnalysisSection({ focus }) {
  const items = buildAnalysis(focus)
  const toneCls = {
    good: 'text-green-600',
    bad: 'text-rose-500',
    flat: 'text-slate-500',
    none: 'text-slate-400',
  }
  return (
    <section className="mt-5">
      <h2 className="text-xl font-bold text-slate-700">專注力分析(近兩週趨勢)</h2>
      <p className="text-sm text-slate-400">
        比較最近 7 日 vs 之前 7 日。↑ 進步、→ 持平、↓ 退步、🆕 啱開始記錄。小朋友端睇唔到。
      </p>
      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="kid-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-700">{it.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-600">{it.value}</span>
                <span className={`text-2xl font-extrabold ${toneCls[it.tone] || ''}`}>{it.arrow}</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{it.text}</p>
            <p className="mt-0.5 text-xs text-slate-400">{it.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
