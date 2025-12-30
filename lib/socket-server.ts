import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

export type Player = {
  id: string
  username: string
  cards: number[]
  isReady: boolean
}

export type Lobby = {
  id: string
  players: Player[]
  hostId: string
  gameStarted: boolean
  currentRound: {
    writerIndex: number
    pickerIndex: number
    prompt: string | null
    selectedPlayerId: string | null
    writerCard: number | null
    pickerCard: number | null
    revealPrompt: boolean
  } | null
}

const lobbies = new Map<string, Lobby>()

function dealCards(count: number): number[] {
  const cards: number[] = []
  for (let i = 0; i < count; i++) {
    cards.push(Math.floor(Math.random() * 13) + 1)
  }
  return cards.sort((a, b) => b - a)
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[v0] Client connected:", socket.id)

    // Event: Create Lobby
    socket.on("create-lobby", ({ username }: { username: string }) => {
      const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const player: Player = {
        id: socket.id,
        username,
        cards: [],
        isReady: false,
      }

      const lobby: Lobby = {
        id: lobbyId,
        players: [player],
        hostId: socket.id,
        gameStarted: false,
        currentRound: null,
      }

      lobbies.set(lobbyId, lobby)
      socket.join(lobbyId)

      socket.emit("lobby-created", { lobbyId, lobby })
      console.log("[v0] Lobby created:", lobbyId)
    })

    // Event: Join Lobby
    socket.on("join-lobby", ({ lobbyId, username }: { lobbyId: string; username: string }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        socket.emit("error", { message: "Lobby not found" })
        return
      }

      if (lobby.gameStarted) {
        socket.emit("error", { message: "Game already started" })
        return
      }

      const player: Player = {
        id: socket.id,
        username,
        cards: [],
        isReady: false,
      }

      lobby.players.push(player)
      socket.join(lobbyId)

      io.to(lobbyId).emit("player-joined", { lobby })
      console.log("[v0] Player joined lobby:", lobbyId, username)
    })

    // Event: Get Lobby
    socket.on("get-lobby", ({ lobbyId }: { lobbyId: string }, callback: (response: { lobby: Lobby | null; message?: string }) => void) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        callback({ lobby: null, message: "Lobby not found" })
        return
      }

      callback({ lobby })
      console.log("[v0] Lobby fetched:", lobbyId)
    })

    // Event: Start Game
    socket.on("start-game", ({ lobbyId }: { lobbyId: string }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || lobby.hostId !== socket.id) {
        socket.emit("error", { message: "Only host can start the game" })
        return
      }

      if (lobby.players.length < 3) {
        socket.emit("error", { message: "Need at least 3 players to start" })
        return
      }

      lobby.players.forEach((player) => {
        player.cards = dealCards(5)
      })

      lobby.gameStarted = true
      lobby.currentRound = {
        writerIndex: 0,
        pickerIndex: 1,
        prompt: null,
        selectedPlayerId: null,
        writerCard: null,
        pickerCard: null,
        revealPrompt: false,
      }

      io.to(lobbyId).emit("game-started", { lobby })
      console.log("[v0] Game started in lobby:", lobbyId)
    })

    // Event: Submit Prompt
    socket.on("submit-prompt", ({ lobbyId, prompt }: { lobbyId: string; prompt: string }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || !lobby.currentRound) return

      const writerPlayer = lobby.players[lobby.currentRound.writerIndex]
      if (writerPlayer.id !== socket.id) return

      lobby.currentRound.prompt = prompt

      io.to(lobbyId).emit("prompt-submitted", { lobby })
      console.log("[v0] Prompt submitted:", prompt)
    })

    // Event: Select Player
    socket.on("select-player", ({ lobbyId, playerId }: { lobbyId: string; playerId: string }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || !lobby.currentRound) return

      const pickerPlayer = lobby.players[lobby.currentRound.pickerIndex]
      if (pickerPlayer.id !== socket.id) return

      lobby.currentRound.selectedPlayerId = playerId

      io.to(lobbyId).emit("player-selected", { lobby })
      console.log("[v0] Player selected:", playerId)
    })

    // Event: Play Card
    socket.on("play-card", ({ lobbyId, cardIndex }: { lobbyId: string; cardIndex: number }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || !lobby.currentRound) return

      const writerPlayer = lobby.players[lobby.currentRound.writerIndex]
      const pickerPlayer = lobby.players[lobby.currentRound.pickerIndex]

      if (socket.id === writerPlayer.id) {
        lobby.currentRound.writerCard = writerPlayer.cards[cardIndex]
        writerPlayer.cards.splice(cardIndex, 1)
      } else if (socket.id === pickerPlayer.id) {
        lobby.currentRound.pickerCard = pickerPlayer.cards[cardIndex]
        pickerPlayer.cards.splice(cardIndex, 1)
      }

      if (lobby.currentRound.writerCard !== null && lobby.currentRound.pickerCard !== null) {
        const writerWins = lobby.currentRound.writerCard > lobby.currentRound.pickerCard

        if (writerWins) {
          lobby.currentRound.revealPrompt = true
        }

        io.to(lobbyId).emit("cards-played", { lobby, writerWins })
      } else {
        io.to(lobbyId).emit("card-played", { lobby })
      }

      console.log("[v0] Card played")
    })

    // Event: Choose Reveal
    socket.on("choose-reveal", ({ lobbyId, reveal }: { lobbyId: string; reveal: boolean }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || !lobby.currentRound) return

      const pickerPlayer = lobby.players[lobby.currentRound.pickerIndex]
      if (pickerPlayer.id !== socket.id) return

      lobby.currentRound.revealPrompt = reveal

      io.to(lobbyId).emit("reveal-chosen", { lobby })
      console.log("[v0] Picker chose to reveal:", reveal)
    })

    // Event: Next Round
    socket.on("next-round", ({ lobbyId }: { lobbyId: string }) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby || !lobby.currentRound) return

      const nextWriterIndex = (lobby.currentRound.writerIndex + 1) % lobby.players.length
      const nextPickerIndex = (nextWriterIndex + 1) % lobby.players.length

      // Deal new cards to players if they have fewer than 2
      lobby.players.forEach((player) => {
        if (player.cards.length < 2) {
          player.cards = dealCards(5)
        }
      })

      lobby.currentRound = {
        writerIndex: nextWriterIndex,
        pickerIndex: nextPickerIndex,
        prompt: null,
        selectedPlayerId: null,
        writerCard: null,
        pickerCard: null,
        revealPrompt: false,
      }

      io.to(lobbyId).emit("round-started", { lobby })
      console.log("[v0] Next round started")
    })

    socket.on("disconnect", () => {
      console.log("[v0] Client disconnected:", socket.id)

      lobbies.forEach((lobby, lobbyId) => {
        const playerIndex = lobby.players.findIndex((p) => p.id === socket.id)

        if (playerIndex !== -1) {
          lobby.players.splice(playerIndex, 1)

          if (lobby.players.length === 0) {
            lobbies.delete(lobbyId)
            console.log("[v0] Lobby deleted:", lobbyId)
          } else {
            // Assign new host if needed
            if (lobby.hostId === socket.id) {
              lobby.hostId = lobby.players[0].id
              console.log("[v0] New host assigned:", lobby.players[0].username)
            }

            io.to(lobbyId).emit("player-left", { lobby })
          }
        }
      })
    })
  })

  return io
}
