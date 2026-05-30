import type { ClickableComponentId } from '../data/types'
import { areAllTodosComplete } from '../data/types'
import { CONTENT_BOX_1_ANSWER } from '../data/level-01/quest-01'
import { CONTENT_BOX_2_ANSWER } from '../data/level-01/quest-content-box-2'
import { MUSIC_QUEST_DELAY_MS } from '../data/level-01/quest-02-music'
import { PHONE_MESSAGE_DELAY_MS } from '../data/level-01/quest-phone-message'
import {
  DISTRACTION_ANSWER_MS,
  DISTRACTION_QUEST_DELAY_MS,
} from '../data/level-01/quest-distraction'
import {
  BG_SELECT_FEEDBACK_1,
  BG_SELECT_FEEDBACK_2,
  BG_SELECT_FEEDBACK_3,
  BG_SELECT_SUCCESS,
  type BgColorId,
} from '../data/level-01/quest-bg-select'
import {
  CHORE_QUEST_DELAY_MS,
  WATERING_ANIMATION_MS,
  WATERING_PROMPT_DELAY_MS,
} from '../data/level-01/quest-chore'
import type { DriftedItemId, GameState } from './types/state'

export type GameAction =
  | { type: 'START' }
  | { type: 'CLICK_COMPONENT'; componentId: ClickableComponentId }
  | { type: 'REVEAL_SEARCH_ANSWER' }
  | { type: 'COMPLETE_CONTENT_BOX_1' }
  | { type: 'COMPLETE_CONTENT_BOX_2' }
  | { type: 'COMPLETE_IMAGE_BOX' }
  | { type: 'OPEN_PHONE_REPLY' }
  | { type: 'SEND_PHONE_MESSAGE' }
  | { type: 'CLICK_MUSIC_ICON' }
  | { type: 'SELECT_MUSIC_ALBUM' }
  | { type: 'SELECT_LAPTOP_FONT' }
  | { type: 'SELECT_BG_COLOR'; colorId: BgColorId }
  | { type: 'DISMISS_BG_SELECT_SUCCESS' }
  | { type: 'REVEAL_DISTRACTION_SEARCH' }
  | { type: 'DISMISS_DISTRACTION_THOUGHT' }
  | { type: 'RESTORE_DRIFTED_ITEM'; itemId: DriftedItemId }
  | { type: 'COMPLETE_MOP_QUEST' }
  | { type: 'CHORE_WATERING_ACCEPT' }
  | { type: 'CHORE_WATERING_DECLINE' }
  | { type: 'COMPLETE_WATERING_QUEST' }
  | { type: 'RESTORE_FALLEN_ITEM'; itemId: DriftedItemId }
  | { type: 'END_GAME_HOME' }
  | { type: 'END_GAME_RETRY' }

type Listener = (state: GameState) => void

export const LEVEL_DURATION_MS = 60_000

const CONTENT_BOX_1_TRIGGERS: ClickableComponentId[] = ['content-box-1', 'todo-content-box-1']
const CONTENT_BOX_2_TRIGGERS: ClickableComponentId[] = ['content-box-2', 'todo-content-box-2']
const IMAGE_BOX_TRIGGERS: ClickableComponentId[] = ['image-box', 'todo-image-box']

export class GameRuntime {
  private state: GameState

  constructor() {
    this.state = this.createInitialState(true)
  }

  private createInitialState(showStartModal: boolean): GameState {
    return {
      phase: 'ready',
      remainingMs: LEVEL_DURATION_MS,
      showStartModal,
      endResult: null,
      lastClicked: null,
      activeSideQuest: null,
      musicQuest: null,
      phoneMessageQuest: null,
      distractionQuest: null,
      choreQuest: null,
      contentFallQuest: null,
      waterPuddleVisible: true,
      completedTodos: [],
      filledContentBoxes: {},
      imageBoxFilled: false,
      fontSelectModalOpen: false,
      laptopFontHeiti: false,
      bgSelectQuest: null,
      laptopBgColor: null,
    }
  }

  private listeners = new Set<Listener>()
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private musicQuestTimer: ReturnType<typeof setTimeout> | null = null
  private phoneMessageTimer: ReturnType<typeof setTimeout> | null = null
  private distractionQuestTimer: ReturnType<typeof setTimeout> | null = null
  private distractionAnswerTimer: ReturnType<typeof setTimeout> | null = null
  private choreQuestTimer: ReturnType<typeof setTimeout> | null = null
  private wateringPromptTimer: ReturnType<typeof setTimeout> | null = null
  private wateringAnimationTimer: ReturnType<typeof setTimeout> | null = null

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
      case 'REVEAL_SEARCH_ANSWER': {
        if (this.state.activeSideQuest === null) break
        if (this.state.activeSideQuest.searchRevealed) break
        const questType = this.state.activeSideQuest.type
        this.state = {
          ...this.state,
          activeSideQuest: {
            ...this.state.activeSideQuest,
            searchRevealed: true,
          },
        }
        if (questType === 'content-box-2-search') {
          this.schedulePhoneMessageQuest()
        }
        break
      }
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
        this.maybeCompleteGameFromTodos()
        break
      case 'COMPLETE_CONTENT_BOX_2':
        if (this.state.activeSideQuest?.type !== 'content-box-2-search') break
        this.state = {
          ...this.state,
          activeSideQuest: null,
          completedTodos: this.state.completedTodos.includes('todo-content-box-2')
            ? this.state.completedTodos
            : [...this.state.completedTodos, 'todo-content-box-2'],
          filledContentBoxes: {
            ...this.state.filledContentBoxes,
            'content-box-2': CONTENT_BOX_2_ANSWER,
          },
        }
        this.maybeCompleteGameFromTodos()
        break
      case 'COMPLETE_IMAGE_BOX':
        if (this.state.activeSideQuest?.type !== 'image-box-search') break
        this.state = {
          ...this.state,
          activeSideQuest: null,
          imageBoxFilled: true,
          completedTodos: this.state.completedTodos.includes('todo-image-box')
            ? this.state.completedTodos
            : [...this.state.completedTodos, 'todo-image-box'],
        }
        this.maybeCompleteGameFromTodos()
        break
      case 'OPEN_PHONE_REPLY':
        if (this.state.phoneMessageQuest?.phase !== 'incoming') break
        this.state = {
          ...this.state,
          phoneMessageQuest: { phase: 'composing' },
        }
        break
      case 'SEND_PHONE_MESSAGE':
        if (this.state.phoneMessageQuest?.phase !== 'composing') break
        this.state = {
          ...this.state,
          phoneMessageQuest: null,
        }
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
      case 'SELECT_LAPTOP_FONT':
        if (!this.state.fontSelectModalOpen) break
        this.state = {
          ...this.state,
          fontSelectModalOpen: false,
          laptopFontHeiti: true,
          completedTodos: this.state.completedTodos.includes('todo-select-font')
            ? this.state.completedTodos
            : [...this.state.completedTodos, 'todo-select-font'],
        }
        this.scheduleDistractionQuest()
        this.maybeCompleteGameFromTodos()
        break
      case 'SELECT_BG_COLOR': {
        const quest = this.state.bgSelectQuest
        if (!quest || quest.successVisible) break
        const clickCount = quest.clickCount + 1
        const colorId = action.colorId

        if (clickCount <= 3) {
          const firstColor = clickCount === 1 ? colorId : quest.firstColor
          const feedback =
            clickCount === 1
              ? BG_SELECT_FEEDBACK_1
              : clickCount === 2
                ? BG_SELECT_FEEDBACK_2
                : BG_SELECT_FEEDBACK_3
          this.state = {
            ...this.state,
            laptopBgColor: colorId,
            bgSelectQuest: {
              firstColor,
              clickCount,
              feedback,
              successVisible: false,
            },
          }
          break
        }

        if (colorId !== quest.firstColor) {
          this.state = {
            ...this.state,
            laptopBgColor: colorId,
          }
          break
        }

        this.state = {
          ...this.state,
          laptopBgColor: colorId,
          bgSelectQuest: {
            ...quest,
            clickCount,
            feedback: BG_SELECT_SUCCESS,
            successVisible: true,
          },
          completedTodos: this.state.completedTodos.includes('todo-select-bg-color')
            ? this.state.completedTodos
            : [...this.state.completedTodos, 'todo-select-bg-color'],
        }
        this.maybeCompleteGameFromTodos()
        break
      }
      case 'DISMISS_BG_SELECT_SUCCESS':
        if (!this.state.bgSelectQuest?.successVisible) break
        this.state = {
          ...this.state,
          bgSelectQuest: null,
        }
        break
      case 'REVEAL_DISTRACTION_SEARCH':
        if (this.state.distractionQuest?.phase !== 'laptop-search') break
        {
          const driftedItems = this.collectDriftedItems()
          if (driftedItems.length === 0) {
            this.state = { ...this.state, distractionQuest: null }
            break
          }
          this.state = {
            ...this.state,
            distractionQuest: {
              ...this.state.distractionQuest,
              phase: 'laptop-answer',
              driftedItems,
            },
          }
          this.scheduleDistractionAnswer()
        }
        break
      case 'DISMISS_DISTRACTION_THOUGHT':
        if (!this.state.distractionQuest?.thought2Visible) break
        this.state = {
          ...this.state,
          distractionQuest: {
            ...this.state.distractionQuest,
            phase: 'restore',
            thought2Visible: false,
          },
        }
        break
      case 'RESTORE_DRIFTED_ITEM': {
        const quest = this.state.distractionQuest
        if (!quest || quest.phase !== 'restore') break
        if (!quest.driftedItems.includes(action.itemId)) break
        if (quest.restoredItems.includes(action.itemId)) break
        const restoredItems = [...quest.restoredItems, action.itemId]
        const allRestored = quest.driftedItems.every((id) => restoredItems.includes(id))
        this.state = {
          ...this.state,
          distractionQuest: allRestored
            ? null
            : {
                ...quest,
                restoredItems,
              },
        }
        if (allRestored) {
          this.scheduleChoreQuest()
        }
        break
      }
      case 'COMPLETE_MOP_QUEST':
        if (this.state.choreQuest?.phase !== 'mop') break
        this.state = {
          ...this.state,
          waterPuddleVisible: false,
          choreQuest: {
            phase: 'mop-cooldown',
          },
        }
        this.scheduleWateringPrompt()
        break
      case 'CHORE_WATERING_ACCEPT':
        if (this.state.choreQuest?.phase !== 'watering-prompt') break
        this.state = {
          ...this.state,
          choreQuest: {
            ...this.state.choreQuest!,
            phase: 'watering-drag',
          },
        }
        break
      case 'CHORE_WATERING_DECLINE':
        if (this.state.choreQuest?.phase !== 'watering-prompt') break
        this.state = { ...this.state, choreQuest: null }
        break
      case 'COMPLETE_WATERING_QUEST':
        if (this.state.choreQuest?.phase !== 'watering-drag') break
        this.state = {
          ...this.state,
          choreQuest: {
            ...this.state.choreQuest,
            phase: 'watering-animation',
          },
        }
        this.scheduleWateringAnimation()
        break
      case 'RESTORE_FALLEN_ITEM': {
        const fallQuest = this.state.contentFallQuest
        if (!fallQuest) break
        if (!fallQuest.fallenItems.includes(action.itemId)) break
        if (fallQuest.restoredItems.includes(action.itemId)) break
        const restoredItems = [...fallQuest.restoredItems, action.itemId]
        const allFallRestored = fallQuest.fallenItems.every((id) => restoredItems.includes(id))
        this.state = {
          ...this.state,
          contentFallQuest: allFallRestored
            ? null
            : {
                ...fallQuest,
                restoredItems,
              },
        }
        break
      }
      case 'END_GAME_HOME':
        this.resetGame(false)
        break
      case 'END_GAME_RETRY':
        this.resetGame(true)
        break
    }
    this.notify()
  }

  private resetGame(showStartModal: boolean): void {
    this.stopTicking()
    this.clearAllTimers()
    this.state = this.createInitialState(showStartModal)
  }

  private clearAllTimers(): void {
    this.clearMusicQuestTimer()
    this.clearPhoneMessageTimer()
    this.clearDistractionTimers()
    this.clearChoreTimers()
  }

  private maybeCompleteGameFromTodos(): void {
    if (this.state.phase !== 'playing') return
    if (!areAllTodosComplete(this.state.completedTodos)) return
    this.endGame(true)
  }

  private endGame(allDone: boolean): void {
    if (this.state.phase !== 'playing') return
    this.stopTicking()
    this.clearAllTimers()
    this.state = {
      ...this.state,
      phase: 'ended',
      remainingMs: 0,
      endResult: allDone ? 'all-done' : 'incomplete',
    }
  }

  private handleComponentClick(componentId: ClickableComponentId): void {
    if (this.state.phase !== 'playing') return
    if (this.isMusicQuestBlocking()) return
    if (this.isPhoneMessageQuestBlocking()) return
    if (this.isDistractionQuestBlocking()) return
    if (this.isChoreQuestBlocking()) return
    if (this.isContentFallQuestBlocking()) return
    if (this.isBgSelectQuestBlocking()) return

    const contentBox1Done = this.state.completedTodos.includes('todo-content-box-1')
    const contentBox2Done = this.state.completedTodos.includes('todo-content-box-2')
    const imageBoxDone = this.state.completedTodos.includes('todo-image-box')
    const fontSelectDone = this.state.completedTodos.includes('todo-select-font')
    const bgSelectDone = this.state.completedTodos.includes('todo-select-bg-color')

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

    if (
      CONTENT_BOX_2_TRIGGERS.includes(componentId) &&
      !contentBox2Done &&
      this.state.activeSideQuest === null
    ) {
      this.state = {
        ...this.state,
        lastClicked: componentId,
        activeSideQuest: { type: 'content-box-2-search', searchRevealed: false },
      }
      return
    }

    if (
      IMAGE_BOX_TRIGGERS.includes(componentId) &&
      !imageBoxDone &&
      this.state.activeSideQuest === null
    ) {
      this.state = {
        ...this.state,
        lastClicked: componentId,
        activeSideQuest: { type: 'image-box-search', searchRevealed: false },
      }
      return
    }

    if (
      componentId === 'todo-select-font' &&
      !fontSelectDone &&
      !this.state.fontSelectModalOpen &&
      this.state.activeSideQuest === null
    ) {
      this.state = {
        ...this.state,
        lastClicked: componentId,
        fontSelectModalOpen: true,
      }
      return
    }

    if (
      componentId === 'todo-select-bg-color' &&
      !bgSelectDone &&
      this.state.bgSelectQuest === null &&
      this.state.activeSideQuest === null
    ) {
      this.state = {
        ...this.state,
        lastClicked: componentId,
        bgSelectQuest: {
          firstColor: null,
          clickCount: 0,
          feedback: null,
          successVisible: false,
        },
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

  private isPhoneMessageQuestBlocking(): boolean {
    return this.state.phoneMessageQuest !== null
  }

  private isDistractionQuestBlocking(): boolean {
    return this.state.distractionQuest !== null
  }

  private isChoreQuestBlocking(): boolean {
    return this.state.choreQuest !== null
  }

  private isContentFallQuestBlocking(): boolean {
    return this.state.contentFallQuest !== null
  }

  private isBgSelectQuestBlocking(): boolean {
    return this.state.bgSelectQuest !== null
  }

  private scheduleChoreQuest(): void {
    this.clearChoreQuestTimer()
    this.choreQuestTimer = setTimeout(() => {
      if (this.state.phase !== 'playing') return
      if (this.state.choreQuest !== null) return
      if (this.state.contentFallQuest !== null) return
      this.state = {
        ...this.state,
        choreQuest: {
          phase: 'mop',
        },
      }
      this.notify()
    }, CHORE_QUEST_DELAY_MS)
  }

  private scheduleWateringPrompt(): void {
    this.clearWateringPromptTimer()
    this.wateringPromptTimer = setTimeout(() => {
      if (this.state.choreQuest?.phase !== 'mop-cooldown') return
      this.state = {
        ...this.state,
        choreQuest: {
          phase: 'watering-prompt',
        },
      }
      this.startContentFallQuest()
      this.notify()
    }, WATERING_PROMPT_DELAY_MS)
  }

  private scheduleWateringAnimation(): void {
    this.clearWateringAnimationTimer()
    this.wateringAnimationTimer = setTimeout(() => {
      if (this.state.choreQuest?.phase !== 'watering-animation') return
      this.state = { ...this.state, choreQuest: null }
      this.notify()
    }, WATERING_ANIMATION_MS)
  }

  private startContentFallQuest(): void {
    if (this.state.contentFallQuest !== null) return
    const fallenItems = this.collectDriftedItems()
    if (fallenItems.length === 0) return
    this.state = {
      ...this.state,
      contentFallQuest: {
        fallenItems,
        restoredItems: [],
        fallStartedAt: Date.now(),
      },
    }
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

  private schedulePhoneMessageQuest(): void {
    this.clearPhoneMessageTimer()
    this.phoneMessageTimer = setTimeout(() => {
      if (this.state.phase !== 'playing') return
      if (this.state.activeSideQuest?.type !== 'content-box-2-search') return
      if (this.state.phoneMessageQuest !== null) return
      this.state = {
        ...this.state,
        phoneMessageQuest: { phase: 'incoming' },
      }
      this.notify()
    }, PHONE_MESSAGE_DELAY_MS)
  }

  private scheduleDistractionQuest(): void {
    this.clearDistractionQuestTimer()
    this.distractionQuestTimer = setTimeout(() => {
      if (this.state.phase !== 'playing') return
      if (this.state.distractionQuest !== null) return
      this.state = {
        ...this.state,
        distractionQuest: {
          phase: 'laptop-search',
          driftedItems: [],
          restoredItems: [],
          thought2Visible: false,
        },
      }
      this.notify()
    }, DISTRACTION_QUEST_DELAY_MS)
  }

  private scheduleDistractionAnswer(): void {
    this.clearDistractionAnswerTimer()
    this.distractionAnswerTimer = setTimeout(() => {
      if (this.state.distractionQuest?.phase !== 'laptop-answer') return
      this.enterDriftPhase()
      this.notify()
    }, DISTRACTION_ANSWER_MS)
  }

  private collectDriftedItems(): DriftedItemId[] {
    const driftedItems: DriftedItemId[] = []
    if (this.state.filledContentBoxes['content-box-1']) driftedItems.push('content-box-1')
    if (this.state.filledContentBoxes['content-box-2']) driftedItems.push('content-box-2')
    if (this.state.imageBoxFilled) driftedItems.push('image-box')
    return driftedItems
  }

  private enterDriftPhase(): void {
    const quest = this.state.distractionQuest
    if (!quest || quest.phase !== 'laptop-answer') return
    if (quest.driftedItems.length === 0) {
      this.state = { ...this.state, distractionQuest: null }
      return
    }

    this.state = {
      ...this.state,
      distractionQuest: {
        ...quest,
        phase: 'drift',
        thought2Visible: true,
      },
    }
  }

  private clearMusicQuestTimer(): void {
    if (this.musicQuestTimer !== null) {
      clearTimeout(this.musicQuestTimer)
      this.musicQuestTimer = null
    }
  }

  private clearPhoneMessageTimer(): void {
    if (this.phoneMessageTimer !== null) {
      clearTimeout(this.phoneMessageTimer)
      this.phoneMessageTimer = null
    }
  }

  private clearDistractionQuestTimer(): void {
    if (this.distractionQuestTimer !== null) {
      clearTimeout(this.distractionQuestTimer)
      this.distractionQuestTimer = null
    }
  }

  private clearDistractionAnswerTimer(): void {
    if (this.distractionAnswerTimer !== null) {
      clearTimeout(this.distractionAnswerTimer)
      this.distractionAnswerTimer = null
    }
  }

  private clearDistractionTimers(): void {
    this.clearDistractionQuestTimer()
    this.clearDistractionAnswerTimer()
  }

  private clearChoreQuestTimer(): void {
    if (this.choreQuestTimer !== null) {
      clearTimeout(this.choreQuestTimer)
      this.choreQuestTimer = null
    }
  }

  private clearWateringPromptTimer(): void {
    if (this.wateringPromptTimer !== null) {
      clearTimeout(this.wateringPromptTimer)
      this.wateringPromptTimer = null
    }
  }

  private clearWateringAnimationTimer(): void {
    if (this.wateringAnimationTimer !== null) {
      clearTimeout(this.wateringAnimationTimer)
      this.wateringAnimationTimer = null
    }
  }

  private clearChoreTimers(): void {
    this.clearChoreQuestTimer()
    this.clearWateringPromptTimer()
    this.clearWateringAnimationTimer()
  }

  private startTicking(): void {
    this.stopTicking()
    this.tickTimer = setInterval(() => {
      const nextMs = this.state.remainingMs - 1000
      if (nextMs <= 0) {
        const allDone = areAllTodosComplete(this.state.completedTodos)
        this.endGame(allDone)
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
