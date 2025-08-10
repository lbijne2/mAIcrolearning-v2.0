import type { GeneratedCourse, GeneratedSession } from '@/types/models'

export function normalizeGeneratedCourse(json: any): GeneratedCourse {
  console.log('Normalizing course structure:', json)
  console.log('JSON type:', typeof json)
  console.log('JSON keys:', Object.keys(json || {}))
  
  // Defensive validation of the generated course structure
  if (!json || typeof json !== 'object') {
    console.error('Invalid JSON structure:', json)
    throw new Error('Invalid course structure: expected object')
  }

  const course: GeneratedCourse = {
    title: json.title || 'Untitled Course',
    description: json.description || 'No description provided',
    learningObjectives: Array.isArray(json.learningObjectives) ? json.learningObjectives : [],
    tags: Array.isArray(json.tags) ? json.tags : [],
    weeks: [],
    tools: Array.isArray(json.tools) ? json.tools : [],
    assessmentCheckpoints: Array.isArray(json.assessmentCheckpoints) ? json.assessmentCheckpoints : []
  }

  // Validate and normalize weeks
  if (Array.isArray(json.weeks)) {
    console.log('Found weeks array with length:', json.weeks.length)
    course.weeks = json.weeks.map((week: any, weekIndex: number) => {
      console.log(`Week ${weekIndex + 1}:`, week)
      return {
        weekNumber: week.weekNumber || weekIndex + 1,
        theme: week.theme || `Week ${weekIndex + 1}`,
        sessions: normalizeSessions(week.sessions || [], weekIndex + 1)
      }
    })
  } else {
    console.error('No weeks array found in JSON:', json)
    console.error('Available keys:', Object.keys(json || {}))
    throw new Error('Course structure must include a weeks array')
  }

  // Ensure we have exactly 4 weeks with 7 sessions each (28 total)
  if (course.weeks.length !== 4) {
    console.error(`Expected 4 weeks, got ${course.weeks.length}. Weeks:`, course.weeks)
    throw new Error(`Expected 4 weeks, got ${course.weeks.length}`)
  }

  const totalSessions = course.weeks.reduce((sum, week) => sum + week.sessions.length, 0)
  if (totalSessions !== 28) {
    console.error(`Expected 28 sessions total, got ${totalSessions}. Sessions per week:`, course.weeks.map(w => w.sessions.length))
    throw new Error(`Expected 28 sessions total, got ${totalSessions}`)
  }

  console.log('Successfully normalized course structure')
  return course
}

function normalizeSessions(sessions: any[], weekNumber: number): GeneratedSession[] {
  if (!Array.isArray(sessions)) {
    console.error(`Invalid sessions array for week ${weekNumber}:`, sessions)
    throw new Error(`Invalid sessions array for week ${weekNumber}`)
  }

  console.log(`Normalizing ${sessions.length} sessions for week ${weekNumber}`)

  return sessions.map((session: any, dayIndex: number) => {
    console.log(`Session ${dayIndex + 1}:`, session)
    
    // Ensure content field exists with proper structure
    let content = session.content || {}
    if (typeof content === 'string') {
      content = { mainContent: content }
    } else if (!content || typeof content !== 'object') {
      content = {
        mainContent: session.description || `Content for ${session.title || `Session ${dayIndex + 1}`}`,
        examples: [],
        keyPoints: [],
        resources: []
      }
    }
    
    return {
      weekNumber,
      dayNumber: session.dayNumber || dayIndex + 1,
      title: session.title || `Session ${dayIndex + 1}`,
      description: session.description || 'No description provided',
      sessionType: validateSessionType(session.sessionType),
      estimatedDuration: session.estimatedDuration || 10,
      learningObjectives: Array.isArray(session.learningObjectives) ? session.learningObjectives : [],
      content: content
    }
  })
}

function validateSessionType(type: any): 'theory' | 'quiz' | 'interactive' | 'hands_on' | 'review' {
  const validTypes = ['theory', 'quiz', 'interactive', 'hands_on', 'review']
  if (validTypes.includes(type)) {
    return type
  }
  return 'theory' // Default fallback
}

export function calculateOrderIndex(weekNumber: number, dayNumber: number): number {
  return (weekNumber - 1) * 7 + dayNumber
}

export function parseOrderIndex(orderIndex: number): { weekNumber: number; dayNumber: number } {
  const weekNumber = Math.floor((orderIndex - 1) / 7) + 1
  const dayNumber = ((orderIndex - 1) % 7) + 1
  return { weekNumber, dayNumber }
}

export function validateCourseStructure(course: GeneratedCourse): boolean {
  try {
    // Check if we have exactly 4 weeks
    if (course.weeks.length !== 4) return false

    // Check if each week has exactly 7 sessions
    for (const week of course.weeks) {
      if (week.sessions.length !== 7) return false
      
      // Check if session types are valid
      for (const session of week.sessions) {
        const validTypes = ['theory', 'quiz', 'interactive', 'hands_on', 'review']
        if (!validTypes.includes(session.sessionType)) return false
      }
    }

    return true
  } catch {
    return false
  }
}
