import type { CourseGenerationChain } from './openai'
import type { CourseGenerationChain as GrokCourseGenerationChain } from './grok'

export async function getCourseLLM(): Promise<CourseGenerationChain | GrokCourseGenerationChain> {
  if (process.env.XAI_API_KEY) {
    const { CourseGenerationChain } = await import('@/lib/grok')
    return new CourseGenerationChain()
  }
  
  if (process.env.OPENAI_API_KEY) {
    const { CourseGenerationChain } = await import('@/lib/openai')
    return new CourseGenerationChain()
  }
  
  throw new Error('No LLM configured. Please set XAI_API_KEY or OPENAI_API_KEY environment variable.')
}

export function isLLMAvailable(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.XAI_API_KEY)
}

export function getLLMProvider(): 'openai' | 'grok' | 'none' {
  if (process.env.XAI_API_KEY) return 'grok'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'none'
}

// Client-side versions that check for environment variables
export function isLLMAvailableClient(): boolean {
  // For client-side, we'll assume LLM is available and let the server handle the actual check
  // This prevents the UI from being blocked when we can't access process.env on the client
  return true
}

export function getLLMProviderClient(): 'openai' | 'grok' | 'unknown' {
  // For client-side, we can't determine the provider without exposing API keys
  // The server will handle the actual provider selection
  return 'unknown'
}
