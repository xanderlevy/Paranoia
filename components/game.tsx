"use client"

import { useEffect, useReducer } from "react"
import { getSocket } from "@/lib/socket-client"
import { Card } from "@/components/ui/card"
import { PlayerLine } from "@/components/player-line"
import { CardHand } from "@/components/card-hand"
import { PromptInput } from "@/components/prompt-input"
import { PlayerSelector } from "@/components/player-selector"
import { CardReveal } from "@/components/card-reveal"
import { RevealChoice } from "@/components/reveal-choice"
import { Button } from "@/components/ui/button"
import type { Lobby as LobbyType } from "@/lib/socket-server"

interface GameProps {
  lobby: LobbyType
  username: string
}

type GameState = {
  lobby: LobbyType
  phase:
    | "waiting-for-prompt"
    | "waiting-for-player-selection"
    | "waiting-for-cards"
    | "revealing-cards"
    | "picker-choice"
    | "round-complete"
}

type GameAction =
  | { type: "UPDATE_LOBBY"; payload: LobbyType }
  | { type: "PROMPT_SUBMITTED" }
  | { type: "PLAYER_SELECTED" }
  | { type: "CARD_PLAYED" }
  | { type: "CARDS_REVEALED"; payload: { writerWins: boolean } }
  | { type: "REVEAL_CHOSEN" }
  | { type: "NEXT_ROUND" }

function gameReducer(state: GameState, action: GameAction): GameState {
  console.log("[v0] Game state transition:", action.type, "Current phase:", state.phase)

  switch (action.type) {
    case "UPDATE_LOBBY":
      return { ...state, lobby: action.payload }

    case "PROMPT_SUBMITTED":
      return { ...state, phase: "waiting-for-player-selection" }

    case "PLAYER_SELECTED":
      return { ...state, phase: "waiting-for-cards" }

    case "CARD_PLAYED":
      return state

    case "CARDS_REVEALED":
      if (action.payload.writerWins) {
        return { ...state, phase: "round-complete" }
      }
      return { ...state, phase: "picker-choice" }

    case "REVEAL_CHOSEN":
      return { ...state, phase: "round-complete" }

    case "NEXT_ROUND":
      return { ...state, phase: "waiting-for-prompt" }

    default:
      return state
  }
}

export function Game({ lobby: initialLobby, username }: GameProps) {
  const socket = getSocket()
  const [state, dispatch] = useReducer(gameReducer, {
    lobby: initialLobby,
    phase: "waiting-for-prompt",
  })

  const currentPlayerId = socket?.id || ""
  const currentPlayer = state.lobby.players.find((p) => p.id === currentPlayerId)
  const round = state.lobby.currentRound

  useEffect(() => {
    if (!socket) return

    socket.on("game-started", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
    })

    socket.on("prompt-submitted", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "PROMPT_SUBMITTED" })
    })

    socket.on("player-selected", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "PLAYER_SELECTED" })
    })

    socket.on("card-played", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "CARD_PLAYED" })
    })

    socket.on("cards-played", ({ lobby, writerWins }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "CARDS_REVEALED", payload: { writerWins } })
    })

    socket.on("reveal-chosen", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "REVEAL_CHOSEN" })
    })

    socket.on("round-started", ({ lobby }) => {
      dispatch({ type: "UPDATE_LOBBY", payload: lobby })
      dispatch({ type: "NEXT_ROUND" })
    })

    return () => {
      socket.off("game-started")
      socket.off("prompt-submitted")
      socket.off("player-selected")
      socket.off("card-played")
      socket.off("cards-played")
      socket.off("reveal-chosen")
      socket.off("round-started")
    }
  }, [socket])

  const writer = state.lobby.players[state.lobby.currentRound?.writerIndex || 0]
  const picker = state.lobby.players[state.lobby.currentRound?.pickerIndex || 0]
  const isWriter = writer.id === currentPlayerId
  const isPicker = picker.id === currentPlayerId

  if (!round) return null

  const handleNextRound = () => {
    socket?.emit("next-round", { lobbyId: state.lobby.id })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Player Line */}
        <PlayerLine
          players={state.lobby.players}
          writerIndex={round.writerIndex}
          pickerIndex={round.pickerIndex}
          selectedPlayerId={round.selectedPlayerId}
          currentPlayerId={currentPlayerId}
        />

        {/* Main Game Area */}
        <Card className="p-8 shadow-xl border-border/50">
          <div className="space-y-6">
            {/* Phase: Writer submits prompt */}
            {state.phase === "waiting-for-prompt" && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-balance">
                    {isWriter ? "You are the Writer" : `${writer.username} is writing a prompt`}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {isWriter ? `Write a prompt for ${picker.username}` : "Waiting for the prompt..."}
                  </p>
                </div>
                {isWriter && <PromptInput lobbyId={state.lobby.id} pickerName={picker.username} />}
              </div>
            )}

            {/* Phase: Picker selects a player */}
            {state.phase === "waiting-for-player-selection" && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-balance">
                    {isPicker ? "Select a Player" : `${picker.username} is selecting a player`}
                  </h2>
                  {isPicker && round.prompt && (
                    <p className="text-xl text-foreground/90 italic text-balance">"{round.prompt}"</p>
                  )}
                  {!isPicker && (
                    <p className="text-muted-foreground">The picker is reading the prompt and choosing...</p>
                  )}
                </div>
                {isPicker && (
                  <PlayerSelector
                    lobbyId={state.lobby.id}
                    players={state.lobby.players}
                    currentPlayerId={currentPlayerId}
                  />
                )}
              </div>
            )}

            {/* Phase: Both play cards */}
            {state.phase === "waiting-for-cards" && (
              <div className="space-y-4">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold">Play Your Card</h2>
                  {(isWriter || isPicker) && round.prompt && (
                    <p className="text-xl text-foreground/90 italic text-balance">"{round.prompt}"</p>
                  )}
                  {round.selectedPlayerId && (
                    <p className="text-lg text-muted-foreground">
                      Selected:{" "}
                      <span className="font-semibold text-foreground">
                        {state.lobby.players.find((p) => p.id === round.selectedPlayerId)?.username}
                      </span>
                    </p>
                  )}
                  {(isWriter || isPicker) && (
                    <p className="text-sm text-muted-foreground">Choose your best card to play!</p>
                  )}
                </div>
                {(isWriter || isPicker) && currentPlayer && (
                  <CardHand
                    cards={currentPlayer.cards}
                    lobbyId={state.lobby.id}
                    disabled={(isWriter && round.writerCard !== null) || (isPicker && round.pickerCard !== null)}
                  />
                )}
                {!isWriter && !isPicker && (
                  <div className="text-center space-y-2">
                    <p className="text-lg text-muted-foreground">
                      {writer.username} and {picker.username} are selecting their cards...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Phase: Cards revealed */}
            {(state.phase === "revealing-cards" || state.phase === "picker-choice") &&
              round.writerCard &&
              round.pickerCard && (
                <div className="space-y-6">
                  <CardReveal
                    writerName={writer.username}
                    pickerName={picker.username}
                    writerCard={round.writerCard}
                    pickerCard={round.pickerCard}
                    prompt={round.prompt}
                    revealPrompt={round.revealPrompt}
                    selectedPlayer={state.lobby.players.find((p) => p.id === round.selectedPlayerId)}
                  />
                  {state.phase === "picker-choice" && isPicker && <RevealChoice lobbyId={state.lobby.id} />}
                  {state.phase === "picker-choice" && !isPicker && (
                    <p className="text-center text-muted-foreground">
                      {picker.username} is deciding whether to reveal...
                    </p>
                  )}
                </div>
              )}

            {/* Phase: Round complete */}
            {state.phase === "round-complete" && (
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold">Round Complete</h2>
                {round.revealPrompt && round.prompt && (
                  <div className="space-y-2">
                    <p className="text-xl text-primary italic text-balance">"{round.prompt}"</p>
                    {round.selectedPlayerId && (
                      <p className="text-lg text-muted-foreground">
                        Answer:{" "}
                        <span className="font-semibold text-foreground">
                          {state.lobby.players.find((p) => p.id === round.selectedPlayerId)?.username}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                <Button onClick={handleNextRound} size="lg" className="h-14 px-10 text-lg font-semibold">
                  Next Round
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Player's hand (always visible when not actively playing) */}
        {currentPlayer && state.phase !== "waiting-for-cards" && currentPlayer.cards.length > 0 && (
          <Card className="p-6 shadow-lg border-border/50">
            <h3 className="text-lg font-semibold mb-4 text-center">Your Remaining Cards</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              {currentPlayer.cards.map((card, index) => (
                <div
                  key={index}
                  className="h-24 w-16 rounded-lg bg-card border-2 border-border flex items-center justify-center text-2xl font-bold shadow-sm"
                >
                  {card}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
