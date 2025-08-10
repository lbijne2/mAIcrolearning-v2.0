import { supabase } from '@/lib/supabase'

export interface ConnectionTestResult {
  success: boolean
  error?: string
  responseTime?: number
  details?: any
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Basic connection test
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error)
      return {
        success: false,
        error: error.message,
        responseTime,
        details: error
      }
    }
    
    console.log('✅ Supabase connection test successful')
    return {
      success: true,
      responseTime,
      details: data
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('❌ Supabase connection test exception:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
      details: error
    }
  }
}

export async function testAuthConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Testing Supabase auth connection...')
    
    const { data, error } = await supabase.auth.getSession()
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.error('❌ Supabase auth test failed:', error)
      return {
        success: false,
        error: error.message,
        responseTime,
        details: error
      }
    }
    
    console.log('✅ Supabase auth test successful')
    return {
      success: true,
      responseTime,
      details: data
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('❌ Supabase auth test exception:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
      details: error
    }
  }
}

export function getConnectionStatus(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    return '❌ Missing environment variables'
  }
  
  if (!url.includes('supabase.co')) {
    return '⚠️ Invalid Supabase URL'
  }
  
  if (key.length < 100) {
    return '⚠️ Invalid Supabase key format'
  }
  
  return '✅ Environment variables configured'
}
