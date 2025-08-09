import { User } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import type { OnboardingFormData } from '@/types'

interface PersonalInfoStepProps {
  data: OnboardingFormData['personal']
  onChange: (data: Partial<OnboardingFormData['personal']>) => void
}

export function PersonalInfoStep({ data, onChange }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-primary-600" />
        </div>
        <p className="text-neutral-600">
          Let's start with some basic information about you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={data.first_name}
          onChange={(e) => onChange({ first_name: e.target.value })}
          placeholder="Enter your first name"
          required
        />

        <Input
          label="Last Name"
          value={data.last_name}
          onChange={(e) => onChange({ last_name: e.target.value })}
          placeholder="Enter your last name"
          required
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
        placeholder="Enter your email"
        disabled
        helperText="This email is associated with your account"
      />
    </div>
  )
}
