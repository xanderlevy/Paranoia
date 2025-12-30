"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: "/api/socketio",
        addTrailingSlash: false,
      })

      socket.on("connect", () => {
        console.log("[v0] Connected to socket server")
        setIsConnected(true)
      })

      socket.on("disconnect", () => {
        console.log("[v0] Disconnected from socket server")
        setIsConnected(false)
      })
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  return { socket, isConnected }
}

export function getSocket() {
  return socket
}
