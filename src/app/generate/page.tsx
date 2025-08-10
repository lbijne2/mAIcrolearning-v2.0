'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Brain, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GenerationProgress as GenerationProgressComponent } from '@/components/ui/GenerationProgress'
import { generateCoursePlan, type GenerationProgress, type GenerationStage } from './actions'
import { CourseGenerationFormSchema, type CourseGenerationFormData } from '@/types/models'
import { isLLMAvailableClient, getLLMProviderClient } from '@/lib/llm'
import { useAuth } from '@/hooks/useAuth'

const INDUSTRIES = [
  'Healthcare & Life Sciences',
  'Finance & Banking',
  'Technology & Software',
  'Manufacturing & Industrial',
  'Retail & E-commerce',
  'Education & Training',
  'Marketing & Advertising',
  'Consulting & Professional Services',
  'Government & Public Sector',
  'Non-profit & Social Impact',
  'Other'
]

const AI_SKILL_LEVELS = [
  { value: 'none', label: 'None - Complete beginner' },
  { value: 'basic', label: 'Basic - Some exposure' },
  { value: 'intermediate', label: 'Intermediate - Regular user' },
  { value: 'advanced', label: 'Advanced - Power user' }
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner - 0-2 years' },
  { value: 'intermediate', label: 'Intermediate - 3-5 years' },
  { value: 'advanced', label: 'Advanced - 5+ years' }
]

export default function GeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CourseGenerationFormData>({
    resolver: zodResolver(CourseGenerationFormSchema),
    defaultValues: {
      industry: 'Healthcare & Life Sciences',
      delivery: 'micro-learning – 10 min/day'
    }
  })

  const learningGoals = watch('learningGoals', '')

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
      validating: 'Validating your course details...',
      generating_structure: 'Generating your personalized course structure...',
      creating_course: 'Creating your course...',
      creating_sessions: 'Creating your course sessions...',
      finalizing: 'Finalizing your course...'
    }
    return messages[stage]
  }

  const onSubmit = async (data: CourseGenerationFormData) => {
    if (!user) {
      setError('You must be signed in to generate courses')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    setGenerationProgress({
      stage: 'validating',
      progress: 0,
      message: 'Validating your course details...'
    })

    // Start progress simulation
    const progressIntervals: NodeJS.Timeout[] = []
    const startTime = Date.now()
    
    // Simulate validation (fast)
    progressIntervals.push(simulateProgress('validating', 500))
    
    // Simulate LLM generation (longest part - this will be the most time-consuming)
    setTimeout(() => {
      progressIntervals.push(simulateProgress('generating_structure', 12000)) // Increased time for LLM
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
      formData.append('topic', data.topic)
      formData.append('industry', data.industry)
      formData.append('aiSkillLevel', data.aiSkillLevel)
      formData.append('experienceLevel', data.experienceLevel)
      formData.append('learningGoals', data.learningGoals)
      formData.append('delivery', data.delivery)

      const result = await generateCoursePlan(formData)

      // Clear all progress intervals
      progressIntervals.forEach(clearInterval)

      if (result.success && result.data && result.data.courseId) {
        const courseId = result.data.courseId
        setSuccess('Course generated successfully! Redirecting to preview...')
        setTimeout(() => {
          // Add a small delay to ensure state is stable before navigation
          setTimeout(() => {
            router.push(`/course/${courseId}/draft`)
          }, 100)
        }, 1500)
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

  const llmAvailable = isLLMAvailableClient()
  const llmProvider = getLLMProviderClient()

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto container-padding py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
              Generate a Course
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Create a personalized 4-week AI course tailored to your industry, experience level, and learning goals.
            </p>
          </div>
          
          {/* Back to Dashboard Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            icon={<ArrowLeft />}
            className="text-neutral-600 hover:text-neutral-900"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Generation Progress */}
        {isGenerating && generationProgress && (
          <div className="mb-6">
            <GenerationProgressComponent progress={generationProgress} />
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Topic */}
              <Input
                label="Course Topic"
                placeholder="e.g., AI for Healthcare Analytics, Machine Learning in Finance"
                error={errors.topic?.message}
                {...register('topic')}
              />

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Industry
                </label>
                <select
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  {...register('industry')}
                >
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                )}
              </div>

              {/* AI Skill Level */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Your AI Skill Level
                </label>
                <div className="space-y-2">
                  {AI_SKILL_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={level.value}
                        {...register('aiSkillLevel')}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{level.label}</span>
                    </label>
                  ))}
                </div>
                {errors.aiSkillLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.aiSkillLevel.message}</p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Professional Experience Level
                </label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={level.value}
                        {...register('experienceLevel')}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{level.label}</span>
                    </label>
                  ))}
                </div>
                {errors.experienceLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
                )}
              </div>

              {/* Learning Goals */}
              <Textarea
                label="Learning Goals (comma-separated)"
                placeholder="e.g., Understand AI fundamentals, Apply ML to business problems, Build predictive models"
                helperText="Enter your specific learning objectives, separated by commas"
                error={errors.learningGoals?.message}
                {...register('learningGoals')}
              />

              {/* Learning Goals Preview */}
              {learningGoals && learningGoals.trim() && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Goals Preview
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {learningGoals.split(',').map((goal, index) => {
                      const trimmedGoal = goal.trim()
                      return trimmedGoal ? (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                        >
                          {trimmedGoal}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Delivery Method
                </label>
                <div className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <span className="text-sm text-neutral-600">
                    micro-learning – 10 min/day
                  </span>
                </div>
                <input type="hidden" {...register('delivery')} />
              </div>

              {/* Theory-First Focus Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Theory-First Approach</h4>
                    <p className="text-sm text-blue-700">
                      This course focuses on foundational AI concepts and theory, with practical applications 
                      integrated throughout. Perfect for building a solid understanding before diving into hands-on work.
                    </p>
                  </div>
                </div>
              </div>

              {/* LLM Provider Info */}
              {llmAvailable && (
                <div className="text-sm text-neutral-500 text-center">
                  Powered by AI (xAI Grok preferred, OpenAI GPT-4 fallback)
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isGenerating}
                className="w-full"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Your Course...
                  </>
                ) : (
                  'Generate Course'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
