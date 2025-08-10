'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConnectionError } from '@/components/ui/ConnectionError'

export default function DashboardPage() {
  const { user, profile, loading, error, refreshAuth, clearError } = useAuth()
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
      } else if (!profile) {
        router.push('/onboarding')
      }
    }
  }, [user, profile, loading, router])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && retryCount < 2) {
        console.log('Dashboard loading timeout, retrying...')
        setIsRetrying(true)
        setRetryCount(prev => prev + 1)
        // Force a page reload after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }, 15000) // Increased to 15 seconds to match useAuth timeout

    return () => clearTimeout(timeout)
  }, [loading, retryCount])

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    clearError()
    await refreshAuth()
    setIsRetrying(false)
  }

  const handleClearError = () => {
    clearError()
    setRetryCount(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600 mb-4">Loading dashboard...</p>
          {retryCount > 0 && (
            <p className="text-sm text-neutral-500 mb-4">
              Retry attempt {retryCount}/3
            </p>
          )}
          {retryCount >= 2 && (
            <Button 
              onClick={handleRetry}
              loading={isRetrying}
              icon={<RefreshCw />}
              variant="outline"
            >
              Retry Loading
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ConnectionError
            error={error}
            onRetry={handleRetry}
            onClearError={handleClearError}
          />
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return <Dashboard user={user} profile={profile} />
}
