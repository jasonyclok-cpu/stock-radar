// 專注力分析:讀取靜默記錄,計「近兩週趨勢」。只俾家長後台用。
// 比較最近 7 日(recent) vs 之前 7-14 日(prior),得出 進步/持平/退步 + 白話解讀。
const DAY = 86400000

const ageDays = (ts) => (Date.now() - ts) / DAY
const recentOf = (list) => list.filter((r) => ageDays(r.ts) < 7)
const priorOf = (list) => list.filter((r) => ageDays(r.ts) >= 7 && ageDays(r.ts) < 14)
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const num = (xs) => xs.filter((x) => x != null && !Number.isNaN(x))

// recent / prior 係數值(已聚合);lowerBetter:數值細係咪更好
function trend(recent, prior, lowerBetter) {
  if (recent == null) return { arrow: '—', tone: 'none' }
  if (prior == null) return { arrow: '🆕', tone: 'none' }
  const pct = Math.abs(recent - prior) / (Math.abs(prior) || 1)
  if (pct < 0.05) return { arrow: '→', tone: 'flat' }
  const better = lowerBetter ? recent < prior : recent > prior
  return better ? { arrow: '↑', tone: 'good' } : { arrow: '↓', tone: 'bad' }
}

function pctText(recent, prior, lowerBetter, unitGood, unitBad) {
  if (recent == null) return '仲未有紀錄,玩多幾次就睇到。'
  if (prior == null) return '啱啱開始記錄,再玩多幾日就有得比較。'
  const better = lowerBetter ? recent < prior : recent > prior
  const same = Math.abs(recent - prior) / (Math.abs(prior) || 1) < 0.05
  if (same) return '同上星期差唔多,保持得唔錯。'
  return better ? unitGood : unitBad
}

export function buildAnalysis(focus) {
  const reaction = focus.reaction || []
  const listen = focus.listen || []
  const sequence = focus.sequence || []
  const memory = focus.memory || []

  const out = []

  // 1. 平均反應時間(紅綠燈 avgMs,毫秒,越低越快)
  {
    const r = avg(num(recentOf(reaction).map((x) => x.avgMs)))
    const p = avg(num(priorOf(reaction).map((x) => x.avgMs)))
    out.push({
      label: '平均反應時間',
      value: r == null ? '—' : Math.round(r) + ' 毫秒',
      ...trend(r, p, true),
      text: pctText(r, p, true, '反應快咗,專注力提升緊 👍', '反應慢咗少少,可能攰咗或者分心。'),
      note: '來源:紅綠燈、舒爾特',
    })
  }

  // 2. 反應穩定度(反應時間波動 sdMs,越低越穩定)
  {
    const r = avg(num(recentOf(reaction).map((x) => x.sdMs)))
    const p = avg(num(priorOf(reaction).map((x) => x.sdMs)))
    out.push({
      label: '反應穩定度',
      value: r == null ? '—' : '±' + Math.round(r) + ' 毫秒',
      ...trend(r, p, true),
      text: pctText(r, p, true, '反應越嚟越穩定,唔會時快時慢 👍', '反應快慢差咗,專注力可能唔夠集中。'),
      note: '反應時間嘅波動程度',
    })
  }

  // 3. 持續力(同一回合後半段 vs 前半段反應變化,越細表示越捱得)
  {
    const diff = (arr) => num(arr.map((x) => (x.secondAvg != null && x.firstAvg != null ? x.secondAvg - x.firstAvg : null)))
    const r = avg(diff(recentOf(reaction)))
    const p = avg(diff(priorOf(reaction)))
    out.push({
      label: '持續力',
      value: r == null ? '—' : (r > 0 ? '後半慢 ' : '後半快 ') + Math.abs(Math.round(r)) + ' 毫秒',
      ...trend(r, p, true),
      text: pctText(r, p, true, '玩到後半段都keep到速度,持續力好 👍', '後半段慢咗,可能注意力撐唔耐,可縮短時間。'),
      note: '一回合前半 vs 後半',
    })
  }

  // 4. 抑制控制(唔應該撳嗰陣有冇撳:紅綠燈紅燈誤點 + 聽指令錯點率,越低越好)
  {
    const rate = (rArr, lArr) => {
      const vals = []
      rArr.forEach((x) => {
        const t = (x.hits || 0) + (x.falseTaps || 0)
        if (t) vals.push((x.falseTaps || 0) / t)
      })
      lArr.forEach((x) => {
        const t = (x.correct || 0) + (x.wrong || 0)
        if (t) vals.push((x.wrong || 0) / t)
      })
      return avg(vals)
    }
    const r = rate(recentOf(reaction), recentOf(listen))
    const p = rate(priorOf(reaction), priorOf(listen))
    out.push({
      label: '抑制控制',
      value: r == null ? '—' : Math.round(r * 100) + '% 誤觸',
      ...trend(r, p, true),
      text: pctText(r, p, true, '越嚟越忍到手、唔亂撳,自控力好 👍', '誤觸多咗,可能太心急,可提醒佢睇清楚先撳。'),
      note: '來源:紅綠燈、聽指令',
    })
  }

  // 5. 工作記憶廣度(接龍最長序列 / 翻牌最大格數,越高越好)
  {
    const maxOf = (arr) => {
      const xs = num(arr.map((x) => x.len))
      return xs.length ? Math.max(...xs) : null
    }
    const r = maxOf(recentOf(sequence))
    const p = maxOf(priorOf(sequence))
    const bestGrid = (memory || []).reduce((b, x) => (rank(x.grid) > rank(b) ? x.grid : b), '—')
    out.push({
      label: '工作記憶廣度',
      value: r == null ? '—' : r + ' 個',
      ...trend(r, p, false),
      text: pctText(r, p, false, '記得到嘅序列長咗,記憶力進步 👍', '序列短咗少少,可以慢慢嚟、由短開始。'),
      note: '翻牌最大格數:' + bestGrid,
    })
  }

  return out
}

function rank(g) {
  return { '4x4': 1, '4x5': 2 }[g] || 0
}
