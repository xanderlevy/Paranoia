"use client"

import { useState } from "react"
import { getSocket } from "@/lib/socket-client"
import { cn } from "@/lib/utils"

interface CardHandProps {
  cards: number[]
  lobbyId: string
  disabled?: boolean
}

export function CardHand({ cards, lobbyId, disabled = false }: CardHandProps) {
  const socket = getSocket()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleCardClick = (index: number) => {
    if (disabled) return
    setSelectedIndex(index)
  }

  const handlePlayCard = () => {
    if (selectedIndex === null || disabled) return
    socket?.emit("play-card", { lobbyId, cardIndex: selectedIndex })
    setSelectedIndex(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 justify-center flex-wrap">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            disabled={disabled}
            className={cn(
              "h-32 w-24 rounded-xl flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-lg",
              "hover:scale-105 active:scale-95",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              selectedIndex === index
                ? "bg-primary text-primary-foreground scale-110 -translate-y-2 shadow-2xl ring-4 ring-primary/50"
                : "bg-card text-foreground border-2 border-border",
            )}
          >
            {card}
          </button>
        ))}
      </div>
      {selectedIndex !== null && (
        <div className="flex justify-center">
          <button
            onClick={handlePlayCard}
            disabled={disabled}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Play Card
          </button>
        </div>
      )}
    </div>
  )
}
