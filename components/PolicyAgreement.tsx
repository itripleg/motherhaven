"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface PolicyQuestion {
  id: string
  question: string
}

interface PolicyAgreementProps {
  policies: PolicyQuestion[]
  onComplete: (agreements: Record<string, boolean>) => void
}

export function PolicyAgreement({ policies, onComplete }: PolicyAgreementProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [agreements, setAgreements] = useState<Record<string, boolean>>({})

  const handleResponse = (agree: boolean) => {
    const currentPolicy = policies[currentQuestionIndex]
    setAgreements(prev => ({ ...prev, [currentPolicy.id]: agree }))

    if (currentQuestionIndex < policies.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      onComplete(agreements)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardContent className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold mb-4">{policies[currentQuestionIndex].question}</h2>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => handleResponse(true)}
                variant="outline"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Yea
              </Button>
              <Button
                onClick={() => handleResponse(false)}
                variant="outline"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Nah
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

