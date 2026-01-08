"use client"

import { motion } from "framer-motion"

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="w-16 h-16"
      >
        <div className="text-5xl">☕</div>
      </motion.div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        className="text-muted-foreground"
      >
        Brewing...
      </motion.div>
    </div>
  )
}
