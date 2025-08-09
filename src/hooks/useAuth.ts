'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return
      }
      
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (user: User) => {
    try {
      console.log('Loading profile for user:', user.id)
      
      // Test basic Supabase connection first
      console.log('Testing Supabase connection...')
      const connectionTest = await supabase.from('user_profiles').select('count', { count: 'exact', head: true })
      console.log('Connection test result:', connectionTest)
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('Profile query result:', { profile, error, errorCode: error?.code, errorMessage: error?.message })

      if (error && error.code !== 'PGRST116') {
        console.error('Profile loading error details:')
        console.error('- Error object:', error)
        console.error('- Error code:', error.code)
        console.error('- Error message:', error.message)
        console.error('- Error details:', error.details)
        console.error('- Error hint:', error.hint)
        console.error('- Full error JSON:', JSON.stringify(error, null, 2))
        
        // Handle specific database errors
        if (error.code === '42P01') {
          console.error('🚨 DATABASE SETUP REQUIRED: The user_profiles table does not exist.')
          console.error('Please run the SQL schema file in your Supabase dashboard.')
          setState(prev => ({
            ...prev,
            user,
            profile: null,
            loading: false,
            error: 'Database setup required. Please contact support.'
          }))
          return
        }
        
        throw error
      }

      console.log('Profile loaded:', profile ? 'Found' : 'Not found')
      setState({
        user,
        profile: profile || null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Failed to load profile (catch block):', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      }))
    }
  }

  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }))
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }))
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }))
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const createProfile = async (profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!state.user) {
      console.error('createProfile: User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    console.log('createProfile: Starting profile creation for user:', state.user.id)
    console.log('createProfile: Profile data:', profileData)
    
    // Check if Supabase has the current session (with timeout)
    try {
      console.log('createProfile: Checking Supabase session...')
      const sessionCheck = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
      ])
      console.log('createProfile: Session check result:', sessionCheck?.data?.session?.user?.id || 'No session')
      
      if (!sessionCheck?.data?.session) {
        console.error('createProfile: No active Supabase session found')
        setState(prev => ({ ...prev, loading: false, error: 'Authentication session expired' }))
        return { success: false, error: 'Authentication session expired. Please sign in again.' }
      }
    } catch (sessionError) {
      console.error('createProfile: Session check failed, continuing anyway:', sessionError)
      // Continue with the profile creation attempt even if session check fails
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))

    // Skip connection test for now to avoid hanging - go straight to insert
    console.log('createProfile: Skipping connection test, attempting direct insert...')

    try {
      console.log('createProfile: Attempting to insert profile...')
      
      // Prepare the data for insertion
      const insertData = {
        user_id: state.user.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        industry: profileData.industry,
        job_role: profileData.job_role,
        experience_level: profileData.experience_level,
        ai_skill_level: profileData.ai_skill_level,
        learning_goals: profileData.learning_goals,
        preferred_learning_style: profileData.preferred_learning_style,
        time_commitment: profileData.time_commitment,
        interests: profileData.interests,
        company_size: profileData.company_size || null,
        technical_background: profileData.technical_background
      }
      
      console.log('createProfile: Insert data prepared:', insertData)

      // Simplified insert with timeout
      const { data, error } = await Promise.race([
        supabase.from('user_profiles').insert(insertData).select().single(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile creation timeout after 30 seconds')), 30000)
        )
      ])

      console.log('createProfile: Supabase response:', { data, error })

      if (error) {
        console.error('createProfile: Database error:', error)
        
        // Handle specific database errors
        if (error.code === '42P01') {
          const errorMsg = 'Database setup required. The user_profiles table does not exist. Please run the schema setup.'
          console.error('🚨 DATABASE SETUP REQUIRED:', errorMsg)
          setState(prev => ({ ...prev, error: errorMsg, loading: false }))
          return { success: false, error: errorMsg }
        }
        
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      console.log('createProfile: Profile created successfully:', data)
      setState(prev => ({ ...prev, profile: data, loading: false }))
      return { success: true, data }
    } catch (err) {
      console.error('createProfile: Unexpected error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user || !state.profile) {
      return { success: false, error: 'User not authenticated or no profile' }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', state.user.id)
      .select()
      .single()

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }))
      return { success: false, error: error.message }
    }

    setState(prev => ({ ...prev, profile: data, loading: false }))
    return { success: true, data }
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    createProfile,
    updateProfile
  }
}
