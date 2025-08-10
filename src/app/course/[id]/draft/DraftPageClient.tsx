'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { publishCourse, discardCourse } from '@/app/generate/actions'
import { useAuth } from '@/hooks/useAuth'
import type { CourseRow, SessionRow } from '@/types/models'
import type { Session, Course } from '@/types'

interface DraftPageClientProps {
  courseId: string
}

export function DraftPageClient({ courseId }: DraftPageClientProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [showJsonDrawer, setShowJsonDrawer] = useState<string | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
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

      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
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
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleSessionUpdate = async (sessionId: string, updates: Partial<Session>) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      // Update local state
      setSessions(prev => prev.map((session: Session) => 
        session.id === sessionId ? { ...session, ...updates } : session
      ))
      
      setEditingSession(null)
    } catch (err) {
      console.error('Failed to update session:', err)
    }
  }

  const handleNavigation = (path: string) => {
    // Add a small delay to ensure state is stable before navigation
    setTimeout(() => {
      router.push(path)
    }, 100)
  }

  const handlePublish = async () => {
    if (!course || !user) return
    
    setPublishing(true)
    try {
      const result = await publishCourse(course.id, user.id)
      if (result.success) {
        handleNavigation('/dashboard')
      } else {
        setError(result.error || 'Failed to publish course')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setPublishing(false)
    }
  }

  const handleDiscard = async () => {
    if (!course || !user) return
    
    if (!confirm('Are you sure you want to discard this course? This action cannot be undone.')) {
      return
    }
    
    setDiscarding(true)
    try {
      const result = await discardCourse(course.id, user.id)
      if (result.success) {
        handleNavigation('/dashboard')
      } else {
        setError(result.error || 'Failed to discard course')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setDiscarding(false)
    }
  }

  const openJsonDrawer = (session: Session) => {
    setJsonContent(JSON.stringify(session.content, null, 2))
    setShowJsonDrawer(session.id)
  }

  const saveJsonContent = async () => {
    if (!showJsonDrawer) return
    
    try {
      const parsedContent = JSON.parse(jsonContent)
      await handleSessionUpdate(showJsonDrawer, { content: parsedContent })
      setShowJsonDrawer(null)
    } catch (err) {
      alert('Invalid JSON format')
    }
  }

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

  const incompleteSessions = sessions.length < 28

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto container-padding py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleNavigation('/dashboard')}
                icon={<ArrowLeft />}
              >
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary-600" />
                <span className="text-lg font-semibold text-neutral-900">
                  Course Preview
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {incompleteSessions && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Incomplete plan</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDiscard}
                loading={discarding}
              >
                Discard
              </Button>
              <Button 
                size="sm" 
                onClick={handlePublish}
                loading={publishing}
                disabled={incompleteSessions}
              >
                Publish Course
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-neutral-600">Industry</div>
              <div className="font-medium">{course.industry}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-neutral-600">Difficulty</div>
              <div className="font-medium capitalize">{course.difficulty_level}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-neutral-600">Sessions</div>
              <div className="font-medium">{sessions.length} / 28</div>
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

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Course Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Week</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Day</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-neutral-100">
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {session.week_number}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-600">
                        {session.day_number}
                      </td>
                      <td className="py-3 px-4">
                        {editingSession === session.id ? (
                          <Input
                            value={session.title}
                            onChange={(e) => {
                              setSessions(prev => prev.map((s: Session) => 
                                s.id === session.id ? { ...s, title: e.target.value } : s
                              ))
                            }}
                            onBlur={() => handleSessionUpdate(session.id, { title: session.title })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSessionUpdate(session.id, { title: session.title })
                              }
                              if (e.key === 'Escape') {
                                setEditingSession(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{session.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSession(session.id)}
                              icon={<Edit3 className="h-4 w-4" />}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={session.session_type}
                          onChange={(e) => handleSessionUpdate(session.id, { 
                            session_type: e.target.value as any 
                          })}
                          className="px-2 py-1 border border-neutral-300 rounded text-sm"
                        >
                          <option value="theory">Theory</option>
                          <option value="quiz">Quiz</option>
                          <option value="interactive">Interactive</option>
                          <option value="hands_on">Hands-on</option>
                          <option value="review">Review</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={session.estimated_duration}
                          onChange={(e) => {
                            setSessions(prev => prev.map((s: Session) => 
                              s.id === session.id ? { ...s, estimated_duration: parseInt(e.target.value) || 0 } : s
                            ))
                          }}
                          onBlur={() => handleSessionUpdate(session.id, { 
                            estimated_duration: session.estimated_duration 
                          })}
                          className="w-20"
                        />
                        <span className="text-sm text-neutral-500 ml-1">min</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openJsonDrawer(session)}
                            icon={<Eye className="h-4 w-4" />}
                          >
                            JSON
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* JSON Drawer */}
      {showJsonDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Session Content (JSON)</h3>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={saveJsonContent}>
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowJsonDrawer(null)}
                  icon={<X />}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="w-full h-full p-4 border rounded font-mono text-sm resize-none"
                placeholder="Enter valid JSON content..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
