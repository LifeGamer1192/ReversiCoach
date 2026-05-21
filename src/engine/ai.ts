import { applyMove, legalMoves, opponent } from './board'
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
 * Negamax search: the best score `player` can achieve when it is their
 * turn on `board`, looking `depth` plies ahead. A pass (no legal move)
 * hands the turn over without consuming depth; if neither side can move
 * the game is over and the static evaluation is returned.
 */
function negamax(board: Board, player: Player, depth: number): number {
  if (depth <= 0) return evaluateFor(board, player)

  const moves = legalMoves(board, player)
  if (moves.length === 0) {
    const foe = opponent(player)
    if (legalMoves(board, foe).length === 0) {
      return evaluateFor(board, player)
    }
    return -negamax(board, foe, depth)
  }

  let best = -Infinity
  for (const move of moves) {
    const next = applyMove(board, player, move.row, move.col)
    const score = -negamax(next, opponent(player), depth - 1)
    if (score > best) best = score
  }
  return best
}

/**
 * V3 AI: choose the move leading to the best position for `player`,
 * searching `depth` plies ahead with negamax. Ties are broken randomly
 * so games are not perfectly repetitive.
 */
export function chooseMinimaxMove(
  board: Board,
  player: Player,
  depth: number,
  rng: () => number = Math.random,
): Position | null {
  const moves = legalMoves(board, player)
  if (moves.length === 0) return null

  let bestScore = -Infinity
  let bestMoves: Position[] = []
  for (const move of moves) {
    const next = applyMove(board, player, move.row, move.col)
    const score = -negamax(next, opponent(player), depth - 1)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [move]
    } else if (score === bestScore) {
      bestMoves.push(move)
    }
  }
  return bestMoves[Math.floor(rng() * bestMoves.length)]
}

/**
 * Pick the AI's move for the given search depth: depth 0 plays at random,
 * depth >= 1 runs a negamax search of that depth.
 */
export function chooseAiMove(
  board: Board,
  player: Player,
  depth: number,
  rng: () => number = Math.random,
): Position | null {
  return depth <= 0
    ? chooseRandomMove(board, player, rng)
    : chooseMinimaxMove(board, player, depth, rng)
}
