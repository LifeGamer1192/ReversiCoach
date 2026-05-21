interface ModeSelectorProps {
  /** True when serious (no-assist) mode is active. */
  cleanMode: boolean
  /** Called when a mode is chosen (the caller also restarts the game). */
  onSelect: (cleanMode: boolean) => void
}

/**
 * Picks between the normal mode and 真剣勝負 mode, which hides every
 * in-game aid (guide, coach comment, advantage bar, chart, take-back).
 */
export function ModeSelector({ cleanMode, onSelect }: ModeSelectorProps) {
  return (
    <section className="picker" aria-label="モード">
      <span className="picker__label">モード</span>
      <div className="picker__options">
        <button
          type="button"
          className={`picker__btn${!cleanMode ? ' is-selected' : ''}`}
          aria-pressed={!cleanMode}
          onClick={() => onSelect(false)}
        >
          通常
        </button>
        <button
          type="button"
          className={`picker__btn${cleanMode ? ' is-selected' : ''}`}
          aria-pressed={cleanMode}
          onClick={() => onSelect(true)}
        >
          真剣勝負
        </button>
      </div>
    </section>
  )
}
