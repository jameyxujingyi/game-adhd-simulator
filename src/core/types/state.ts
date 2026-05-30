import type { BgColorId } from '../../data/level-01/quest-bg-select'
import type { ClickableComponentId } from '../../data/types'

export type GamePhase = 'ready' | 'playing' | 'ended'

export type EndResult = 'all-done' | 'incomplete'

export type SideQuestType = 'content-box-1-search' | 'content-box-2-search' | 'image-box-search'

export interface ActiveSideQuest {
  type: SideQuestType
  searchRevealed: boolean
}

export type MusicQuestPhase = 'icon' | 'album-modal' | 'playing'

export interface MusicQuestState {
  phase: MusicQuestPhase
}

export type PhoneMessageQuestPhase = 'incoming' | 'composing'

export interface PhoneMessageQuestState {
  phase: PhoneMessageQuestPhase
}

export type DistractionQuestPhase = 'laptop-search' | 'laptop-answer' | 'drift' | 'restore'

export type DriftedItemId = 'content-box-1' | 'content-box-2' | 'image-box'

export interface DistractionQuestState {
  phase: DistractionQuestPhase
  driftedItems: DriftedItemId[]
  restoredItems: DriftedItemId[]
  thought2Visible: boolean
}

export type ChoreQuestPhase =
  | 'mop'
  | 'mop-cooldown'
  | 'watering-prompt'
  | 'watering-drag'
  | 'watering-animation'

export interface ChoreQuestState {
  phase: ChoreQuestPhase
}

export interface ContentFallQuestState {
  fallenItems: DriftedItemId[]
  restoredItems: DriftedItemId[]
  fallStartedAt: number
}

export interface BgSelectQuestState {
  firstColor: BgColorId | null
  clickCount: number
  feedback: string | null
  successVisible: boolean
}

export interface GameState {
  phase: GamePhase
  remainingMs: number
  showStartModal: boolean
  endResult: EndResult | null
  lastClicked: ClickableComponentId | null
  activeSideQuest: ActiveSideQuest | null
  musicQuest: MusicQuestState | null
  phoneMessageQuest: PhoneMessageQuestState | null
  distractionQuest: DistractionQuestState | null
  choreQuest: ChoreQuestState | null
  contentFallQuest: ContentFallQuestState | null
  waterPuddleVisible: boolean
  completedTodos: ClickableComponentId[]
  filledContentBoxes: Partial<Record<'content-box-1' | 'content-box-2', string>>
  imageBoxFilled: boolean
  fontSelectModalOpen: boolean
  laptopFontHeiti: boolean
  bgSelectQuest: BgSelectQuestState | null
  laptopBgColor: BgColorId | null
}
