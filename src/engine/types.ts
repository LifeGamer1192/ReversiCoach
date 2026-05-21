/** The two sides in a game of reversi. */
export type Player = 'black' | 'white'

/** Contents of one square: a disc, or empty. */
export type Cell = Player | null

/**
 * The board as a flat 64-element array.
 * Index is `row * 8 + col`, with row and col each in 0..7.
 */
export type Board = Cell[]

/** A board coordinate. */
export interface Position {
  row: number
  col: number
}

/** Disc counts for both players. */
export interface Score {
  black: number
  white: number
}
