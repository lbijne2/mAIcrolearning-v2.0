import OpenAI from 'openai'

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

if (!process.env.OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Course generation will not be available.')
}

export { openai }

// Course generation prompt templates
export const COURSE_GENERATION_PROMPTS = {
  courseStructure: `You are an expert AI education curriculum designer. Create a comprehensive 4-week course structure for the topic: "{topic}" in the industry: "{industry}".

Requirements:
- 4 weeks total, 7 days per week (28 sessions)
- Each session should be 10 minutes
- Mix theory and practical applications
- Include industry-specific examples and tools
- Target audience: {aiSkillLevel} in AI, {experienceLevel} professional
- Learning goals: {learningGoals}

Return a JSON structure with:
- Course title, description, learning objectives
- Weekly breakdown with themes
- Daily sessions with titles, types, and brief descriptions
- Recommended tools and resources
- Assessment checkpoints

Session types to include:
- theory: Foundational concepts
- quiz: Knowledge verification
- interactive: Hands-on demos
- hands_on: Practical exercises
- review: Consolidation and reflection`,

  sessionContent: `Generate detailed content for a {sessionType} session titled "{sessionTitle}" for week {week}, day {day} of the AI course.

Context:
- Industry: {industry}
- User skill level: {aiSkillLevel}
- Session duration: 10 minutes
- Learning objectives: {learningObjectives}

For {sessionType} sessions, include:
${getSessionTypeInstructions()}

Return structured JSON with all required content, examples, and interactive elements.`,

  adaptiveContent: `Adapt the following session content based on user performance and emotion data:

Original content: {originalContent}
User performance: {performanceData}
Emotion indicators: {emotionData}
Adaptation needed: {adaptationType}

Provide adapted content that addresses the detected issues while maintaining learning objectives.`
}

function getSessionTypeInstructions(): string {
  return `
  - theory: Core concepts, real-world examples, key takeaways
  - quiz: 3-5 questions with explanations, multiple choice and short answer
  - interactive: Step-by-step demo with tools, guided exploration
  - hands_on: Project brief, requirements, tools, deliverables
  - review: Summary, connections, preparation for next week
  `
}

// LLM Chain for course generation
export class CourseGenerationChain {
  async generateCourseStructure(params: {
    topic: string
    industry: string
    aiSkillLevel: string
    experienceLevel: string
    learningGoals: string[]
  }) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.')
    }

    const prompt = COURSE_GENERATION_PROMPTS.courseStructure
      .replace('{topic}', params.topic)
      .replace('{industry}', params.industry)
      .replace('{aiSkillLevel}', params.aiSkillLevel)
      .replace('{experienceLevel}', params.experienceLevel)
      .replace('{learningGoals}', params.learningGoals.join(', '))

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI education curriculum designer. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  async generateSessionContent(params: {
    sessionType: string
    sessionTitle: string
    week: number
    day: number
    industry: string
    aiSkillLevel: string
    learningObjectives: string[]
  }) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.')
    }

    const prompt = COURSE_GENERATION_PROMPTS.sessionContent
      .replace('{sessionType}', params.sessionType)
      .replace('{sessionTitle}', params.sessionTitle)
      .replace('{week}', params.week.toString())
      .replace('{day}', params.day.toString())
      .replace('{industry}', params.industry)
      .replace('{aiSkillLevel}', params.aiSkillLevel)
      .replace('{learningObjectives}', params.learningObjectives.join(', '))

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI education content creator. Generate detailed, engaging content with practical examples. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  async adaptContent(params: {
    originalContent: any
    performanceData: any
    emotionData: any
    adaptationType: string
  }) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.')
    }

    const prompt = COURSE_GENERATION_PROMPTS.adaptiveContent
      .replace('{originalContent}', JSON.stringify(params.originalContent))
      .replace('{performanceData}', JSON.stringify(params.performanceData))
      .replace('{emotionData}', JSON.stringify(params.emotionData))
      .replace('{adaptationType}', params.adaptationType)

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an adaptive learning AI that modifies content based on user needs. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }
}

// Chatbot for lesson delivery
export class LessonChatbot {
  async generateResponse(params: {
    sessionContent: any
    userMessage: string
    conversationHistory: any[]
    emotionData?: any
    gradingPreamble?: string
    firstTurnPreamble?: string
  }) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.')
    }

    const systemPrompt = `You are an AI learning assistant delivering a micro-learning session. 

Session content: ${JSON.stringify(params.sessionContent)}
Emotion data: ${params.emotionData ? JSON.stringify(params.emotionData) : 'None'}

Guidelines:
- Keep responses concise and engaging
- Adapt tone based on emotion data (if provided)
- Provide encouragement and support
- Ask interactive questions to maintain engagement
- Offer practical examples and applications
- Use simple language for complex concepts
    - Suggest tool calls when appropriate for hands-on learning
    - If you want to ask a multiple-choice question, return STRICT JSON with shape {"type":"quiz","id":"<string>","question":"<string>","choices":["A","B",...],"correctIndex":<number>,"questionType":"multiple-choice","explanation":"<string>"} and nothing else. Do not include markdown.`

    const messages = [
      { role: 'system', content: systemPrompt + (params.gradingPreamble ?? '') + (params.firstTurnPreamble ?? '') },
      ...params.conversationHistory,
      { role: 'user', content: params.userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 300
    })

    return response.choices[0].message.content
  }

  async generateFeedback(params: {
    userResponse: string
    expectedAnswer: string
    context: string
  }) {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.')
    }

    const prompt = `Provide constructive feedback on this user response:

User answer: ${params.userResponse}
Expected answer: ${params.expectedAnswer}
Context: ${params.context}

Give encouraging, specific feedback that helps the user learn.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive AI tutor providing constructive feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 200
    })

    return response.choices[0].message.content
  }
}

// Generate a quiz set of N multiple-choice questions
export async function generateQuizSet(params: {
  sessionContent: any
  sessionTitle: string
  sessionType: string
  courseTitle: string
  courseLearningObjectives: string[]
  numQuestions: number
}) {
  if (!openai) throw new Error('OpenAI client not initialized.')
  const system = `You are an expert quiz generator for micro-learning sessions. Output STRICT JSON only.`
  const user = `Create a quiz of ${params.numQuestions} multiple-choice questions for a session titled "${params.sessionTitle}" in the course "${params.courseTitle}". Base questions ONLY on this content: ${JSON.stringify(params.sessionContent)}. Each question should be concise and unambiguous.

Return a JSON array of objects with this exact shape per item:
{
  "type": "quiz",
  "id": "q<number>",
  "question": "<string>",
  "choices": ["<string>", "<string>", "<string>", "<string>"],
  "correctIndex": <0-3>,
  "questionType": "multiple-choice",
  "explanation": "<short explanation>"
}

No preface or markdown.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_tokens: 1200,
  })

  const content = response.choices[0].message.content || '[]'
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed)) throw new Error('Quiz set must be an array')
  return parsed
}

// Helper function to check if OpenAI is available
export function isOpenAIAvailable(): boolean {
  return openai !== null
}