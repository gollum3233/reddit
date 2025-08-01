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

    // Check if player is still in lobby
    const player = lobby.players.find((p: any) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not in lobby" }, { status: 404 })
    }

    // Update player's last seen
    player.lastSeen = Date.now()
    lobby.lastActivity = Date.now()
    lobbies.set(lobbyId, lobby)

    // Return lobby state and current quiz if game is active
    const response: any = { lobby }
    if (lobby.gameStarted && lobby.currentQuiz) {
      response.currentQuiz = lobby.currentQuiz
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error getting lobby status:", error)
    return NextResponse.json({ error: "Failed to get lobby status" }, { status: 500 })
  }
}
