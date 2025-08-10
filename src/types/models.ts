import { z } from 'zod'
import type { Course, Session } from './index'

// Zod schemas for validation
export const CourseGenerationFormSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  industry: z.string().min(1, 'Industry is required'),
  aiSkillLevel: z.enum(['none', 'basic', 'intermediate', 'advanced']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  learningGoals: z.string().min(1, 'At least one learning goal is required'),
  delivery: z.literal('micro-learning – 10 min/day')
})

export type CourseGenerationFormData = z.infer<typeof CourseGenerationFormSchema>

// Generated course structure from LLM
export interface GeneratedCourse {
  title: string
  description: string
  learningObjectives: string[]
  tags: string[]
  weeks: GeneratedWeek[]
  tools: string[]
  assessmentCheckpoints: string[]
}

export interface GeneratedWeek {
  weekNumber: number
  theme: string
  sessions: GeneratedSession[]
}

export interface GeneratedSession {
  weekNumber: number
  dayNumber: number
  title: string
  description: string
  sessionType: 'theory' | 'quiz' | 'interactive' | 'hands_on' | 'review'
  estimatedDuration: number
  learningObjectives: string[]
  content: any // JSON content from LLM
}

// Extended types for the application
export interface CourseRow extends Course {
  sessions?: SessionRow[]
}

export interface SessionRow extends Session {
  // Additional computed properties
  isCompleted?: boolean
  isInProgress?: boolean
}

// Error types
export interface AuthError {
  code: 'AUTH'
  message: string
}

export interface ValidationError {
  code: 'VALIDATION'
  message: string
  field?: string
}

export interface LLMError {
  code: 'LLM'
  message: string
}

export type CourseGenerationError = AuthError | ValidationError | LLMError

// Success response
export interface CourseGenerationResult {
  success: true
  courseId: string
}

export interface CourseGenerationResponse {
  success: boolean
  data?: CourseGenerationResult
  error?: CourseGenerationError
}
