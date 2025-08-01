"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Trophy,
  Clock,
  Copy,
  Crown,
  LogOut,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Shield,
  ShieldOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  score: number
  isReady: boolean
  correctAnswers?: number
  lastSeen?: number
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
  usedPostIds?: string[]
  usedCommentSets?: Array<{ postId: string; commentSetIndex: number }>
  settings?: {
    allowNSFW: boolean
    maxRounds: number
  }
  gameState?: string
  currentQuiz?: QuizData
}

interface Comment {
  body: string
  score: number
  author: string
  isTopComment: boolean
}

interface QuizData {
  postTitle: string
  postScore: number
  postAuthor: string
  comments: Comment[]
  postId: string
}

interface GameLobbyProps {
  lobby: Lobby
  playerId: string
  onLeaveLobby: () => void
  onLobbyUpdate: (lobby: Lobby) => void
}

export default function GameLobby({ lobby, playerId, onLeaveLobby, onLobbyUpdate }: GameLobbyProps) {
  const [quizData, setQuizData] = useState<QuizData | null>(lobby.currentQuiz || null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [gamePhase, setGamePhase] = useState<"waiting" | "playing" | "results">(
    lobby.gameStarted ? "playing" : "waiting",
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [lastSync, setLastSync] = useState(Date.now())
  const [allowNSFW, setAllowNSFW] = useState(lobby.settings?.allowNSFW || false)
  const { toast } = useToast()

  const isHost = lobby.hostId === playerId

  // Find current player
  useEffect(() => {
    const player = lobby.players.find((p) => p.id === playerId)
    setCurrentPlayer(player || null)
  }, [lobby.players, playerId])

  // Sync lobby state periodically
  useEffect(() => {
    const syncLobby = async () => {
      try {
        const response = await fetch("/api/lobby/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lobbyId: lobby.id, playerId }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.lobby) {
            onLobbyUpdate(data.lobby)

            // Update quiz data if game started
            if (data.currentQuiz && (!quizData || data.currentQuiz.postId !== quizData.postId)) {
              setQuizData(data.currentQuiz)
              setGamePhase("playing")
              setTimeLeft(45)
              setIsTimerActive(true)
              setShowResult(false)
              setSelectedAnswer("")
            }

            setIsConnected(true)
            setLastSync(Date.now())
          }
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Failed to sync lobby:", error)
        setIsConnected(false)
      }
    }

    // Sync every 2 seconds when in lobby
    const interval = setInterval(syncLobby, 2000)
    return () => clearInterval(interval)
  }, [lobby.id, playerId, onLobbyUpdate, quizData])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsTimerActive(false)
            handleTimeUp()
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerActive, timeLeft, showResult])

  const handleTimeUp = useCallback(() => {
    if (!showResult && gamePhase === "playing") {
      setShowResult(true)
      // Auto-submit with no answer
      submitAnswer(true)
    }
  }, [showResult, gamePhase])

  const toggleReady = async () => {
    try {
      const response = await fetch("/api/lobby/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: lobby.id,
          playerId,
          isReady: !currentPlayer?.isReady,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onLobbyUpdate(data.lobby)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to update ready status",
        variant: "destructive",
      })
      setIsConnected(false)
    }
  }

  const updateLobbySettings = async () => {
    if (!isHost) return

    try {
      const updatedLobby = {
        ...lobby,
        settings: {
          ...lobby.settings,
          allowNSFW,
        },
      }

      // Update local state immediately
      onLobbyUpdate(updatedLobby)

      toast({
        title: "Settings Updated",
        description: `NSFW content ${allowNSFW ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const startGame = async () => {
    if (!isHost) return

    try {
      const response = await fetch("/api/lobby/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: lobby.id,
          settings: { allowNSFW },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizData(data.quizData)
        setGamePhase("playing")
        setTimeLeft(45)
        setIsTimerActive(true)
        setShowResult(false)
        setSelectedAnswer("")
        onLobbyUpdate({ ...data.lobby, settings: { ...lobby.settings, allowNSFW } })
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to start game",
        variant: "destructive",
      })
      setIsConnected(false)
    }
  }

  const submitAnswer = async (isTimeUp = false) => {
    if ((!selectedAnswer && !isTimeUp) || !quizData || showResult) return

    setIsTimerActive(false)
    const selectedComment = quizData.comments.find((c) => c.body === selectedAnswer)
    const isCorrect = selectedComment?.isTopComment || false
    const points = isCorrect ? quizData.postScore : 0

    try {
      const response = await fetch("/api/lobby/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: lobby.id,
          playerId,
          points,
          isCorrect,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onLobbyUpdate(data.lobby)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Failed to submit answer:", error)
      setIsConnected(false)
    }

    if (!isTimeUp) {
      setShowResult(true)
    }
  }

  const nextRound = async () => {
    if (!isHost) return

    try {
      const response = await fetch("/api/lobby/next-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: lobby.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizData(data.quizData)
        setTimeLeft(45)
        setIsTimerActive(true)
        setShowResult(false)
        setSelectedAnswer("")
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to start next round",
        variant: "destructive",
      })
      setIsConnected(false)
    }
  }

  const leaveLobby = async () => {
    try {
      await fetch("/api/lobby/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: lobby.id, playerId }),
      })
    } catch (error) {
      console.error("Failed to leave lobby properly:", error)
    }
    onLeaveLobby()
  }

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobby.id)
    toast({
      title: "Copied!",
      description: "Lobby code copied to clipboard",
    })
  }

  const getTimerProgress = () => {
    return (timeLeft / 45) * 100
  }

  const getTimerColor = () => {
    if (timeLeft > 30) return "bg-green-500"
    if (timeLeft > 15) return "bg-yellow-500"
    return "bg-red-500"
  }

  const allPlayersReady = lobby.players.length > 1 && lobby.players.every((p) => p.isReady)
  const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Connection lost. Trying to reconnect...</span>
            </div>
          </div>
        )}

        {/* Lobby Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">{lobby.name}</h1>
              {isConnected ? (
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {lobby.isPrivate ? "Private" : "Public"} Lobby
              </Badge>
              {lobby.currentRound && (
                <Badge variant="secondary" className="text-xs">
                  Round {lobby.currentRound}
                </Badge>
              )}
              {lobby.settings?.allowNSFW && (
                <Badge variant="destructive" className="text-xs">
                  NSFW
                </Badge>
              )}
              {lobby.isPrivate && (
                <Button variant="ghost" size="sm" onClick={copyLobbyCode} className="h-6 px-2 text-xs">
                  <Copy className="w-3 h-3 mr-1" />
                  {lobby.id}
                </Button>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={leaveLobby} size="sm" className="flex-shrink-0 bg-transparent">
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Players Panel */}
          <Card className="lg:order-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Players ({lobby.players.length}/{lobby.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {index === 0 && lobby.currentRound && lobby.currentRound > 0 && (
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      {player.id === lobby.hostId && (
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm sm:text-base truncate">{player.name}</span>
                      {player.id === playerId && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {player.score.toLocaleString()} pts
                      </Badge>
                      {gamePhase === "waiting" && (
                        <Badge variant={player.isReady ? "default" : "secondary"} className="text-xs">
                          {player.isReady ? "✓" : "○"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {gamePhase === "waiting" && (
                <div className="space-y-3 pt-2 border-t">
                  {/* NSFW Settings - Only show for host */}
                  {isHost && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {allowNSFW ? (
                            <ShieldOff className="w-4 h-4 text-red-500" />
                          ) : (
                            <Shield className="w-4 h-4 text-green-500" />
                          )}
                          <Label htmlFor="nsfw-toggle" className="text-sm font-medium">
                            Allow NSFW Content
                          </Label>
                        </div>
                        <Switch
                          id="nsfw-toggle"
                          checked={allowNSFW}
                          onCheckedChange={(checked) => {
                            setAllowNSFW(checked)
                            updateLobbySettings()
                          }}
                          disabled={!isConnected}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {allowNSFW ? "NSFW posts may appear in the game" : "Only safe-for-work posts will be shown"}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={toggleReady}
                    variant={currentPlayer?.isReady ? "secondary" : "default"}
                    className="w-full"
                    disabled={!isConnected}
                    size="sm"
                  >
                    {currentPlayer?.isReady ? "Not Ready" : "Ready Up"}
                  </Button>

                  {isHost && (
                    <Button
                      onClick={startGame}
                      disabled={!allPlayersReady || !isConnected}
                      className="w-full"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                  )}

                  {!isHost && !allPlayersReady && (
                    <p className="text-xs text-gray-500 text-center">Waiting for all players to ready up...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Panel */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {gamePhase === "waiting" && (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Waiting for players...</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    {allPlayersReady
                      ? "All players ready! Host can start the game."
                      : `${lobby.players.filter((p) => p.isReady).length}/${lobby.players.length} players ready`}
                  </p>
                  {lobby.players.length === 1 && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      Share the lobby code with friends to play together!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {gamePhase === "playing" && quizData && (
              <>
                {/* Timer */}
                {!showResult && (
                  <Card className="border-2 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                          <span className="font-semibold text-base sm:text-lg">{timeLeft}s</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Potential Points: {quizData.postScore.toLocaleString()}
                        </div>
                      </div>
                      <Progress value={getTimerProgress()} className="h-2 sm:h-3">
                        <div className={`h-full transition-all duration-1000 ${getTimerColor()}`} />
                      </Progress>
                    </CardContent>
                  </Card>
                )}

                {/* Question */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl leading-relaxed">{quizData.postTitle}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-xs sm:text-sm">by u/{quizData.postAuthor}</span>
                      <Badge variant="secondary" className="text-xs">
                        {quizData.postScore.toLocaleString()} upvotes
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Answers */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Which comment do you think was the most upvoted?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedAnswer}
                      onValueChange={setSelectedAnswer}
                      className="space-y-3 sm:space-y-4"
                      disabled={showResult || timeLeft === 0 || !isConnected}
                    >
                      {quizData.comments.map((comment, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 sm:p-4 transition-colors ${
                            showResult
                              ? comment.isTopComment
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : selectedAnswer === comment.body && !comment.isTopComment
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                  : "border-gray-200 dark:border-gray-700"
                              : selectedAnswer === comment.body
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem
                              value={comment.body}
                              id={`comment-${index}`}
                              className="mt-1 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={`comment-${index}`}
                                className="text-xs sm:text-sm leading-relaxed cursor-pointer block"
                              >
                                {comment.body}
                              </Label>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>by u/{comment.author}</span>
                                {showResult && (
                                  <Badge variant="outline" className="text-xs">
                                    {comment.score.toLocaleString()} upvotes
                                  </Badge>
                                )}
                                {showResult && comment.isTopComment && (
                                  <Badge className="text-xs bg-green-600">Top Comment!</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex gap-3 mt-4 sm:mt-6">
                      {!showResult ? (
                        <Button
                          onClick={() => submitAnswer()}
                          disabled={!selectedAnswer || timeLeft === 0 || !isConnected}
                          className="flex-1"
                          size="sm"
                        >
                          {timeLeft === 0 ? "Time's Up!" : !isConnected ? "Reconnecting..." : "Submit Answer"}
                        </Button>
                      ) : (
                        isHost && (
                          <Button onClick={nextRound} disabled={!isConnected} className="flex-1" size="sm">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Next Round
                          </Button>
                        )
                      )}
                    </div>

                    {showResult && (
                      <div className="mt-4 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="text-center">
                          <p className="font-medium mb-2 text-sm sm:text-base">
                            {quizData.comments.find((c) => c.body === selectedAnswer)?.isTopComment
                              ? "🎉 Correct! You guessed the top comment!"
                              : timeLeft === 0 && !selectedAnswer
                                ? "⏰ Time's up! No answer selected."
                                : "❌ Wrong! Better luck next time!"}
                          </p>
                          {quizData.comments.find((c) => c.body === selectedAnswer)?.isTopComment && (
                            <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                              <p>+{quizData.postScore.toLocaleString()} points</p>
                            </div>
                          )}
                          {!isHost && showResult && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                              Waiting for host to start next round...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
