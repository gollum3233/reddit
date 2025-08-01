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

export async function GET() {
  try {
    const now = Date.now()
    const twoHoursAgo = now - 2 * 60 * 60 * 1000

    // Clean up old lobbies
    for (const [id, lobby] of lobbies.entries()) {
      if (lobby.lastActivity < twoHoursAgo) {
        lobbies.delete(id)
      }
    }

    // Get public lobbies that are still active
    const publicLobbies = Array.from(lobbies.values())
      .filter((lobby) => !lobby.isPrivate && lobby.lastActivity > twoHoursAgo)
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, 20) // Limit to 20 most recent

    return NextResponse.json({ lobbies: publicLobbies })
  } catch (error) {
    console.error("Error fetching public lobbies:", error)
    return NextResponse.json({ error: "Failed to fetch lobbies" }, { status: 500 })
  }
}
