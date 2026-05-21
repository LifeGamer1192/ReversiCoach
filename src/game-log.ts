import type { Player, Position } from './engine/types'

/** A single played move: who moved, and where. */
export interface MovePlay {
  player: Player
  move: Position
}
