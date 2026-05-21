interface GuideToggleProps {
  /** Whether guide mode is currently on. */
  enabled: boolean
  onChange: (enabled: boolean) => void
}

/** An on/off control for guide mode, styled like the other picker rows. */
export function GuideToggle({ enabled, onChange }: GuideToggleProps) {
  return (
    <section className="picker" aria-label="ガイドモード">
      <span className="picker__label">ガイド</span>
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
