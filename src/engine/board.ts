import type { Board, Player, Position, Score } from './types'

/** Side length of a standard reversi board. */
export const BOARD_SIZE = 8

const CELL_COUNT = BOARD_SIZE * BOARD_SIZE

/** The eight directions in which a line of discs can be flipped. */
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

/** Flat-array index for a (row, col) coordinate. */
export const idx = (row: number, col: number): number => row * BOARD_SIZE + col

/** Whether (row, col) lies on the board. */
export const inBounds = (row: number, col: number): boolean =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

/** The other player. */
export const opponent = (player: Player): Player =>
  player === 'black' ? 'white' : 'black'

/** A fresh board with the four standard starting discs. */
export function createInitialBoard(): Board {
  const board: Board = new Array(CELL_COUNT).fill(null)
  board[idx(3, 3)] = 'white'
  board[idx(3, 4)] = 'black'
  board[idx(4, 3)] = 'black'
  board[idx(4, 4)] = 'white'
  return board
}

/**
 * Indices of the opponent discs that `player` would flip by playing at
 * (row, col). An empty array means the move flips nothing and is illegal.
 */
export function flipsForMove(
  board: Board,
  player: Player,
  row: number,
  col: number,
): number[] {
  if (board[idx(row, col)] !== null) return []

  const foe = opponent(player)
  const flips: number[] = []

  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = []
    let r = row + dr
    let c = col + dc
    while (inBounds(r, c) && board[idx(r, c)] === foe) {
      line.push(idx(r, c))
      r += dr
      c += dc
    }
    // The run of opponent discs counts only if closed by the player's own disc.
    if (line.length > 0 && inBounds(r, c) && board[idx(r, c)] === player) {
      flips.push(...line)
    }
  }
  return flips
}

/** Whether `player` may legally play at (row, col). */
export function isLegalMove(
  board: Board,
  player: Player,
  row: number,
  col: number,
): boolean {
  return flipsForMove(board, player, row, col).length > 0
}

/** Every legal move for `player` on the current board. */
export function legalMoves(board: Board, player: Player): Position[] {
  const moves: Position[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isLegalMove(board, player, row, col)) {
        moves.push({ row, col })
      }
    }
  }
  return moves
}

/**
 * A new board with `player`'s move at (row, col) applied. The caller must
 * ensure the move is legal; an illegal move flips nothing.
 */
export function applyMove(
  board: Board,
  player: Player,
  row: number,
  col: number,
): Board {
  const flips = flipsForMove(board, player, row, col)
  const next = board.slice()
  next[idx(row, col)] = player
  for (const i of flips) next[i] = player
  return next
}

/** Disc counts for both players. */
export function countDiscs(board: Board): Score {
  let black = 0
  let white = 0
  for (const cell of board) {
    if (cell === 'black') black++
    else if (cell === 'white') white++
  }
  return { black, white }
}
