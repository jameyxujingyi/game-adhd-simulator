import type { BgColorId } from '../../data/level-01/quest-bg-select'
import { BG_COLORS } from '../../data/level-01/quest-bg-select'
import type { BgSelectQuestState } from '../../core/types/state'
import styles from './BgSelectOverlay.module.css'

interface BgSelectOverlayProps {
  quest: BgSelectQuestState
  onSelectColor: (colorId: BgColorId) => void
  onDismissSuccess: () => void
}

const BG_SWATCH_CLASS: Record<BgColorId, string> = {
  'light-green': styles.swatchGreen,
  'light-blue': styles.swatchBlue,
  'light-orange': styles.swatchOrange,
}

export default function BgSelectOverlay({
  quest,
  onSelectColor,
  onDismissSuccess,
}: BgSelectOverlayProps) {
  if (quest.successVisible) {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.feedbackCard}>
          <p className={styles.feedbackText}>{quest.feedback}</p>
          <button type="button" className={styles.dismissButton} onClick={onDismissSuccess}>
            好的
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="选择背景颜色">
      <div className={styles.dialogColumn}>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>选择背景颜色</p>
          <div className={styles.colorRow}>
            {BG_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                className={`${styles.colorSwatch} ${BG_SWATCH_CLASS[color.id]}`}
                aria-label={color.label}
                onClick={() => onSelectColor(color.id)}
              />
            ))}
          </div>
        </div>
        {quest.feedback && (
          <div className={styles.thoughtWrap} role="status">
            <div className={styles.thoughtBubble}>
              <p className={styles.thoughtText}>{quest.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
