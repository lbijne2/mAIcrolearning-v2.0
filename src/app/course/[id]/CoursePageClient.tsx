'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, 
  Edit3, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  BookOpen,
  Target,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { revertCourseToDraft } from '@/app/generate/actions'
import { useAuth } from '@/hooks/useAuth'
import type { Course, Session, UserProgress } from '@/types'

interface CoursePageClientProps {
  courseId: string
}

export function CoursePageClient({ courseId }: CoursePageClientProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revertingToDraft, setRevertingToDraft] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      
      // Get user session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Load course (only active courses)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (courseError || !courseData) {
        setError('Course not found or you do not have permission to view it.')
        return
      }

      setCourse(courseData)

      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (sessionsError) {
        setError('Failed to load course sessions.')
        return
      }

      setSessions(sessionsData || [])

      // Load user progress for this course
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)

      if (progressError) {
        console.error('Failed to load user progress:', progressError)
        // Don't fail the entire load for progress errors
        setUserProgress([])
      } else {
        setUserProgress(progressData || [])
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = (path: string) => {
    // Add a small delay to ensure state is stable before navigation
    setTimeout(() => {
      router.push(path)
    }, 100)
  }

  const handleRevertToDraft = async () => {
    if (!course || !user) return
    
    if (!confirm('Are you sure you want to edit this course? It will be moved back to draft status and you can make changes.')) {
      return
    }
    
    setRevertingToDraft(true)
    try {
      const result = await revertCourseToDraft(course.id, user.id)
      if (result.success) {
        // Redirect to draft page
        handleNavigation(`/course/${course.id}/draft`)
      } else {
        setError(result.error || 'Failed to revert course to draft status.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setRevertingToDraft(false)
    }
  }

  // Calculate completed sessions count
  const completedSessionsCount = userProgress.filter(progress => progress.status === 'completed').length
  const totalSessionsCount = sessions.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-neutral-600">{error || 'Course not found'}</p>
          <Button onClick={() => handleNavigation('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto container-padding py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-semibold text-neutral-900">
                Course Overview
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleNavigation('/dashboard')}
                icon={<ArrowLeft />}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRevertToDraft}
                loading={revertingToDraft}
                icon={<Edit3 />}
              >
                Edit Course
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto container-padding py-8">
        {/* Course Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {course.title}
          </h1>
          <p className="text-lg text-neutral-600 mb-4">
            {course.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {course.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-neutral-600" />
                <div>
                  <div className="text-sm text-neutral-600">Industry</div>
                  <div className="font-medium">{course.industry}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-neutral-600" />
                <div>
                  <div className="text-sm text-neutral-600">Difficulty</div>
                  <div className="font-medium capitalize">{course.difficulty_level}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-neutral-600" />
                <div>
                  <div className="text-sm text-neutral-600">Sessions</div>
                  <div className="font-medium">{completedSessionsCount} / {totalSessionsCount}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-neutral-600" />
                <div>
                  <div className="text-sm text-neutral-600">Duration</div>
                  <div className="font-medium">{course.estimated_duration} min</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {course.learning_objectives?.map((objective, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {objective}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0}%
              </div>
              <p className="text-neutral-600 mb-4">Complete</p>
              <Button size="sm">
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => {
                const sessionProgress = userProgress.find(progress => progress.session_id === session.id)
                const isCompleted = sessionProgress?.status === 'completed'
                const isInProgress = sessionProgress?.status === 'in_progress'
                
                return (
                  <div key={session.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col h-full ${
                    isCompleted ? 'border-green-200 bg-green-50' : 
                    isInProgress ? 'border-blue-200 bg-blue-50' : 
                    'border-neutral-200'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-600">
                          Week {session.week_number} • Day {session.day_number}
                        </span>
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          )}
                          {isInProgress && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Progress
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.session_type === 'theory' ? 'bg-blue-100 text-blue-800' :
                            session.session_type === 'quiz' ? 'bg-purple-100 text-purple-800' :
                            session.session_type === 'interactive' ? 'bg-green-100 text-green-800' :
                            session.session_type === 'hands_on' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.session_type}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {session.title}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {session.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs text-neutral-500">
                        {session.estimated_duration} min
                      </span>
                      <Button 
                        variant={isCompleted ? "outline" : "ghost"} 
                        size="sm"
                        disabled={isCompleted}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
