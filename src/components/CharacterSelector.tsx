import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../difficulty'

interface CharacterSelectorProps {
  /** `id` of the currently selected opponent. */
  selectedId: string
  /** Called when an opponent is chosen (the caller also restarts the game). */
  onSelect: (level: DifficultyLevel) => void
}

/** A grid of comical AI characters to pick as the opponent (= difficulty). */
export function CharacterSelector({ selectedId, onSelect }: CharacterSelectorProps) {
  const selected =
    DIFFICULTY_LEVELS.find((level) => level.id === selectedId) ?? DIFFICULTY_LEVELS[0]

  return (
    <section className="chars" aria-label="対戦相手">
      <span className="chars__label">対戦相手</span>
      <div className="chars__grid">
        {DIFFICULTY_LEVELS.map((level) => {
          const isSelected = level.id === selectedId
          return (
            <button
              key={level.id}
              type="button"
              className={`char${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(level)}
            >
              <span className="char__emoji">{level.emoji}</span>
              <span className="char__name">{level.name}</span>
              <span className="char__depth">
                {level.depth === 0 ? 'ランダム' : `${level.depth}手読み`}
              </span>
            </button>
          )
        })}
      </div>
      <p className="chars__tagline">
        {selected.emoji} {selected.name} — {selected.tagline}
      </p>
    </section>
  )
}
