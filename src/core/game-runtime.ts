import type { ClickableComponentId } from '../data/types'
import type { GameState } from './types/state'

export type GameAction =
  | { type: 'CLICK_COMPONENT'; componentId: ClickableComponentId }
  | { type: 'EXIT' }

type Listener = (state: GameState) => void

const INITIAL_REMAINING_MS = 59_000

export class GameRuntime {
  private state: GameState = {
    scene: 'playing',
    remainingMs: INITIAL_REMAINING_MS,
    lastClicked: null,
  }

  private listeners = new Set<Listener>()

  getState(): GameState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispatch(action: GameAction): void {
    switch (action.type) {
      case 'CLICK_COMPONENT':
        this.state = { ...this.state, lastClicked: action.componentId }
        break
      case 'EXIT':
        break
    }
    this.notify()
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

export function createGameRuntime(): GameRuntime {
  return new GameRuntime()
}
