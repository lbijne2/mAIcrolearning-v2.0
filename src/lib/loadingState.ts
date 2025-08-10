import React from 'react'

// Simple loading state management to prevent race conditions

class LoadingStateManager {
  private loadingStates: Map<string, boolean> = new Map()
  private listeners: Map<string, Set<() => void>> = new Map()

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading)
    this.notifyListeners(key)
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  subscribe(key: string, callback: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key)
      if (keyListeners) {
        keyListeners.delete(callback)
        if (keyListeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  private notifyListeners(key: string) {
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      keyListeners.forEach(callback => callback())
    }
  }

  // Clear all loading states (useful for navigation)
  clearAll() {
    this.loadingStates.clear()
    this.listeners.forEach((listeners, key) => {
      listeners.forEach(callback => callback())
    })
  }

  // Clear specific loading state
  clear(key: string) {
    this.loadingStates.delete(key)
    this.notifyListeners(key)
  }
}

// Global instance
export const loadingStateManager = new LoadingStateManager()

// React hook for using loading states
export function useLoadingState(key: string) {
  const [isLoading, setIsLoading] = React.useState(() => loadingStateManager.isLoading(key))

  React.useEffect(() => {
    const unsubscribe = loadingStateManager.subscribe(key, () => {
      setIsLoading(loadingStateManager.isLoading(key))
    })
    return unsubscribe
  }, [key])

  const setLoading = React.useCallback((loading: boolean) => {
    loadingStateManager.setLoading(key, loading)
  }, [key])

  return [isLoading, setLoading] as const
}

// Utility functions
export const setGlobalLoading = (key: string, loading: boolean) => {
  loadingStateManager.setLoading(key, loading)
}

export const getGlobalLoading = (key: string) => {
  return loadingStateManager.isLoading(key)
}

export const clearGlobalLoading = (key?: string) => {
  if (key) {
    loadingStateManager.clear(key)
  } else {
    loadingStateManager.clearAll()
  }
}
