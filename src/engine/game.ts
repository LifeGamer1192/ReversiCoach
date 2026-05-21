import {
  applyMove,
  countDiscs,
  createInitialBoard,
  legalMoves,
  opponent,
} from './board'
import type { Board, Player, Position } from './types'

export type GameStatus = 'playing' | 'finished'

/** A complete, immutable snapshot of a game in progress. */
export interface GameState {
  board: Board
  /** Player to move. While `status` is 'finished' this is the last to move. */
  current: Player
  status: GameStatus
  /** Legal moves for `current`; empty once the game is finished. */
  legalMoves: Position[]
  /** Player skipped on the most recent turn for having no legal move, if any. */
  passedPlayer: Player | null
}

/** A new game: the standard opening position, black to move. */
export function createGame(): GameState {
  const board = createInitialBoard()
  return {
    board,
    current: 'black',
    status: 'playing',
    legalMoves: legalMoves(board, 'black'),
    passedPlayer: null,
  }
}

/**
 * Play the current player's move at (row, col) and hand over the turn.
 * The move must be one of `state.legalMoves`; an illegal call returns the
 * state unchanged.
 */
export function playMove(state: GameState, row: number, col: number): GameState {
  if (state.status !== 'playing') return state
  const legal = state.legalMoves.some((m) => m.row === row && m.col === col)
  if (!legal) return state

  const board = applyMove(state.board, state.current, row, col)
  return advanceTurn(board, opponent(state.current))
}

/**
 * Decide who moves next on `board`, where `next` is the player whose turn it
 * would normally be. Handles a forced pass and detects the end of the game.
 */
function advanceTurn(board: Board, next: Player): GameState {
  const nextMoves = legalMoves(board, next)
  if (nextMoves.length > 0) {
    return {
      board,
      current: next,
      status: 'playing',
      legalMoves: nextMoves,
      passedPlayer: null,
    }
  }

  // `next` has no legal move and must pass; the turn bounces back.
  const other = opponent(next)
  const otherMoves = legalMoves(board, other)
  if (otherMoves.length > 0) {
    return {
      board,
      current: other,
      status: 'playing',
      legalMoves: otherMoves,
      passedPlayer: next,
    }
  }

  // Neither player can move: the game is over.
  return {
    board,
    current: next,
    status: 'finished',
    legalMoves: [],
    passedPlayer: null,
  }
}

/** Winner of the given board by disc count, or 'draw' on a tie. */
export function getWinner(board: Board): Player | 'draw' {
  const { black, white } = countDiscs(board)
  if (black > white) return 'black'
  if (white > black) return 'white'
  return 'draw'
}
