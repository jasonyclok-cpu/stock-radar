import { useState } from 'react'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import MemoryMatch from './pages/MemoryMatch'
import MathGame from './pages/MathGame'
import SchulteTable from './games/SchulteTable'
import TrafficLight from './games/TrafficLight'
import MemoryFlipAdvanced from './games/MemoryFlipAdvanced'
import ParentDashboard from './pages/ParentDashboard'

export default function App() {
  // 簡單嘅畫面切換,唔使 router:{ name, ...params }
  // nonce 確保「再玩一次」同一關時 Quiz 會重新開始
  const [screen, setScreen] = useState({ name: 'home' })
  const go = (name, params = {}) => setScreen({ name, nonce: Date.now(), ...params })

  switch (screen.name) {
    case 'quiz':
      return (
        <Quiz
          key={screen.nonce}
          subject={screen.subject}
          grade={screen.grade}
          levelId={screen.levelId}
          go={go}
        />
      )
    case 'memory':
      return <MemoryMatch key={screen.nonce} go={go} />
    case 'mathgame':
      return <MathGame key={screen.nonce} go={go} />
    case 'schulte':
      return <SchulteTable key={screen.nonce} go={go} />
    case 'traffic':
      return <TrafficLight key={screen.nonce} go={go} />
    case 'memoryplus':
      return <MemoryFlipAdvanced key={screen.nonce} go={go} />
    case 'parent':
      return <ParentDashboard go={go} />
    default:
      return <Home go={go} toast={screen.toast} />
  }
}
