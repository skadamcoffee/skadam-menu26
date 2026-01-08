"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface SuccessAnimationProps {
  message: string
  isVisible: boolean
}

export function SuccessAnimation({ message, isVisible }: SuccessAnimationProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
    >
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
        <CheckCircle2 className="w-5 h-5" />
      </motion.div>
      <span>{message}</span>
    </motion.div>
  )
}
