interface GuideToggleProps {
  /** Whether guide mode is currently on. */
  enabled: boolean
  /** True if the guide has been used at any point in the current game. */
  used: boolean
  onChange: (enabled: boolean) => void
}

/** An on/off control for guide mode, styled like the other picker rows. */
export function GuideToggle({ enabled, used, onChange }: GuideToggleProps) {
  return (
    <section className="picker" aria-label="ガイドモード">
      <span className="picker__label">
        ガイド
        {used ? (
          <span className="guide-mark" title="この対局でガイドを使用しました">
            ★
          </span>
        ) : null}
      </span>
      <div className="picker__options">
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
      </div>
    </section>
  )
}
