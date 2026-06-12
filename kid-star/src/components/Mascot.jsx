// 吉祥物「小星」:CSS 畫嘅星星角色,跟住答題狀態做反應
export default function Mascot({ mood = 'idle', size = 80 }) {
  const face = { idle: '😊', happy: '🤩', sad: '😯', cheer: '🥳' }[mood] || '😊'
  const anim =
    mood === 'happy' || mood === 'cheer' ? 'animate-cheer' : mood === 'sad' ? '' : 'animate-floaty'
  return (
    <div className={`relative inline-block ${anim}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-md">
        <polygon
          points="50,4 61,36 95,36 68,57 78,90 50,70 22,90 32,57 5,36 39,36"
          fill="#facc15"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
        style={{ fontSize: size * 0.32 }}
      >
        {face}
      </span>
    </div>
  )
}
