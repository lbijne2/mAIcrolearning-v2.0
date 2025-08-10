'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getCourseLLM } from '@/lib/llm'
import { normalizeGeneratedCourse, calculateOrderIndex } from '@/utils/course'
import type { GenerationProgress, GenerationStage } from '@/app/generate/actions'

export interface SimpleCourseGenerationResponse {
  success: boolean
  data?: {
    success: boolean
    courseId: string
  }
  error?: {
    code: string
    message: string
    field?: string
  }
}

export async function generateSimpleCourse(
  formData: FormData,
  onProgress?: (progress: GenerationProgress) => void
): Promise<SimpleCourseGenerationResponse> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    // Stage 1: Validating input
    onProgress?.({
      stage: 'validating',
      progress: 10,
      message: 'Validating your course request...'
    })
    
    // Get user ID from form data
    const userId = formData.get('userId') as string
    const prompt = formData.get('prompt') as string
    
    if (!userId || !prompt) {
      return {
        success: false,
        error: {
          code: 'VALIDATION',
          message: 'User ID and prompt are required.'
        }
      }
    }
    
    // Verify user exists and get profile
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user.user) {
      return {
        success: false,
        error: {
          code: 'AUTH',
          message: 'Authentication required. Please sign in to generate courses.'
        }
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          code: 'PROFILE',
          message: 'User profile not found. Please complete your profile setup.'
        }
      }
    }

    // Stage 2: Generating course structure with LLM
    onProgress?.({
      stage: 'generating_structure',
      progress: 30,
      message: 'Generating your personalized course structure...'
    })
    
    // Generate course structure using LLM with profile data
    const llm = await getCourseLLM()
    let generatedCourse
    
    try {
      console.log('Starting simple LLM course generation with params:', {
        prompt,
        industry: profile.industry,
        aiSkillLevel: profile.ai_skill_level,
        experienceLevel: profile.experience_level,
        learningGoals: profile.learning_goals
      })
      
      const rawCourse = await llm.generateCourseStructure({
        topic: prompt,
        industry: profile.industry,
        aiSkillLevel: profile.ai_skill_level,
        experienceLevel: profile.experience_level,
        learningGoals: profile.learning_goals
      })
      
      console.log('Raw LLM response:', rawCourse)
      
      generatedCourse = normalizeGeneratedCourse(rawCourse)
      console.log('Normalized course structure:', generatedCourse)
    } catch (llmError) {
      console.error('LLM generation error:', llmError)
      console.error('Error details:', {
        name: (llmError as Error).name,
        message: (llmError as Error).message,
        stack: (llmError as Error).stack
      })
      
      // Try one retry with stricter prompt
      try {
        console.log('Attempting retry with stricter prompt...')
        
        const retryResponse = await llm.generateCourseStructure({
          topic: prompt,
          industry: profile.industry,
          aiSkillLevel: profile.ai_skill_level,
          experienceLevel: profile.experience_level,
          learningGoals: profile.learning_goals
        })
        
        console.log('Retry LLM response:', retryResponse)
        generatedCourse = normalizeGeneratedCourse(retryResponse)
      } catch (retryError) {
        console.error('Retry also failed:', retryError)
        return {
          success: false,
          error: {
            code: 'LLM',
            message: `Failed to generate course structure: ${(llmError as Error).message}. Please try again.`
          }
        }
      }
    }

    // Stage 3: Creating course record
    onProgress?.({
      stage: 'creating_course',
      progress: 60,
      message: 'Creating your course...'
    })
    
    // Create course record
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert({
        title: generatedCourse.title,
        description: generatedCourse.description,
        industry: profile.industry,
        difficulty_level: profile.experience_level,
        total_sessions: 28,
        estimated_duration: 280, // 28 sessions * 10 minutes
        tags: generatedCourse.tags,
        learning_objectives: generatedCourse.learningObjectives,
        prerequisites: [],
        user_id: user.user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (courseError) {
      console.error('Course creation error:', courseError)
      return {
        success: false,
        error: {
          code: 'LLM',
          message: 'Failed to save course. Please try again.'
        }
      }
    }

    // Stage 4: Creating session records
    onProgress?.({
      stage: 'creating_sessions',
      progress: 80,
      message: 'Creating your course sessions...'
    })
    
    // Create session records
    const sessionInserts = []
    
    for (const week of generatedCourse.weeks) {
      for (const session of week.sessions) {
        const orderIndex = calculateOrderIndex(session.weekNumber, session.dayNumber)
        
        sessionInserts.push({
          course_id: course.id,
          week_number: session.weekNumber,
          day_number: session.dayNumber,
          title: session.title,
          description: session.description,
          content: session.content,
          session_type: session.sessionType,
          estimated_duration: session.estimatedDuration,
          order_index: orderIndex,
          prerequisites: [],
          learning_objectives: session.learningObjectives
        })
      }
    }

    const { error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .insert(sessionInserts)

    if (sessionsError) {
      console.error('Sessions creation error:', sessionsError)
      // Clean up the course if sessions fail
      await supabaseAdmin.from('courses').delete().eq('id', course.id)
      
      return {
        success: false,
        error: {
          code: 'LLM',
          message: 'Failed to create course sessions. Please try again.'
        }
      }
    }

    // Stage 5: Finalizing
    onProgress?.({
      stage: 'finalizing',
      progress: 100,
      message: 'Finalizing your course...'
    })

    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: {
        success: true,
        courseId: course.id
      }
    }

  } catch (error) {
    console.error('Simple course generation error:', error)
    return {
      success: false,
      error: {
        code: 'LLM',
        message: 'An unexpected error occurred. Please try again.'
      }
    }
  }
}
