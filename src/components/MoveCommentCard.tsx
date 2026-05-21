import type { MoveComment } from '../engine/coach'

interface MoveCommentCardProps {
  comment: MoveComment | null
}

/** Shows the coach's verdict and explanation for the player's latest move. */
export function MoveCommentCard({ comment }: MoveCommentCardProps) {
  if (!comment) {
    return (
      <section className="coach coach--empty" aria-label="コーチのコメント">
        あなたが着手すると、その手についてコーチがコメントします。
      </section>
    )
  }

  return (
    <section className={`coach coach--${comment.tone}`} aria-label="コーチのコメント">
      <div className="coach__head">
        <span className="coach__badge">コーチ</span>
        <span className="coach__verdict">{comment.verdict}</span>
      </div>
      {comment.lines.map((line, i) => (
        <p key={i} className="coach__line">
          {line}
        </p>
      ))}
    </section>
  )
}
