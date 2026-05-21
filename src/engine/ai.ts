import { legalMoves } from './board'
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
