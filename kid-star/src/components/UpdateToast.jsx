import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// 有新版本時彈出嘅提示掣:撳一下即刻更新,唔使教人手動 reload
export default function UpdateToast() {
  const [show, setShow] = useState(false)
  const updateRef = useRef(null)

  useEffect(() => {
    updateRef.current = registerSW({
      onNeedRefresh() {
        setShow(true)
      },
    })
  }, [])

  if (!show) return null
  return (
    <button
      onClick={() => updateRef.current && updateRef.current(true)}
      className="kid-btn fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-pop bg-sky-500 px-6 py-3 text-xl font-extrabold text-white shadow-xl"
    >
      🆕 有新嘢玩!撳一下更新 ⟳
    </button>
  )
}
