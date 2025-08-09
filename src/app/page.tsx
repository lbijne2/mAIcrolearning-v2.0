'use client'

import { useAuth } from '@/hooks/useAuth'
import { Landing } from '@/components/Landing'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { loading } = useAuth()

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Always show the landing page - let users navigate from there
  return <Landing />
}
