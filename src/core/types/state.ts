import type { ClickableComponentId } from '../../data/types'

export type GamePhase = 'ready' | 'playing' | 'ended'

export type SideQuestType = 'content-box-1-search'

export interface ActiveSideQuest {
  type: SideQuestType
  searchRevealed: boolean
}

export type MusicQuestPhase = 'icon' | 'album-modal' | 'playing'

export interface MusicQuestState {
  phase: MusicQuestPhase
}

export interface GameState {
  phase: GamePhase
  remainingMs: number
  lastClicked: ClickableComponentId | null
  activeSideQuest: ActiveSideQuest | null
  musicQuest: MusicQuestState | null
  completedTodos: ClickableComponentId[]
  filledContentBoxes: Partial<Record<'content-box-1' | 'content-box-2', string>>
}
