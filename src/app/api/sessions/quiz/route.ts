import { NextResponse } from 'next/server'

// Simple in-memory cache per runtime
const globalAny: any = globalThis as any
if (!globalAny.__quizCache) globalAny.__quizCache = new Map<string, any>()
const quizCache: Map<string, any> = globalAny.__quizCache

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, sessionContent, sessionTitle, sessionType, courseTitle, courseLearningObjectives } = body || {}

    if (!sessionContent || !sessionTitle || !sessionType || !courseTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cacheKey = sessionId ? `session:${sessionId}` : undefined
    if (cacheKey && quizCache.has(cacheKey)) {
      return NextResponse.json({ quizzes: quizCache.get(cacheKey) })
    }

    let mod: any
    if (process.env.XAI_API_KEY) {
      mod = await import('@/lib/grok')
    } else if (process.env.OPENAI_API_KEY) {
      mod = await import('@/lib/openai')
    } else {
      return NextResponse.json({ error: 'No LLM configured.' }, { status: 500 })
    }

    if (typeof mod.generateQuizSet !== 'function') {
      return NextResponse.json({ error: 'Quiz generation not available.' }, { status: 500 })
    }

    const quizzes = await mod.generateQuizSet({
      sessionContent,
      sessionTitle,
      sessionType,
      courseTitle,
      courseLearningObjectives: Array.isArray(courseLearningObjectives) ? courseLearningObjectives : [],
      numQuestions: 10,
    })

    if (!Array.isArray(quizzes)) {
      return NextResponse.json({ error: 'Invalid quiz response' }, { status: 500 })
    }

    if (cacheKey) quizCache.set(cacheKey, quizzes)
    return NextResponse.json({ quizzes })
  } catch (error: any) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}


