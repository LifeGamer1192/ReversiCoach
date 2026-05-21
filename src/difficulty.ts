/**
 * An AI opponent: a comical character paired with a search depth.
 * Depth 0 means random play; depth N runs an N-ply search.
 */
export interface DifficultyLevel {
  id: string
  /** Character name. */
  name: string
  /** Emoji face for the character. */
  emoji: string
  /** A short, comical description. */
  tagline: string
  /** Negamax search depth (0 = random). */
  depth: number
}

/** Selectable opponents, weakest first. */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  {
    id: 'random',
    name: 'きまぐれネコ',
    emoji: '🐱',
    tagline: '気分で石を置く。先を読む気はゼロ。',
    depth: 0,
  },
  {
    id: 'look1',
    name: 'ひよこ',
    emoji: '🐤',
    tagline: '一手先だけ見る、駆け出しの新人。',
    depth: 1,
  },
  {
    id: 'look2',
    name: 'ふんばりイヌ',
    emoji: '🐶',
    tagline: '二手先まで読む、なかなかやる相手。',
    depth: 2,
  },
  {
    id: 'look3',
    name: 'さくしキツネ',
    emoji: '🦊',
    tagline: '三手先を読む、小ずるい策士。',
    depth: 3,
  },
  {
    id: 'look4',
    name: 'フクロウ先生',
    emoji: '🦉',
    tagline: '四手先まで見通す、盤上の賢者。',
    depth: 4,
  },
  {
    id: 'look5',
    name: 'リバーシ王',
    emoji: '👑',
    tagline: '五手先まで読む、最強の対戦相手。',
    depth: 5,
  },
]

/** Opponent selected when the app first loads (ひよこ / 1手読み). */
export const DEFAULT_DIFFICULTY: DifficultyLevel = DIFFICULTY_LEVELS[1]
