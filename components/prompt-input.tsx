"use client"

import { useState } from "react"
import { getSocket } from "@/lib/socket-client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface PromptInputProps {
  lobbyId: string
  pickerName: string
}

export function PromptInput({ lobbyId, pickerName }: PromptInputProps) {
  const socket = getSocket()
  const [prompt, setPrompt] = useState("")

  const handleSubmit = () => {
    if (!prompt.trim()) return
    socket?.emit("submit-prompt", { lobbyId, prompt: prompt.trim() })
    setPrompt("")
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Textarea
        placeholder={`Write a prompt for ${pickerName}... (e.g., "Who would you want on your team in a zombie apocalypse?")`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[120px] text-base resize-none"
      />
      <Button onClick={handleSubmit} disabled={!prompt.trim()} className="w-full h-12 text-base font-semibold">
        Submit Prompt
      </Button>
    </div>
  )
}
