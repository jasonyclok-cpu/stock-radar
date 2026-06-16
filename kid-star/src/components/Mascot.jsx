// 吉祥物「小星」:CSS 畫嘅星星角色,跟住答題狀態做反應
export default function Mascot({ mood = 'idle', size = 80 }) {
  const face = { idle: '😊', happy: '🤩', sad: '😯', cheer: '🥳' }[mood] || '😊'
  const anim =
    mood === 'happy' || mood === 'cheer' ? 'animate-cheer' : mood === 'sad' ? '' : 'animate-floaty'
  // 每個吉祥物獨立漸變 id,避免多個同時出現時互相影響
  const gid = 'star-grad-' + size
  return (
    <div className={`relative inline-block ${anim}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-lg">
        <defs>
          <radialGradient id={gid} cx="42%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="45%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <polygon
          points="50,4 61,36 95,36 68,57 78,90 50,70 22,90 32,57 5,36 39,36"
          fill={`url(#${gid})`}
          stroke="#f59e0b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* 高光 */}
        <ellipse cx="38" cy="30" rx="9" ry="6" fill="#fffdf5" opacity="0.8" />
        {/* 粉紅腮 */}
        <circle cx="33" cy="50" r="5" fill="#fb7185" opacity="0.55" />
        <circle cx="67" cy="50" r="5" fill="#fb7185" opacity="0.55" />
      </svg>
      <span
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
        style={{ fontSize: size * 0.3 }}
      >
        {face}
      </span>
    </div>
  )
}
