import { Brain, Target, Clock, Eye, Headphones, Hand, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LEARNING_GOALS, INTERESTS, SKILL_LEVELS, LEARNING_STYLES } from '@/utils/constants'
import type { OnboardingFormData } from '@/types'

interface LearningPreferencesStepProps {
  data: OnboardingFormData['learning']
  onChange: (data: Partial<OnboardingFormData['learning']>) => void
}

export function LearningPreferencesStep({ data, onChange }: LearningPreferencesStepProps) {
  const handleGoalToggle = (goal: string) => {
    const goals = data.learning_goals.includes(goal)
      ? data.learning_goals.filter(g => g !== goal)
      : [...data.learning_goals, goal]
    onChange({ learning_goals: goals })
  }

  const handleInterestToggle = (interest: string) => {
    const interests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest]
    onChange({ interests })
  }

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'visual': return <Eye className="h-4 w-4" />
      case 'auditory': return <Headphones className="h-4 w-4" />
      case 'kinesthetic': return <Hand className="h-4 w-4" />
      case 'reading': return <BookOpen className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8 text-secondary-600" />
        </div>
        <p className="text-neutral-600">
          Help us customize your learning experience based on your preferences and goals
        </p>
      </div>

      {/* AI Skill Level */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Current AI/ML Knowledge Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(SKILL_LEVELS).map(([value, { label, description }]) => (
            <Card
              key={value}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.ai_skill_level === value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => onChange({ ai_skill_level: value as any })}
            >
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-neutral-500 mt-1">{description}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Learning Goals */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Learning Goals <span className="text-red-500">*</span>
          <span className="text-xs text-neutral-500 ml-2">(Select at least one)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEARNING_GOALS.map((goal) => (
            <Card
              key={goal}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.learning_goals.includes(goal)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => handleGoalToggle(goal)}
            >
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{goal}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Learning Style */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Preferred Learning Style
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(LEARNING_STYLES).map(([value, { label, description }]) => (
            <Card
              key={value}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.preferred_learning_style === value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => onChange({ preferred_learning_style: value as any })}
            >
              <div className="flex items-center space-x-3">
                {getStyleIcon(value)}
                <div>
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-neutral-500 mt-1">{description}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Time Commitment */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Daily Time Commitment
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { minutes: 5, label: '5 minutes', description: 'Quick overview' },
            { minutes: 10, label: '10 minutes', description: 'Standard session' },
            { minutes: 15, label: '15 minutes', description: 'Deep dive' },
            { minutes: 20, label: '20+ minutes', description: 'Extended learning' }
          ].map((option) => (
            <Card
              key={option.minutes}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.time_commitment === option.minutes
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => onChange({ time_commitment: option.minutes })}
            >
              <div className="text-center">
                <Clock className="h-5 w-5 text-neutral-500 mx-auto mb-2" />
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-neutral-500 mt-1">{option.description}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Interests */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          AI Topics of Interest <span className="text-red-500">*</span>
          <span className="text-xs text-neutral-500 ml-2">(Select at least one)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INTERESTS.map((interest) => (
            <Card
              key={interest}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.interests.includes(interest)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => handleInterestToggle(interest)}
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{interest}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
