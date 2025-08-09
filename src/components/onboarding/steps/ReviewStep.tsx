import { CheckCircle, User, Briefcase, Brain, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SKILL_LEVELS, LEARNING_STYLES } from '@/utils/constants'
import type { OnboardingFormData } from '@/types'

interface ReviewStepProps {
  formData: OnboardingFormData
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Almost There!
        </h3>
        <p className="text-neutral-600">
          Please review your information before we create your personalized learning profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-neutral-700">Name:</span>
              <p className="text-neutral-900">
                {formData.personal.first_name} {formData.personal.last_name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Email:</span>
              <p className="text-neutral-900">{formData.personal.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Background */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-accent-600" />
              <span>Professional Background</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-neutral-700">Industry:</span>
              <p className="text-neutral-900">{formData.professional.industry}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Role:</span>
              <p className="text-neutral-900">{formData.professional.job_role}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Experience:</span>
              <p className="text-neutral-900 capitalize">{formData.professional.experience_level}</p>
            </div>
            {formData.professional.company_size && (
              <div>
                <span className="text-sm font-medium text-neutral-700">Company Size:</span>
                <p className="text-neutral-900">{formData.professional.company_size}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-neutral-700">Technical Background:</span>
              <p className="text-neutral-900">
                {formData.professional.technical_background ? 'Yes' : 'No'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-secondary-600" />
            <span>Learning Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-neutral-700">AI Skill Level:</span>
              <p className="text-neutral-900">
                {SKILL_LEVELS[formData.learning.ai_skill_level as keyof typeof SKILL_LEVELS]?.label}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Learning Style:</span>
              <p className="text-neutral-900">
                {LEARNING_STYLES[formData.learning.preferred_learning_style as keyof typeof LEARNING_STYLES]?.label}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Daily Commitment:</span>
              </span>
              <p className="text-neutral-900">{formData.learning.time_commitment} minutes</p>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-neutral-700 flex items-center space-x-1 mb-2">
              <Target className="h-4 w-4" />
              <span>Learning Goals:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {formData.learning.learning_goals.map((goal, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-neutral-700 flex items-center space-x-1 mb-2">
              <Brain className="h-4 w-4" />
              <span>AI Interests:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {formData.learning.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <CardContent className="text-center py-6">
          <h4 className="text-lg font-semibold text-neutral-900 mb-2">
            What happens next?
          </h4>
          <div className="text-sm text-neutral-600 space-y-2">
            <p>✨ We'll create your personalized learning profile</p>
            <p>🎯 Generate a custom AI course tailored to your industry and goals</p>
            <p>📚 Start your first micro-learning session immediately</p>
            <p>📊 Track your progress and adapt your learning path</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
