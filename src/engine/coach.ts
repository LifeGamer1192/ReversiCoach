import { scoreMoves } from './ai'
import { idx } from './board'
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
