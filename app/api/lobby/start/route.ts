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

// Expanded mock quiz data with NSFW flag and more variety
const mockQuizData = [
  {
    postId: "post_1",
    postTitle: "What's the most ridiculous thing you believed as a child?",
    postScore: 15420,
    postAuthor: "curious_redditor",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "I thought that if I swallowed a watermelon seed, a watermelon would grow in my stomach. I was terrified of eating watermelon for years.",
          score: 8934,
          author: "watermelon_kid",
          isTopComment: true,
        },
        {
          body: "I believed that chocolate milk came from brown cows. It made perfect sense to my 5-year-old brain.",
          score: 3421,
          author: "chocolate_lover",
          isTopComment: false,
        },
        {
          body: "I thought that when people died in movies, they actually died in real life. I couldn't understand why anyone would want to be an actor.",
          score: 2156,
          author: "movie_watcher",
          isTopComment: false,
        },
        {
          body: "I was convinced that teachers lived at school. I was shocked when I saw my kindergarten teacher at the grocery store.",
          score: 1876,
          author: "school_kid",
          isTopComment: false,
        },
      ],
      [
        {
          body: "I thought adults had all the answers and never made mistakes. Boy was I wrong about that one.",
          score: 7234,
          author: "reality_check",
          isTopComment: true,
        },
        {
          body: "I believed that if I made a funny face and the wind changed, I'd be stuck like that forever.",
          score: 4567,
          author: "face_maker",
          isTopComment: false,
        },
        {
          body: "I was convinced that quicksand would be a much bigger problem in my adult life than it actually is.",
          score: 3890,
          author: "quicksand_survivor",
          isTopComment: false,
        },
        {
          body: "I thought that when you got married, you automatically knew how to be an adult and do taxes.",
          score: 2345,
          author: "confused_adult",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_2",
    postTitle: "What's a skill that's surprisingly easy to learn but looks impressive?",
    postScore: 23156,
    postAuthor: "skill_seeker",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "Juggling! It looks super impressive but you can learn the basics in about 30 minutes. Most people think it takes years to master.",
          score: 12453,
          author: "juggling_master",
          isTopComment: true,
        },
        {
          body: "Speed reading. Once you learn to stop subvocalizing, you can dramatically increase your reading speed in just a few weeks.",
          score: 5432,
          author: "book_worm",
          isTopComment: false,
        },
        {
          body: "Basic card tricks. Learn 3-4 simple tricks and people will think you're a magician. The secret is in the presentation, not the complexity.",
          score: 4321,
          author: "card_shark",
          isTopComment: false,
        },
        {
          body: "Solving a Rubik's cube. It's just memorizing algorithms, not being a genius. You can learn it in a weekend with YouTube tutorials.",
          score: 3876,
          author: "cube_solver",
          isTopComment: false,
        },
      ],
      [
        {
          body: "Lock picking. Looks like something only spies can do, but most basic locks can be picked with 20 minutes of practice.",
          score: 9876,
          author: "lock_picker",
          isTopComment: true,
        },
        {
          body: "Origami. Start with simple models and people will think you're an artist. Plus it's incredibly relaxing.",
          score: 6543,
          author: "paper_folder",
          isTopComment: false,
        },
        {
          body: "Basic cooking techniques. Learn to properly sear, sauté, and season, and people will think you're a chef.",
          score: 5234,
          author: "home_chef",
          isTopComment: false,
        },
        {
          body: "Touch typing. Once you can type without looking, people assume you're some kind of computer wizard.",
          score: 4567,
          author: "keyboard_warrior",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_3",
    postTitle: "What's something that sounds like a conspiracy theory but is actually true?",
    postScore: 31245,
    postAuthor: "truth_seeker",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "The US government really did conduct mind control experiments on unwitting citizens (MKUltra). It was declassified and everything.",
          score: 18234,
          author: "history_buff",
          isTopComment: true,
        },
        {
          body: "Tobacco companies knew cigarettes caused cancer decades before it became public knowledge and actively covered it up.",
          score: 9876,
          author: "public_health",
          isTopComment: false,
        },
        {
          body: "The sugar industry paid scientists in the 1960s to downplay the link between sugar and heart disease and blame fat instead.",
          score: 7543,
          author: "nutrition_facts",
          isTopComment: false,
        },
        {
          body: "Exxon's own scientists accurately predicted climate change in the 1970s, but the company spent millions denying it publicly.",
          score: 6234,
          author: "climate_researcher",
          isTopComment: false,
        },
      ],
      [
        {
          body: "The FBI had a program called COINTELPRO that illegally surveilled and disrupted civil rights groups in the 60s and 70s.",
          score: 15678,
          author: "civil_rights_historian",
          isTopComment: true,
        },
        {
          body: "Operation Northwoods was a real plan by the US military to stage false flag attacks to justify invading Cuba. JFK rejected it.",
          score: 8765,
          author: "declassified_reader",
          isTopComment: false,
        },
        {
          body: "The Tuskegee Syphilis Study deliberately left Black men untreated for syphilis for 40 years to study the disease's progression.",
          score: 7234,
          author: "medical_ethics",
          isTopComment: false,
        },
        {
          body: "Big pharma companies have been caught multiple times hiding negative trial results and bribing doctors to prescribe their drugs.",
          score: 6543,
          author: "pharma_watchdog",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_4",
    postTitle: "What's the weirdest thing you've seen someone do in public?",
    postScore: 19876,
    postAuthor: "people_watcher",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "I saw a guy at the airport brushing his teeth with an electric toothbrush at the gate, no water, just dry brushing for 10 minutes straight.",
          score: 11234,
          author: "frequent_flyer",
          isTopComment: true,
        },
        {
          body: "Woman on the subway was knitting what appeared to be a sweater for her pet chicken, which she had in a carrier next to her.",
          score: 5678,
          author: "subway_rider",
          isTopComment: false,
        },
        {
          body: "Saw someone at Walmart shopping with a full-size mannequin in their cart, talking to it like it was their shopping companion.",
          score: 4321,
          author: "retail_witness",
          isTopComment: false,
        },
        {
          body: "Guy at the park was having a full conversation with a squirrel, complete with pauses for the squirrel to 'respond'.",
          score: 3456,
          author: "park_visitor",
          isTopComment: false,
        },
      ],
      [
        {
          body: "Watched a woman at the library using a magnifying glass to read her phone screen. She had reading glasses on too.",
          score: 8765,
          author: "library_regular",
          isTopComment: true,
        },
        {
          body: "Saw a man at the grocery store smell every single banana before putting them in his cart. Took him 15 minutes.",
          score: 6234,
          author: "grocery_shopper",
          isTopComment: false,
        },
        {
          body: "Person at the coffee shop was typing on their laptop with chopsticks instead of their fingers. Surprisingly fast too.",
          score: 4567,
          author: "coffee_observer",
          isTopComment: false,
        },
        {
          body: "Saw someone at the bus stop doing full yoga poses while waiting. Downward dog right on the sidewalk.",
          score: 3890,
          author: "bus_commuter",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_5",
    postTitle: "What's a red flag in a job interview that means you should run?",
    postScore: 28934,
    postAuthor: "career_advisor",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "When they say 'We're like a family here.' Usually means they'll guilt you into working unpaid overtime and have no work-life balance.",
          score: 16789,
          author: "corporate_survivor",
          isTopComment: true,
        },
        {
          body: "If they can't give you a clear answer about why the position is open or what happened to the last person.",
          score: 8234,
          author: "hr_professional",
          isTopComment: false,
        },
        {
          body: "When the interviewer shows up 20+ minutes late with no apology or explanation. Shows they don't respect your time.",
          score: 6543,
          author: "job_hunter",
          isTopComment: false,
        },
        {
          body: "If they ask you to do a 'small project' that's clearly several hours of actual work they could use, especially unpaid.",
          score: 5432,
          author: "freelancer_life",
          isTopComment: false,
        },
      ],
      [
        {
          body: "When they refuse to discuss salary until after you've 'proven yourself.' That's code for 'we pay below market rate.'",
          score: 14567,
          author: "salary_negotiator",
          isTopComment: true,
        },
        {
          body: "If the office looks like a ghost town during normal business hours. Either everyone quit or they're all working remotely for a reason.",
          score: 7890,
          author: "office_observer",
          isTopComment: false,
        },
        {
          body: "When they ask illegal questions about your personal life, family plans, or health status. Major lawsuit waiting to happen.",
          score: 6234,
          author: "employment_lawyer",
          isTopComment: false,
        },
        {
          body: "If they badmouth their previous employees or other companies constantly. Shows they have no professionalism.",
          score: 5678,
          author: "professional_networker",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_6",
    postTitle: "What's the most embarrassing thing that happened to you in school?",
    postScore: 22456,
    postAuthor: "school_memories",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "I gave a presentation with my fly down the entire time. Nobody told me until after class when my best friend was crying from laughter.",
          score: 13456,
          author: "presentation_disaster",
          isTopComment: true,
        },
        {
          body: "Called my teacher 'Mom' in front of the entire class. She just smiled and said 'Yes, honey?' which made it even worse.",
          score: 8765,
          author: "accidental_mom",
          isTopComment: false,
        },
        {
          body: "Fell asleep in class and woke up to everyone staring at me. Apparently I was snoring AND talking in my sleep about pizza.",
          score: 6543,
          author: "sleepy_student",
          isTopComment: false,
        },
        {
          body: "Tried to be cool and lean against what I thought was a wall. It was a door. I fell backwards into the hallway during a test.",
          score: 5234,
          author: "not_so_cool",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_7",
    postTitle: "What's something everyone pretends to understand but actually doesn't?",
    postScore: 35678,
    postAuthor: "truth_teller",
    isNSFW: false,
    commentSets: [
      [
        {
          body: "Wine tasting. 90% of people are just making stuff up about 'notes of oak with a hint of berry.' It's grape juice that makes you dizzy.",
          score: 19876,
          author: "wine_skeptic",
          isTopComment: true,
        },
        {
          body: "Cryptocurrency. Everyone acts like they understand blockchain but most people just know 'number go up, number go down.'",
          score: 12345,
          author: "crypto_confused",
          isTopComment: false,
        },
        {
          body: "Modern art. Half the time I can't tell if it's a masterpiece or if someone left their lunch on the wall by accident.",
          score: 9876,
          author: "art_confused",
          isTopComment: false,
        },
        {
          body: "How the stock market actually works. Everyone's an expert until they lose their shirt on meme stocks.",
          score: 8765,
          author: "market_realist",
          isTopComment: false,
        },
      ],
    ],
  },
  {
    postId: "post_8",
    postTitle: "What's the worst dating advice you've ever received?",
    postScore: 18234,
    postAuthor: "dating_disasters",
    isNSFW: true,
    commentSets: [
      [
        {
          body: "'Just be yourself' - terrible advice when yourself is an anxious mess who collects vintage spoons and talks too much about conspiracy theories.",
          score: 11234,
          author: "spoon_collector",
          isTopComment: true,
        },
        {
          body: "'Play hard to get.' So I ignored someone I really liked for weeks. They moved on. Shocking.",
          score: 7890,
          author: "hard_to_get_failure",
          isTopComment: false,
        },
        {
          body: "'Never text first.' Great way to ensure you never talk to anyone ever again.",
          score: 6543,
          author: "texting_rules",
          isTopComment: false,
        },
        {
          body: "'Date multiple people at once to keep your options open.' Recipe for disaster and hurt feelings all around.",
          score: 5432,
          author: "serial_dater",
          isTopComment: false,
        },
      ],
    ],
  },
]

export async function POST(request: Request) {
  try {
    const { lobbyId } = await request.json()

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 })
    }

    // Initialize tracking arrays if not exists
    if (!lobby.usedPostIds) lobby.usedPostIds = []
    if (!lobby.usedCommentSets) lobby.usedCommentSets = []

    // Filter posts based on NSFW setting
    const allowedPosts = mockQuizData.filter((post) => {
      if (!lobby.settings?.allowNSFW && post.isNSFW) {
        return false
      }
      return true
    })

    if (allowedPosts.length === 0) {
      return NextResponse.json({ error: "No suitable posts available" }, { status: 400 })
    }

    // Find posts with unused comment sets
    let availablePosts = allowedPosts.filter((post) => {
      const usedSetsForPost = lobby.usedCommentSets.filter((used: any) => used.postId === post.postId)
      return usedSetsForPost.length < post.commentSets.length
    })

    // If all comment sets used, reset
    if (availablePosts.length === 0) {
      lobby.usedCommentSets = []
      availablePosts = allowedPosts
    }

    // Select random post from available
    const selectedPost = availablePosts[Math.floor(Math.random() * availablePosts.length)]

    // Find unused comment set for this post
    const usedSetsForPost = lobby.usedCommentSets.filter((used: any) => used.postId === selectedPost.postId)
    const availableCommentSets = selectedPost.commentSets.filter(
      (_, index) => !usedSetsForPost.some((used: any) => used.commentSetIndex === index),
    )

    const selectedCommentSetIndex = Math.floor(Math.random() * availableCommentSets.length)
    const selectedCommentSet = availableCommentSets[selectedCommentSetIndex]

    // Mark this comment set as used
    lobby.usedCommentSets.push({
      postId: selectedPost.postId,
      commentSetIndex: selectedPost.commentSets.indexOf(selectedCommentSet),
    })

    // Shuffle the comments
    const shuffledComments = [...selectedCommentSet].sort(() => Math.random() - 0.5)

    const quizData = {
      postId: selectedPost.postId,
      postTitle: selectedPost.postTitle,
      postScore: selectedPost.postScore,
      postAuthor: selectedPost.postAuthor,
      comments: shuffledComments,
    }

    lobby.gameStarted = true
    lobby.currentRound = (lobby.currentRound || 0) + 1
    lobby.lastActivity = Date.now()
    lobby.gameState = "playing"
    lobby.currentQuiz = quizData

    lobbies.set(lobbyId, lobby)

    return NextResponse.json({
      success: true,
      lobby,
      quizData,
    })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}
