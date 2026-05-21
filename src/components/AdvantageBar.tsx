/** Maps the raw evaluation onto the bar via tanh; larger = less sensitive. */
const BAR_SCALE = 150

/** A short verdict in Japanese for the given signed evaluation. */
function advantageLabel(score: number): string {
  const magnitude = Math.abs(score)
  if (magnitude < 22) return '互角'
  const side = score > 0 ? '黒' : '白'
  if (magnitude < 90) return `${side} やや有利`
  if (magnitude < 230) return `${side} 有利`
  return `${side} 優勢`
}

interface AdvantageBarProps {
  /** Static board evaluation: positive favours black, negative favours white. */
  score: number
}

/** A horizontal bar visualising the balance of advantage between both sides. */
export function AdvantageBar({ score }: AdvantageBarProps) {
  const blackRatio = 0.5 + 0.5 * Math.tanh(score / BAR_SCALE)
  const blackPercent = Math.round(blackRatio * 100)

  return (
    <section className="advantage" aria-label="有利度">
      <div className="advantage__head">
        <span className="advantage__verdict">{advantageLabel(score)}</span>
        <span className="advantage__score">
          評価値 {score > 0 ? '+' : ''}
          {score}
        </span>
      </div>
      <div className="advantage__bar">
        <div
          className="advantage__fill advantage__fill--black"
          style={{ width: `${blackPercent}%` }}
        />
        <div
          className="advantage__fill advantage__fill--white"
          style={{ width: `${100 - blackPercent}%` }}
        />
        <span className="advantage__center" aria-hidden="true" />
      </div>
    </section>
  )
}
