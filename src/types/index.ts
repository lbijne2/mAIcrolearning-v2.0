import { Database } from './database'

// Export the Database type
export type { Database }

// Extract UserProfile type from the Database schema
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Define OnboardingFormData interface based on the form structure
export interface OnboardingFormData {
  personal: {
    first_name: string
    last_name: string
    email: string
  }
  professional: {
    industry: string
    job_role: string
    experience_level: 'beginner' | 'intermediate' | 'advanced'
    technical_background: boolean
    company_size?: string
  }
  learning: {
    ai_skill_level: 'none' | 'basic' | 'intermediate' | 'advanced'
    learning_goals: string[]
    preferred_learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
    time_commitment: number
    interests: string[]
  }
}

// Additional types that might be useful
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Course = Database['public']['Tables']['courses']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type LearningPath = Database['public']['Tables']['learning_paths']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type Analytics = Database['public']['Tables']['analytics']['Row']
