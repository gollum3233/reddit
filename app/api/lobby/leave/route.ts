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
    const { lobbyId, playerId } = await request.json()

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    // Remove player from lobby
    lobby.players = lobby.players.filter((p: any) => p.id !== playerId)

    // If lobby is empty, delete it
    if (lobby.players.length === 0) {
      lobbies.delete(lobbyId)
      return NextResponse.json({ success: true, lobbyDeleted: true })
    }

    // If the host left, assign new host
    if (lobby.hostId === playerId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].id
    }

    lobby.lastActivity = Date.now()
    lobbies.set(lobbyId, lobby)

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error leaving lobby:", error)
    return NextResponse.json({ error: "Failed to leave lobby" }, { status: 500 })
  }
}
