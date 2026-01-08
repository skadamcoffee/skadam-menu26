"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function FloatingCoffeeBeans() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Update dimensions on resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return <div className="fixed inset-0 pointer-events-none overflow-hidden" />
  }

  const beans = Array.from({ length: 5 })

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {beans.map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{
            x: Math.random() * dimensions.width,
            y: -50,
            opacity: 0,
          }}
          animate={{
            y: dimensions.height + 50,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 2,
            ease: "linear",
          }}
        >
          ☕
        </motion.div>
      ))}
    </div>
  )
}
