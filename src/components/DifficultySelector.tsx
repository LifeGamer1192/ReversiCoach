import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../difficulty'

interface DifficultySelectorProps {
  /** `id` of the currently selected difficulty. */
  selectedId: string
  /** Called when a difficulty is chosen (the caller also restarts the game). */
  onSelect: (level: DifficultyLevel) => void
}

/** A row of buttons for choosing the AI difficulty (its search depth). */
export function DifficultySelector({ selectedId, onSelect }: DifficultySelectorProps) {
  return (
    <section className="difficulty" aria-label="難易度">
      <span className="difficulty__label">難易度</span>
      <div className="difficulty__options">
        {DIFFICULTY_LEVELS.map((level) => {
          const selected = level.id === selectedId
          return (
            <button
              key={level.id}
              type="button"
              className={`difficulty__btn${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(level)}
            >
              {level.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
