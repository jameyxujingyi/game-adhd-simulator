import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CONTENT_BOX_1_ANSWER_LINES,
  CONTENT_BOX_1_SEARCH_QUERY,
} from '../../data/level-01/quest-01'
import styles from './SearchQuestPanel.module.css'

type AnswerMode = 'attached' | 'floating' | 'snapping'

interface SearchQuestPanelProps {
  searchRevealed: boolean
  onReveal: () => void
  onComplete: () => void
  targetRef: React.RefObject<HTMLElement | null>
}

function isPointerInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function AnswerLines({ className }: { className?: string }) {
  return (
    <span className={className}>
      {CONTENT_BOX_1_ANSWER_LINES[0]}
      <br />
      {CONTENT_BOX_1_ANSWER_LINES[1]}
      <br />
      <span className={styles.answerDropHint}>{CONTENT_BOX_1_ANSWER_LINES[2]}</span>
    </span>
  )
}

export default function SearchQuestPanel({
  searchRevealed,
  onReveal,
  onComplete,
  targetRef,
}: SearchQuestPanelProps) {
  const floatRef = useRef<HTMLDivElement>(null)
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draggingRef = useRef(false)

  const [mode, setMode] = useState<AnswerMode>('attached')

  const dragRef = useRef({ w: 0, h: 0 })

  const getTargetRect = useCallback(
    () => targetRef.current?.getBoundingClientRect() ?? null,
    [targetRef],
  )

  useEffect(() => {
    if (!searchRevealed) {
      setMode('attached')
    }
  }, [searchRevealed])

  useEffect(
    () => () => {
      if (completeTimer.current) clearTimeout(completeTimer.current)
      if (snapTimer.current) clearTimeout(snapTimer.current)
    },
    [],
  )

  const applyFloatPosition = useCallback((clientX: number, clientY: number) => {
    const el = floatRef.current
    const { w, h } = dragRef.current
    if (!el || w <= 0 || h <= 0) return

    el.style.transition = 'none'
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.left = `${clientX}px`
    el.style.top = `${clientY}px`
    el.style.transform = 'translate(-50%, -50%)'
  }, [])

  const snapFloatToTarget = useCallback(() => {
    const el = floatRef.current
    const target = getTargetRect()
    if (!el || !target) return

    draggingRef.current = false
    setMode('snapping')

    el.classList.add(styles.answerSnapping)
    el.style.transition =
      'left 0.36s cubic-bezier(0.34, 1.35, 0.64, 1), top 0.36s cubic-bezier(0.34, 1.35, 0.64, 1), transform 0.36s cubic-bezier(0.34, 1.35, 0.64, 1)'

    const { w, h } = dragRef.current
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.left = `${target.left + target.width / 2}px`
    el.style.top = `${target.top + target.height / 2}px`
    el.style.transform = 'translate(-50%, -50%) scale(1.03)'

    snapTimer.current = window.setTimeout(() => {
      el.style.transform = 'translate(-50%, -50%) scale(1)'
    }, 70)

    completeTimer.current = window.setTimeout(() => {
      onComplete()
    }, 460)
  }, [getTargetRect, onComplete])

  const unbindDragRef = useRef<(() => void) | null>(null)

  const bindDragListeners = useCallback(
    (startX: number, startY: number) => {
      draggingRef.current = true
      applyFloatPosition(startX, startY)

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
        unbindDragRef.current = null
      }

      const trySnapOnTouch = (clientX: number, clientY: number): boolean => {
        const targetRect = getTargetRect()
        if (!targetRect || !isPointerInRect(clientX, clientY, targetRect)) return false
        cleanup()
        snapFloatToTarget()
        return true
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        ev.preventDefault()
        applyFloatPosition(ev.clientX, ev.clientY)
        trySnapOnTouch(ev.clientX, ev.clientY)
      }

      const onPointerUp = (ev: PointerEvent) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        cleanup()

        if (trySnapOnTouch(ev.clientX, ev.clientY)) return
        applyFloatPosition(ev.clientX, ev.clientY)
      }

      document.addEventListener('pointermove', onPointerMove, { passive: false })
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
      unbindDragRef.current = cleanup
    },
    [applyFloatPosition, getTargetRect, snapFloatToTarget],
  )

  const beginDrag = useCallback(
    (clientX: number, clientY: number, dropRect: DOMRect) => {
      dragRef.current = { w: dropRect.width, h: dropRect.height }

      const el = floatRef.current
      if (el) {
        el.style.display = 'flex'
        el.style.transition = 'none'
        el.classList.remove(styles.answerSnapping)
      }

      setMode('floating')

      requestAnimationFrame(() => {
        applyFloatPosition(clientX, clientY)
        bindDragListeners(clientX, clientY)
      })
    },
    [applyFloatPosition, bindDragListeners],
  )

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (mode !== 'attached') return

      event.preventDefault()
      event.stopPropagation()
      beginDrag(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
    },
    [mode, beginDrag],
  )

  const startFloatDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (mode !== 'floating') return

      event.preventDefault()
      event.stopPropagation()

      const el = floatRef.current
      if (el) {
        el.style.transition = 'none'
        el.style.transform = 'translate(-50%, -50%)'
        el.classList.remove(styles.answerSnapping)
      }

      bindDragListeners(event.clientX, event.clientY)
    },
    [mode, bindDragListeners],
  )

  const showAttached = searchRevealed && mode === 'attached'
  const showFloat = searchRevealed && (mode === 'floating' || mode === 'snapping')

  return (
    <div className={styles.overlay} aria-label="搜索任务">
      <div className={styles.panel}>
        <div className={`${styles.searchUnit} ${searchRevealed ? styles.searchUnitExpanded : ''}`}>
          <div className={styles.searchBar}>
            <span className={styles.searchQuery}>{CONTENT_BOX_1_SEARCH_QUERY}</span>
            <button
              type="button"
              className={`${styles.searchButton} ${!searchRevealed ? styles.searchButtonPulse : ''}`}
              aria-label="搜索"
              onClick={onReveal}
              disabled={searchRevealed}
            >
              <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
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

          {showAttached && (
            <div className={styles.answerDrop} onPointerDown={startDrag}>
              <AnswerLines className={styles.answerDropText} />
            </div>
          )}
        </div>
      </div>

      <div
        ref={floatRef}
        className={`${styles.answerFloat} ${mode === 'floating' ? styles.answerDragging : ''} ${mode === 'snapping' ? styles.answerSnapping : ''}`}
        style={{ display: showFloat ? 'flex' : 'none' }}
        aria-hidden={!showFloat}
        onPointerDown={startFloatDrag}
      >
        <AnswerLines className={styles.answerDropText} />
      </div>
    </div>
  )
}
