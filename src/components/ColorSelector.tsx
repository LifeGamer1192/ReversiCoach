import type { Player } from '../engine/types'

interface ColorSelectorProps {
  /** The colour the human currently plays. */
  selected: Player
  /** Called when a side is chosen (the caller also restarts the game). */
  onSelect: (color: Player) => void
}

const OPTIONS: ReadonlyArray<{ color: Player; label: string }> = [
  { color: 'black', label: '先手（黒）' },
  { color: 'white', label: '後手（白）' },
]

/** Lets the player choose to play first (black) or second (white). */
export function ColorSelector({ selected, onSelect }: ColorSelectorProps) {
  return (
    <section className="picker" aria-label="手番">
      <span className="picker__label">手番</span>
      <div className="picker__options">
        {OPTIONS.map((option) => {
          const isSelected = option.color === selected
          return (
            <button
              key={option.color}
              type="button"
              className={`picker__btn${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.color)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
