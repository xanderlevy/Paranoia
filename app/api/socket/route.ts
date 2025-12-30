import type { NextRequest } from "next/server"
import type { Server as SocketIOServer } from "socket.io"

// Extend NodeJS global to include our socket server
declare global {
  var io: SocketIOServer | undefined
}

// We'll initialize Socket.io on first request
export async function GET(req: NextRequest) {
  if (!global.io) {
    // Socket.io will be initialized in the middleware
    return new Response(JSON.stringify({ message: "Socket server not initialized" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ message: "Socket server is running" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
