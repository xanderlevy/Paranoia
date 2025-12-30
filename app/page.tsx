"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useSocket } from "@/lib/socket-client"
import { Lobby } from "@/components/lobby"

export default function HomePage() {
  const { socket, isConnected } = useSocket()
  const [username, setUsername] = useState("")
  const [lobbyId, setLobbyId] = useState("")
  const [currentLobby, setCurrentLobby] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleCreateLobby = () => {
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    socket?.emit("create-lobby", { username })

    socket?.once("lobby-created", ({ lobbyId }) => {
      setCurrentLobby(lobbyId)
      setError("")
    })
  }

  const handleJoinLobby = () => {
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    if (!lobbyId.trim()) {
      setError("Please enter a lobby code")
      return
    }

    socket?.emit("join-lobby", { lobbyId: lobbyId.toUpperCase(), username })
    socket?.once("player-joined", () => {
      setCurrentLobby(lobbyId.toUpperCase())
      setError("")
    })

    socket?.once("error", ({ message }) => {
      setError(message)
    })
  }

  if (currentLobby) {
    return <div>{currentLobby}<Lobby lobbyId={currentLobby} username={username} /></div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-4xl font-bold tracking-tight text-balance">Paranoia</CardTitle>
          <CardDescription className="text-base">A party game of secrets and revelations</CardDescription>
          {!isConnected && <p className="text-sm text-muted-foreground">Connecting to server...</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isConnected}
            />
          </div>

          <div className="space-y-3">
            <Button className="w-full h-12 text-base font-semibold" onClick={handleCreateLobby} disabled={!isConnected}>
              Create New Lobby
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or join existing</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter lobby code"
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                disabled={!isConnected}
              />
              <Button
                className="w-full bg-transparent"
                variant="outline"
                onClick={handleJoinLobby}
                disabled={!isConnected}
              >
                Join Lobby
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
