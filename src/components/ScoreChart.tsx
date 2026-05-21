/** SVG view box; the chart scales to its container width. */
const VIEW_W = 320
const VIEW_H = 130
const PAD = 10

/** The y-axis always spans at least ±this, so small swings aren't exaggerated. */
const MIN_RANGE = 80

interface ScoreChartProps {
  /** Evaluation after each ply; `values[0]` is the opening position. */
  values: number[]
}

/** A line chart of how the board evaluation has moved over the game. */
export function ScoreChart({ values }: ScoreChartProps) {
  const plotW = VIEW_W - PAD * 2
  const plotH = VIEW_H - PAD * 2
  const midY = PAD + plotH / 2

  const range = Math.max(MIN_RANGE, ...values.map((v) => Math.abs(v)))
  const count = values.length
  const lastIndex = count - 1

  const xAt = (i: number) =>
    count <= 1 ? PAD + plotW / 2 : PAD + (i / (count - 1)) * plotW
  const yAt = (v: number) => midY - (v / range) * (plotH / 2)

  const points = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')

  return (
    <section className="chart" aria-label="評価値の推移">
      <div className="chart__caption">評価値の推移（上=黒有利／下=白有利）</div>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`評価値の推移。現在の評価値は ${values[lastIndex]}`}
      >
        <rect
          className="chart__bg"
          x="0"
          y="0"
          width={VIEW_W}
          height={VIEW_H}
          rx="8"
        />
        <line
          className="chart__zero"
          x1={PAD}
          y1={midY}
          x2={VIEW_W - PAD}
          y2={midY}
        />
        {count > 1 && <polyline className="chart__line" points={points} />}
        <circle
          className="chart__dot"
          cx={xAt(lastIndex)}
          cy={yAt(values[lastIndex])}
          r="3.5"
        />
      </svg>
    </section>
  )
}
