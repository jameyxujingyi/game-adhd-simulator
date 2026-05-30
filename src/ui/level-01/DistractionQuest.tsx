import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DISTRACTION_ANSWER,
  DISTRACTION_SEARCH_QUERY,
  DISTRACTION_THOUGHT_1,
  DISTRACTION_THOUGHT_2,
} from '../../data/level-01/quest-distraction'
import { IMAGE_BOX_CORRECT_SRC } from '../../data/level-01/quest-image-box'
import type { DistractionQuestState, DriftedItemId } from '../../core/types/state'
import styles from './DistractionQuest.module.css'

interface DistractionThoughtBubblesProps {
  quest: DistractionQuestState
}

export function DistractionThoughtBubbles({ quest }: DistractionThoughtBubblesProps) {
  const showThought1 = quest.phase === 'laptop-answer'
  const showThought2 = quest.thought2Visible
  const thought2Drifting = showThought2 && quest.phase === 'drift'

  if (!showThought1 && !showThought2) return null

  return (
    <>
      {showThought1 && (
        <div className={`${styles.thoughtWrap} ${styles.thoughtWrapLower}`} role="note">
          <div className={styles.thoughtOval}>
            <p className={styles.thoughtText}>{DISTRACTION_THOUGHT_1}</p>
          </div>
        </div>
      )}
      {showThought2 && (
        <div
          className={
            thought2Drifting
              ? `${styles.thoughtDriftHost} ${styles.thoughtWrapLower}`
              : `${styles.thoughtWrap} ${styles.thoughtWrapLower}`
          }
          role="note"
        >
          <div className={thought2Drifting ? styles.thoughtDriftInner : undefined}>
            <div className={styles.thoughtOval}>
              <p className={styles.thoughtText}>{DISTRACTION_THOUGHT_2}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface DistractionSearchOverlayProps {
  onSearch: () => void
}

export function DistractionSearchOverlay({ onSearch }: DistractionSearchOverlayProps) {
  return (
    <div className={styles.distractionSearchStage}>
      <div className={styles.distractionSearchThought} role="note">
        <div className={styles.thoughtOval}>
          <p className={styles.thoughtText}>{DISTRACTION_THOUGHT_1}</p>
        </div>
      </div>
      <div className={styles.centerSearchWrap}>
        <div className={styles.laptopSearchBar}>
          <span className={styles.laptopSearchQuery}>{DISTRACTION_SEARCH_QUERY}</span>
          <button
            type="button"
            className={styles.laptopSearchButton}
            aria-label="搜索"
            onClick={onSearch}
          >
            <svg className={styles.laptopSearchIcon} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <line
                x1="15.5"
                y1="15.5"
                x2="20.5"
                y2="20.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface LaptopDistractionPanelProps {
  phase: DistractionQuestState['phase']
}

export function LaptopDistractionPanel({ phase }: LaptopDistractionPanelProps) {
  if (phase === 'laptop-search') {
    return <div className={styles.laptopDimVeil} aria-hidden="true" />
  }

  if (phase === 'laptop-answer') {
    return (
      <div className={styles.laptopAnswer}>
        <span className={styles.laptopAnswerText}>{DISTRACTION_ANSWER}</span>
      </div>
    )
  }

  return null
}

function isPointerInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function getGameViewportMetrics() {
  const viewport = document.querySelector('[data-game-viewport]')
  if (!(viewport instanceof HTMLElement)) return null
  const rect = viewport.getBoundingClientRect()
  const scale =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1
  return { rect, scale }
}

function clientToGame(clientX: number, clientY: number) {
  const metrics = getGameViewportMetrics()
  if (!metrics) return null
  return {
    x: (clientX - metrics.rect.left) / metrics.scale,
    y: (clientY - metrics.rect.top) / metrics.scale,
  }
}

function getCenterInGame(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return clientToGame(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

function getSizeInGame(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const metrics = getGameViewportMetrics()
  if (!metrics) return null
  return {
    width: rect.width / metrics.scale,
    height: rect.height / metrics.scale,
  }
}

const DRIFT_ANIM_CLASS: Record<DriftedItemId, string> = {
  'content-box-1': styles.driftAnim1,
  'content-box-2': styles.driftAnim2,
  'image-box': styles.driftAnim3,
}

interface DriftedSlideItemsProps {
  quest: Pick<
    DistractionQuestState,
    'phase' | 'driftedItems' | 'restoredItems' | 'thought2Visible'
  >
  driftHidden?: boolean
  targetRefs: Record<DriftedItemId, React.RefObject<HTMLElement | null>>
  contentBox1Text: string | undefined
  contentBox2Text: string | undefined
  onDismissThought: () => void
  onRestoreItem: (itemId: DriftedItemId) => void
}

export function DriftedSlideItems({
  quest,
  driftHidden,
  targetRefs,
  contentBox1Text,
  contentBox2Text,
  onDismissThought,
  onRestoreItem,
}: DriftedSlideItemsProps) {
  const [layouts, setLayouts] = useState<
    Partial<Record<DriftedItemId, { centerX: number; centerY: number; width: number; height: number }>>
  >({})
  const [draggingId, setDraggingId] = useState<DriftedItemId | null>(null)
  const [snappingId, setSnappingId] = useState<DriftedItemId | null>(null)
  const hostRefs = useRef<Partial<Record<DriftedItemId, HTMLDivElement | null>>>({})
  const draggingRef = useRef(false)

  const activeItems = quest.driftedItems.filter((id) => !quest.restoredItems.includes(id))
  const canDrag = quest.phase === 'restore' && !quest.thought2Visible

  useEffect(() => {
    if (
      quest.phase !== 'laptop-answer' &&
      quest.phase !== 'drift' &&
      quest.phase !== 'restore'
    ) {
      return
    }

    const measure = () => {
      const next: typeof layouts = {}
      for (const id of quest.driftedItems) {
        const target = targetRefs[id].current
        if (!target) continue
        const center = getCenterInGame(target)
        const size = getSizeInGame(target)
        if (!center || !size) continue
        next[id] = { centerX: center.x, centerY: center.y, ...size }
      }
      setLayouts(next)
    }

    measure()
    requestAnimationFrame(measure)
  }, [quest.phase, quest.driftedItems, targetRefs])

  const applyHostPosition = useCallback(
    (id: DriftedItemId, centerX: number, centerY: number) => {
      const host = hostRefs.current[id]
      const layout = layouts[id]
      if (!host || !layout) return

      host.style.left = `${centerX}px`
      host.style.top = `${centerY}px`
      host.style.width = `${layout.width}px`
      host.style.height = `${layout.height}px`
    },
    [layouts],
  )

  const snapToTarget = useCallback(
    (id: DriftedItemId) => {
      const host = hostRefs.current[id]
      const target = targetRefs[id].current
      const inner = host?.querySelector(`.${styles.driftItemInner}`) as HTMLElement | null
      if (!host || !target || !inner) return

      const center = getCenterInGame(target)
      if (!center) return

      draggingRef.current = false
      setDraggingId(null)
      setSnappingId(id)

      host.classList.add(styles.driftSnapping)
      inner.style.transition = 'transform 0.36s cubic-bezier(0.34, 1.35, 0.64, 1)'
      inner.style.transform = 'translate(-50%, -50%) scale(1.03)'
      host.style.transition =
        'left 0.36s cubic-bezier(0.34, 1.35, 0.64, 1), top 0.36s cubic-bezier(0.34, 1.35, 0.64, 1)'
      host.style.left = `${center.x}px`
      host.style.top = `${center.y}px`

      window.setTimeout(() => {
        inner.style.transform = 'translate(-50%, -50%) scale(1)'
      }, 70)

      window.setTimeout(() => {
        onRestoreItem(id)
        setSnappingId(null)
      }, 460)
    },
    [onRestoreItem, targetRefs],
  )

  const bindDrag = useCallback(
    (id: DriftedItemId, startX: number, startY: number) => {
      const host = hostRefs.current[id]
      const inner = host?.querySelector(`.${styles.driftItemInner}`) as HTMLElement | null
      const point = clientToGame(startX, startY)
      if (!host || !inner || !point) return

      draggingRef.current = true
      setDraggingId(id)
      host.classList.add(styles.driftDragging)
      host.classList.remove(styles.driftSnapping)
      host.style.transition = 'none'
      inner.style.transition = 'none'
      inner.style.transform = 'translate(-50%, -50%)'
      applyHostPosition(id, point.x, point.y)

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
      }

      const trySnap = (clientX: number, clientY: number) => {
        const targetRect = targetRefs[id].current?.getBoundingClientRect()
        if (!targetRect || !isPointerInRect(clientX, clientY, targetRect)) return false
        cleanup()
        snapToTarget(id)
        return true
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        ev.preventDefault()
        const movePoint = clientToGame(ev.clientX, ev.clientY)
        if (movePoint) applyHostPosition(id, movePoint.x, movePoint.y)
        trySnap(ev.clientX, ev.clientY)
      }

      const onPointerUp = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        if (trySnap(ev.clientX, ev.clientY)) return
        draggingRef.current = false
        setDraggingId(null)
        host.classList.remove(styles.driftDragging)
        cleanup()
        const endPoint = clientToGame(ev.clientX, ev.clientY)
        if (endPoint) applyHostPosition(id, endPoint.x, endPoint.y)
      }

      document.addEventListener('pointermove', onPointerMove, { passive: false })
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [applyHostPosition, snapToTarget, targetRefs],
  )

  const handleItemPointerDown = useCallback(
    (id: DriftedItemId, event: React.PointerEvent<HTMLDivElement>) => {
      if (quest.thought2Visible) {
        event.preventDefault()
        onDismissThought()
        return
      }
      if (!canDrag || snappingId !== null) return
      event.preventDefault()
      event.stopPropagation()
      bindDrag(id, event.clientX, event.clientY)
    },
    [bindDrag, canDrag, onDismissThought, quest.thought2Visible, snappingId],
  )

  if (quest.driftedItems.length === 0) return null
  if (
    quest.phase !== 'laptop-answer' &&
    quest.phase !== 'drift' &&
    quest.phase !== 'restore'
  ) {
    return null
  }

  const driftLayerHidden = driftHidden ?? quest.phase === 'laptop-answer'

  return (
    <div className={`${styles.driftLayer} ${driftLayerHidden ? styles.driftLayerHidden : ''}`}>
      {activeItems.map((id) => {
        const layout = layouts[id]
        if (!layout) return null

        const isDragging = draggingId === id
        const animClass = isDragging || snappingId === id ? '' : DRIFT_ANIM_CLASS[id]

        return (
          <div
            key={id}
            ref={(node) => {
              hostRefs.current[id] = node
            }}
            className={`${styles.driftItemHost} ${isDragging ? styles.driftDragging : ''} ${snappingId === id ? styles.driftSnapping : ''}`}
            style={{
              left: layout.centerX,
              top: layout.centerY,
              width: layout.width,
              height: layout.height,
            }}
            onPointerDown={(event) => handleItemPointerDown(id, event)}
          >
            <div className={`${styles.driftItemInner} ${animClass}`}>
              {id === 'image-box' ? (
                <img src={IMAGE_BOX_CORRECT_SRC} alt="" className={styles.driftItemImage} />
              ) : (
                <span className={styles.driftItemText}>
                  {id === 'content-box-1' ? contentBox1Text : contentBox2Text}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
