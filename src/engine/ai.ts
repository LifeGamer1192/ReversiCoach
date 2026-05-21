import { applyMove, idx, legalMoves, opponent } from './board'
import { evaluateFor, POSITION_WEIGHTS } from './evaluation'
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
 * Negamax search with alpha-beta pruning: the best score `player` can
 * achieve on `board`, looking `depth` plies ahead. Moves are tried in
 * descending square value to make pruning more effective. A pass (no
 * legal move) hands the turn over without consuming depth; if neither
 * side can move the game is over and the static evaluation is returned.
 */
function alphabeta(
  board: Board,
  player: Player,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth <= 0) return evaluateFor(board, player)

  const moves = legalMoves(board, player)
  if (moves.length === 0) {
    const foe = opponent(player)
    if (legalMoves(board, foe).length === 0) {
      return evaluateFor(board, player)
    }
    return -alphabeta(board, foe, depth, -beta, -alpha)
  }

  moves.sort(
    (a, b) =>
      POSITION_WEIGHTS[idx(b.row, b.col)] - POSITION_WEIGHTS[idx(a.row, a.col)],
  )

  let best = -Infinity
  for (const move of moves) {
    const next = applyMove(board, player, move.row, move.col)
    const bound = Math.max(alpha, best)
    const score = -alphabeta(next, opponent(player), depth - 1, -beta, -bound)
    if (score > best) best = score
    if (best >= beta) break
  }
  return best
}

/** A legal move paired with its searched score (from the mover's view). */
export interface MoveScore {
  move: Position
  score: number
}

/**
 * Score every legal move for `player` by searching `depth` plies ahead
 * (a depth below 1 is treated as 1). Each move is searched with a full
 * window, so the returned scores are exact. Higher is better for `player`.
 */
export function scoreMoves(
  board: Board,
  player: Player,
  depth: number,
): MoveScore[] {
  const searchDepth = Math.max(1, depth)
  return legalMoves(board, player).map((move) => {
    const next = applyMove(board, player, move.row, move.col)
    return {
      move,
      score: -alphabeta(
        next,
        opponent(player),
        searchDepth - 1,
        -Infinity,
        Infinity,
      ),
    }
  })
}

/**
 * V3+ AI: choose the move leading to the best position for `player`,
 * searching `depth` plies ahead. Ties are broken randomly so games are
 * not perfectly repetitive.
 */
export function chooseMinimaxMove(
  board: Board,
  player: Player,
  depth: number,
  rng: () => number = Math.random,
): Position | null {
  const scored = scoreMoves(board, player, depth)
  if (scored.length === 0) return null

  let bestScore = -Infinity
  for (const { score } of scored) {
    if (score > bestScore) bestScore = score
  }
  const best = scored.filter((s) => s.score === bestScore)
  return best[Math.floor(rng() * best.length)].move
}

/**
 * Pick the AI's move for the given search depth: depth 0 plays at random,
 * depth >= 1 runs an alpha-beta search of that depth.
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
