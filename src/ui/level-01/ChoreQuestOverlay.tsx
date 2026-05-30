import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MOP_THOUGHT,
  WATERING_ACCEPT_LABEL,
  WATERING_ANIMATION_MS,
  WATERING_DECLINE_LABEL,
  WATERING_PROMPT_TEXT,
} from '../../data/level-01/quest-chore'
import type { ChoreQuestState } from '../../core/types/state'
import {
  clientToGame,
  getCenterInGame,
  getSizeInGame,
  isHostOverlappingElementCenter,
} from './dragUtils'
import styles from './ChoreQuestOverlay.module.css'

interface ChoreQuestOverlayProps {
  quest: ChoreQuestState
  mopRef: React.RefObject<HTMLElement | null>
  waterRef: React.RefObject<HTMLElement | null>
  sprayRef: React.RefObject<HTMLElement | null>
  plantRef: React.RefObject<HTMLElement | null>
  onCompleteMop: () => void
  onWateringAccept: () => void
  onWateringDecline: () => void
  onCompleteWatering: () => void
}

function MopSvg() {
  return (
    <svg viewBox="0 0 60 180" className={styles.mopSvg} aria-hidden="true">
      <rect x="27" y="0" width="6" height="130" rx="3" fill="#8d6e63" />
      <rect x="10" y="125" width="40" height="14" rx="4" fill="#bdbdbd" />
      <rect x="8" y="138" width="44" height="28" rx="3" fill="#eceff1" />
      <line x1="12" y1="145" x2="48" y2="145" stroke="#cfd8dc" strokeWidth="2" />
      <line x1="12" y1="152" x2="48" y2="152" stroke="#cfd8dc" strokeWidth="2" />
      <line x1="12" y1="159" x2="48" y2="159" stroke="#cfd8dc" strokeWidth="2" />
    </svg>
  )
}

function SpraySvg() {
  return (
    <svg viewBox="0 0 50 80" className={styles.spraySvg} aria-hidden="true">
      <rect x="14" y="28" width="22" height="44" rx="4" fill="#42a5f5" />
      <rect x="16" y="32" width="18" height="8" rx="2" fill="#64b5f6" opacity="0.5" />
      <path d="M20 28 L20 18 Q20 10 28 8 L32 8 Q38 10 38 18 L38 28" fill="#78909c" />
      <rect x="34" y="12" width="14" height="6" rx="2" fill="#546e7a" />
      <circle cx="40" cy="10" r="3" fill="#90a4ae" />
    </svg>
  )
}

export default function ChoreQuestOverlay({
  quest,
  mopRef,
  waterRef,
  sprayRef,
  plantRef,
  onCompleteMop,
  onWateringAccept,
  onWateringDecline,
  onCompleteWatering,
}: ChoreQuestOverlayProps) {
  const [mopLayout, setMopLayout] = useState<{
    centerX: number
    centerY: number
    width: number
    height: number
  } | null>(null)
  const [sprayLayout, setSprayLayout] = useState<{
    centerX: number
    centerY: number
    width: number
    height: number
  } | null>(null)
  const [mopDragPos, setMopDragPos] = useState<{ x: number; y: number } | null>(null)
  const [sprayDragPos, setSprayDragPos] = useState<{ x: number; y: number } | null>(null)
  const [mopDragging, setMopDragging] = useState(false)
  const [sprayDragging, setSprayDragging] = useState(false)
  const [waterAnim, setWaterAnim] = useState<{
    sprayX: number
    sprayY: number
    dropX: number
    dropStartY: number
    dropEndY: number
  } | null>(null)
  const mopHostRef = useRef<HTMLDivElement>(null)
  const sprayHostRef = useRef<HTMLDivElement>(null)
  const mopDraggingRef = useRef(false)
  const sprayDraggingRef = useRef(false)

  const showDimOverlay =
    quest.phase === 'mop' ||
    quest.phase === 'watering-prompt' ||
    quest.phase === 'watering-drag' ||
    quest.phase === 'watering-animation'

  useEffect(() => {
    if (quest.phase !== 'mop') return
    const measure = () => {
      const mop = mopRef.current
      if (!mop) return
      const center = getCenterInGame(mop)
      const size = getSizeInGame(mop)
      if (!center || !size) return
      setMopLayout({ centerX: center.x, centerY: center.y, ...size })
    }
    measure()
    requestAnimationFrame(measure)
  }, [mopRef, quest.phase])

  useEffect(() => {
    if (quest.phase !== 'watering-drag' && quest.phase !== 'watering-animation') return
    const measure = () => {
      const spray = sprayRef.current
      if (!spray) return
      const center = getCenterInGame(spray)
      const size = getSizeInGame(spray)
      if (!center || !size) return
      setSprayLayout({ centerX: center.x, centerY: center.y, ...size })
    }
    measure()
    requestAnimationFrame(measure)
  }, [sprayRef, quest.phase])

  useEffect(() => {
    if (quest.phase !== 'watering-animation') return
    const plant = plantRef.current
    if (!plant) return

    const plantRect = plant.getBoundingClientRect()
    const plantCenter = getCenterInGame(plant)
    const plantTop = clientToGame(plantRect.left + plantRect.width / 2, plantRect.top)
    if (!plantCenter || !plantTop) return

    setWaterAnim({
      sprayX: plantCenter.x,
      sprayY: plantTop.y - 56,
      dropX: plantCenter.x,
      dropStartY: plantTop.y - 20,
      dropEndY: plantCenter.y + 24,
    })
    setSprayDragPos({ x: plantCenter.x, y: plantTop.y - 56 })
  }, [plantRef, quest.phase])

  const tryCompleteMop = useCallback(() => {
    const host = mopHostRef.current
    const water = waterRef.current
    if (!host || !water) return false
    if (!isHostOverlappingElementCenter(host, water, 12)) return false
    mopDraggingRef.current = false
    setMopDragging(false)
    onCompleteMop()
    return true
  }, [onCompleteMop, waterRef])

  const tryCompleteWatering = useCallback(() => {
    const host = sprayHostRef.current
    const plant = plantRef.current
    if (!host || !plant) return false
    if (!isHostOverlappingElementCenter(host, plant, 16)) return false
    sprayDraggingRef.current = false
    setSprayDragging(false)
    onCompleteWatering()
    return true
  }, [onCompleteWatering, plantRef])

  const bindMopDrag = useCallback(
    (startX: number, startY: number) => {
      const point = clientToGame(startX, startY)
      if (!point) return
      mopDraggingRef.current = true
      setMopDragging(true)
      setMopDragPos(point)

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!mopDraggingRef.current) return
        ev.preventDefault()
        const movePoint = clientToGame(ev.clientX, ev.clientY)
        if (movePoint) setMopDragPos(movePoint)
        if (tryCompleteMop()) cleanup()
      }

      const onPointerUp = (ev: PointerEvent) => {
        if (!mopDraggingRef.current) return
        mopDraggingRef.current = false
        setMopDragging(false)
        cleanup()
        if (tryCompleteMop()) return
        const endPoint = clientToGame(ev.clientX, ev.clientY)
        if (endPoint) setMopDragPos(endPoint)
      }

      document.addEventListener('pointermove', onPointerMove, { passive: false })
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [mopLayout, tryCompleteMop],
  )

  const bindSprayDrag = useCallback(
    (startX: number, startY: number) => {
      const point = clientToGame(startX, startY)
      if (!point) return
      sprayDraggingRef.current = true
      setSprayDragging(true)
      setSprayDragPos(point)

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!sprayDraggingRef.current) return
        ev.preventDefault()
        const movePoint = clientToGame(ev.clientX, ev.clientY)
        if (movePoint) setSprayDragPos(movePoint)
        if (tryCompleteWatering()) cleanup()
      }

      const onPointerUp = () => {
        if (!sprayDraggingRef.current) return
        sprayDraggingRef.current = false
        setSprayDragging(false)
        cleanup()
        if (tryCompleteWatering()) return
        if (sprayLayout) setSprayDragPos({ x: sprayLayout.centerX, y: sprayLayout.centerY })
      }

      document.addEventListener('pointermove', onPointerMove, { passive: false })
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [sprayLayout, tryCompleteWatering],
  )

  const mopCenter = mopDragPos ?? (mopLayout ? { x: mopLayout.centerX, y: mopLayout.centerY } : null)
  const sprayAnimating = quest.phase === 'watering-animation'
  const sprayCenter =
    sprayAnimating && waterAnim
      ? { x: waterAnim.sprayX, y: waterAnim.sprayY }
      : sprayDragPos ?? (sprayLayout ? { x: sprayLayout.centerX, y: sprayLayout.centerY } : null)

  const mopThoughtTop = mopLayout ? mopLayout.centerY + mopLayout.height * 0.35 + 12 : null

  return (
    <>
      {showDimOverlay && <div className={styles.choreDimOverlay} aria-hidden="true" />}

      {quest.phase === 'mop' && mopLayout && mopCenter && (
        <>
          {mopThoughtTop !== null && (
            <div
              className={styles.mopThoughtWrap}
              style={{ left: mopLayout.centerX, top: mopThoughtTop }}
              role="note"
            >
              <div className={styles.mopThoughtOval}>
                <p className={styles.mopThoughtText}>{MOP_THOUGHT}</p>
              </div>
            </div>
          )}
          <div
            ref={mopHostRef}
            className={`${styles.dragHost} ${mopDragging ? styles.dragHostActive : ''}`}
            style={{
              left: mopCenter.x,
              top: mopCenter.y,
              width: mopLayout.width,
              height: mopLayout.height,
            }}
            onPointerDown={(event) => {
              event.preventDefault()
              bindMopDrag(event.clientX, event.clientY)
            }}
          >
            <div className={`${styles.dragInner} ${!mopDragging ? styles.dragInnerBob : ''}`}>
              <MopSvg />
            </div>
          </div>
        </>
      )}

      {quest.phase === 'watering-prompt' && (
        <div className={styles.wateringModalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.wateringModal}>
            <p className={styles.wateringModalText}>{WATERING_PROMPT_TEXT}</p>
            <div className={styles.wateringModalActions}>
              <button type="button" className={styles.wateringAcceptBtn} onClick={onWateringAccept}>
                {WATERING_ACCEPT_LABEL}
              </button>
              <button
                type="button"
                className={styles.wateringDeclineBtn}
                onClick={onWateringDecline}
              >
                {WATERING_DECLINE_LABEL}
              </button>
            </div>
          </div>
        </div>
      )}

      {(quest.phase === 'watering-drag' || quest.phase === 'watering-animation') &&
        sprayLayout &&
        sprayCenter && (
          <>
            <div
              ref={sprayHostRef}
              className={`${styles.dragHost} ${sprayDragging ? styles.dragHostActive : ''} ${sprayAnimating ? styles.dragHostLocked : ''}`}
              style={{
                left: sprayCenter.x,
                top: sprayCenter.y,
                width: sprayLayout.width,
                height: sprayLayout.height,
              }}
              onPointerDown={
                sprayAnimating
                  ? undefined
                  : (event) => {
                      event.preventDefault()
                      bindSprayDrag(event.clientX, event.clientY)
                    }
              }
            >
              <div className={styles.dragInner}>
                <SpraySvg />
              </div>
            </div>
            {sprayAnimating && waterAnim && (
              <svg className={styles.waterStreamSvg} aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <circle
                    key={i}
                    cx={waterAnim.dropX}
                    cy={waterAnim.dropStartY}
                    r={5}
                    className={styles.waterDrop}
                  >
                    <animate
                      attributeName="cy"
                      from={waterAnim.dropStartY}
                      to={waterAnim.dropEndY}
                      dur={`${WATERING_ANIMATION_MS}ms`}
                      begin={`${i * 0.28}s`}
                      repeatCount="1"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.9"
                      to="0.2"
                      dur={`${WATERING_ANIMATION_MS}ms`}
                      begin={`${i * 0.28}s`}
                      repeatCount="1"
                      fill="freeze"
                    />
                  </circle>
                ))}
              </svg>
            )}
          </>
        )}
    </>
  )
}
