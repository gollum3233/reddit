import { NextResponse } from "next/server"

// Simple in-memory storage with Map for demo
// In production, replace with Redis or database
let lobbies: Map<string, any>

// Initialize lobbies Map if it doesn't exist
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
    const lobby = await request.json()

    // Add timestamp for cleanup
    lobby.createdAt = Date.now()
    lobby.lastActivity = Date.now()

    // Add server-side timestamps and settings
    lobby.settings = {
      allowNSFW: lobby.settings?.allowNSFW || false,
      maxRounds: lobby.settings?.maxRounds || 10,
    }
    lobby.usedPostIds = []
    lobby.usedCommentSets = []
    lobby.currentRound = 0

    lobbies.set(lobby.id, lobby)

    // Clean up old lobbies (older than 2 hours)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    for (const [id, lobbyData] of lobbies.entries()) {
      if (lobbyData.lastActivity < twoHoursAgo) {
        lobbies.delete(id)
      }
    }

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error("Error creating lobby:", error)
    return NextResponse.json({ error: "Failed to create lobby" }, { status: 500 })
  }
}
