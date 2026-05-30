import {
  PHONE_INCOMING_MESSAGE,
  PHONE_REPLY_MESSAGE,
} from '../../data/level-01/quest-phone-message'
import type { PhoneMessageQuestPhase } from '../../core/types/state'
import styles from './PhoneMessageQuestOverlay.module.css'

interface PhoneMessageQuestOverlayProps {
  phase: PhoneMessageQuestPhase
  onOpenReply: () => void
  onSend: () => void
}

export default function PhoneMessageQuestOverlay({
  phase,
  onOpenReply,
  onSend,
}: PhoneMessageQuestOverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="手机消息">
      <div className={styles.messageStack}>
        <div className={styles.messageRow}>
          <div className={styles.incomingBubble}>
            <span className={styles.bubbleTail} aria-hidden="true" />
            <p className={styles.bubbleText}>{PHONE_INCOMING_MESSAGE}</p>
          </div>

          {phase === 'incoming' && (
            <button type="button" className={styles.replyButton} onClick={onOpenReply}>
              回复消息
            </button>
          )}
        </div>

        {phase === 'composing' && (
          <div className={styles.messageRow}>
            <div className={styles.outgoingBubble}>
              <p className={styles.bubbleText}>{PHONE_REPLY_MESSAGE}</p>
              <span className={styles.bubbleTailRight} aria-hidden="true" />
            </div>
            <button type="button" className={styles.sendButton} onClick={onSend}>
              发送
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
