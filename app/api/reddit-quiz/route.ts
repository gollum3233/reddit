import { NextResponse } from "next/server"

// Mock data with unique IDs to prevent duplicates
const mockQuizData = [
  {
    postId: "post_1",
    postTitle: "What's the most ridiculous thing you believed as a child?",
    postScore: 15420,
    postAuthor: "curious_redditor",
    comments: [
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
  },
  {
    postId: "post_2",
    postTitle: "What's a skill that's surprisingly easy to learn but looks impressive?",
    postScore: 23156,
    postAuthor: "skill_seeker",
    comments: [
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
  },
  {
    postId: "post_3",
    postTitle: "What's the weirdest compliment you've ever received?",
    postScore: 18743,
    postAuthor: "compliment_collector",
    comments: [
      {
        body: "A stranger told me I have 'very trustworthy eyebrows.' I still don't know what that means, but I'll take it.",
        score: 9876,
        author: "eyebrow_owner",
        isTopComment: true,
      },
      {
        body: "Someone said I smell like their childhood. I was both flattered and concerned about what their childhood smelled like.",
        score: 4567,
        author: "nostalgic_scent",
        isTopComment: false,
      },
      {
        body: "A kid told me I look like a 'fancy dinosaur.' Best compliment ever, honestly.",
        score: 3421,
        author: "dino_human",
        isTopComment: false,
      },
      {
        body: "My dentist said I have 'Hollywood teeth in a small-town mouth.' I'm still processing that one.",
        score: 2987,
        author: "small_town_smile",
        isTopComment: false,
      },
    ],
  },
  {
    postId: "post_4",
    postTitle: "What's something that sounds like a conspiracy theory but is actually true?",
    postScore: 31245,
    postAuthor: "truth_seeker",
    comments: [
      {
        body: "The CIA actually did conduct mind control experiments on unwitting subjects in the 1950s and 60s. It was called MKUltra and it's fully documented.",
        score: 15678,
        author: "history_buff",
        isTopComment: true,
      },
      {
        body: "Coca-Cola used to contain actual cocaine. It was removed in 1903, but the name stuck.",
        score: 8234,
        author: "soda_historian",
        isTopComment: false,
      },
      {
        body: "The US government really did spray chemicals over populated areas to test biological warfare. Operation LAC in the 1950s.",
        score: 6789,
        author: "declassified_docs",
        isTopComment: false,
      },
      {
        body: "Big tobacco companies knew cigarettes caused cancer decades before it became public knowledge and actively covered it up.",
        score: 5432,
        author: "public_health",
        isTopComment: false,
      },
    ],
  },
  {
    postId: "post_5",
    postTitle: "What's the best piece of advice you've ever received?",
    postScore: 27891,
    postAuthor: "wisdom_collector",
    comments: [
      {
        body: "You can't control what happens to you, but you can control how you react to it. Changed my entire perspective on life.",
        score: 14567,
        author: "stoic_student",
        isTopComment: true,
      },
      {
        body: "Don't set yourself on fire to keep others warm. Learning to say no was life-changing.",
        score: 9876,
        author: "boundary_setter",
        isTopComment: false,
      },
      {
        body: "The best time to plant a tree was 20 years ago. The second best time is now. Never too late to start something.",
        score: 7654,
        author: "late_bloomer",
        isTopComment: false,
      },
      {
        body: "If you're the smartest person in the room, you're in the wrong room. Always seek to learn from others.",
        score: 6543,
        author: "lifelong_learner",
        isTopComment: false,
      },
    ],
  },
]

export async function POST(request: Request) {
  try {
    const { usedPostIds = [] } = await request.json()

    // Filter out already used posts
    const availablePosts = mockQuizData.filter((post) => !usedPostIds.includes(post.postId))

    // If no posts available, reset and use all posts
    const postsToUse = availablePosts.length > 0 ? availablePosts : mockQuizData

    // Select a random post
    const selectedQuiz = postsToUse[Math.floor(Math.random() * postsToUse.length)]

    // Shuffle the comments to randomize the order
    const shuffledComments = [...selectedQuiz.comments].sort(() => Math.random() - 0.5)

    return NextResponse.json({
      postId: selectedQuiz.postId,
      postTitle: selectedQuiz.postTitle,
      postScore: selectedQuiz.postScore,
      postAuthor: selectedQuiz.postAuthor,
      comments: shuffledComments,
    })
  } catch (error) {
    console.error("Error in quiz API:", error)
    return NextResponse.json({ error: "Failed to fetch quiz data" }, { status: 500 })
  }
}

// Keep GET method for backward compatibility
export async function GET() {
  return POST(new Request("", { method: "POST", body: JSON.stringify({}) }))
}
