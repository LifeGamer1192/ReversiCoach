import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdvantageBar } from './components/AdvantageBar'
import { Board } from './components/Board'
import { ColorSelector } from './components/ColorSelector'
import { DifficultySelector } from './components/DifficultySelector'
import { MoveCommentCard } from './components/MoveCommentCard'
import { MoveLog } from './components/MoveLog'
import { ScoreChart } from './components/ScoreChart'
import { DEFAULT_DIFFICULTY, type DifficultyLevel } from './difficulty'
import { chooseAiMove } from './engine/ai'
import { countDiscs, opponent } from './engine/board'
import { commentOnMove, type MoveComment } from './engine/coach'
import { evaluateBoard } from './engine/evaluation'
import { createGame, getWinner, playMove, type GameState } from './engine/game'
import type { Player } from './engine/types'
import type { MovePlay } from './game-log'

/** Pause before the AI moves, so its turn is visible to the player. */
const AI_DELAY_MS = 600

/** Display label for a disc colour, noting whether it is the human or AI. */
function playerLabel(color: Player, humanColor: Player): string {
  const name = color === 'black' ? '黒' : '白'
  const role = color === humanColor ? 'あなた' : 'AI'
  return `${name}（${role}）`
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
  const [humanColor, setHumanColor] = useState<Player>('black')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DEFAULT_DIFFICULTY)
  const [log, setLog] = useState<GameLog>(newGameLog)

  const aiColor = opponent(humanColor)
  const game = log.states[log.states.length - 1]

  // Drive the AI: on its turn, search for a move and play it after a short delay.
  useEffect(() => {
    if (game.status !== 'playing' || game.current !== aiColor) return
    const timer = setTimeout(() => {
      setLog((prev) => {
        const current = prev.states[prev.states.length - 1]
        if (current.status !== 'playing' || current.current !== aiColor) return prev
        const move = chooseAiMove(current.board, aiColor, difficulty.depth)
        if (!move) return prev
        const next = playMove(current, move.row, move.col)
        if (next === current) return prev
        return {
          states: [...prev.states, next],
          moves: [...prev.moves, { player: aiColor, move }],
        }
      })
    }, AI_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game, aiColor, difficulty])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setLog((prev) => {
        const current = prev.states[prev.states.length - 1]
        if (current.status !== 'playing' || current.current !== humanColor) return prev
        const next = playMove(current, row, col)
        if (next === current) return prev
        return {
          states: [...prev.states, next],
          moves: [...prev.moves, { player: humanColor, move: { row, col } }],
        }
      })
    },
    [humanColor],
  )

  const handleRestart = useCallback(() => setLog(newGameLog()), [])

  const handleSelectDifficulty = useCallback((level: DifficultyLevel) => {
    setDifficulty(level)
    setLog(newGameLog())
  }, [])

  // Changing the side starts a fresh game.
  const handleSelectColor = useCallback((color: Player) => {
    setHumanColor(color)
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
      if (log.moves[i].player === humanColor) {
        return commentOnMove(log.states[i].board, humanColor, log.moves[i].move)
      }
    }
    return null
  }, [log, humanColor])

  const humanCanInteract = game.status === 'playing' && game.current === humanColor

  return (
    <main className="app">
      <h1 className="app__title">ReversiCoach</h1>

      <ColorSelector selected={humanColor} onSelect={handleSelectColor} />
      <DifficultySelector
        selectedId={difficulty.id}
        onSelect={handleSelectDifficulty}
      />

      <section className="scoreboard">
        {(['black', 'white'] as const).map((color) => (
          <div
            key={color}
            className={`scoreboard__side${game.current === color ? ' is-active' : ''}`}
          >
            <span className={`disc disc--${color}`} />
            <span className="scoreboard__label">{playerLabel(color, humanColor)}</span>
            <span className="scoreboard__count">{score[color]}</span>
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

      <StatusMessage game={game} humanColor={humanColor} />

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
function StatusMessage({
  game,
  humanColor,
}: {
  game: GameState
  humanColor: Player
}) {
  if (game.status === 'finished') {
    const winner = getWinner(game.board)
    const text =
      winner === 'draw'
        ? '引き分けです。'
        : `${playerLabel(winner, humanColor)} の勝ちです！`
    return <p className="status status--result">対局終了 — {text}</p>
  }

  const turnText =
    game.current === humanColor
      ? 'あなたの番です。石を置く場所を選んでください。'
      : 'AI が考えています…'

  return (
    <p className="status">
      {game.passedPlayer ? (
        <span className="status__pass">
          {playerLabel(game.passedPlayer, humanColor)} は打てる場所がなくパスしました。{' '}
        </span>
      ) : null}
      {turnText}
    </p>
  )
}
