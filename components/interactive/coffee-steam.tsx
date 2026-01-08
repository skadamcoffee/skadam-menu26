"use client"

import { motion } from "framer-motion"

export function CoffeeSteam() {
  const steamLines = Array.from({ length: 3 })

  return (
    <div className="relative w-12 h-12">
      <svg className="absolute inset-0" viewBox="0 0 100 100" width="100%">
        {steamLines.map((_, i) => (
          <motion.path
            key={i}
            d={`M 50 60 Q ${50 + (Math.random() - 0.5) * 20} ${60 - 20 * i} 50 ${60 - 40 - 20 * i}`}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-primary/40"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0.2, 0.5, 0], pathLength: [0, 1, 1] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.6,
            }}
          />
        ))}
      </svg>
    </div>
  )
}
