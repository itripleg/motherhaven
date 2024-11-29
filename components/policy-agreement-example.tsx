"use client"

import React from 'react'
import { PolicyAgreement } from '@/components/PolicyAgreement'

const policyQuestions = [
  { id: 'terms', question: 'Do you agree to our terms of service?' },
  { id: 'privacy', question: 'Do you accept our privacy policy?' },
  { id: 'cookies', question: 'Is it cool if we use cookies?' },
  { id: 'updates', question: 'Can we send you product updates?' },
]

export default function PolicyAgreementExample() {
  const handleCompletion = (agreements: Record<string, boolean>) => {
    console.log('Policy agreements:', agreements)
    // Here you can handle the completion, e.g., save to database, update user profile, etc.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <PolicyAgreement policies={policyQuestions} onComplete={handleCompletion} />
    </div>
  )
}

