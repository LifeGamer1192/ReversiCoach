import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdvantageBar } from './components/AdvantageBar'
import { Board } from './components/Board'
import { CharacterSelector } from './components/CharacterSelector'
import { ColorSelector } from './components/ColorSelector'
import { GameAnalysisCard } from './components/GameAnalysisCard'
import { GuideLegend } from './components/GuideLegend'
import { GuideToggle } from './components/GuideToggle'
import { MoveCommentCard } from './components/MoveCommentCard'
import { MoveLog } from './components/MoveLog'
import { ScoreChart } from './components/ScoreChart'
import { DEFAULT_DIFFICULTY, type DifficultyLevel } from './difficulty'
import { chooseAiMove } from './engine/ai'
import { countDiscs, opponent } from './engine/board'
import {
  analyzeGame,
  commentOnMove,
  gradeMoves,
  type GameAnalysis,
  type GradedMove,
  type MoveComment,
} from './engine/coach'
import { evaluateBoard } from './engine/evaluation'
import { createGame, getWinner, playMove, type GameState } from './engine/game'
import type { Player } from './engine/types'
import type { MovePlay } from './game-log'

/** Pause before the AI moves, so its turn is visible to the player. */
const AI_DELAY_MS = 600

/** Scoreboard label for a disc colour (the AI side just reads "AI"). */
function playerLabel(color: Player, humanColor: Player): string {
  const name = color === 'black' ? '黒' : '白'
  return `${name}（${color === humanColor ? 'あなた' : 'AI'}）`
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
  const [guideEnabled, setGuideEnabled] = useState(false)
  // True once the guide has been switched on during the current game; a
  // small ★ then marks the session. Cleared by a reload or a new game.
  const [guideUsed, setGuideUsed] = useState(false)
  const [log, setLog] = useState<GameLog>(newGameLog)
  // When the human plays second, the game waits on a "start" press so the AI
  // does not move on its own the instant 後手 is chosen.
  const [started, setStarted] = useState(true)

  const aiColor = opponent(humanColor)
  const aiName = `${difficulty.emoji}${difficulty.name}`
  const game = log.states[log.states.length - 1]

  // Drive the AI: on its turn, search for a move and play it after a short delay.
  useEffect(() => {
    if (!started || game.status !== 'playing' || game.current !== aiColor) return
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
  }, [game, aiColor, difficulty, started])

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

  // Start a fresh game. It begins immediately when the human plays first
  // (先手); when the human is 後手, it waits for the "対局開始" press.
  const startFreshGame = useCallback(
    (color: Player) => {
      setLog(newGameLog())
      setStarted(color === 'black')
      // A new game: the ★ persists only if the guide is already on.
      setGuideUsed(guideEnabled)
    },
    [guideEnabled],
  )

  const handleRestart = useCallback(
    () => startFreshGame(humanColor),
    [startFreshGame, humanColor],
  )

  // Undo: revert to the position just before the player's most recent move,
  // discarding that move and the AI's reply so the player can choose again.
  const handleUndo = useCallback(() => {
    setLog((prev) => {
      let lastHuman = -1
      for (let i = prev.moves.length - 1; i >= 0; i--) {
        if (prev.moves[i].player === humanColor) {
          lastHuman = i
          break
        }
      }
      if (lastHuman < 0) return prev
      return {
        states: prev.states.slice(0, lastHuman + 1),
        moves: prev.moves.slice(0, lastHuman),
      }
    })
  }, [humanColor])

  const handleSelectDifficulty = useCallback(
    (level: DifficultyLevel) => {
      setDifficulty(level)
      startFreshGame(humanColor)
    },
    [startFreshGame, humanColor],
  )

  // Changing the side starts a fresh game.
  const handleSelectColor = useCallback(
    (color: Player) => {
      setHumanColor(color)
      startFreshGame(color)
    },
    [startFreshGame],
  )

  // Switching the guide on while a game is in progress marks the session.
  const handleToggleGuide = useCallback(
    (enabled: boolean) => {
      setGuideEnabled(enabled)
      if (enabled && game.status === 'playing') setGuideUsed(true)
    },
    [game.status],
  )

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

  // The detailed review, produced once the game is finished.
  const analysis = useMemo<GameAnalysis | null>(() => {
    if (game.status !== 'finished') return null
    return analyzeGame(
      log.states.map((state) => state.board),
      log.moves,
      humanColor,
    )
  }, [game.status, log, humanColor])

  const humanCanInteract =
    started && game.status === 'playing' && game.current === humanColor

  // Guide mode: grade the player's options so the hints can be colour-coded.
  const guide = useMemo<GradedMove[] | null>(() => {
    if (!guideEnabled || !humanCanInteract) return null
    return gradeMoves(game.board, humanColor)
  }, [guideEnabled, humanCanInteract, game, humanColor])

  const canUndo = log.moves.some((m) => m.player === humanColor)

  return (
    <main className="app">
      <h1 className="app__title">ReversiCoach</h1>

      <ColorSelector selected={humanColor} onSelect={handleSelectColor} />
      <CharacterSelector
        selectedId={difficulty.id}
        onSelect={handleSelectDifficulty}
      />
      <GuideToggle
        enabled={guideEnabled}
        used={guideUsed}
        onChange={handleToggleGuide}
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
        guide={guide}
        onCellClick={handleCellClick}
      />

      {guide ? <GuideLegend /> : null}

      {started ? (
        <StatusMessage game={game} humanColor={humanColor} aiName={aiName} />
      ) : (
        <div className="startgate">
          <p className="status">
            後手（白）です。「対局開始」を押すと {aiName} が先に着手します。
          </p>
          <button
            className="ctrl-btn ctrl-btn--primary"
            type="button"
            onClick={() => setStarted(true)}
          >
            対局開始
          </button>
        </div>
      )}

      {analysis ? <GameAnalysisCard analysis={analysis} /> : null}

      <MoveCommentCard comment={comment} />

      <ScoreChart values={evalHistory} />

      <MoveLog moves={log.moves} />

      <div className="controls">
        <button
          className="ctrl-btn"
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
        >
          一手戻す
        </button>
        <button
          className="ctrl-btn ctrl-btn--primary"
          type="button"
          onClick={handleRestart}
        >
          最初から
        </button>
      </div>
    </main>
  )
}

/** One-line status under the board: turn prompt, pass notice, or result. */
function StatusMessage({
  game,
  humanColor,
  aiName,
}: {
  game: GameState
  humanColor: Player
  aiName: string
}) {
  const sideName = (color: Player) => (color === humanColor ? 'あなた' : aiName)

  if (game.status === 'finished') {
    const winner = getWinner(game.board)
    const text =
      winner === 'draw'
        ? '引き分けです。'
        : `${sideName(winner)} の勝ちです！`
    return <p className="status status--result">対局終了 — {text}</p>
  }

  const turnText =
    game.current === humanColor
      ? 'あなたの番です。石を置く場所を選んでください。'
      : `${aiName} が考えています…`

  return (
    <p className="status">
      {game.passedPlayer ? (
        <span className="status__pass">
          {sideName(game.passedPlayer)} は打てる場所がなくパスしました。{' '}
        </span>
      ) : null}
      {turnText}
    </p>
  )
}
