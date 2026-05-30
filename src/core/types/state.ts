import type { ClickableComponentId } from '../../data/types'

export type GameScene = 'playing'

export interface GameState {
  scene: GameScene
  remainingMs: number
  lastClicked: ClickableComponentId | null
}
