'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useNavigationGuard() {
  const router = useRouter()

  const navigate = useCallback((path: string, delay: number = 100) => {
    // Add a small delay to ensure state is stable before navigation
    setTimeout(() => {
      router.push(path)
    }, delay)
  }, [router])

  const navigateWithState = useCallback((path: string, state?: any, delay: number = 100) => {
    // Add a small delay to ensure state is stable before navigation
    setTimeout(() => {
      if (state) {
        // Store state in sessionStorage for the next page
        sessionStorage.setItem('navigationState', JSON.stringify(state))
      }
      router.push(path)
    }, delay)
  }, [router])

  const getNavigationState = useCallback(() => {
    const state = sessionStorage.getItem('navigationState')
    if (state) {
      sessionStorage.removeItem('navigationState')
      return JSON.parse(state)
    }
    return null
  }, [])

  return {
    navigate,
    navigateWithState,
    getNavigationState
  }
}
