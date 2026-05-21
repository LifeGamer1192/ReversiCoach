import type { Position } from '../engine/types'
import type { MovePlay } from '../game-log'

interface MoveLogProps {
  moves: MovePlay[]
}

function formatSquare(pos: Position): string {
  return `${pos.row + 1}行${pos.col + 1}列`
}

/** A scrollable list of every move played so far, newest first. */
export function MoveLog({ moves }: MoveLogProps) {
  return (
    <section className="movelog" aria-label="着手ログ">
      <div className="movelog__title">着手ログ（{moves.length}手）</div>
      {moves.length === 0 ? (
        <p className="movelog__empty">まだ着手はありません。</p>
      ) : (
        <ol className="movelog__list">
          {moves
            .map((m, i) => ({ ...m, ply: i + 1 }))
            .reverse()
            .map((m) => (
              <li key={m.ply} className="movelog__item">
                <span className="movelog__ply">{m.ply}</span>
                <span className={`disc disc--${m.player}`} />
                <span className="movelog__square">{formatSquare(m.move)}</span>
              </li>
            ))}
        </ol>
      )}
    </section>
  )
}
