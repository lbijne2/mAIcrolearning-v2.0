'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, X, ArrowRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GenerationProgress } from '@/components/ui/GenerationProgress'
import { generateSimpleCourse } from '@/components/dashboard/actions'
import type { GenerationProgress as GenerationProgressType, GenerationStage } from '@/app/generate/actions'
import { useAuth } from '@/hooks/useAuth'
import type { UserProfile } from '@/types'

interface SimpleCourseGeneratorProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
}

export function SimpleCourseGenerator({ isOpen, onClose, profile }: SimpleCourseGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgressType | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  if (!isOpen) return null

  // Simulate progress updates based on expected timing
  const simulateProgress = (stage: GenerationStage, duration: number) => {
    const stageProgress = {
      validating: { start: 0, end: 10 },
      generating_structure: { start: 10, end: 75 },
      creating_course: { start: 75, end: 85 },
      creating_sessions: { start: 85, end: 95 },
      finalizing: { start: 95, end: 100 }
    }

    const stageInfo = stageProgress[stage]
    const steps = Math.ceil(duration / 100) // Update every 100ms
    const increment = (stageInfo.end - stageInfo.start) / steps
    let currentProgress = stageInfo.start

    const interval = setInterval(() => {
      currentProgress += increment
      if (currentProgress >= stageInfo.end) {
        currentProgress = stageInfo.end
        clearInterval(interval)
      }

      setGenerationProgress({
        stage,
        progress: Math.round(currentProgress),
        message: getStageMessage(stage)
      })
    }, 100)

    return interval
  }

  const getStageMessage = (stage: GenerationStage): string => {
    const messages = {
      validating: 'Validating your course request...',
      generating_structure: 'Generating your personalized course structure...',
      creating_course: 'Creating your course...',
      creating_sessions: 'Creating your course sessions...',
      finalizing: 'Finalizing your course...'
    }
    return messages[stage]
  }

  const handleSubmit = async () => {
    if (!user || !prompt.trim()) {
      setError('Please enter a course description')
      return
    }

    // Scroll to top to show the progress UI
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setIsGenerating(true)
    setError(null)
    setGenerationProgress({
      stage: 'validating',
      progress: 0,
      message: 'Validating your course request...'
    })

    // Start progress simulation
    const progressIntervals: NodeJS.Timeout[] = []
    
    // Simulate validation (fast)
    progressIntervals.push(simulateProgress('validating', 500))
    
    // Simulate LLM generation (longest part)
    setTimeout(() => {
      progressIntervals.push(simulateProgress('generating_structure', 12000))
    }, 500)
    
    // Simulate course creation
    setTimeout(() => {
      progressIntervals.push(simulateProgress('creating_course', 1000))
    }, 12500)
    
    // Simulate session creation
    setTimeout(() => {
      progressIntervals.push(simulateProgress('creating_sessions', 1000))
    }, 13500)
    
    // Simulate finalization
    setTimeout(() => {
      progressIntervals.push(simulateProgress('finalizing', 500))
    }, 14500)

    try {
      const formData = new FormData()
      formData.append('userId', user.id)
      formData.append('prompt', prompt.trim())

      const result = await generateSimpleCourse(formData)

      // Clear all progress intervals
      progressIntervals.forEach(clearInterval)

      if (result.success && result.data && result.data.courseId) {
        const courseId = result.data.courseId
        // Close modal and redirect to course
        onClose()
        setTimeout(() => {
          router.push(`/course/${courseId}/draft`)
        }, 100)
      } else {
        setError(result.error?.message || 'Failed to generate course')
      }
    } catch (err) {
      // Clear all progress intervals on error
      progressIntervals.forEach(clearInterval)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  const handleAdvancedGenerator = () => {
    onClose()
    router.push('/generate')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-primary-600" />
            <CardTitle>Generate New Course</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            icon={<X />}
          >
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Progress */}
          {isGenerating && generationProgress && (
            <div className="mb-6">
              <GenerationProgress progress={generationProgress} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Simple Course Generation Form */}
          {!isGenerating && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Describe Your Course
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Tell us what you want to learn. We'll use your profile information to create a personalized course.
                </p>
                
                <Textarea
                  label="Course Description"
                  placeholder="e.g., I want to learn how to use AI for data analysis in healthcare, focusing on patient outcome prediction and medical image processing..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              {/* Profile Information Preview */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="font-medium text-neutral-900 mb-3">Using Your Profile Information:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600">Industry:</span>
                    <p className="font-medium">{profile.industry}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">AI Skill Level:</span>
                    <p className="font-medium capitalize">{profile.ai_skill_level}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Experience Level:</span>
                    <p className="font-medium capitalize">{profile.experience_level}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Learning Goals:</span>
                    <p className="font-medium">{profile.learning_goals.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSubmit}
                  loading={isGenerating && !generationProgress}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex-1"
                  size="lg"
                >
                  Generate Course
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAdvancedGenerator}
                  disabled={isGenerating}
                  icon={<Settings />}
                  size="lg"
                >
                  Advanced Options
                </Button>
              </div>

              {/* Info Text */}
              <div className="text-xs text-neutral-500 text-center bg-blue-50 rounded-lg p-3">
                <p>This will create a 4-week course with 10-minute daily sessions tailored to your needs.</p>
                <p className="mt-1">Need more control? Use the Advanced Options to customize every detail.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
