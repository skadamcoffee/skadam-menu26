"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Clock, Wifi, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Poppins, Playfair_Display } from "next/font/google"

// Fonts
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"] })

interface StoreSettings {
  opening_time: string
  closing_time: string
  wifi_password: string
  wifi_qr_code_url: string
  shop_name: string
}

interface Promotion {
  id: string
  title: string
  description: string
  image_url: string
  discount_text: string
  start_date: string
  end_date: string
}

/* ----------------------------------
   Elegant letter-by-letter animation
----------------------------------- */
const AnimatedText = ({ text }: { text: string }) => {
  return (
    <span className="inline-flex">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.08,
            duration: 0.4,
            ease: "easeOut",
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  )
}

export function WelcomeLanding() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")
  const supabase = createClient()

  useEffect(() => {
    fetchPromotions()
    fetchStoreSettings()
  }, [])

  useEffect(() => {
    if (promotions.length > 1) {
      const timer = setInterval(() => {
        setCurrentPromoIndex((prev) => (prev + 1) % promotions.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [promotions.length])

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setPromotions(data || [])
    } catch (err) {
      console.error("Error fetching promotions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStoreSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .single()

      if (error && error.code !== "PGRST116") console.error(error)
      if (data) setSettings(data)
    } catch (error) {
      console.error(error)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleContinue = () => {
    router.push(`/menu?table=${encodeURIComponent(tableNumber || "")}`)
  }

  /* ----------------------------------
     ELEGANT LOADING UI
  ----------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAF0]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="text-center space-y-1">
            <h1
              className={`text-3xl font-semibold tracking-wide text-amber-900 ${playfair.className}`}
            >
              <AnimatedText text={settings?.shop_name || "SKADAM"} />
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
              Coffee & Experience
            </p>
          </div>

          <div className="relative w-56 h-[2px] bg-amber-200 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
              }}
            />
          </div>

          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm text-amber-800 tracking-wide"
          >
            Preparing your experience
          </motion.p>
        </motion.div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${poppins.className}`}
      style={{
        background:
          "linear-gradient(135deg, #FFFAF0 0%, #FFE4B5 50%, #FFD700 100%)",
      }}
    >
      <motion.div className="max-w-3xl w-full space-y-10">
        {/* Welcome Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className={`text-5xl font-extrabold text-amber-900 ${playfair.className}`}
          >
            {settings?.shop_name || "Welcome to SKADAM"}
          </h1>
          {tableNumber && (
            <p className="text-lg text-muted-foreground font-medium">
              Table {tableNumber}
            </p>
          )}
        </motion.div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          size="lg"
          disabled={!tableNumber}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          Browse Our Menu
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  )
}
