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
    const { lobbyId, player } = await request.json()

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      return NextResponse.json({ error: "Lobby is full" }, { status: 400 })
    }

    // Check if player name already exists
    const existingPlayer = lobby.players.find((p: any) => p.name.toLowerCase() === player.name.toLowerCase())
    if (existingPlayer) {
      return NextResponse.json({ error: "A player with this name already exists" }, { status: 400 })
    }

    // Check if player ID already exists (rejoining)
    const existingPlayerById = lobby.players.find((p: any) => p.id === player.id)
    if (existingPlayerById) {
      // Update existing player info
      existingPlayerById.name = player.name
      existingPlayerById.isReady = false
    } else {
      // Add new player
      lobby.players.push(player)
    }

    lobby.lastActivity = Date.now()
    lobbies.set(lobbyId, lobby)

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error joining lobby:", error)
    return NextResponse.json({ error: "Failed to join lobby" }, { status: 500 })
  }
}
