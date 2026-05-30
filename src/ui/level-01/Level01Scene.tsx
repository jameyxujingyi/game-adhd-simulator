import { forwardRef, useRef } from 'react'
import type { ClickableComponentId } from '../../data/types'
import { TODO_ITEMS } from '../../data/types'
import { useGame } from '../bridge/GameProvider'
import MusicQuestOverlay, { albumCover } from './MusicQuestOverlay'
import musicStyles from './MusicQuestOverlay.module.css'
import SearchQuestPanel from './SearchQuestPanel'
import styles from './Level01Scene.module.css'

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const ClickTarget = forwardRef<
  HTMLButtonElement,
  {
    componentId: ClickableComponentId
    className?: string
    ariaLabel: string
    children?: React.ReactNode
  }
>(function ClickTarget({ componentId, className, ariaLabel, children }, ref) {
  const { state, dispatch } = useGame()
  const sideQuestActive = state.activeSideQuest !== null
  const musicPhase = state.musicQuest?.phase
  const iconPhaseActive = musicPhase === 'icon'

  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.clickable} ${className ?? ''}`}
      data-component-id={componentId}
      aria-label={ariaLabel}
      disabled={state.phase !== 'playing' || sideQuestActive || iconPhaseActive || musicPhase === 'album-modal'}
      onClick={() => dispatch({ type: 'CLICK_COMPONENT', componentId })}
    >
      {children}
    </button>
  )
})

export default function Level01Scene() {
  const { state, dispatch } = useGame()
  const isReady = state.phase === 'ready'
  const contentBox1Ref = useRef<HTMLButtonElement>(null)
  const contentBox1Filled = state.filledContentBoxes['content-box-1']
  const sideQuest = state.activeSideQuest
  const musicQuest = state.musicQuest
  const musicPhase = musicQuest?.phase
  const sceneMusicBlocked = musicPhase === 'album-modal'

  return (
    <div className={styles.scene}>
      <div
        className={`${styles.sceneContent} ${isReady ? styles.sceneDimmed : ''} ${sideQuest ? styles.sceneQuestDimmed : ''} ${sceneMusicBlocked ? styles.sceneMusicBlocked : ''}`}
      >
      {/* 房间背景：三线透视（左墙 / 后墙 / 地面） */}
      <div className={styles.room}>
        <svg
          className={styles.roomSvg}
          viewBox="0 0 1000 700"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* 后墙（延伸至画面顶部） */}
          <polygon points="210,268 1000,268 1000,0 210,0" className={styles.backWall} />
          {/* 左墙（延伸至画面顶部与底部） */}
          <polygon points="0,700 210,268 210,0 0,0" className={styles.leftWall} />
          {/* 木质地板（左右缘与墙面对齐） */}
          <polygon points="0,700 210,268 1000,268 1000,700" className={styles.floorPlane} />

          {Array.from({ length: 9 }).map((_, row) =>
            Array.from({ length: 15 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={220 + col * 52 + (row % 2) * 26}
                y={10 + row * 28}
                width={48}
                height={24}
                className={styles.brick}
              />
            )),
          )}

          <line x1="210" y1="268" x2="1000" y2="268" className={styles.cornerAxisX} />
        </svg>
      </div>

      {/* 顶部 HUD：倒计时 + 退出 */}
      <div className={styles.hud}>
        <div className={styles.timer} aria-live="polite">
          {formatTime(state.remainingMs)}
        </div>
        <button
          type="button"
          className={styles.exitButton}
          data-component-id="exit-button"
          aria-label="退出"
          disabled={sideQuest !== null || musicPhase === 'icon' || musicPhase === 'album-modal'}
          onClick={() => dispatch({ type: 'EXIT' })}
        >
          <span className={styles.exitIcon}>×</span>
        </button>
      </div>

      {/* 桌子：笔记本电脑 + 手机 + 记事本 */}
      <div className={styles.deskArea}>
        <div className={styles.deskSurface} aria-hidden="true" />

        <div className={styles.deskItems}>
          {/* 笔记本电脑 */}
          <div className={styles.laptop}>
            <div className={styles.laptopScreenBezel}>
              <div className={styles.pptScreen}>
                {musicPhase === 'icon' && (
                  <div className={styles.pptScreenGrayVeil} aria-hidden="true" />
                )}

                {musicPhase === 'playing' && (
                  <div className={musicStyles.laptopAlbumSpinWrap} aria-hidden="true">
                    <img src={albumCover} alt="" className={musicStyles.laptopAlbumSpin} />
                  </div>
                )}

                {musicPhase === 'icon' && (
                  <button
                    type="button"
                    className={musicStyles.laptopMusicIcon}
                    aria-label="播放音乐"
                    onClick={() => dispatch({ type: 'CLICK_MUSIC_ICON' })}
                  >
                    <svg className={musicStyles.musicNoteSvg} viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 3v10.55A4 4 0 1 0 14 17V7h6V3h-8z"
                      />
                    </svg>
                  </button>
                )}

                <span className={styles.pptLabel}>PPTX.</span>
                <h1 className={styles.slideTitle}>我为什么睡不着</h1>

                <div className={styles.slideContent}>
                  <div className={styles.contentColumn}>
                    <ClickTarget
                      ref={contentBox1Ref}
                      componentId="content-box-1"
                      className={`${styles.contentBox} ${contentBox1Filled ? styles.contentBoxFilled : ''}`}
                      ariaLabel="内容框1"
                    >
                      <span className={styles.contentBoxText}>
                        {contentBox1Filled ?? '文本'}
                      </span>
                    </ClickTarget>
                    <ClickTarget
                      componentId="content-box-2"
                      className={styles.contentBox}
                      ariaLabel="内容框2"
                    >
                      <span>文本</span>
                    </ClickTarget>
                  </div>

                  <ClickTarget
                    componentId="image-box"
                    className={styles.imageBox}
                    ariaLabel="图片框"
                  >
                    <svg viewBox="0 0 100 120" className={styles.imagePlaceholder} aria-hidden="true">
                      <circle cx="72" cy="28" r="14" fill="#ffd54f" />
                      <path
                        d="M10 95 L35 55 L55 75 L75 45 L95 70 L95 110 L10 110 Z"
                        fill="#81c784"
                      />
                      <path
                        d="M10 110 L30 85 L50 95 L70 75 L90 90 L90 110 Z"
                        fill="#66bb6a"
                      />
                    </svg>
                  </ClickTarget>
                </div>
              </div>
            </div>
            <div className={styles.laptopBase} aria-hidden="true">
              <div className={styles.keyboard}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className={styles.key} />
                ))}
              </div>
              <div className={styles.trackpad} />
            </div>
          </div>

          {/* 手机 */}
          <ClickTarget componentId="phone" className={styles.phone} ariaLabel="手机">
            <div className={styles.phoneBody}>
              <div className={styles.phoneScreen} />
              <div className={styles.phoneHomeButton} aria-hidden="true" />
            </div>
          </ClickTarget>

          {/* 右下角记事本 */}
          <div className={styles.notepad}>
            <div className={styles.notepadSpiral} aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={styles.spiralRing} />
              ))}
            </div>
            <ul className={styles.todoList}>
              {TODO_ITEMS.map((item) => {
                const isDone = state.completedTodos.includes(item.id)
                return (
                  <li key={item.id}>
                    <ClickTarget
                      componentId={item.id}
                      className={styles.todoItem}
                      ariaLabel={item.label}
                    >
                      <span
                        className={`${styles.checkbox} ${isDone ? styles.checkboxChecked : ''}`}
                        aria-hidden="true"
                      />
                      <span className={`${styles.todoText} ${isDone ? styles.todoTextDone : ''}`}>
                        {item.label}
                      </span>
                    </ClickTarget>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 墙地交界线：拖把、喷水壶、盆栽 */}
      <div className={styles.roomCorner}>
        <ClickTarget componentId="mop" className={styles.mop} ariaLabel="拖把">
          <svg viewBox="0 0 60 180" className={styles.mopSvg} aria-hidden="true">
            <rect x="27" y="0" width="6" height="130" rx="3" fill="#8d6e63" />
            <rect x="10" y="125" width="40" height="14" rx="4" fill="#bdbdbd" />
            <rect x="8" y="138" width="44" height="28" rx="3" fill="#eceff1" />
            <line x1="12" y1="145" x2="48" y2="145" stroke="#cfd8dc" strokeWidth="2" />
            <line x1="12" y1="152" x2="48" y2="152" stroke="#cfd8dc" strokeWidth="2" />
            <line x1="12" y1="159" x2="48" y2="159" stroke="#cfd8dc" strokeWidth="2" />
          </svg>
        </ClickTarget>

        <ClickTarget
          componentId="spray-bottle"
          className={styles.sprayBottle}
          ariaLabel="喷水壶"
        >
          <svg viewBox="0 0 50 80" className={styles.spraySvg} aria-hidden="true">
            <rect x="14" y="28" width="22" height="44" rx="4" fill="#42a5f5" />
            <rect x="16" y="32" width="18" height="8" rx="2" fill="#64b5f6" opacity="0.5" />
            <path d="M20 28 L20 18 Q20 10 28 8 L32 8 Q38 10 38 18 L38 28" fill="#78909c" />
            <rect x="34" y="12" width="14" height="6" rx="2" fill="#546e7a" />
            <circle cx="40" cy="10" r="3" fill="#90a4ae" />
          </svg>
        </ClickTarget>

        <ClickTarget
          componentId="potted-plant"
          className={styles.pottedPlant}
          ariaLabel="一盆大盆栽"
        >
          <svg viewBox="0 0 120 200" className={styles.plantSvg} aria-hidden="true">
            <path d="M35 175 L85 175 L78 145 L42 145 Z" fill="#795548" />
            <rect x="38" y="168" width="44" height="10" rx="2" fill="#6d4c41" />
            <path d="M60 145 Q30 100 20 60 Q45 80 60 120 Q75 80 100 60 Q90 100 60 145" fill="#43a047" />
            <path d="M60 130 Q15 90 10 40 Q40 70 55 100 Q50 60 60 30 Q70 60 65 100 Q80 70 110 40 Q105 90 60 130" fill="#66bb6a" />
            <path d="M60 120 Q40 70 55 20 Q60 50 60 80 Q60 50 65 20 Q80 70 60 120" fill="#2e7d32" />
          </svg>
        </ClickTarget>
      </div>

      {/* 水塘（画面正中心） */}
      <ClickTarget
        componentId="water-puddle"
        className={styles.waterPuddle}
        ariaLabel="地上一滩水"
      >
        <svg viewBox="0 0 120 70" className={styles.waterSvg} aria-hidden="true">
          <path
            d="M18 38
               C22 22, 38 14, 55 18
               C72 12, 88 20, 95 32
               C102 42, 92 52, 78 56
               C62 62, 42 58, 28 52
               C16 46, 12 48, 18 38 Z"
            fill="#4fc3f7"
            opacity="0.88"
          />
          <path
            d="M28 42
               C34 30, 48 26, 62 30
               C76 28, 84 36, 80 44
               C72 50, 52 52, 36 48
               C26 44, 24 46, 28 42 Z"
            fill="#81d4fa"
            opacity="0.55"
          />
        </svg>
      </ClickTarget>
      </div>

      {sideQuest?.type === 'content-box-1-search' && (
        <SearchQuestPanel
          searchRevealed={sideQuest.searchRevealed}
          onReveal={() => dispatch({ type: 'REVEAL_SEARCH_ANSWER' })}
          onComplete={() => dispatch({ type: 'COMPLETE_CONTENT_BOX_1' })}
          targetRef={contentBox1Ref}
        />
      )}

      {musicQuest && musicQuest.phase !== 'playing' && (
        <MusicQuestOverlay
          phase={musicQuest.phase}
          onSelectAlbum={() => dispatch({ type: 'SELECT_MUSIC_ALBUM' })}
        />
      )}

      {isReady && (
        <div className={styles.startOverlay} role="dialog" aria-modal="true" aria-labelledby="start-title">
          <div className={styles.startModal}>
            <p id="start-title" className={styles.startText}>
              你需要在1分钟之内做完ppt
              <br />
              请参考记事本上的任务清单
            </p>
            <button
              type="button"
              className={styles.startButton}
              onClick={() => dispatch({ type: 'START' })}
            >
              开始
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
