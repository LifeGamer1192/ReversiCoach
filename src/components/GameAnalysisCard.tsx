import type { GameAnalysis } from '../engine/coach'

/** Assist usage for the finished game. */
interface AssistInfo {
  guideUsed: boolean
  undoCount: number
  cleanMode: boolean
}

interface GameAnalysisCardProps {
  analysis: GameAnalysis
  assist: AssistInfo
}

function assistSummary(assist: AssistInfo): { clean: boolean; text: string } {
  if (assist.cleanMode) {
    return { clean: true, text: '真剣勝負モード — アシストなしの公式記録です。' }
  }
  if (!assist.guideUsed && assist.undoCount === 0) {
    return { clean: true, text: 'アシストなしの対局でした（公式記録）。' }
  }
  const parts: string[] = []
  if (assist.guideUsed) parts.push('ガイド')
  if (assist.undoCount > 0) parts.push(`待った${assist.undoCount}回`)
  return { clean: false, text: `アシスト使用 — ${parts.join('・')}。` }
}

/** The detailed post-game review, shown once the game has finished. */
export function GameAnalysisCard({ analysis, assist }: GameAnalysisCardProps) {
  const [title, ...body] = analysis.lines
  const { clean, text } = assistSummary(assist)

  return (
    <section className="analysis" aria-label="対局の振り返り">
      <div className="analysis__title">{title}</div>
      <div className={`analysis__assist ${clean ? 'is-clean' : 'is-assisted'}`}>
        {clean ? '✓ ' : '★ '}
        {text}
      </div>
      {body.map((line, i) => (
        <p key={i} className="analysis__line">
          {line}
        </p>
      ))}
    </section>
  )
}
