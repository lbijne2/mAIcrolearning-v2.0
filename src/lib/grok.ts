import OpenAI from 'openai'

// Using OpenAI SDK with xAI Grok API
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
})

export { grok }

// Helper function to parse JSON responses that might be wrapped in markdown code blocks
function parseJSONResponse(content: string): any {
  console.log('Raw response content:', content)
  console.log('Content length:', content.length)
  console.log('Content type:', typeof content)
  
  // Check if response might be truncated
  if (content.length > 7000) {
    console.log('Response is quite long, checking for completeness...')
  }
  
  try {
    // First, try to parse as raw JSON
    console.log('Attempting to parse as raw JSON...')
    return JSON.parse(content)
  } catch (error) {
    console.log('Raw JSON parsing failed:', error)
    
    // Check if the error suggests truncation
    const errorMessage = (error as Error).message
    if (errorMessage.includes('Unexpected end of JSON input') || 
        errorMessage.includes('Expected') && errorMessage.includes('after array element')) {
      console.error('JSON appears to be truncated. Response length:', content.length)
      throw new Error('Response was truncated. Please try again with a shorter course topic or contact support.')
    }
    
    // If that fails, try to extract JSON from markdown code blocks
    console.log('Looking for markdown code blocks...')
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      console.log('Found markdown block, extracted JSON:', jsonMatch[1])
      try {
        return JSON.parse(jsonMatch[1])
      } catch (innerError) {
        console.error('Failed to parse JSON from markdown block:', innerError)
        console.error('Extracted content was:', jsonMatch[1])
        throw new Error('Invalid JSON format in response')
      }
    }
    
    // If no markdown blocks found, try to find JSON object in the content
    console.log('Looking for JSON object in content...')
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      console.log('Found JSON object:', jsonObjectMatch[0])
      try {
        return JSON.parse(jsonObjectMatch[0])
      } catch (innerError) {
        console.error('Failed to parse JSON object from content:', innerError)
        console.error('Extracted content was:', jsonObjectMatch[0])
        throw new Error('Invalid JSON format in response')
      }
    }
    
    console.error('No valid JSON found in response. Full content:', content)
    throw new Error('No valid JSON found in response')
  }
}

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

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. The response must be a single JSON object.

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
- review: Consolidation and reflection

Example JSON structure:
{
  "title": "Course Title",
  "description": "Course description",
  "learningObjectives": ["objective1", "objective2"],
  "tags": ["tag1", "tag2"],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week 1 Theme",
      "sessions": [
        {
          "weekNumber": 1,
          "dayNumber": 1,
          "title": "Session Title",
          "description": "Session description",
          "sessionType": "theory",
          "estimatedDuration": 10,
          "learningObjectives": ["objective1"],
          "content": {
            "mainContent": "Detailed session content here",
            "examples": ["example1", "example2"],
            "keyPoints": ["point1", "point2"],
            "resources": ["resource1", "resource2"]
          }
        }
      ]
    }
  ],
  "tools": ["tool1", "tool2"],
  "assessmentCheckpoints": ["checkpoint1", "checkpoint2"]
}

IMPORTANT: Every session MUST include a "content" field with detailed session content. The content field should contain the actual learning material for that session.`,

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
    const prompt = COURSE_GENERATION_PROMPTS.courseStructure
      .replace('{topic}', params.topic)
      .replace('{industry}', params.industry)
      .replace('{aiSkillLevel}', params.aiSkillLevel)
      .replace('{experienceLevel}', params.experienceLevel)
      .replace('{learningGoals}', params.learningGoals.join(', '))

    const response = await grok.chat.completions.create({
      model: 'grok-2-vision-1212',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI education curriculum designer. You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. The response must be a single JSON object that can be parsed directly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    })

    const content = response.choices[0].message.content || '{}'
    return parseJSONResponse(content)
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
    const prompt = COURSE_GENERATION_PROMPTS.sessionContent
      .replace('{sessionType}', params.sessionType)
      .replace('{sessionTitle}', params.sessionTitle)
      .replace('{week}', params.week.toString())
      .replace('{day}', params.day.toString())
      .replace('{industry}', params.industry)
      .replace('{aiSkillLevel}', params.aiSkillLevel)
      .replace('{learningObjectives}', params.learningObjectives.join(', '))

    const response = await grok.chat.completions.create({
      model: 'grok-2-vision-1212',
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
      max_tokens: 4000
    })

    const content = response.choices[0].message.content || '{}'
    return parseJSONResponse(content)
  }

  async adaptContent(params: {
    originalContent: any
    performanceData: any
    emotionData: any
    adaptationType: string
  }) {
    const prompt = COURSE_GENERATION_PROMPTS.adaptiveContent
      .replace('{originalContent}', JSON.stringify(params.originalContent))
      .replace('{performanceData}', JSON.stringify(params.performanceData))
      .replace('{emotionData}', JSON.stringify(params.emotionData))
      .replace('{adaptationType}', params.adaptationType)

    const response = await grok.chat.completions.create({
      model: 'grok-2-vision-1212',
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
      max_tokens: 3000
    })

    const content = response.choices[0].message.content || '{}'
    return parseJSONResponse(content)
  }
}

// Chatbot for lesson delivery
export class LessonChatbot {
  async generateResponse(params: {
    sessionContent: any
    userMessage: string
    conversationHistory: any[]
    emotionData?: any
  }) {
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
- Suggest tool calls when appropriate for hands-on learning`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...params.conversationHistory,
      { role: 'user', content: params.userMessage }
    ]

    const response = await grok.chat.completions.create({
      model: 'grok-2-vision-1212',
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
    const prompt = `Provide constructive feedback on this user response:

User answer: ${params.userResponse}
Expected answer: ${params.expectedAnswer}
Context: ${params.context}

Give encouraging, specific feedback that helps the user learn.`

    const response = await grok.chat.completions.create({
      model: 'grok-2-vision-1212',
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
