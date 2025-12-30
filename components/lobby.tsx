"use client"

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, Copy, CheckCircle2 } from "lucide-react"
import { Game } from "@/components/game"
import type { Lobby as LobbyType } from "@/lib/socket-server"

interface LobbyProps {
  lobbyId: string
  username: string
}

export function Lobby({ lobbyId, username }: LobbyProps) {
  const socket = getSocket()
  const [lobby, setLobby] = useState<LobbyType | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!socket) return

    // Listen for lobby updates
    socket.on("lobby-created", ({ lobby }) => setLobby(lobby))
    socket.on("player-joined", ({ lobby }) => setLobby(lobby))
    socket.on("player-left", ({ lobby }) => setLobby(lobby))
    socket.on("game-started", ({ lobby }) => setLobby(lobby))

    socket.emit("get-lobby", { lobbyId }, (response: { lobby: LobbyType | null; message?: string }) => {
      console.log("Fetching lobby with ID:", lobbyId, response);
      if (response.lobby) {
        setLobby(response.lobby)
      } else {
        console.error("Failed to get lobby:", response.message)
      }
    })


    return () => {
      socket.off("lobby-created")
      socket.off("player-joined")
      socket.off("player-left")
      socket.off("game-started")
    }
  }, [socket])

  const handleStartGame = () => {
    socket?.emit("start-game", { lobbyId })
  }

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

 
  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading lobby...</p>
      </div>
    )
  }

  if (lobby.gameStarted) {
    return <Game lobby={lobby} username={username} />
  }

  const isHost = lobby.hostId === socket?.id

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl shadow-xl border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">Lobby</CardTitle>
            <Button variant="outline" size="sm" onClick={copyLobbyCode} className="gap-2 bg-transparent">
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {lobbyId}
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="text-sm">
              {lobby.players.length} {lobby.players.length === 1 ? "player" : "players"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {lobby.players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">{player.username[0].toUpperCase()}</span>
                  </div>
                  <span className="font-medium">{player.username}</span>
                </div>
                {player.id === lobby.hostId && (
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Host
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {lobby.players.length < 3 && (
            <p className="text-sm text-center text-muted-foreground">Waiting for at least 3 players to start...</p>
          )}

          {isHost && (
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleStartGame}
              disabled={lobby.players.length < 3}
            >
              Start Game
            </Button>
          )}

          {!isHost && (
            <p className="text-sm text-center text-muted-foreground">Waiting for host to start the game...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
