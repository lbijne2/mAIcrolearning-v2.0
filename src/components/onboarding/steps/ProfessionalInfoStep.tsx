import { useState } from 'react'
import { Briefcase, Building, Users, Code } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { INDUSTRIES, JOB_ROLES, COMPANY_SIZES } from '@/utils/constants'
import type { OnboardingFormData } from '@/types'

interface ProfessionalInfoStepProps {
  data: OnboardingFormData['professional']
  onChange: (data: Partial<OnboardingFormData['professional']>) => void
}

export function ProfessionalInfoStep({ data, onChange }: ProfessionalInfoStepProps) {
  const [showOtherIndustry, setShowOtherIndustry] = useState(data.industry === 'Other')
  const [showOtherRole, setShowOtherRole] = useState(data.job_role === 'Other')

  const handleIndustryChange = (industry: string) => {
    onChange({ industry })
    setShowOtherIndustry(industry === 'Other')
  }

  const handleRoleChange = (role: string) => {
    onChange({ job_role: role })
    setShowOtherRole(role === 'Other')
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-accent-600" />
        </div>
        <p className="text-neutral-600">
          Tell us about your professional background to customize your learning experience
        </p>
      </div>

      {/* Industry Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Industry <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INDUSTRIES.map((industry) => (
            <Card
              key={industry}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.industry === industry
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => handleIndustryChange(industry)}
            >
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{industry}</span>
              </div>
            </Card>
          ))}
        </div>

        {showOtherIndustry && (
          <div className="mt-3">
            <Input
              placeholder="Please specify your industry"
              value={data.industry === 'Other' ? '' : data.industry}
              onChange={(e) => onChange({ industry: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Job Role Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Job Role <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {JOB_ROLES.map((role) => (
            <Card
              key={role}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.job_role === role
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => handleRoleChange(role)}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{role}</span>
              </div>
            </Card>
          ))}
        </div>

        {showOtherRole && (
          <div className="mt-3">
            <Input
              placeholder="Please specify your job role"
              value={data.job_role === 'Other' ? '' : data.job_role}
              onChange={(e) => onChange({ job_role: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Professional Experience Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'beginner', label: 'Entry Level', description: '0-2 years experience' },
            { value: 'intermediate', label: 'Mid Level', description: '3-7 years experience' },
            { value: 'advanced', label: 'Senior Level', description: '8+ years experience' }
          ].map((level) => (
            <Card
              key={level.value}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.experience_level === level.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => onChange({ experience_level: level.value as any })}
            >
              <div className="text-center">
                <div className="font-medium text-sm">{level.label}</div>
                <div className="text-xs text-neutral-500 mt-1">{level.description}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Company Size */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Company Size (Optional)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPANY_SIZES.map((size) => (
            <Card
              key={size}
              className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                data.company_size === size
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              padding="sm"
              onClick={() => onChange({ company_size: size })}
            >
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{size}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Technical Background */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Technical Background
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
              data.technical_background
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            padding="sm"
            onClick={() => onChange({ technical_background: true })}
          >
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-neutral-500" />
              <div>
                <div className="font-medium text-sm">Yes, I'm technical</div>
                <div className="text-xs text-neutral-500">Programming, data, or IT background</div>
              </div>
            </div>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
              !data.technical_background
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            padding="sm"
            onClick={() => onChange({ technical_background: false })}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-neutral-500" />
              <div>
                <div className="font-medium text-sm">No, I'm non-technical</div>
                <div className="text-xs text-neutral-500">Business, creative, or other background</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
