import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createGameRuntime, type GameAction, type GameRuntime } from '../../core/game-runtime'
import type { GameState } from '../../core/types/state'

interface GameContextValue {
  state: GameState
  dispatch: (action: GameAction) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const runtime = useMemo(() => createGameRuntime(), [])
  const [state, setState] = useState<GameState>(() => runtime.getState())

  useEffect(() => runtime.subscribe(setState), [runtime])

  const value = useMemo(
    () => ({
      state,
      dispatch: (action: GameAction) => runtime.dispatch(action),
    }),
    [runtime, state],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider')
  }
  return ctx
}

export type { GameRuntime }
