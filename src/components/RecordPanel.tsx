import type { RecordStats } from '../game-records'

interface RecordPanelProps {
  stats: RecordStats
}

/** A compact summary of the player's stored game records. */
export function RecordPanel({ stats }: RecordPanelProps) {
  return (
    <section className="record" aria-label="戦績">
      <span className="record__title">戦績</span>
      <span className="record__item">
        ノーアシスト勝利 <b>{stats.unassistedWins}</b>
      </span>
      <span className="record__item">
        連勝 <b>{stats.unassistedWinStreak}</b>
      </span>
      <span className="record__item">
        真剣勝負勝利 <b>{stats.cleanWins}</b>
      </span>
      <span className="record__item record__item--muted">総 {stats.total}局</span>
    </section>
  )
}
