'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase'
import { getCourseLLM } from '@/lib/llm'
import { normalizeGeneratedCourse, calculateOrderIndex } from '@/utils/course'
import { 
  CourseGenerationFormSchema, 
  type CourseGenerationFormData,
  type CourseGenerationResponse,
  type CourseGenerationError
} from '@/types/models'

// Progress tracking types
export type GenerationStage = 
  | 'validating'
  | 'generating_structure'
  | 'creating_course'
  | 'creating_sessions'
  | 'finalizing'

export interface GenerationProgress {
  stage: GenerationStage
  progress: number
  message: string
}

export async function generateCoursePlan(
  formData: FormData,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CourseGenerationResponse> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    // Stage 1: Validating input
    onProgress?.({
      stage: 'validating',
      progress: 10,
      message: 'Validating your course details...'
    })
    
    // Get user ID from form data
    const userId = formData.get('userId') as string
    
    if (!userId) {
      return {
        success: false,
        error: {
          code: 'AUTH',
          message: 'Authentication required. Please sign in to generate courses.'
        }
      }
    }
    
    // Verify user exists
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

    // Parse and validate form data
    const rawData = {
      topic: formData.get('topic') as string,
      industry: formData.get('industry') as string,
      aiSkillLevel: formData.get('aiSkillLevel') as string,
      experienceLevel: formData.get('experienceLevel') as string,
      learningGoals: formData.get('learningGoals') as string,
      delivery: formData.get('delivery') as string
    }

    // Use the raw data directly since learningGoals is now a string
    const parsedData = rawData

    const validationResult = CourseGenerationFormSchema.safeParse(parsedData)
    
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION',
          message: 'Invalid form data. Please check your inputs.',
          field: validationResult.error.errors[0]?.path?.[0] as string
        }
      }
    }

    const validatedData = validationResult.data

    // Stage 2: Generating course structure with LLM
    onProgress?.({
      stage: 'generating_structure',
      progress: 30,
      message: 'Generating your personalized course structure...'
    })
    
    // Generate course structure using LLM
    const llm = await getCourseLLM()
    let generatedCourse
    
    try {
      console.log('Starting LLM course generation with params:', {
        topic: validatedData.topic,
        industry: validatedData.industry,
        aiSkillLevel: validatedData.aiSkillLevel,
        experienceLevel: validatedData.experienceLevel,
        learningGoals: validatedData.learningGoals.split(',').map(goal => goal.trim()).filter(Boolean)
      })
      
      const rawCourse = await llm.generateCourseStructure({
        topic: validatedData.topic,
        industry: validatedData.industry,
        aiSkillLevel: validatedData.aiSkillLevel,
        experienceLevel: validatedData.experienceLevel,
        learningGoals: validatedData.learningGoals.split(',').map(goal => goal.trim()).filter(Boolean)
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
          topic: validatedData.topic,
          industry: validatedData.industry,
          aiSkillLevel: validatedData.aiSkillLevel,
          experienceLevel: validatedData.experienceLevel,
          learningGoals: validatedData.learningGoals.split(',').map(goal => goal.trim()).filter(Boolean)
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
        industry: validatedData.industry,
        difficulty_level: validatedData.experienceLevel,
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
    console.error('Course generation error:', error)
    return {
      success: false,
      error: {
        code: 'LLM',
        message: 'An unexpected error occurred. Please try again.'
      }
    }
  }
}

export async function publishCourse(courseId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user.user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .update({ status: 'active' })
      .eq('id', courseId)
      .eq('user_id', user.user.id)

    if (error) {
      return { success: false, error: 'Failed to publish course' }
    }

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Publish course error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function discardCourse(courseId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user.user) {
      return { success: false, error: 'Authentication required' }
    }

    // Soft delete by setting status to archived
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ status: 'archived' })
      .eq('id', courseId)
      .eq('user_id', user.user.id)

    if (error) {
      return { success: false, error: 'Failed to discard course' }
    }

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Discard course error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function revertCourseToDraft(courseId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user.user) {
      return { success: false, error: 'Authentication required' }
    }

    // Revert course status from active to draft
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ status: 'draft' })
      .eq('id', courseId)
      .eq('user_id', user.user.id)
      .eq('status', 'active') // Only allow reverting active courses

    if (error) {
      return { success: false, error: 'Failed to revert course to draft' }
    }

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Revert course error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
