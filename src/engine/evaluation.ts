import { legalMoves } from './board'
import type { Board, Player } from './types'

/**
 * Positional value of each square, from black's point of view.
 * Corners are prized; the diagonally adjacent X-squares and the
 * edge-adjacent C-squares are penalised because occupying them early
 * tends to hand the opponent a corner.
 */
export const POSITION_WEIGHTS: readonly number[] = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
]

/** Value of each extra legal move one side has over the other. */
const MOBILITY_WEIGHT = 10

/**
 * Static evaluation of a board. Positive favours black, negative favours
 * white. Combines the positional weights with a mobility term (how many
 * more moves one side has than the other).
 */
export function evaluateBoard(board: Board): number {
  let positional = 0
  for (let i = 0; i < board.length; i++) {
    const cell = board[i]
    if (cell === 'black') positional += POSITION_WEIGHTS[i]
    else if (cell === 'white') positional -= POSITION_WEIGHTS[i]
  }

  const mobility =
    (legalMoves(board, 'black').length - legalMoves(board, 'white').length) *
    MOBILITY_WEIGHT

  return positional + mobility
}

/** Board evaluation from `player`'s point of view; higher is better. */
export function evaluateFor(board: Board, player: Player): number {
  const score = evaluateBoard(board)
  return player === 'black' ? score : -score
}
