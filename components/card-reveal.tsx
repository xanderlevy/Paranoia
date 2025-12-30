"use client"

import { cn } from "@/lib/utils"
import type { Player } from "@/lib/socket-server"

interface CardRevealProps {
  writerName: string
  pickerName: string
  writerCard: number
  pickerCard: number
  prompt: string | null
  revealPrompt: boolean
  selectedPlayer?: Player
}

export function CardReveal({
  writerName,
  pickerName,
  writerCard,
  pickerCard,
  prompt,
  revealPrompt,
  selectedPlayer,
}: CardRevealProps) {
  const writerWins = writerCard > pickerCard

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="flex gap-8 justify-center items-end">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{writerName}</span>
          <div
            className={cn(
              "h-40 w-28 rounded-xl flex items-center justify-center text-5xl font-bold shadow-2xl transition-all duration-500",
              writerWins
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-card text-foreground border-2 border-border",
            )}
          >
            {writerCard}
          </div>
          {writerWins && <span className="text-primary font-semibold text-sm">Winner!</span>}
        </div>

        <div className="text-4xl text-muted-foreground font-light mb-12">vs</div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{pickerName}</span>
          <div
            className={cn(
              "h-40 w-28 rounded-xl flex items-center justify-center text-5xl font-bold shadow-2xl transition-all duration-500",
              !writerWins
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-card text-foreground border-2 border-border",
            )}
          >
            {pickerCard}
          </div>
          {!writerWins && <span className="text-primary font-semibold text-sm">Winner!</span>}
        </div>
      </div>

      {/* Prompt reveal */}
      {revealPrompt && prompt && (
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-semibold">Prompt Revealed:</h3>
          <p className="text-2xl text-primary italic text-balance">"{prompt}"</p>
          {selectedPlayer && (
            <p className="text-muted-foreground">
              Answer: <span className="font-semibold text-foreground">{selectedPlayer.username}</span>
            </p>
          )}
        </div>
      )}

      {!revealPrompt && <p className="text-center text-muted-foreground italic">The prompt remains a secret...</p>}
    </div>
  )
}
