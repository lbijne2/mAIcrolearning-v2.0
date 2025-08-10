import React from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-400 text-sm">{icon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-all duration-200',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-neutral-50 disabled:cursor-not-allowed',
            error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-neutral-300',
            icon ? 'pl-10' : '',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export function Textarea({
  label,
  error,
  helperText,
  fullWidth = true,
  className,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'w-full px-4 py-3 border rounded-lg transition-all duration-200',
          'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-neutral-50 disabled:cursor-not-allowed',
          'resize-vertical',
          error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-neutral-300',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  )
}
