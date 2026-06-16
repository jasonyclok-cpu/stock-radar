// 全螢幕裝飾層:識郁嘅雲同閃爍嘅星星,放喺所有內容後面
const CLOUDS = [
  { top: '8%', left: '4%', size: 64, delay: '0s' },
  { top: '14%', right: '8%', size: 88, delay: '1.2s' },
  { top: '40%', left: '-2%', size: 72, delay: '0.5s' },
  { top: '62%', right: '2%', size: 80, delay: '2s' },
]
const STARS = [
  { top: '22%', left: '20%', size: 22, delay: '0s' },
  { top: '12%', left: '52%', size: 16, delay: '0.6s' },
  { top: '34%', right: '18%', size: 20, delay: '1.1s' },
  { top: '54%', left: '12%', size: 18, delay: '0.3s' },
  { top: '70%', left: '46%', size: 22, delay: '1.6s' },
  { top: '48%', right: '30%', size: 14, delay: '0.9s' },
]

export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {CLOUDS.map((c, i) => (
        <span
          key={'c' + i}
          className="absolute anim-drift select-none opacity-90"
          style={{ ...c, fontSize: c.size, animationDelay: c.delay }}
        >
          ☁️
        </span>
      ))}
      {STARS.map((s, i) => (
        <span
          key={'s' + i}
          className="absolute anim-twinkle select-none"
          style={{ ...s, fontSize: s.size, animationDelay: s.delay }}
        >
          ✨
        </span>
      ))}
    </div>
  )
}
