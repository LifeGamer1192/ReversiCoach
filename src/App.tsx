import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { AdvantageBar } from './components/AdvantageBar'
import { Board } from './components/Board'
import { chooseGreedyMove } from './engine/ai'
import { countDiscs } from './engine/board'
import { evaluateBoard } from './engine/evaluation'
import { createGame, getWinner, playMove, type GameState } from './engine/game'
import type { Player } from './engine/types'

/** The human plays black (and moves first); the AI plays white. */
const HUMAN: Player = 'black'
const AI: Player = 'white'

/** Pause before the AI moves, so its turn is visible to the player. */
const AI_DELAY_MS = 600

const PLAYER_LABEL: Record<Player, string> = {
  black: '黒（あなた）',
  white: '白（AI）',
}

export default function App() {
  const [game, setGame] = useState<GameState>(createGame)

  // Drive the AI: on its turn, play the highest-scoring move after a short delay.
  useEffect(() => {
    if (game.status !== 'playing' || game.current !== AI) return
    const timer = setTimeout(() => {
      setGame((current) => {
        if (current.status !== 'playing' || current.current !== AI) return current
        const move = chooseGreedyMove(current.board, AI)
        return move ? playMove(current, move.row, move.col) : current
      })
    }, AI_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game])

  const handleCellClick = useCallback((row: number, col: number) => {
    setGame((current) => {
      if (current.status !== 'playing' || current.current !== HUMAN) return current
      return playMove(current, row, col)
    })
  }, [])

  const handleRestart = useCallback(() => setGame(createGame()), [])

  const score = countDiscs(game.board)
  const evaluation = evaluateBoard(game.board)
  const humanCanInteract = game.status === 'playing' && game.current === HUMAN

  return (
    <main className="app">
      <h1 className="app__title">ReversiCoach</h1>

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
