"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Users, EyeOff, RefreshCw, Gamepad2, Shield, ShieldOff } from "lucide-react"
import GameLobby from "./components/game-lobby"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  score: number
  isReady: boolean
}

interface Lobby {
  id: string
  name: string
  isPrivate: boolean
  players: Player[]
  maxPlayers: number
  gameStarted: boolean
  hostId: string
  currentRound?: number
  settings?: {
    allowNSFW: boolean
    maxRounds: number
  }
}

export default function RedditQuizGame() {
  const [currentView, setCurrentView] = useState<"menu" | "lobby">("menu")
  const [playerName, setPlayerName] = useState("")
  const [lobbyCode, setLobbyCode] = useState("")
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null)
  const [playerId, setPlayerId] = useState("")
  const [publicLobbies, setPublicLobbies] = useState<Lobby[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [allowNSFW, setAllowNSFW] = useState(false)
  const { toast } = useToast()

  // Generate player ID on mount
  useEffect(() => {
    const savedPlayerId = localStorage.getItem("reddit-quiz-player-id")
    if (savedPlayerId) {
      setPlayerId(savedPlayerId)
    } else {
      const newPlayerId = `player_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
      setPlayerId(newPlayerId)
      localStorage.setItem("reddit-quiz-player-id", newPlayerId)
    }

    // Load saved player name
    const savedPlayerName = localStorage.getItem("reddit-quiz-player-name")
    if (savedPlayerName) {
      setPlayerName(savedPlayerName)
    }

    // Load saved NSFW preference
    const savedNSFW = localStorage.getItem("reddit-quiz-allow-nsfw")
    if (savedNSFW) {
      setAllowNSFW(savedNSFW === "true")
    }
  }, [])

  // Save player name to localStorage
  useEffect(() => {
    if (playerName.trim()) {
      localStorage.setItem("reddit-quiz-player-name", playerName.trim())
    }
  }, [playerName])

  // Save NSFW preference to localStorage
  useEffect(() => {
    localStorage.setItem("reddit-quiz-allow-nsfw", allowNSFW.toString())
  }, [allowNSFW])

  const generateLobbyCode = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const createLobby = async (isPrivate: boolean) => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name first",
        variant: "destructive",
      })
      return
    }

    if (playerName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const lobbyId = generateLobbyCode()
    const newLobby: Lobby = {
      id: lobbyId,
      name: `${playerName.trim()}'s Game`,
      isPrivate,
      players: [
        {
          id: playerId,
          name: playerName.trim(),
          score: 0,
          isReady: false,
        },
      ],
      maxPlayers: 8,
      gameStarted: false,
      hostId: playerId,
      settings: {
        allowNSFW,
        maxRounds: 10,
      },
    }

    try {
      const response = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLobby),
      })

      if (response.ok) {
        setCurrentLobby(newLobby)
        setCurrentView("lobby")
        toast({
          title: "Lobby Created!",
          description: isPrivate ? `Private lobby code: ${lobbyId}` : "Public lobby created successfully",
        })
      } else {
        throw new Error("Failed to create lobby")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lobby. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const joinLobby = async (lobbyId: string) => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name first",
        variant: "destructive",
      })
      return
    }

    if (playerName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/lobby/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: lobbyId.toUpperCase(),
          player: {
            id: playerId,
            name: playerName.trim(),
            score: 0,
            isReady: false,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentLobby(data.lobby)
        setCurrentView("lobby")
        toast({
          title: "Joined Lobby!",
          description: `Welcome to ${data.lobby.name}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to join lobby",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to join lobby. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const joinPrivateLobby = () => {
    if (!lobbyCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lobby code",
        variant: "destructive",
      })
      return
    }
    joinLobby(lobbyCode.toUpperCase())
  }

  const fetchPublicLobbies = async () => {
    try {
      const response = await fetch("/api/lobby/public")
      const data = await response.json()
      setPublicLobbies(data.lobbies || [])
      setLastRefresh(Date.now())
    } catch (error) {
      console.error("Failed to fetch public lobbies:", error)
      toast({
        title: "Connection Error",
        description: "Failed to load public lobbies",
        variant: "destructive",
      })
    }
  }

  const leaveLobby = () => {
    setCurrentLobby(null)
    setCurrentView("menu")
    setLobbyCode("")
    // Refresh public lobbies when returning to menu
    fetchPublicLobbies()
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  useEffect(() => {
    if (currentView === "menu") {
      fetchPublicLobbies()
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchPublicLobbies, 10000)
      return () => clearInterval(interval)
    }
  }, [currentView])

  if (currentView === "lobby" && currentLobby) {
    return (
      <GameLobby lobby={currentLobby} playerId={playerId} onLeaveLobby={leaveLobby} onLobbyUpdate={setCurrentLobby} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">Reddit Quiz Game</h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 px-4">
            Join a lobby and compete with friends to guess the top Reddit comments!
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              <strong>How to play:</strong> Guess which comment received the most upvotes on popular AskReddit posts.
              Earn points equal to the post's upvote count when you're correct!
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Join or Create a Game</CardTitle>
            <CardDescription className="text-sm sm:text-base">Enter your name to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-sm sm:text-base">
                Your Name
              </Label>
              <Input
                id="playerName"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                disabled={isLoading}
                className="text-sm sm:text-base"
              />
            </div>

            {/* NSFW Content Toggle */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                {allowNSFW ? (
                  <ShieldOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                ) : (
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                )}
                <div>
                  <Label htmlFor="nsfw-toggle" className="text-sm sm:text-base font-medium cursor-pointer">
                    Allow NSFW Content
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {allowNSFW ? "May include mature content" : "Safe for work only"}
                  </p>
                </div>
              </div>
              <Switch id="nsfw-toggle" checked={allowNSFW} onCheckedChange={setAllowNSFW} disabled={isLoading} />
            </div>

            <Tabs defaultValue="public" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="public" className="text-sm sm:text-base">
                  Public Lobbies
                </TabsTrigger>
                <TabsTrigger value="private" className="text-sm sm:text-base">
                  Private Lobby
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public" className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => createLobby(false)}
                    className="flex-1 text-sm sm:text-base"
                    disabled={isLoading || !playerName.trim()}
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create Public Lobby"}
                  </Button>
                  <Button onClick={fetchPublicLobbies} variant="outline" disabled={isLoading} size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm sm:text-base">Available Public Lobbies</Label>
                    <span className="text-xs text-gray-500">Updated {formatTimeAgo(lastRefresh)}</span>
                  </div>
                  <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2">
                    {publicLobbies.length === 0 ? (
                      <Card>
                        <CardContent className="p-3 sm:p-4 text-center text-gray-500">
                          <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm sm:text-base">No public lobbies available.</p>
                          <p className="text-xs sm:text-sm">Create one to get started!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      publicLobbies.map((lobby) => (
                        <Card
                          key={lobby.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{lobby.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <span>
                                    {lobby.players.length}/{lobby.maxPlayers} players
                                  </span>
                                  {lobby.gameStarted && <span>• Game in progress</span>}
                                  {lobby.currentRound && <span>• Round {lobby.currentRound}</span>}
                                  {lobby.settings?.allowNSFW && <span className="text-red-500">• NSFW</span>}
                                </div>
                              </div>
                              <Button
                                onClick={() => joinLobby(lobby.id)}
                                disabled={
                                  lobby.players.length >= lobby.maxPlayers ||
                                  lobby.gameStarted ||
                                  isLoading ||
                                  !playerName.trim()
                                }
                                size="sm"
                                className="ml-2 flex-shrink-0"
                              >
                                {isLoading ? "Joining..." : "Join"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="private" className="space-y-4">
                <Button
                  onClick={() => createLobby(true)}
                  className="w-full text-sm sm:text-base"
                  disabled={isLoading || !playerName.trim()}
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  {isLoading ? "Creating..." : "Create Private Lobby"}
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="lobbyCode" className="text-sm sm:text-base">
                    Join Private Lobby
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="lobbyCode"
                      placeholder="Enter lobby code"
                      value={lobbyCode}
                      onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      disabled={isLoading}
                      className="text-sm sm:text-base"
                    />
                    <Button
                      onClick={joinPrivateLobby}
                      disabled={isLoading || !playerName.trim() || !lobbyCode.trim()}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {isLoading ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="max-w-2xl mx-auto mt-4 sm:mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Game Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 font-semibold text-xs flex-shrink-0">
                1
              </div>
              <p>Create or join a lobby with up to 8 players</p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 font-semibold text-xs flex-shrink-0">
                2
              </div>
              <p>All players must ready up before the host can start the game</p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 font-semibold text-xs flex-shrink-0">
                3
              </div>
              <p>Read the AskReddit post and choose which comment you think got the most upvotes</p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 font-semibold text-xs flex-shrink-0">
                4
              </div>
              <p>You have 45 seconds to make your choice - earn points equal to the post's upvotes if correct!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
