'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Bell,
  Edit3,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress, CircularProgress } from '@/components/ui/Progress'
import { SimpleCourseGenerator } from './SimpleCourseGenerator'
import { AccountManager } from './AccountManager'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { UserProfile, Course, UserProgress, Session } from '@/types'
import type { CourseRow } from '@/types/models'

interface DashboardProps {
  user: User
  profile: UserProfile
}

export function Dashboard({ user, profile }: DashboardProps) {
  const [showSimpleCourseModal, setShowSimpleCourseModal] = useState(false)
  const [showAccountManager, setShowAccountManager] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(profile)
  const [courses, setCourses] = useState<Course[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { signOut, refreshAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['draft', 'active'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading courses:', error)
        setError('Failed to load courses. Please try again.')
      } else {
        setCourses(coursesData || [])
        
        // Load user progress for all courses
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map(course => course.id)
          
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('course_id', courseIds)

          if (progressError) {
            console.error('Error loading user progress:', progressError)
          } else {
            setUserProgress(progressData || [])
          }

          // Load sessions for all courses
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .in('course_id', courseIds)
            .order('order_index')

          if (sessionsError) {
            console.error('Error loading sessions:', sessionsError)
          } else {
            setSessions(sessionsData || [])
          }
        }
      }
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('An unexpected error occurred while loading courses.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAuth()
      await loadCourses()
    } catch (err) {
      console.error('Error refreshing dashboard:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleNavigation = (path: string) => {
    // Add a small delay to ensure state is stable before navigation
    setTimeout(() => {
      router.push(path)
    }, 100)
  }

  const draftCourses = courses.filter(course => course.status === 'draft')
  const activeCourses = courses.filter(course => course.status === 'active')
  const latestDraft = draftCourses[0]

  // Function to find the next lesson for a course
  const getNextLesson = (courseId: string) => {
    const courseSessions = sessions.filter(session => session.course_id === courseId)
    const courseProgress = userProgress.filter(progress => progress.course_id === courseId)
    
    // Find the first session that is not completed
    const nextSession = courseSessions.find(session => {
      const sessionProgress = courseProgress.find(progress => progress.session_id === session.id)
      return !sessionProgress || sessionProgress.status !== 'completed'
    })
    
    return nextSession
  }

  // Function to handle starting the next lesson
  const handleStartNextLesson = (courseId: string) => {
    const nextSession = getNextLesson(courseId)
    if (nextSession) {
      handleNavigation(`/course/${courseId}?session=${nextSession.id}`)
    } else {
      // If all sessions are completed, go to course overview
      handleNavigation(`/course/${courseId}`)
    }
  }

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result?.success) {
        // Redirect to home page after successful sign out
        router.push('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, try to redirect to home
      router.push('/')
    }
  }

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile)
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
              <Button variant="ghost" size="sm" onClick={() => setShowAccountManager(true)} icon={<Settings />}>
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
        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadCourses}
                    icon={<RefreshCw />}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome back, {currentProfile.first_name}!
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
                <p className="text-2xl font-bold text-neutral-900">{activeCourses.length}</p>
                <p className="text-sm text-neutral-600">Active Courses</p>
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
            {/* Draft Course Banner */}
            {latestDraft && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-1">
                          Resume Draft Course
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          You have a draft course: "{latestDraft.title}"
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleNavigation(`/course/${latestDraft.id}/draft`)}
                      icon={<Edit3 />}
                    >
                      Continue Editing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Course */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Learning Path</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefresh}
                      loading={isRefreshing}
                      icon={<RefreshCw />}
                    >
                    </Button>
                    {activeCourses.length > 0 && (
                      <Button 
                        size="sm"
                        onClick={() => setShowSimpleCourseModal(true)}
                        icon={<Plus />}
                      >
                        Generate New Course
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading courses...</p>
                  </div>
                ) : activeCourses.length > 0 ? (
                  <div className="space-y-4">
                    {activeCourses.map((course) => {
                      const nextSession = getNextLesson(course.id)
                      const courseProgress = userProgress.filter(progress => progress.course_id === course.id)
                      const completedCount = courseProgress.filter(progress => progress.status === 'completed').length
                      const totalSessions = sessions.filter(session => session.course_id === course.id).length
                      
                      return (
                        <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900">{course.title}</h3>
                            <p className="text-sm text-neutral-600 mb-2">{course.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-neutral-500">
                              <span>{completedCount} / {totalSessions} sessions completed</span>
                              {nextSession && (
                                <span>Next: Week {nextSession.week_number} • Day {nextSession.day_number}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {nextSession && (
                              <Button 
                                size="sm"
                                onClick={() => handleStartNextLesson(course.id)}
                              >
                                Start Next Lesson
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleNavigation(`/course/${course.id}`)}
                            >
                              View Course
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Ready to Start Learning?
                    </h3>
                    <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                      Let's create your first personalized AI course based on your profile. 
                      It will be tailored specifically for the {currentProfile.industry} industry.
                    </p>
                    <Button 
                      onClick={() => setShowSimpleCourseModal(true)}
                      icon={<Plus />}
                    >
                      Generate My First Course
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Your Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.learning_goals.map((goal, index) => (
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
                  <p className="text-neutral-900">{currentProfile.industry}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">Role:</span>
                  <p className="text-neutral-900">{currentProfile.job_role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">AI Experience:</span>
                  <p className="text-neutral-900 capitalize">{currentProfile.ai_skill_level}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-700">Daily Goal:</span>
                  <p className="text-neutral-900">{currentProfile.time_commitment} minutes</p>
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
                  0 / {currentProfile.time_commitment} minutes completed
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
                  {currentProfile.interests.map((interest, index) => (
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

      {/* Simple Course Generation Modal */}
      <SimpleCourseGenerator
        isOpen={showSimpleCourseModal}
        onClose={() => setShowSimpleCourseModal(false)}
        profile={currentProfile}
      />

      {/* Account Manager Modal */}
      <AccountManager
        isOpen={showAccountManager}
        onClose={() => setShowAccountManager(false)}
        profile={currentProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  )
}
