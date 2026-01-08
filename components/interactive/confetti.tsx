"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [isActive, setIsActive] = useState(trigger)

  useEffect(() => {
    if (trigger) {
      setIsActive(true)
      const timer = setTimeout(() => {
        setIsActive(false)
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!isActive) return null

  const pieces = Array.from({ length: 30 })

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full"
          initial={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            opacity: 1,
          }}
          animate={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 500,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 500,
            opacity: 0,
            scale: [1, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
