"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Coffee, ShoppingBag } from "lucide-react"

export default function Home() {
  const [tableNumber, setTableNumber] = useState("")
  const router = useRouter()

  const goToMenu = () => {
    if (!tableNumber.trim()) return
    router.push(`/menu?table=${encodeURIComponent(tableNumber)}`)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://res.cloudinary.com/dgequg3ik/image/upload/v1768377494/20260111_030418_0000_tilp13.png)",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768097629/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000_oc3uod.png"
            alt="Skadam Logo"
            className="w-36 h-36 object-contain"
          />
        </div>

        {/* Card */}
        <Card className="bg-[#f5ecd7] border-[3px] border-[#c9a96a] rounded-3xl shadow-2xl">
          <CardContent className="p-6 space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-[#3b2a1a]">
                Welcome! Ready to order?
              </h1>
              <p className="text-[#6b5a3a] mt-1">
                Please enter your table number.
              </p>
            </div>

            {/* Input */}
            <Input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table number (e.g., 5 or A1)"
              className="
                h-12
                text-center
                text-lg
                rounded-xl
                bg-white
                border border-[#d6c49a]
                focus-visible:ring-[#c9a96a]
              "
              onKeyDown={(e) => e.key === "Enter" && goToMenu()}
            />

            {/* Primary button */}
            <Button
              onClick={goToMenu}
              disabled={!tableNumber.trim()}
              className="
                w-full h-12 rounded-xl
                bg-[#5a3a1a]
                text-white
                font-semibold
                hover:bg-[#4a2f15]
                flex items-center justify-center gap-2
              "
            >
              <ShoppingBag className="w-5 h-5" />
              Confirm Table & Order
            </Button>

            {/* Secondary button */}
            <Button
              variant="secondary"
              onClick={() => router.push("/menu")}
              className="
                w-full h-12 rounded-xl
                bg-[#b6b07a]
                text-[#2f2a12]
                font-semibold
                hover:bg-[#a9a36d]
                flex items-center justify-center gap-2
              "
            >
              <Coffee className="w-5 h-5" />
              Browse Full Menu
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
