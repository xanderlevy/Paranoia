"use client"

import { getSocket } from "@/lib/socket-client"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface RevealChoiceProps {
  lobbyId: string
}

export function RevealChoice({ lobbyId }: RevealChoiceProps) {
  const socket = getSocket()

  const handleChoice = (reveal: boolean) => {
    socket?.emit("choose-reveal", { lobbyId, reveal })
  }

  return (
    <div className="space-y-4 text-center">
      <h3 className="text-xl font-semibold">You won! Do you want to reveal the prompt?</h3>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => handleChoice(true)} size="lg" className="gap-2 bg-primary hover:bg-primary/90">
          <Eye className="h-5 w-5" />
          Reveal Prompt
        </Button>
        <Button onClick={() => handleChoice(false)} size="lg" variant="outline" className="gap-2 bg-transparent">
          <EyeOff className="h-5 w-5" />
          Keep Secret
        </Button>
      </div>
    </div>
  )
}
