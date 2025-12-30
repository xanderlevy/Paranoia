"use client"

import { cn } from "@/lib/utils"
import { Pen, Target } from "lucide-react"
import type { Player } from "@/lib/socket-server"

interface PlayerLineProps {
  players: Player[]
  writerIndex: number
  pickerIndex: number
  selectedPlayerId: string | null
  currentPlayerId: string
}

export function PlayerLine({ players, writerIndex, pickerIndex, selectedPlayerId, currentPlayerId }: PlayerLineProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {players.map((player, index) => {
          const isWriter = index === writerIndex
          const isPicker = index === pickerIndex
          const isSelected = player.id === selectedPlayerId
          const isCurrent = player.id === currentPlayerId

          return (
            <div key={player.id} className="relative flex flex-col items-center gap-2">
              {/* Role indicator */}
              {isWriter && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Pen className="h-3 w-3" />
                  Writer
                </div>
              )}
              {isPicker && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Picker
                </div>
              )}

              {/* Player avatar */}
              <div
                className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 relative",
                  isCurrent ? "ring-4 ring-primary ring-offset-4 ring-offset-background" : "",
                  isSelected
                    ? "bg-accent text-accent-foreground scale-110 shadow-lg"
                    : "bg-muted text-muted-foreground",
                  isWriter || isPicker ? "shadow-md" : "",
                )}
              >
                {player.username[0].toUpperCase()}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-accent rounded-full flex items-center justify-center shadow-md">
                    <Target className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
              </div>

              {/* Player name */}
              <span
                className={cn(
                  "text-sm font-medium transition-all",
                  isCurrent ? "text-primary font-semibold" : "text-foreground/80",
                )}
              >
                {player.username}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
