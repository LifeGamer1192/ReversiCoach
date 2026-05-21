import { scoreMoves } from './ai'
import { countDiscs, idx } from './board'
import { evaluateFor } from './evaluation'
import type { Board, Player, Position } from './types'

/** Search depth the coach uses when judging a move's quality. */
const COMMENT_DEPTH = 3

const CORNER_SET = new Set<number>([
  idx(0, 0), idx(0, 7), idx(7, 0), idx(7, 7),
])

/** The four X-squares (diagonally adjacent to a corner). */
const X_SQUARE_SET = new Set<number>([
  idx(1, 1), idx(1, 6), idx(6, 1), idx(6, 6),
])

/** X-/C-squares mapped to the corner they sit beside. */
const NEAR_CORNER = new Map<number, number>([
  [idx(1, 1), idx(0, 0)], [idx(0, 1), idx(0, 0)], [idx(1, 0), idx(0, 0)],
  [idx(1, 6), idx(0, 7)], [idx(0, 6), idx(0, 7)], [idx(1, 7), idx(0, 7)],
  [idx(6, 1), idx(7, 0)], [idx(6, 0), idx(7, 0)], [idx(7, 1), idx(7, 0)],
  [idx(6, 6), idx(7, 7)], [idx(6, 7), idx(7, 7)], [idx(7, 6), idx(7, 7)],
])

/** How good a move was, plus a short explanation for the player. */
export interface MoveComment {
  /** A one-word verdict, e.g. 好手 / 疑問手. */
  verdict: string
  /** Overall tone, used for colour. */
  tone: 'good' | 'mid' | 'bad'
  /** Two or three short comment lines. */
  lines: string[]
}

function formatSquare(pos: Position): string {
  return `${pos.row + 1}行${pos.col + 1}列`
}

/** Classify a move's loss (vs the best move) into a quality grade. */
function gradeOf(loss: number): MoveGrade {
  if (loss <= 0) return 'best'
  if (loss <= 15) return 'good'
  if (loss <= 40) return 'fair'
  return 'poor'
}

/**
 * Judge the quality of `move` — just played by `player` on `boardBefore` —
 * and produce a short, player-facing comment of about three lines.
 */
export function commentOnMove(
  boardBefore: Board,
  player: Player,
  move: Position,
): MoveComment {
  const scored = scoreMoves(boardBefore, player, COMMENT_DEPTH)
  const sortedDesc = [...scored].sort((a, b) => b.score - a.score)
  const movedIdx = idx(move.row, move.col)

  const bestScore = sortedDesc[0].score
  const played = scored.find((s) => idx(s.move.row, s.move.col) === movedIdx)
  const playedScore = played ? played.score : bestScore
  const loss = bestScore - playedScore
  const rank =
    sortedDesc.findIndex((s) => idx(s.move.row, s.move.col) === movedIdx) + 1

  let verdict: string
  let tone: MoveComment['tone']
  if (loss <= 0) {
    verdict = '最善手'
    tone = 'good'
  } else if (loss <= 15) {
    verdict = '好手'
    tone = 'good'
  } else if (loss <= 40) {
    verdict = 'まずまず'
    tone = 'mid'
  } else if (loss <= 90) {
    verdict = '疑問手'
    tone = 'bad'
  } else {
    verdict = '悪手'
    tone = 'bad'
  }

  const lines: string[] = []

  // Line 1 — how the move ranked among the alternatives.
  if (scored.length === 1) {
    lines.push('打てる場所がここだけで、選択の余地はありませんでした。')
  } else if (loss <= 0) {
    lines.push(`候補 ${scored.length} 手の中で最も評価の高い手を選べました。`)
  } else {
    lines.push(
      `候補 ${scored.length} 手中 ${rank} 番目の評価で、最善手より約 ${loss} 点の損でした。`,
    )
  }

  // Line 2 — a positional note about the square that was played.
  const nearCorner = NEAR_CORNER.get(movedIdx)
  const cornerOpen = nearCorner !== undefined && boardBefore[nearCorner] === null
  if (CORNER_SET.has(movedIdx)) {
    lines.push('隅を確保しました。隅は決して返されない、最も価値の高い石です。')
  } else if (cornerOpen && X_SQUARE_SET.has(movedIdx)) {
    lines.push('X打ちです。隣の空き隅を相手に取られやすくなる危険な手です。')
  } else if (cornerOpen) {
    lines.push('C打ちです。隣の隅を相手に渡すきっかけになりやすい手です。')
  } else if (tone === 'good') {
    lines.push('形勢を保てる、無理のない手です。')
  } else if (tone === 'mid') {
    lines.push('大きな問題はありませんが、改善の余地があります。')
  } else {
    lines.push('相手に良い展開を許しやすい手でした。')
  }

  // Line 3 — encouragement, or where the better move was.
  if (loss <= 0) {
    lines.push('この調子で、隅を狙いつつ相手の打てる場所を減らしましょう。')
  } else {
    lines.push(`より良い手は ${formatSquare(sortedDesc[0].move)} 付近にありました。`)
  }

  return { verdict, tone, lines }
}

/** A quality grade for a candidate move, best to worst. */
export type MoveGrade = 'best' | 'good' | 'fair' | 'poor'

/** A legal move paired with its quality grade. */
export interface GradedMove {
  move: Position
  grade: MoveGrade
}

/**
 * Grade every legal move for `player` by quality, for guide mode.
 * Uses the same search depth as the move comments.
 */
export function gradeMoves(board: Board, player: Player): GradedMove[] {
  const scored = scoreMoves(board, player, COMMENT_DEPTH)
  if (scored.length === 0) return []

  let bestScore = -Infinity
  for (const { score } of scored) {
    if (score > bestScore) bestScore = score
  }

  return scored.map(({ move, score }) => ({
    move,
    grade: gradeOf(bestScore - score),
  }))
}

/** Search depth used for the post-game analysis. */
const ANALYSIS_DEPTH = 3

/** A detailed post-game review of the player's moves. */
export interface GameAnalysis {
  /** Roughly 15 lines; the first line is a heading. */
  lines: string[]
}

interface HumanMoveStat {
  ply: number
  square: Position
  loss: number
  grade: MoveGrade
  bestAlt: Position
  tookCorner: boolean
  riskyCornerPlay: boolean
}

/**
 * Analyse a finished game from `humanColor`'s point of view and produce a
 * detailed, roughly 15-line review of how the player performed.
 * `boards[i]` is the position before `moves[i]` was played.
 */
export function analyzeGame(
  boards: Board[],
  moves: ReadonlyArray<{ player: Player; move: Position }>,
  humanColor: Player,
): GameAnalysis {
  const stats: HumanMoveStat[] = []
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].player !== humanColor) continue
    const board = boards[i]
    const { move } = moves[i]
    const scored = scoreMoves(board, humanColor, ANALYSIS_DEPTH)
    if (scored.length === 0) continue
    const sorted = [...scored].sort((a, b) => b.score - a.score)
    const movedIdx = idx(move.row, move.col)
    const played = scored.find((s) => idx(s.move.row, s.move.col) === movedIdx)
    const loss = sorted[0].score - (played ? played.score : sorted[0].score)
    const near = NEAR_CORNER.get(movedIdx)
    stats.push({
      ply: i + 1,
      square: move,
      loss,
      grade: gradeOf(loss),
      bestAlt: sorted[0].move,
      tookCorner: CORNER_SET.has(movedIdx),
      riskyCornerPlay: near !== undefined && board[near] === null,
    })
  }

  const lines: string[] = ['【対局の振り返り】']

  const finalBoard = boards[boards.length - 1]
  const { black, white } = countDiscs(finalBoard)
  const humanDiscs = humanColor === 'black' ? black : white
  const aiDiscs = humanColor === 'black' ? white : black
  if (humanDiscs > aiDiscs) {
    lines.push(`結果: あなたの勝ち（あなた ${humanDiscs} 対 AI ${aiDiscs}）。お見事です。`)
  } else if (humanDiscs < aiDiscs) {
    lines.push(`結果: AI の勝ち（あなた ${humanDiscs} 対 AI ${aiDiscs}）。`)
  } else {
    lines.push(`結果: 引き分け（${humanDiscs} 対 ${aiDiscs}）。`)
  }

  if (stats.length === 0) {
    lines.push('あなたが着手できる場面がなく、手の解析はできませんでした。')
    return { lines }
  }

  const total = stats.length
  const bestN = stats.filter((s) => s.grade === 'best').length
  const goodN = stats.filter((s) => s.grade === 'good').length
  const fairN = stats.filter((s) => s.grade === 'fair').length
  const poorN = stats.filter((s) => s.grade === 'poor').length
  lines.push(
    `あなたの着手は全 ${total} 手。内訳は 最善手 ${bestN}・好手 ${goodN}・注意 ${fairN}・非推奨 ${poorN} です。`,
  )

  const accuracy = Math.round(((bestN + goodN) / total) * 100)
  lines.push(`最善手＋好手の割合（精度）は約 ${accuracy}% でした。`)
  if (accuracy >= 70) {
    lines.push('精度は高水準です。安定して良い手を選べています。')
  } else if (accuracy >= 45) {
    lines.push('精度はまずまずです。疑問手を減らせれば確実に伸びます。')
  } else {
    lines.push('精度には伸びしろがあります。一手ずつじっくり考えてみましょう。')
  }

  const worst = stats.reduce((a, b) => (b.loss > a.loss ? b : a))
  if (worst.loss > 20) {
    lines.push(
      `最も評価を落としたのは ${worst.ply} 手目（${formatSquare(worst.square)}）で、約 ${worst.loss} 点の損でした。`,
    )
    lines.push(`この局面では ${formatSquare(worst.bestAlt)} 付近がより良い手でした。`)
  } else {
    lines.push('際立った失着はなく、全体に大きな崩れはありませんでした。')
  }

  const corners = stats.filter((s) => s.tookCorner)
  if (corners.length > 0) {
    lines.push(
      `隅を ${corners.length} 回確保できました（例: ${corners[0].ply} 手目 ${formatSquare(corners[0].square)}）。隅は強い武器です。`,
    )
  } else {
    lines.push('今回は隅を取る場面がありませんでした。隅を狙う展開も意識してみましょう。')
  }

  const risky = stats.filter((s) => s.riskyCornerPlay).length
  lines.push(`空き隅のそば（X打ち・C打ち）への着手は ${risky} 回でした。`)
  if (risky >= 3) {
    lines.push('隅のそばに打つ回数が多めです。相手に隅を渡さない意識を強めましょう。')
  } else if (risky === 0) {
    lines.push('危険な隅のそばの手をうまく避けられていました。')
  } else {
    lines.push('隅のそばの手は概ね抑えられていました。')
  }

  // Phase trend, from the player's point of view.
  const openingEnd = Math.min(16, boards.length - 1)
  const openingEval = evaluateFor(boards[openingEnd], humanColor)
  const finalEval = evaluateFor(finalBoard, humanColor)
  const describe = (v: number) => (v > 25 ? '有利' : v < -25 ? '不利' : '互角')
  lines.push(`序盤を終えた時点の形勢は「${describe(openingEval)}」でした。`)
  if (finalEval > openingEval + 25) {
    lines.push('中盤以降で差を広げる展開に持ち込めました。')
  } else if (finalEval < openingEval - 25) {
    lines.push('中盤以降に形勢を損ねました。中盤の競り合いが今後の課題です。')
  } else {
    lines.push('中盤以降は大きな崩れなく進められました。')
  }

  // Closing advice, based on the most prominent weakness.
  if (fairN + poorN >= Math.ceil(total / 2)) {
    lines.push('助言: 疑問手が多めでした。ガイドモードで着手前に手の良し悪しを確かめると効果的です。')
  } else if (risky >= 3) {
    lines.push('助言: 隅周りの安全を意識すると、終盤の失点を減らせます。')
  } else {
    lines.push('助言: 良い精度です。ひとつ上の難易度にも挑戦してみましょう。')
  }
  lines.push('次の対局でも、隅の確保と相手の着手可能数を意識して打ってみてください。')

  return { lines }
}
