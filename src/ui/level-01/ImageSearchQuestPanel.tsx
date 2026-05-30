import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IMAGE_BOX_SEARCH_QUERY,
  IMAGE_SEARCH_OPTIONS,
  IMAGE_WRONG_HINT,
} from '../../data/level-01/quest-image-box'
import styles from './ImageSearchQuestPanel.module.css'

type DragMode = 'idle' | 'floating' | 'snapping'

interface ImageSearchQuestPanelProps {
  searchRevealed: boolean
  onReveal: () => void
  onComplete: () => void
  targetRef: React.RefObject<HTMLElement | null>
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

function rectToGame(rect: DOMRect) {
  const metrics = getGameViewportMetrics()
  if (!metrics) return null

  return {
    width: rect.width / metrics.scale,
    height: rect.height / metrics.scale,
    centerX: (rect.left + rect.width / 2 - metrics.rect.left) / metrics.scale,
    centerY: (rect.top + rect.height / 2 - metrics.rect.top) / metrics.scale,
  }
}

export default function ImageSearchQuestPanel({
  searchRevealed,
  onReveal,
  onComplete,
  targetRef,
}: ImageSearchQuestPanelProps) {
  const floatRef = useRef<HTMLDivElement>(null)
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draggingRef = useRef(false)
  const dragRef = useRef({ w: 0, h: 0 })

  const [dragMode, setDragMode] = useState<DragMode>('idle')
  const [wrongHintVisible, setWrongHintVisible] = useState(false)
  const correctOption = IMAGE_SEARCH_OPTIONS.find((option) => option.correct)!

  const getTargetRect = useCallback(
    () => targetRef.current?.getBoundingClientRect() ?? null,
    [targetRef],
  )

  useEffect(() => {
    if (!searchRevealed) {
      setDragMode('idle')
    }
  }, [searchRevealed])

  useEffect(
    () => () => {
      if (completeTimer.current) clearTimeout(completeTimer.current)
      if (snapTimer.current) clearTimeout(snapTimer.current)
      if (hintTimer.current) clearTimeout(hintTimer.current)
    },
    [],
  )

  const applyFloatPosition = useCallback((clientX: number, clientY: number) => {
    const el = floatRef.current
    const { w, h } = dragRef.current
    const point = clientToGame(clientX, clientY)
    if (!el || w <= 0 || h <= 0 || !point) return

    el.style.transition = 'none'
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.left = `${point.x}px`
    el.style.top = `${point.y}px`
    el.style.transform = 'translate(-50%, -50%)'
  }, [])

  const snapFloatToTarget = useCallback(() => {
    const el = floatRef.current
    const target = getTargetRect()
    const targetGame = target ? rectToGame(target) : null
    if (!el || !targetGame) return

    draggingRef.current = false
    setDragMode('snapping')

    el.classList.add(styles.imageSnapping)
    el.style.transition =
      'left 0.36s cubic-bezier(0.34, 1.35, 0.64, 1), top 0.36s cubic-bezier(0.34, 1.35, 0.64, 1), transform 0.36s cubic-bezier(0.34, 1.35, 0.64, 1)'

    const { w, h } = dragRef.current
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.left = `${targetGame.centerX}px`
    el.style.top = `${targetGame.centerY}px`
    el.style.transform = 'translate(-50%, -50%) scale(1.03)'

    snapTimer.current = window.setTimeout(() => {
      el.style.transform = 'translate(-50%, -50%) scale(1)'
    }, 70)

    completeTimer.current = window.setTimeout(() => {
      onComplete()
    }, 460)
  }, [getTargetRect, onComplete])

  const bindDragListeners = useCallback(() => {
    const cleanup = () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
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
      if (trySnapOnTouch(ev.clientX, ev.clientY)) return
      draggingRef.current = false
      cleanup()
      applyFloatPosition(ev.clientX, ev.clientY)
    }

    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [applyFloatPosition, getTargetRect, snapFloatToTarget])

  const beginDrag = useCallback(
    (clientX: number, clientY: number, tileRect: DOMRect) => {
      const tileGame = rectToGame(tileRect)
      if (!tileGame) return

      dragRef.current = { w: tileGame.width, h: tileGame.height }

      const el = floatRef.current
      if (el) {
        el.style.display = 'block'
        el.style.transition = 'none'
        el.classList.remove(styles.imageSnapping)
      }

      setDragMode('floating')
      draggingRef.current = true

      requestAnimationFrame(() => {
        applyFloatPosition(clientX, clientY)
        bindDragListeners()
      })
    },
    [applyFloatPosition, bindDragListeners],
  )

  const startCorrectDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!searchRevealed || dragMode === 'snapping') return

      event.preventDefault()
      event.stopPropagation()
      beginDrag(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
    },
    [searchRevealed, dragMode, beginDrag],
  )

  const startFloatDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragMode !== 'floating') return

      event.preventDefault()
      event.stopPropagation()

      const el = floatRef.current
      if (el) {
        el.style.transition = 'none'
        el.style.transform = 'translate(-50%, -50%)'
        el.classList.remove(styles.imageSnapping)
      }

      draggingRef.current = true
      bindDragListeners()
    },
    [dragMode, bindDragListeners],
  )

  const showWrongHint = useCallback(() => {
    setWrongHintVisible(true)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => {
      setWrongHintVisible(false)
    }, 1800)
  }, [])

  const showSearchPulse = !searchRevealed
  const showFloat = dragMode === 'floating' || dragMode === 'snapping'

  return (
    <div className={styles.overlay} aria-label="图片搜索任务">
      <div className={styles.panel}>
        <div className={`${styles.searchUnit} ${searchRevealed ? styles.searchUnitExpanded : ''}`}>
          <div className={styles.searchBar}>
            <span className={styles.searchQuery}>{IMAGE_BOX_SEARCH_QUERY}</span>
            <button
              type="button"
              className={`${styles.searchButton} ${showSearchPulse ? styles.searchButtonPulse : ''}`}
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

          {searchRevealed && dragMode === 'idle' && (
            <div className={styles.imageResults}>
              {IMAGE_SEARCH_OPTIONS.map((option) =>
                option.correct ? (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.imageTile} ${styles.imageTileCorrect}`}
                    aria-label="图片选项"
                    onPointerDown={startCorrectDrag}
                  >
                    <img src={option.src} alt="" />
                  </button>
                ) : (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.imageTile}
                    aria-label="图片选项"
                    onClick={showWrongHint}
                  >
                    <img src={option.src} alt="" />
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={floatRef}
        className={`${styles.imageFloat} ${dragMode === 'floating' ? styles.imageDragging : ''} ${dragMode === 'snapping' ? styles.imageSnapping : ''}`}
        style={{ display: showFloat ? 'block' : 'none' }}
        aria-hidden={!showFloat}
        onPointerDown={startFloatDrag}
      >
        <img src={correctOption.src} alt="" />
      </div>

      {wrongHintVisible && (
        <div className={styles.wrongHint} role="alert">
          {IMAGE_WRONG_HINT}
        </div>
      )}
    </div>
  )
}
