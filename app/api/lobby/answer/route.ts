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
    const { lobbyId, playerId, points, isCorrect } = await request.json()

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    const player = lobby.players.find((p: any) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Add points to player score
    player.score += points
    player.lastAnswered = Date.now()
    player.correctAnswers = (player.correctAnswers || 0) + (isCorrect ? 1 : 0)

    lobby.lastActivity = Date.now()
    lobbies.set(lobbyId, lobby)

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error submitting answer:", error)
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 })
  }
}
