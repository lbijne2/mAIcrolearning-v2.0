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
import { CircularProgress, Progress } from '@/components/ui/Progress'
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

  // Realtime updates for this course's progress and status
  useEffect(() => {
    let isMounted = true
    const channels: any[] = []
    ;(async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!isMounted || !currentUser) return
        const progressCh = supabase
          .channel(`course_progress_${courseId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress', filter: `user_id=eq.${currentUser.id},course_id=eq.${courseId}` }, () => {
            loadCourse()
          })
          .subscribe()
        channels.push(progressCh)

        const courseCh = supabase
          .channel(`course_status_${courseId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` }, () => {
            loadCourse()
          })
          .subscribe()
        channels.push(courseCh)
      } catch {}
    })()
    // Soft refresh when regaining focus/visibility
    const onFocus = () => loadCourse()
    const onVisibility = () => { if (document.visibilityState === 'visible') loadCourse() }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
      document.addEventListener('visibilitychange', onVisibility)
    }
    return () => {
      isMounted = false
      for (const ch of channels) {
        try { supabase.removeChannel(ch) } catch {}
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [courseId])

  // BroadcastChannel listener for immediate progress updates from session pages
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const bc = new BroadcastChannel('progress_updates')
    const handler = (ev: MessageEvent) => {
      const msg = ev?.data
      if (!msg) return
      if (msg.courseId === courseId && (msg.type === 'session_completed' || msg.type === 'progress_updated')) {
        loadCourse()
      }
    }
    bc.addEventListener('message', handler)
    return () => {
      try { bc.removeEventListener('message', handler); bc.close() } catch {}
    }
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

      // Load course (active or completed)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])
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

  // Function to find the next lesson for this course
  const getNextLesson = () => {
    // Find the first session that is not completed
    const nextSession = sessions.find(session => {
      const sessionProgress = userProgress.find(progress => progress.session_id === session.id)
      return !sessionProgress || sessionProgress.status !== 'completed'
    })
    
    return nextSession
  }

  const nextSession = getNextLesson()
  const courseCompleted = totalSessionsCount > 0 && completedSessionsCount >= totalSessionsCount

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Overview */}
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <CircularProgress 
                    value={completedSessionsCount}
                    max={totalSessionsCount}
                    size={120}
                    strokeWidth={8}
                    variant="default"
                    showLabel={true}
                    className="text-primary-600"
                  />
                </div>
                <p className="text-neutral-600 mb-2">Complete</p>
                <div className="text-sm text-neutral-500">
                  {completedSessionsCount} of {totalSessionsCount} sessions completed
                </div>
              </div>

              {/* Next Session */}
              <div className="border-l border-neutral-200 pl-6">
                <h4 className="font-semibold text-neutral-900 mb-3">Next Session</h4>
                 {courseCompleted ? (
                   <div className="text-center py-4">
                     <div className="text-green-600 mb-2">🎉</div>
                     <p className="text-sm text-neutral-600">All sessions completed!</p>
                     <div className="text-sm text-neutral-500 mt-1">Course progress is 100%.</div>
                   </div>
                 ) : nextSession ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        Week {nextSession.week_number} • Day {nextSession.day_number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nextSession.session_type === 'theory' ? 'bg-blue-100 text-blue-800' :
                        nextSession.session_type === 'quiz' ? 'bg-purple-100 text-purple-800' :
                        nextSession.session_type === 'interactive' ? 'bg-green-100 text-green-800' :
                        nextSession.session_type === 'hands_on' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {nextSession.session_type}
                      </span>
                    </div>
                    <h5 className="font-medium text-neutral-900">
                      {nextSession.title}
                    </h5>
                    <p className="text-sm text-neutral-600">
                      {nextSession.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-neutral-500">
                        {nextSession.estimated_duration} min
                      </span>
                      <Button size="sm" onClick={() => handleNavigation(`/course/${course.id}/session/${nextSession.id}`)}>
                        Start Session
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-green-600 mb-2">🎉</div>
                    <p className="text-sm text-neutral-600">All sessions completed!</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Review Course
                    </Button>
                  </div>
                )}
              </div>
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
                    const timeSpent = sessionProgress?.time_spent ?? 0
                    const estSec = Math.max(1, (session.estimated_duration || 10) * 60)
                    const pct = isCompleted ? 100 : Math.min(100, Math.round((timeSpent / estSec) * 100))
                
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
                          <div className="mt-3">
                            <Progress value={pct} max={100} />
                            <div className="mt-1 text-xs text-neutral-500">{pct}%</div>
                          </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-xs text-neutral-500">
                        {session.estimated_duration} min
                      </span>
                      <Button 
                        variant={isCompleted ? "outline" : "ghost"} 
                        size="sm"
                        disabled={isCompleted}
                        onClick={() => handleNavigation(`/course/${courseId}/session/${session.id}`)}
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
