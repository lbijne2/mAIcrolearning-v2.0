import React from 'react'
import { Loader2, CheckCircle, Clock } from 'lucide-react'
import { Progress } from './Progress'
import { type GenerationProgress, type GenerationStage } from '@/app/generate/actions'

interface GenerationProgressProps {
  progress: GenerationProgress
  className?: string
}

const STAGE_CONFIG = {
  validating: {
    title: 'Validating',
    description: 'Validating your course details...',
    icon: Clock,
    color: 'text-blue-600'
  },
  generating_structure: {
    title: 'Generating Structure',
    description: 'Creating your personalized course structure...',
    icon: Loader2,
    color: 'text-purple-600'
  },
  creating_course: {
    title: 'Creating Course',
    description: 'Setting up your course...',
    icon: Loader2,
    color: 'text-green-600'
  },
  creating_sessions: {
    title: 'Creating Sessions',
    description: 'Building your course sessions...',
    icon: Loader2,
    color: 'text-orange-600'
  },
  finalizing: {
    title: 'Finalizing',
    description: 'Finalizing your course...',
    icon: Loader2,
    color: 'text-indigo-600'
  }
}

const STAGE_ORDER: GenerationStage[] = [
  'validating',
  'generating_structure',
  'creating_course',
  'creating_sessions',
  'finalizing'
]

export function GenerationProgress({ progress, className }: GenerationProgressProps) {
  const currentStageIndex = STAGE_ORDER.indexOf(progress.stage)
  const currentStageConfig = STAGE_CONFIG[progress.stage]
  const IconComponent = currentStageConfig.icon

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}>
      <div className="space-y-6">
        {/* Current Stage */}
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-full bg-neutral-100 ${currentStageConfig.color}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{currentStageConfig.title}</h3>
            <p className="text-sm text-neutral-600">{currentStageConfig.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-neutral-900">{progress.progress}%</div>
            <div className="text-xs text-neutral-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={progress.progress} 
            max={100}
            size="lg"
            variant="default"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Starting...</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-700">Generation Stages</h4>
          <div className="space-y-2">
            {STAGE_ORDER.map((stage, index) => {
              const stageConfig = STAGE_CONFIG[stage]
              const StageIcon = stageConfig.icon
              const isCompleted = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const isPending = index > currentStageIndex

              return (
                <div
                  key={stage}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : isCurrent
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  <div
                    className={`p-1 rounded-full ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isCurrent
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <StageIcon className={`h-4 w-4 ${isCurrent ? 'animate-spin' : ''}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        isCompleted
                          ? 'text-green-800'
                          : isCurrent
                          ? 'text-blue-800'
                          : 'text-neutral-500'
                      }`}
                    >
                      {stageConfig.title}
                    </div>
                    <div
                      className={`text-xs ${
                        isCompleted
                          ? 'text-green-600'
                          : isCurrent
                          ? 'text-blue-600'
                          : 'text-neutral-400'
                      }`}
                    >
                      {stageConfig.description}
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Text */}
        <div className="text-xs text-neutral-500 text-center bg-neutral-50 rounded-lg p-3">
          <p>This may take a few moments as we create your personalized course structure...</p>
          <p className="mt-1">The AI is analyzing your requirements and generating tailored content.</p>
        </div>
      </div>
    </div>
  )
}
