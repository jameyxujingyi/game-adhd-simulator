import albumCover from '../../assets/melodrama-album.png'
import { MUSIC_ALBUM_TITLE, MUSIC_QUEST_THOUGHT } from '../../data/level-01/quest-02-music'
import type { MusicQuestPhase } from '../../core/types/state'
import styles from './MusicQuestOverlay.module.css'

interface MusicQuestOverlayProps {
  phase: MusicQuestPhase
  onSelectAlbum: () => void
}

export default function MusicQuestOverlay({ phase, onSelectAlbum }: MusicQuestOverlayProps) {
  const showBubble = phase === 'icon'
  const showModal = phase === 'album-modal'

  if (!showBubble && !showModal) return null

  return (
    <>
      {showBubble && (
        <div className={styles.thoughtWrap} role="note">
          <div className={styles.thoughtOval}>
            <p className={styles.thoughtText}>{MUSIC_QUEST_THOUGHT}</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.albumOverlay} role="dialog" aria-modal="true" aria-label="选择专辑">
          <div className={styles.albumModal}>
            <img src={albumCover} alt="" className={styles.albumCover} />
            <p className={styles.albumTitle}>{MUSIC_ALBUM_TITLE}</p>
            <button type="button" className={styles.selectAlbumButton} onClick={onSelectAlbum}>
              选择专辑
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export { albumCover }
