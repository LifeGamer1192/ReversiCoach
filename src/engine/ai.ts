import { applyMove, legalMoves } from './board'
import { evaluateFor } from './evaluation'
import type { Board, Player, Position } from './types'

/**
 * V1 AI: choose uniformly at random among all legal moves.
 * `rng` is injectable so games can be made deterministic in tests.
 */
export function chooseRandomMove(
  board: Board,
  player: Player,
  rng: () => number = Math.random,
): Position | null {
  const moves = legalMoves(board, player)
  if (moves.length === 0) return null
  return moves[Math.floor(rng() * moves.length)]
}

/**
 * V2 AI: choose the move whose resulting board has the best static
 * evaluation for `player` — a one-ply greedy search. Ties are broken
 * randomly so games are not perfectly repetitive.
 */
export function chooseGreedyMove(
  board: Board,
  player: Player,
  rng: () => number = Math.random,
): Position | null {
  const moves = legalMoves(board, player)
  if (moves.length === 0) return null

  let bestScore = -Infinity
  let bestMoves: Position[] = []
  for (const move of moves) {
    const next = applyMove(board, player, move.row, move.col)
    const score = evaluateFor(next, player)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [move]
    } else if (score === bestScore) {
      bestMoves.push(move)
    }
  }
  return bestMoves[Math.floor(rng() * bestMoves.length)]
}
