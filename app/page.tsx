"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { FloatingCoffeeBeans } from "@/components/interactive/floating-coffee-beans"

export default function Home() {
  const [tableNumber, setTableNumber] = useState("")
  const router = useRouter()

  const handleNavigateToMenu = () => {
    if (tableNumber.trim()) {
      router.push(`/menu?table=${encodeURIComponent(tableNumber)}`)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingCoffeeBeans />

      <motion.div
        className="space-y-8 text-center max-w-md w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo/Header */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <motion.div
            className="text-7xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            ☕
          </motion.div>
          <motion.h1 className="text-4xl font-bold text-primary" variants={itemVariants}>
            SKADAM
          </motion.h1>
          <motion.p className="text-muted-foreground text-lg" variants={itemVariants}>
            Smart Coffee Shop Menu
          </motion.p>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Enter Your Table Number</CardTitle>
              <CardDescription>
                Scan the QR code on your table or enter your table number to begin ordering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <motion.div whileFocus={{ scale: 1.02 }}>
                  <Input
                    placeholder="e.g., 5 or A1"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNavigateToMenu()}
                    className="text-center text-lg"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleNavigateToMenu} disabled={!tableNumber.trim()} size="lg" className="w-full">
                    Browse Menu
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div className="grid grid-cols-3 gap-3 text-sm" variants={containerVariants}>
          {[
            { icon: "🎯", label: "Easy Ordering" },
            { icon: "🎁", label: "Earn Rewards" },
            { icon: "✨", label: "Fun Experience" },
          ].map((feature, i) => (
            <motion.div key={i} className="space-y-1" variants={itemVariants} whileHover={{ y: -5 }}>
              <motion.div
                className="text-2xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: i * 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <p className="font-medium text-foreground">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
