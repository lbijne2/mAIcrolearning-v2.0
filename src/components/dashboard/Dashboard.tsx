'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { 
  Brain, 
  BookOpen, 
  Target, 
  Calendar, 
  TrendingUp, 
  Plus,
  LogOut,
  Settings,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress, CircularProgress } from '@/components/ui/Progress'
import { useAuth } from '@/hooks/useAuth'
import type { UserProfile } from '@/types'

interface DashboardProps {
  user: User
  profile: UserProfile
}

export function Dashboard({ user, profile }: DashboardProps) {
  const [showCourseModal, setShowCourseModal] = useState(false)
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto container-padding py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-display font-bold text-neutral-900">
                mAIcrolearning
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" icon={<Bell />}>
                Notifications
              </Button>
              <Button variant="ghost" size="sm" icon={<Settings />}>
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} icon={<LogOut />}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome back, {profile.first_name}!
          </h1>
          <p className="text-neutral-600">
            Ready to continue your AI learning journey? You're doing great!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="bg-primary-100 rounded-full p-3">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">0</p>
                <p className="text-sm text-neutral-600">Courses Started</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="bg-green-100 rounded-full p-3">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">0</p>
                <p className="text-sm text-neutral-600">Sessions Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="bg-accent-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">0</p>
                <p className="text-sm text-neutral-600">Day Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="bg-secondary-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">0%</p>
                <p className="text-sm text-neutral-600">Overall Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Course */}
            <Card>
              <CardHeader>
                <CardTitle>Your Learning Path</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Ready to Start Learning?
                  </h3>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    Let's create your first personalized AI course based on your profile. 
                    It will be tailored specifically for the {profile.industry} industry.
                  </p>
                  <Button 
                    onClick={() => setShowCourseModal(true)}
                    icon={<Plus />}
                  >
                    Generate My First Course
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Your Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.learning_goals.map((goal, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-neutral-700">Industry:</span>
                  <p className="text-neutral-900">{profile.industry}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">Role:</span>
                  <p className="text-neutral-900">{profile.job_role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">AI Experience:</span>
                  <p className="text-neutral-900 capitalize">{profile.ai_skill_level}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">Daily Goal:</span>
                  <p className="text-neutral-900">{profile.time_commitment} minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Daily Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CircularProgress value={0} size={100} className="mb-4" />
                <p className="text-sm text-neutral-600">
                  0 / {profile.time_commitment} minutes completed
                </p>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Start Today's Session
                </Button>
              </CardContent>
            </Card>

            {/* AI Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Your AI Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary-100 text-secondary-800 rounded text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Course Generation Modal - Placeholder */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Generate Your Course</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Brain className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600 mb-6">
                Course generation feature coming soon! We'll create a personalized 
                4-week AI course for the {profile.industry} industry.
              </p>
              <Button onClick={() => setShowCourseModal(false)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
