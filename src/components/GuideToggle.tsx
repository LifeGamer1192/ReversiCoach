interface GuideToggleProps {
  /** Whether guide mode is currently on. */
  enabled: boolean
  /** True if the guide has been used at any point in the current game. */
  used: boolean
  /** How many take-backs ("一手戻す") have been used this game. */
  undoCount: number
  /** True while waiting for the player to confirm turning the guide on. */
  confirming: boolean
  onChange: (enabled: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

/** An on/off control for guide mode, with assist-usage markers. */
export function GuideToggle({
  enabled,
  used,
  undoCount,
  confirming,
  onChange,
  onConfirm,
  onCancel,
}: GuideToggleProps) {
  return (
    <section className="picker" aria-label="ガイドモード">
      <span className="picker__label">
        ガイド
        {used ? (
          <span className="guide-mark" title="この対局でガイドを使用しました">
            ★
          </span>
        ) : null}
        {undoCount > 0 ? (
          <span className="undo-mark" title="この対局での「一手戻す」使用回数">
            ↩{undoCount}
          </span>
        ) : null}
      </span>
      <div className="picker__options">
        {confirming ? (
          <>
            <button
              type="button"
              className="picker__btn picker__btn--warn"
              onClick={onConfirm}
            >
              使う（★が付きます）
            </button>
            <button type="button" className="picker__btn" onClick={onCancel}>
              やめる
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`picker__btn${!enabled ? ' is-selected' : ''}`}
              aria-pressed={!enabled}
              onClick={() => onChange(false)}
            >
              オフ
            </button>
            <button
              type="button"
              className={`picker__btn${enabled ? ' is-selected' : ''}`}
              aria-pressed={enabled}
              onClick={() => onChange(true)}
            >
              オン
            </button>
          </>
        )}
      </div>
    </section>
  )
}
