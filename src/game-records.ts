/** A finished game's outcome and how much assistance was used. */
export interface GameRecord {
  /** Unix timestamp when the game finished. */
  at: number
  result: 'win' | 'loss' | 'draw'
  /** Opponent character (emoji + name). */
  opponentName: string
  /** Whether guide mode was used during the game. */
  guideUsed: boolean
  /** How many times "一手戻す" (take-back) was used. */
  undoCount: number
  /** Whether the game was played in serious (no-assist) mode. */
  cleanMode: boolean
}

/** Aggregate stats derived from the stored records. */
export interface RecordStats {
  total: number
  unassistedWins: number
  cleanWins: number
  unassistedWinStreak: number
}

const STORAGE_KEY = 'reversicoach.records'
const MAX_RECORDS = 50

/** A game with no guide and no take-backs counts as an unassisted result. */
export function isUnassisted(record: GameRecord): boolean {
  return !record.guideUsed && record.undoCount === 0
}

/** Load the stored game records (empty if none or on any read error). */
export function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : []
  } catch {
    return []
  }
}

/** Append a record (keeping the most recent ones) and return the new list. */
export function saveRecord(record: GameRecord): GameRecord[] {
  const next = [...loadRecords(), record].slice(-MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage errors (e.g. private browsing / quota).
  }
  return next
}

/** Summarise the records into the headline stats. */
export function summarize(records: GameRecord[]): RecordStats {
  let unassistedWins = 0
  let cleanWins = 0
  for (const record of records) {
    if (record.result !== 'win') continue
    if (isUnassisted(record)) unassistedWins++
    if (record.cleanMode) cleanWins++
  }

  let unassistedWinStreak = 0
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i]
    if (record.result === 'win' && isUnassisted(record)) unassistedWinStreak++
    else break
  }

  return {
    total: records.length,
    unassistedWins,
    cleanWins,
    unassistedWinStreak,
  }
}
