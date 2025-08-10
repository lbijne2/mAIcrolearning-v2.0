import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionContent, userMessage, conversationHistory, sessionTitle, sessionType, courseTitle, courseLearningObjectives } = body || {}

    if (!sessionContent || !userMessage) {
      return NextResponse.json({ error: 'Missing sessionContent or userMessage' }, { status: 400 })
    }

    // Dynamically pick provider based on available keys
    let LessonChatbotClass: any
    if (process.env.XAI_API_KEY) {
      const mod = await import('@/lib/grok')
      LessonChatbotClass = mod.LessonChatbot
    } else if (process.env.OPENAI_API_KEY) {
      const mod = await import('@/lib/openai')
      LessonChatbotClass = mod.LessonChatbot
    } else {
      return NextResponse.json({ error: 'No LLM configured.' }, { status: 500 })
    }

    const chatbot = new LessonChatbotClass()

    const richSessionContent = {
      course: {
        title: courseTitle,
        learningObjectives: Array.isArray(courseLearningObjectives) ? courseLearningObjectives : []
      },
      session: {
        title: sessionTitle,
        type: sessionType
      },
      content: sessionContent
    }

    // Detect quiz answer control token and build grading preamble
    let gradingPreamble: string | undefined
    try {
      if (typeof userMessage === 'string' && userMessage.includes('<quiz_answer>')) {
        const json = userMessage.replace('<quiz_answer>', '')
        const payload = JSON.parse(json)
        const questionType: string = payload?.quiz?.questionType ?? 'multiple-choice'
        const explanation = payload?.quiz?.explanation ?? 'N/A'
        if (questionType === 'fill-in-the-blank' || questionType === 'case-based') {
          const textAnswer: string = (payload?.textAnswer ?? '').toString()
          gradingPreamble = `\n\nQuiz grading context\nThe user provided the following free-text answer for quiz id ${payload?.id}: "${textAnswer}". Evaluate correctness and reply with a concise verdict and explanation, then continue the lesson. If helpful, use this explanation: ${explanation}`
        } else {
          const selectedIndex: number = Number(payload?.selectedIndex)
          const correctIndex: number | undefined = payload?.quiz?.correctIndex
          gradingPreamble = `\n\nQuiz grading context\nThe user selected option index ${selectedIndex} for quiz id ${payload?.id}. The correct index is ${correctIndex}. If correct, reply with "Correct!" and a short explanation; otherwise reply with "Not quite" and the correct answer with a short explanation. Continue the lesson afterwards. If helpful, use this explanation: ${explanation}`
        }
      }
    } catch (_) {
      // ignore malformed quiz payloads
    }

    // First turn guidance and completion protocol
    let firstTurnPreamble: string | undefined
    const isFirstTurn = !Array.isArray(conversationHistory) || conversationHistory.length === 0
    const isQuizAnswer = typeof userMessage === 'string' && userMessage.includes('<quiz_answer>')
    if (isFirstTurn && !isQuizAnswer) {
      firstTurnPreamble = `\n\nFirst turn behavior: Provide a concise overview of this session (objectives, key topics, estimated duration, and how the session will proceed). Ask a brief engaging question to confirm readiness.\n\nGuidance and completion: You should guide the user through the session in 3-5 concise, interactive steps. When you determine the session has achieved its objectives, emit STRICT JSON and nothing else in your final turn: {"type":"complete","summary":"<2-4 bullet summary of what was learned>"}.` 
    }

    const reply = await chatbot.generateResponse({
      sessionContent: richSessionContent,
      userMessage,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      gradingPreamble,
      firstTurnPreamble,
    })

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}


