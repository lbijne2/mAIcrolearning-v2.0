'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'
import { testSupabaseConnection, getConnectionStatus } from '@/utils/connectionTest'

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

  const loadUserProfile = useCallback(async (user: User, retryCount = 0) => {
    const maxRetries = 2
    
    try {
      console.log(`Loading profile for user: ${user.id} (attempt ${retryCount + 1}/${maxRetries + 1})`)
      console.log('Current timestamp:', new Date().toISOString())
      
      // First, let's check if we can connect to Supabase at all
      let connectionTest = false
      try {
        console.log('Testing Supabase connection...')
        console.log('Environment status:', getConnectionStatus())
        
        const connectionResult = await testSupabaseConnection()
        if (connectionResult.success) {
          connectionTest = true
          console.log(`✅ Supabase connection test successful (${connectionResult.responseTime}ms)`)
        } else {
          console.warn('⚠️ Supabase connection test failed:', connectionResult.error)
          console.warn('Connection details:', connectionResult.details)
        }
      } catch (connectionError) {
        console.warn('⚠️ Supabase connection test failed:', connectionError)
        // Continue anyway, the actual query might still work
      }
      
      // Add timeout to prevent hanging - increased to 15 seconds
      console.log('Starting profile query...')
      const startTime = Date.now()
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: profile, error } = await Promise.race([
        profilePromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile loading timeout')), 15000)
        )
      ])
      
      const queryTime = Date.now() - startTime
      console.log(`Profile query completed in ${queryTime}ms`)

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
        
        // Handle network/connection errors
        if (error.code === 'PGRST301' || error.message?.includes('fetch')) {
          console.error('🌐 NETWORK ERROR: Unable to connect to database')
          setState(prev => ({
            ...prev,
            user,
            profile: null,
            loading: false,
            error: 'Network connection issue. Please check your internet connection and try again.'
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
      console.error(`Failed to load profile (attempt ${retryCount + 1}):`, error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error stringified:', JSON.stringify(error, null, 2))
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.message.includes('timeout')) {
        if (retryCount < maxRetries) {
          console.log(`Retrying profile load in 2 seconds... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            loadUserProfile(user, retryCount + 1)
          }, 2000)
          return
        } else {
          console.error('Max retries reached for profile loading')
          setState(prev => ({
            ...prev,
            user,
            profile: null,
            loading: false,
            error: 'Profile loading timed out after multiple attempts. Please check your connection and try again.'
          }))
          return
        }
      }
      
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      }))
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession()
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Session initialization timeout')), 15000)
          )
        ])

        if (!mounted) return

        if (error) {
          console.error('Session initialization error:', error)
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }
        
        if (session?.user) {
          console.log('Session found, loading user profile...')
          await loadUserProfile(session.user)
        } else {
          console.log('No active session found')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        if (!mounted) return
        console.error('Auth initialization error:', error)
        
        let errorMessage = 'Authentication initialization failed'
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'Authentication service is taking too long to respond. Please check your connection and try again.'
          } else {
            errorMessage = error.message
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage
        }))
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
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

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

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

  // Add a method to manually refresh the auth state
  const refreshAuth = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session refresh timeout')), 15000)
        )
      ])
      
      if (error) {
        console.error('Session refresh error:', error)
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return
      }
      
      if (session?.user) {
        console.log('Session refreshed, loading user profile...')
        await loadUserProfile(session.user)
      } else {
        console.log('No active session found during refresh')
        setState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      let errorMessage = 'Failed to refresh authentication'
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Authentication refresh timed out. Please check your connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }))
    }
  }, [loadUserProfile])

  // Add a method to clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    createProfile,
    updateProfile,
    refreshAuth,
    clearError
  }
}
