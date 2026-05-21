import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdvantageBar } from './components/AdvantageBar'
import { Board } from './components/Board'
import { DifficultySelector } from './components/DifficultySelector'
import { MoveCommentCard } from './components/MoveCommentCard'
import { MoveLog } from './components/MoveLog'
import { ScoreChart } from './components/ScoreChart'
import { DEFAULT_DIFFICULTY, type DifficultyLevel } from './difficulty'
import { chooseAiMove } from './engine/ai'
import { countDiscs } from './engine/board'
import { commentOnMove, type MoveComment } from './engine/coach'
import { evaluateBoard } from './engine/evaluation'
import { createGame, getWinner, playMove, type GameState } from './engine/game'
import type { Player } from './engine/types'
import type { MovePlay } from './game-log'

/** The human plays black (and moves first); the AI plays white. */
const HUMAN: Player = 'black'
const AI: Player = 'white'

/** Pause before the AI moves, so its turn is visible to the player. */
const AI_DELAY_MS = 600

const PLAYER_LABEL: Record<Player, string> = {
  black: '黒（あなた）',
  white: '白（AI）',
}

/** The game played so far: every state, and every move that produced one. */
interface GameLog {
  /** Game states oldest-first; `states[0]` is the opening position. */
  states: GameState[]
  /** Moves played; `moves[i]` produced `states[i + 1]`. */
  moves: MovePlay[]
}

function newGameLog(): GameLog {
  return { states: [createGame()], moves: [] }
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DEFAULT_DIFFICULTY)
  const [log, setLog] = useState<GameLog>(newGameLog)

  const game = log.states[log.states.length - 1]

  // Drive the AI: on its turn, search for a move and play it after a short delay.
  useEffect(() => {
    if (game.status !== 'playing' || game.current !== AI) return
    const timer = setTimeout(() => {
      setLog((prev) => {
        const current = prev.states[prev.states.length - 1]
        if (current.status !== 'playing' || current.current !== AI) return prev
        const move = chooseAiMove(current.board, AI, difficulty.depth)
        if (!move) return prev
        const next = playMove(current, move.row, move.col)
        if (next === current) return prev
        return {
          states: [...prev.states, next],
          moves: [...prev.moves, { player: AI, move }],
        }
      })
    }, AI_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game, difficulty])

  const handleCellClick = useCallback((row: number, col: number) => {
    setLog((prev) => {
      const current = prev.states[prev.states.length - 1]
      if (current.status !== 'playing' || current.current !== HUMAN) return prev
      const next = playMove(current, row, col)
      if (next === current) return prev
      return {
        states: [...prev.states, next],
        moves: [...prev.moves, { player: HUMAN, move: { row, col } }],
      }
    })
  }, [])

  const handleRestart = useCallback(() => setLog(newGameLog()), [])

  // Changing the difficulty starts a fresh game, so each game is played
  // entirely against one opponent.
  const handleSelectDifficulty = useCallback((level: DifficultyLevel) => {
    setDifficulty(level)
    setLog(newGameLog())
  }, [])

  const score = countDiscs(game.board)
  const evaluation = evaluateBoard(game.board)

  const evalHistory = useMemo(
    () => log.states.map((state) => evaluateBoard(state.board)),
    [log],
  )

  // The coach's comment on the player's most recent move.
  const comment = useMemo<MoveComment | null>(() => {
    for (let i = log.moves.length - 1; i >= 0; i--) {
      if (log.moves[i].player === HUMAN) {
        return commentOnMove(log.states[i].board, HUMAN, log.moves[i].move)
      }
    }
    return null
  }, [log])

  const humanCanInteract = game.status === 'playing' && game.current === HUMAN

  return (
    <main className="app">
      <h1 className="app__title">ReversiCoach</h1>

      <DifficultySelector
        selectedId={difficulty.id}
        onSelect={handleSelectDifficulty}
      />

      <section className="scoreboard">
        {(['black', 'white'] as const).map((player) => (
          <div
            key={player}
            className={`scoreboard__side${game.current === player ? ' is-active' : ''}`}
          >
            <span className={`disc disc--${player}`} />
            <span className="scoreboard__label">{PLAYER_LABEL[player]}</span>
            <span className="scoreboard__count">{score[player]}</span>
          </div>
        ))}
      </section>

      <AdvantageBar score={evaluation} />

      <Board
        board={game.board}
        legalMoves={humanCanInteract ? game.legalMoves : []}
        interactive={humanCanInteract}
        onCellClick={handleCellClick}
      />

      <StatusMessage game={game} />

      <MoveCommentCard comment={comment} />

      <ScoreChart values={evalHistory} />

      <MoveLog moves={log.moves} />

      <button className="restart" type="button" onClick={handleRestart}>
        最初から
      </button>
    </main>
  )
}

/** One-line status under the board: turn prompt, pass notice, or result. */
function StatusMessage({ game }: { game: GameState }) {
  if (game.status === 'finished') {
    const winner = getWinner(game.board)
    const text =
      winner === 'draw' ? '引き分けです。' : `${PLAYER_LABEL[winner]} の勝ちです！`
    return <p className="status status--result">対局終了 — {text}</p>
  }

  const turnText =
    game.current === HUMAN
      ? 'あなたの番です。石を置く場所を選んでください。'
      : 'AI が考えています…'

  return (
    <p className="status">
      {game.passedPlayer ? (
        <span className="status__pass">
          {PLAYER_LABEL[game.passedPlayer]} は打てる場所がなくパスしました。{' '}
        </span>
      ) : null}
      {turnText}
    </p>
  )
}
