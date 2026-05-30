import type { ClickableComponentId } from '../data/types'
import { CONTENT_BOX_1_ANSWER } from '../data/level-01/quest-01'
import { MUSIC_QUEST_DELAY_MS } from '../data/level-01/quest-02-music'
import type { GameState } from './types/state'

export type GameAction =
  | { type: 'START' }
  | { type: 'CLICK_COMPONENT'; componentId: ClickableComponentId }
  | { type: 'REVEAL_SEARCH_ANSWER' }
  | { type: 'COMPLETE_CONTENT_BOX_1' }
  | { type: 'CLICK_MUSIC_ICON' }
  | { type: 'SELECT_MUSIC_ALBUM' }
  | { type: 'EXIT' }

type Listener = (state: GameState) => void

export const LEVEL_DURATION_MS = 60_000

const CONTENT_BOX_1_TRIGGERS: ClickableComponentId[] = ['content-box-1', 'todo-content-box-1']

export class GameRuntime {
  private state: GameState = {
    phase: 'ready',
    remainingMs: LEVEL_DURATION_MS,
    lastClicked: null,
    activeSideQuest: null,
    musicQuest: null,
    completedTodos: [],
    filledContentBoxes: {},
  }

  private listeners = new Set<Listener>()
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private musicQuestTimer: ReturnType<typeof setTimeout> | null = null

  getState(): GameState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispatch(action: GameAction): void {
    switch (action.type) {
      case 'START':
        if (this.state.phase !== 'ready') break
        this.state = {
          ...this.state,
          phase: 'playing',
          remainingMs: LEVEL_DURATION_MS,
        }
        this.startTicking()
        break
      case 'CLICK_COMPONENT':
        this.handleComponentClick(action.componentId)
        break
      case 'REVEAL_SEARCH_ANSWER':
        if (this.state.activeSideQuest?.type !== 'content-box-1-search') break
        if (this.state.activeSideQuest.searchRevealed) break
        this.state = {
          ...this.state,
          activeSideQuest: {
            ...this.state.activeSideQuest,
            searchRevealed: true,
          },
        }
        break
      case 'COMPLETE_CONTENT_BOX_1':
        if (this.state.activeSideQuest?.type !== 'content-box-1-search') break
        this.state = {
          ...this.state,
          activeSideQuest: null,
          completedTodos: this.state.completedTodos.includes('todo-content-box-1')
            ? this.state.completedTodos
            : [...this.state.completedTodos, 'todo-content-box-1'],
          filledContentBoxes: {
            ...this.state.filledContentBoxes,
            'content-box-1': CONTENT_BOX_1_ANSWER,
          },
        }
        this.scheduleMusicQuest()
        break
      case 'CLICK_MUSIC_ICON':
        if (this.state.musicQuest?.phase !== 'icon') break
        this.state = {
          ...this.state,
          musicQuest: { phase: 'album-modal' },
        }
        break
      case 'SELECT_MUSIC_ALBUM':
        if (this.state.musicQuest?.phase !== 'album-modal') break
        this.state = {
          ...this.state,
          musicQuest: { phase: 'playing' },
        }
        break
      case 'EXIT':
        this.stopTicking()
        this.clearMusicQuestTimer()
        break
    }
    this.notify()
  }

  private handleComponentClick(componentId: ClickableComponentId): void {
    if (this.state.phase !== 'playing') return
    if (this.isMusicQuestBlocking()) return

    const contentBox1Done = this.state.completedTodos.includes('todo-content-box-1')

    if (
      CONTENT_BOX_1_TRIGGERS.includes(componentId) &&
      !contentBox1Done &&
      this.state.activeSideQuest === null
    ) {
      this.state = {
        ...this.state,
        lastClicked: componentId,
        activeSideQuest: { type: 'content-box-1-search', searchRevealed: false },
      }
      return
    }

    if (this.state.activeSideQuest !== null) return

    this.state = { ...this.state, lastClicked: componentId }
  }

  private isMusicQuestBlocking(): boolean {
    const phase = this.state.musicQuest?.phase
    return phase === 'icon' || phase === 'album-modal'
  }

  private scheduleMusicQuest(): void {
    this.clearMusicQuestTimer()
    this.musicQuestTimer = setTimeout(() => {
      if (this.state.phase !== 'playing') return
      if (this.state.musicQuest !== null) return
      this.state = {
        ...this.state,
        musicQuest: { phase: 'icon' },
      }
      this.notify()
    }, MUSIC_QUEST_DELAY_MS)
  }

  private clearMusicQuestTimer(): void {
    if (this.musicQuestTimer !== null) {
      clearTimeout(this.musicQuestTimer)
      this.musicQuestTimer = null
    }
  }

  private startTicking(): void {
    this.stopTicking()
    this.tickTimer = setInterval(() => {
      const nextMs = this.state.remainingMs - 1000
      if (nextMs <= 0) {
        this.state = { ...this.state, remainingMs: 0, phase: 'ended' }
        this.stopTicking()
      } else {
        this.state = { ...this.state, remainingMs: nextMs }
      }
      this.notify()
    }, 1000)
  }

  private stopTicking(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
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
