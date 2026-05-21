const ITEMS: ReadonlyArray<{ grade: string; label: string }> = [
  { grade: 'best', label: '最善' },
  { grade: 'good', label: '好手' },
  { grade: 'fair', label: '注意' },
  { grade: 'poor', label: '非推奨' },
]

/** A small colour key shown on the board while guide mode is on. */
export function GuideLegend() {
  return (
    <div className="legend" aria-label="ガイドの色の凡例">
      {ITEMS.map((item) => (
        <span key={item.grade} className="legend__item">
          <span className={`legend__dot legend__dot--${item.grade}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
