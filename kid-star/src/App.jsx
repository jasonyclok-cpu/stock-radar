import { useState } from 'react'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import ParentDashboard from './pages/ParentDashboard'
import MemoryMatch from './pages/MemoryMatch'
import MathGame from './pages/MathGame'
import SchulteTable from './games/SchulteTable'
import TrafficLight from './games/TrafficLight'
import MemoryFlipAdvanced from './games/MemoryFlipAdvanced'
import ListenAndDo from './games/ListenAndDo'
import SequenceRecall from './games/SequenceRecall'
import SpotDifference from './games/SpotDifference'
import Maze from './games/Maze'
import ArcadeQuiz from './games/ArcadeQuiz'
import TrueFalse from './games/TrueFalse'
import MakeTen from './games/MakeTen'
import { findGame } from './games/registry'

// 有獨立元件嘅遊戲(arcade 類唔使,統一用 ArcadeQuiz)
const SPECIFIC = {
  mathgame: MathGame,
  memory: MemoryMatch,
  truefalse: TrueFalse,
  maketen: MakeTen,
  schulte: SchulteTable,
  traffic: TrafficLight,
  memoryplus: MemoryFlipAdvanced,
  listen: ListenAndDo,
  sequence: SequenceRecall,
  spot: SpotDifference,
  maze: Maze,
}

export default function App() {
  // 簡單畫面切換;nonce 確保「再玩一次」會重新開始
  const [screen, setScreen] = useState({ name: 'home' })
  const go = (name, params = {}) => setScreen({ name, nonce: Date.now(), ...params })

  if (screen.name === 'quiz')
    return <Quiz key={screen.nonce} subject={screen.subject} grade={screen.grade} levelId={screen.levelId} go={go} />
  if (screen.name === 'parent') return <ParentDashboard go={go} />

  const game = findGame(screen.name)
  if (game) {
    if (game.arcade)
      return <ArcadeQuiz key={screen.nonce} go={go} config={game.arcade} reward={game.cost === 0} />
    const C = SPECIFIC[game.id]
    if (C) return <C key={screen.nonce} go={go} />
  }

  return <Home go={go} toast={screen.toast} />
}
