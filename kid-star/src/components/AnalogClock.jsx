// 指針時鐘(SVG):睇時鐘題用真鐘面,似返學校考卷。
// parseClockTime 由題目文字自動解析時間,唔使改題庫。

export function parseClockTime(text) {
  // 「時針指住 3,分針指住 12」→ 3:00
  let m = text.match(/時針指住\s*(\d+).*分針指住\s*12/)
  if (m) return { h: +m[1], m: 0 }
  // 「分針指住 6,時針在 4 和 5 中間」→ 4:30
  m = text.match(/分針指住\s*6.*時針在\s*(\d+)\s*和/)
  if (m) return { h: +m[1], m: 30 }
  // 「現在是 6 時半 / 10 時正」→ 6:30 / 10:00
  m = text.match(/現在是\s*(\d+)\s*時(正|半)/)
  if (m) return { h: +m[1], m: m[2] === '半' ? 30 : 0 }
  return null
}

export default function AnalogClock({ h, m, size = 150 }) {
  const cx = 50
  const cy = 50
  const hourAngle = ((h % 12) * 30 + m * 0.5 - 90) * (Math.PI / 180)
  const minAngle = (m * 6 - 90) * (Math.PI / 180)
  const numbers = [...Array(12)].map((_, i) => {
    const n = i + 1
    const a = (n * 30 - 90) * (Math.PI / 180)
    return { n, x: cx + 38 * Math.cos(a), y: cy + 38 * Math.sin(a) }
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="drop-shadow-md">
      {/* 錶面 */}
      <circle cx={cx} cy={cy} r="47" fill="#fffbeb" stroke="#f59e0b" strokeWidth="4" />
      {/* 數字 */}
      {numbers.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fontWeight="bold"
          fill="#1e3a5f"
        >
          {n}
        </text>
      ))}
      {/* 時針(短粗) */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + 20 * Math.cos(hourAngle)}
        y2={cy + 20 * Math.sin(hourAngle)}
        stroke="#0369a1"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* 分針(長幼) */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + 30 * Math.cos(minAngle)}
        y2={cy + 30 * Math.sin(minAngle)}
        stroke="#f43f5e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill="#1e3a5f" />
    </svg>
  )
}
