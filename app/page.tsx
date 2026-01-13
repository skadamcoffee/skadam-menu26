"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { motion } from "framer-motion"

export default function Home() {
  const [tableNumber, setTableNumber] = useState("")
  const router = useRouter()

  const handleNavigateToMenu = () => {
    if (tableNumber.trim()) {
      router.push(`/menu?table=${encodeURIComponent(tableNumber)}`)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-black px-4">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md text-center space-y-10"
      >
        {/* Logo with white background */}
        <motion.div
          className="mx-auto w-48 sm:w-56 md:w-64 rounded-full bg-white p-4 flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768097629/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000_oc3uod.png"
            alt="SKADAM Logo"
            className="w-32 sm:w-40 md:w-48 h-auto object-contain"
          />
        </motion.div>

        {/* Card for table number */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white text-xl">Welcome 🌙</CardTitle>
            <CardDescription className="text-white/70">
              Enter your table number to start ordering
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <motion.div
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                placeholder="Table number (e.g., 5 or A1)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleNavigateToMenu()
                }
                className="
                  text-center text-lg
                  bg-white/90
                  placeholder:text-muted-foreground
                  rounded-xl
                  h-12
                "
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={handleNavigateToMenu}
                disabled={!tableNumber.trim()}
                size="lg"
                className="
                  w-full
                  rounded-xl
                  bg-yellow-400
                  text-black
                  font-semibold
                  hover:bg-yellow-300
                "
              >
                Browse Menu
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="mt-auto mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider text-yellow-400 drop-shadow-lg">
          Welcome to SKADAM
        </h2>
      </motion.footer>
    </div>
  )
}
