import { NextResponse } from "next/server"

// Simple in-memory storage with Map for demo
let lobbies: Map<string, any>

if (typeof global !== "undefined") {
  if (!global.lobbies) {
    global.lobbies = new Map()
  }
  lobbies = global.lobbies
} else {
  lobbies = new Map()
}

export async function POST(request: Request) {
  try {
    const { lobbyId, playerId, isReady } = await request.json()

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const player = lobby.players.find((p: any) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    player.isReady = isReady
    lobby.lastActivity = Date.now()
    lobbies.set(lobbyId, lobby)

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error updating ready status:", error)
    return NextResponse.json({ error: "Failed to update ready status" }, { status: 500 })
  }
}
