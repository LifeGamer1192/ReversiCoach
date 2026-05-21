import type { GameAnalysis } from '../engine/coach'

interface GameAnalysisCardProps {
  analysis: GameAnalysis
}

/** The detailed post-game review, shown once the game has finished. */
export function GameAnalysisCard({ analysis }: GameAnalysisCardProps) {
  const [title, ...body] = analysis.lines

  return (
    <section className="analysis" aria-label="対局の振り返り">
      <div className="analysis__title">{title}</div>
      {body.map((line, i) => (
        <p key={i} className="analysis__line">
          {line}
        </p>
      ))}
    </section>
  )
}
