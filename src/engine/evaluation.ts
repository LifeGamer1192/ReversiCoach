import { BOARD_SIZE, countDiscs, idx, inBounds, legalMoves } from './board'
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

/** The eight neighbour directions. */
const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

/** At or below this many empty squares, the disc count starts to dominate. */
const ENDGAME_EMPTIES = 12

/** Each corner with the two edge directions that lead away from it. */
const CORNER_EDGES: ReadonlyArray<
  readonly [number, number, ReadonlyArray<readonly [number, number]>]
> = [
  [0, 0, [[0, 1], [1, 0]]],
  [0, 7, [[0, -1], [1, 0]]],
  [7, 0, [[0, 1], [-1, 0]]],
  [7, 7, [[0, -1], [-1, 0]]],
]

/**
 * Count the discs of `player` that are certainly stable: the corners they
 * own, plus unbroken same-colour runs along the edges from those corners.
 * This is a conservative approximation — it never counts an unstable disc.
 */
function countStable(board: Board, player: Player): number {
  const stable = new Set<number>()
  for (const [cornerRow, cornerCol, dirs] of CORNER_EDGES) {
    if (board[idx(cornerRow, cornerCol)] !== player) continue
    stable.add(idx(cornerRow, cornerCol))
    for (const [dr, dc] of dirs) {
      let r = cornerRow + dr
      let c = cornerCol + dc
      while (inBounds(r, c) && board[idx(r, c)] === player) {
        stable.add(idx(r, c))
        r += dr
        c += dc
      }
    }
  }
  return stable.size
}

/**
 * Static evaluation of a board. Positive favours black, negative favours
 * white. Combines positional weights, stable discs, frontier discs (those
 * touching an empty square — a liability), mobility, and the disc count
 * (which matters mainly in the endgame).
 */
export function evaluateBoard(board: Board): number {
  let blackDiscs = 0
  let whiteDiscs = 0
  let positional = 0
  let blackFrontier = 0
  let whiteFrontier = 0

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[idx(r, c)]
      if (cell === null) continue

      if (cell === 'black') {
        blackDiscs++
        positional += POSITION_WEIGHTS[idx(r, c)]
      } else {
        whiteDiscs++
        positional -= POSITION_WEIGHTS[idx(r, c)]
      }

      let onFrontier = false
      for (const [dr, dc] of NEIGHBOURS) {
        if (inBounds(r + dr, c + dc) && board[idx(r + dr, c + dc)] === null) {
          onFrontier = true
          break
        }
      }
      if (onFrontier) {
        if (cell === 'black') blackFrontier++
        else whiteFrontier++
      }
    }
  }

  const empties = 64 - blackDiscs - whiteDiscs
  const endgame = empties <= ENDGAME_EMPTIES

  const stable = countStable(board, 'black') - countStable(board, 'white')
  const frontier = blackFrontier - whiteFrontier
  const mobility =
    legalMoves(board, 'black').length - legalMoves(board, 'white').length
  const discDiff = blackDiscs - whiteDiscs

  return (
    positional +
    stable * 12 -
    frontier * 4 +
    mobility * (endgame ? 4 : 14) +
    discDiff * (endgame ? 12 : 1)
  )
}

/** Board evaluation from `player`'s point of view; higher is better. */
export function evaluateFor(board: Board, player: Player): number {
  const score = evaluateBoard(board)
  return player === 'black' ? score : -score
}

/**
 * Score of a finished position from `player`'s point of view: the disc
 * difference, scaled to match the endgame disc weight of the heuristic so
 * the search transitions smoothly into an exact endgame result.
 */
export function terminalScore(board: Board, player: Player): number {
  const { black, white } = countDiscs(board)
  const diff = black - white
  return (player === 'black' ? diff : -diff) * 12
}
