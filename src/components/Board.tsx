import { BOARD_SIZE, idx } from '../engine/board'
import type { GradedMove } from '../engine/coach'
import type { Board as BoardModel, Position } from '../engine/types'

interface BoardProps {
  board: BoardModel
  /** Cells the player may click; each is drawn with a hint marker. */
  legalMoves: Position[]
  /** Whether the player can currently click cells. */
  interactive: boolean
  /** When set, legal-move hints are colour-coded by quality (guide mode). */
  guide: GradedMove[] | null
  onCellClick: (row: number, col: number) => void
}

/** The 8x8 reversi board, rendered as a CSS grid of cell buttons. */
export function Board({
  board,
  legalMoves,
  interactive,
  guide,
  onCellClick,
}: BoardProps) {
  const legalSet = new Set(legalMoves.map((m) => idx(m.row, m.col)))
  const gradeByCell = new Map(
    (guide ?? []).map((g) => [idx(g.move.row, g.move.col), g.grade] as const),
  )

  return (
    <div className="board">
      {board.map((cell, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const playable = interactive && legalSet.has(i)
        const grade = gradeByCell.get(i)
        return (
          <button
            key={i}
            type="button"
            className="cell"
            disabled={!playable}
            onClick={() => onCellClick(row, col)}
            aria-label={`${row + 1}行 ${col + 1}列`}
          >
            {cell ? (
              <span className={`disc disc--${cell}`} />
            ) : (
              playable && (
                <span className={`hint${grade ? ` hint--${grade}` : ''}`} />
              )
            )}
          </button>
        )
      })}
    </div>
  )
}
