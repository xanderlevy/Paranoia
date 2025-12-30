"use client"

import { useState } from "react"
import { getSocket } from "@/lib/socket-client"
import { cn } from "@/lib/utils"
import type { Player } from "@/lib/socket-server"
import { Button } from "@/components/ui/button"

interface PlayerSelectorProps {
  lobbyId: string
  players: Player[]
  currentPlayerId: string
}

export function PlayerSelector({ lobbyId, players, currentPlayerId }: PlayerSelectorProps) {
  const socket = getSocket()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!selectedPlayerId) return
    socket?.emit("select-player", { lobbyId, playerId: selectedPlayerId })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 justify-center flex-wrap">
        {players
          .filter((p) => p.id !== currentPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayerId(player.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300",
                selectedPlayerId === player.id
                  ? "bg-accent text-accent-foreground scale-110 shadow-xl ring-4 ring-accent/50"
                  : "bg-muted/50 hover:bg-muted hover:scale-105",
              )}
            >
              <div
                className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold",
                  selectedPlayerId === player.id ? "bg-accent-foreground/10" : "bg-background",
                )}
              >
                {player.username[0].toUpperCase()}
              </div>
              <span className="font-medium">{player.username}</span>
            </button>
          ))}
      </div>
      {selectedPlayerId && (
        <div className="flex justify-center">
          <Button onClick={handleConfirm} className="h-12 px-8 text-base font-semibold">
            Confirm Selection
          </Button>
        </div>
      )}
    </div>
  )
}
