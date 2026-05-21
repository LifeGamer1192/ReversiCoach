/**
 * An AI difficulty option: a display label and the negamax search depth
 * it uses. Depth 0 means random play.
 */
export interface DifficultyLevel {
  id: string
  label: string
  depth: number
}

/** Selectable difficulties, easiest first. */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  { id: 'random', label: 'ランダム', depth: 0 },
  { id: 'look1', label: '1手読み', depth: 1 },
  { id: 'look2', label: '2手読み', depth: 2 },
  { id: 'look3', label: '3手読み', depth: 3 },
]

/** Difficulty selected when the app first loads (1手読み). */
export const DEFAULT_DIFFICULTY: DifficultyLevel = DIFFICULTY_LEVELS[1]
