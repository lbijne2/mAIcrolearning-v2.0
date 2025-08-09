export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          industry: string
          job_role: string
          experience_level: 'beginner' | 'intermediate' | 'advanced'
          ai_skill_level: 'none' | 'basic' | 'intermediate' | 'advanced'
          learning_goals: string[]
          preferred_learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
          time_commitment: number
          interests: string[]
          company_size: string | null
          technical_background: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          industry: string
          job_role: string
          experience_level: 'beginner' | 'intermediate' | 'advanced'
          ai_skill_level: 'none' | 'basic' | 'intermediate' | 'advanced'
          learning_goals: string[]
          preferred_learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
          time_commitment: number
          interests: string[]
          company_size?: string | null
          technical_background: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          industry?: string
          job_role?: string
          experience_level?: 'beginner' | 'intermediate' | 'advanced'
          ai_skill_level?: 'none' | 'basic' | 'intermediate' | 'advanced'
          learning_goals?: string[]
          preferred_learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
          time_commitment?: number
          interests?: string[]
          company_size?: string | null
          technical_background?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          industry: string
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          total_sessions: number
          estimated_duration: number
          tags: string[]
          learning_objectives: string[]
          prerequisites: string[]
          created_at: string
          updated_at: string
          user_id: string
          status: 'draft' | 'active' | 'completed' | 'archived'
        }
        Insert: {
          id?: string
          title: string
          description: string
          industry: string
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          total_sessions: number
          estimated_duration: number
          tags: string[]
          learning_objectives: string[]
          prerequisites: string[]
          created_at?: string
          updated_at?: string
          user_id: string
          status?: 'draft' | 'active' | 'completed' | 'archived'
        }
        Update: {
          id?: string
          title?: string
          description?: string
          industry?: string
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          total_sessions?: number
          estimated_duration?: number
          tags?: string[]
          learning_objectives?: string[]
          prerequisites?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
          status?: 'draft' | 'active' | 'completed' | 'archived'
        }
      }
      sessions: {
        Row: {
          id: string
          course_id: string
          week_number: number
          day_number: number
          title: string
          description: string
          content: any // JSON
          session_type: 'theory' | 'quiz' | 'interactive' | 'hands_on' | 'review'
          estimated_duration: number
          order_index: number
          prerequisites: string[]
          learning_objectives: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          week_number: number
          day_number: number
          title: string
          description: string
          content: any
          session_type: 'theory' | 'quiz' | 'interactive' | 'hands_on' | 'review'
          estimated_duration: number
          order_index: number
          prerequisites: string[]
          learning_objectives: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          week_number?: number
          day_number?: number
          title?: string
          description?: string
          content?: any
          session_type?: 'theory' | 'quiz' | 'interactive' | 'hands_on' | 'review'
          estimated_duration?: number
          order_index?: number
          prerequisites?: string[]
          learning_objectives?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          session_id: string
          status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          start_time: string | null
          completion_time: string | null
          time_spent: number
          score: number | null
          attempts: number
          notes: string | null
          emotion_data: any | null // JSON
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          session_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          start_time?: string | null
          completion_time?: string | null
          time_spent?: number
          score?: number | null
          attempts?: number
          notes?: string | null
          emotion_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          session_id?: string
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          start_time?: string | null
          completion_time?: string | null
          time_spent?: number
          score?: number | null
          attempts?: number
          notes?: string | null
          emotion_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_paths: {
        Row: {
          id: string
          user_id: string
          courses: string[]
          current_course_id: string
          current_session_id: string
          adaptive_adjustments: any[] // JSON
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          courses: string[]
          current_course_id: string
          current_session_id: string
          adaptive_adjustments?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          courses?: string[]
          current_course_id?: string
          current_session_id?: string
          adaptive_adjustments?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          type: 'user' | 'assistant' | 'system'
          content: string
          timestamp: string
          metadata: any | null // JSON
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          type: 'user' | 'assistant' | 'system'
          content: string
          timestamp?: string
          metadata?: any | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          type?: 'user' | 'assistant' | 'system'
          content?: string
          timestamp?: string
          metadata?: any | null
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          course_completion_rate: number
          average_session_time: number
          preferred_session_types: string[]
          learning_velocity: number
          engagement_trends: any[] // JSON
          skill_progression: any[] // JSON
          areas_for_improvement: string[]
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_completion_rate: number
          average_session_time: number
          preferred_session_types: string[]
          learning_velocity: number
          engagement_trends: any[]
          skill_progression: any[]
          areas_for_improvement: string[]
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_completion_rate?: number
          average_session_time?: number
          preferred_session_types?: string[]
          learning_velocity?: number
          engagement_trends?: any[]
          skill_progression?: any[]
          areas_for_improvement?: string[]
          generated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
