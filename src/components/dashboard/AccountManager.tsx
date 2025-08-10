'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Briefcase, 
  BookOpen, 
  Save, 
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface AccountManagerProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  onProfileUpdate: (updatedProfile: UserProfile) => void
}

export function AccountManager({ isOpen, onClose, profile, onProfileUpdate }: AccountManagerProps) {
  const [formData, setFormData] = useState<UserProfile>(profile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(profile)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, profile])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: keyof UserProfile, value: string) => {
    const currentArray = formData[field] as string[]
    const newArray = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          industry: formData.industry,
          job_role: formData.job_role,
          experience_level: formData.experience_level,
          ai_skill_level: formData.ai_skill_level,
          learning_goals: formData.learning_goals,
          preferred_learning_style: formData.preferred_learning_style,
          time_commitment: formData.time_commitment,
          interests: formData.interests,
          company_size: formData.company_size,
          technical_background: formData.technical_background,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        setError('Failed to update profile. Please try again.')
      } else {
        setSuccess(true)
        onProfileUpdate(data)
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-display font-bold text-neutral-900">
            Account Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X />}
          >
            Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800">Profile updated successfully!</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      First Name
                    </label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Professional Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Industry
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Job Role
                  </label>
                  <Input
                    value={formData.job_role}
                    onChange={(e) => handleInputChange('job_role', e.target.value)}
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={formData.company_size || ''}
                    onChange={(e) => handleInputChange('company_size', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="technical_background"
                    checked={formData.technical_background}
                    onChange={(e) => handleInputChange('technical_background', e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="technical_background" className="text-sm text-neutral-700">
                    I have a technical background
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Learning Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Learning Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    AI Skill Level
                  </label>
                  <select
                    value={formData.ai_skill_level}
                    onChange={(e) => handleInputChange('ai_skill_level', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="none">No experience</option>
                    <option value="basic">Basic knowledge</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Preferred Learning Style
                  </label>
                  <select
                    value={formData.preferred_learning_style}
                    onChange={(e) => handleInputChange('preferred_learning_style', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Hands-on</option>
                    <option value="reading">Reading</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Daily Time Commitment (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.time_commitment}
                    onChange={(e) => handleInputChange('time_commitment', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 30"
                    min="5"
                    max="480"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Learning Goals & Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Goals & Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Learning Goals (comma-separated)
                  </label>
                  <Input
                    value={formData.learning_goals.join(', ')}
                    onChange={(e) => handleArrayChange('learning_goals', e.target.value)}
                    placeholder="e.g., Understand AI basics, Learn machine learning, Improve productivity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    AI Interests (comma-separated)
                  </label>
                  <Input
                    value={formData.interests.join(', ')}
                    onChange={(e) => handleArrayChange('interests', e.target.value)}
                    placeholder="e.g., Natural language processing, Computer vision, Automation"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={loading}
              icon={<Save />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
