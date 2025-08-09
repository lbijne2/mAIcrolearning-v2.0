'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { ProfessionalInfoStep } from './steps/ProfessionalInfoStep'
import { LearningPreferencesStep } from './steps/LearningPreferencesStep'
import { ReviewStep } from './steps/ReviewStep'
import type { OnboardingFormData } from '@/types'

const STEPS = [
  { id: 'personal', title: 'Personal Information', description: 'Tell us about yourself' },
  { id: 'professional', title: 'Professional Background', description: 'Your work and industry' },
  { id: 'learning', title: 'Learning Preferences', description: 'How you like to learn' },
  { id: 'review', title: 'Review & Complete', description: 'Confirm your information' }
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingFormData>({
    personal: {
      first_name: '',
      last_name: '',
      email: ''
    },
    professional: {
      industry: '',
      job_role: '',
      experience_level: 'beginner',
      technical_background: false
    },
    learning: {
      ai_skill_level: 'none',
      learning_goals: [],
      preferred_learning_style: 'visual',
      time_commitment: 10,
      interests: []
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasRedirected = useRef(false)
  
  const { user, loading, createProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're not loading and there's definitively no user
    if (!loading && !user && !hasRedirected.current) {
      console.log('OnboardingFlow: No user found, redirecting to home')
      hasRedirected.current = true
      router.push('/')
    } else if (user?.email) {
      setFormData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          email: user.email || ''
        }
      }))
    }
  }, [user, loading, router])

  const updateFormData = (section: keyof OnboardingFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.personal.first_name && formData.personal.last_name
      case 1:
        return formData.professional.industry && formData.professional.job_role
      case 2:
        return formData.learning.learning_goals.length > 0 && formData.learning.interests.length > 0
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!user) {
      console.error('No user found')
      alert('Authentication error: No user found')
      return
    }

    if (!user.id) {
      console.error('User missing ID')
      alert('Authentication error: User ID missing')
      return
    }

    console.log('User authenticated:', { id: user.id, email: user.email })
    setIsSubmitting(true)
    try {
      const profileData = {
        first_name: formData.personal.first_name,
        last_name: formData.personal.last_name,
        industry: formData.professional.industry,
        job_role: formData.professional.job_role,
        experience_level: formData.professional.experience_level,
        ai_skill_level: formData.learning.ai_skill_level,
        learning_goals: formData.learning.learning_goals,
        preferred_learning_style: formData.learning.preferred_learning_style,
        time_commitment: formData.learning.time_commitment,
        interests: formData.learning.interests,
        company_size: formData.professional.company_size || null,
        technical_background: formData.professional.technical_background
      }

      // Validate required fields
      const requiredFields = ['first_name', 'last_name', 'industry', 'job_role']
      for (const field of requiredFields) {
        if (!profileData[field as keyof typeof profileData]) {
          console.error(`Missing required field: ${field}`)
          alert(`Please fill in the ${field.replace('_', ' ')} field`)
          setIsSubmitting(false)
          return
        }
      }

      // Validate arrays are not empty
      if (!profileData.learning_goals || profileData.learning_goals.length === 0) {
        console.error('Missing learning goals')
        alert('Please select at least one learning goal')
        setIsSubmitting(false)
        return
      }

      if (!profileData.interests || profileData.interests.length === 0) {
        console.error('Missing interests')
        alert('Please select at least one interest')
        setIsSubmitting(false)
        return
      }

      console.log('Creating profile with data:', profileData)
      const result = await createProfile(profileData)
      console.log('Profile creation result:', result)
      
      if (result?.success) {
        console.log('Profile created successfully, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        const errorMsg = result?.error || 'Unknown error occurred'
        console.error('Failed to create profile:', errorMsg)
        console.error('Full result object:', result)
        // TODO: Handle error - show toast or error message
        alert(`Failed to create profile: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoStep
            data={formData.personal}
            onChange={(data) => updateFormData('personal', data)}
          />
        )
      case 1:
        return (
          <ProfessionalInfoStep
            data={formData.professional}
            onChange={(data) => updateFormData('professional', data)}
          />
        )
      case 2:
        return (
          <LearningPreferencesStep
            data={formData.learning}
            onChange={(data) => updateFormData('learning', data)}
          />
        )
      case 3:
        return (
          <ReviewStep formData={formData} />
        )
      default:
        return null
    }
  }

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not loading and no user, the useEffect will handle redirect
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-3xl mx-auto container-padding">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome to mAIcrolearning
          </h1>
          <p className="text-lg text-neutral-600">
            Let's personalize your AI learning journey
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <Progress 
            value={(currentStep + 1) / STEPS.length * 100} 
            showLabel 
            label={`Step ${currentStep + 1} of ${STEPS.length}`}
          />
          
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-primary-600' : 'text-neutral-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    index === currentStep 
                      ? 'border-primary-600 bg-primary-600' 
                      : 'border-neutral-300'
                  }`}>
                    {index === currentStep && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <p className="text-neutral-600">{STEPS[currentStep].description}</p>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            icon={<ArrowLeft />}
          >
            Previous
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleComplete}
              loading={isSubmitting}
              icon={<CheckCircle />}
            >
              Complete Setup
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              icon={<ArrowRight />}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
