import React from 'react'
import { Button } from './Button'

interface ConnectionErrorProps {
  error: string
  onRetry: () => void
  onClearError?: () => void
  className?: string
}

export function ConnectionError({ error, onRetry, onClearError, className = '' }: ConnectionErrorProps) {
  const isTimeoutError = error.toLowerCase().includes('timeout')
  const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isTimeoutError ? 'Connection Timeout' : 
             isNetworkError ? 'Network Error' : 'Connection Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
            {onClearError && (
              <Button
                onClick={onClearError}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-100"
              >
                Dismiss
              </Button>
            )}
          </div>
          {(isTimeoutError || isNetworkError) && (
            <div className="mt-3 text-xs text-red-600">
              <p className="font-medium">Troubleshooting tips:</p>
              <ul className="mt-1 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Wait a few moments and try again</li>
                {isTimeoutError && (
                  <li>• The server might be experiencing high load</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
