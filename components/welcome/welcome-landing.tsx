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
      const { data, error } = await supabase.from("store_settings").select("*").single()
      if (error && error.code !== "PGRST116") console.error(error)
      if (data) setSettings(data)
    } catch (error) {
      console.error(error)
    }
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleContinue = () => {
    router.push(`/menu?table=${encodeURIComponent(tableNumber || "")}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground text-lg font-medium">Loading promotions...</p>
        </div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${poppins.className}`}
      style={{
        background: "linear-gradient(135deg, #FFFAF0 0%, #FFE4B5 50%, #FFD700 100%)", // soft appealing gradient
      }}
    >
      <motion.div className="max-w-3xl w-full space-y-10">
        {/* Welcome Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className={`text-5xl font-extrabold ${playfair.className} text-amber-900 dark:text-amber-100`}>
            {settings?.shop_name || "Welcome to SKADAM"}
          </h1>
          {tableNumber && <p className="text-lg text-muted-foreground font-medium">Table {tableNumber}</p>}
        </motion.div>

        {/* Store Hours & WiFi */}
        {settings && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Hours */}
            <div className="bg-white/90 p-6 rounded-2xl shadow-md border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-6 h-6 text-amber-700" />
                <h3 className="font-bold text-amber-900 text-lg">Opening Hours</h3>
              </div>
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Opens:</span> {settings.opening_time || "06:00"}
              </p>
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Closes:</span> {settings.closing_time || "22:00"}
              </p>
            </div>

            {/* WiFi */}
            {settings.wifi_password && (
              <div className="bg-white/90 p-6 rounded-2xl shadow-md border border-white/20 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-6 h-6 text-blue-700" />
                  <h3 className="font-bold text-blue-900 text-lg">WiFi Password</h3>
                </div>
                <div className="flex items-center justify-between bg-white/70 p-2 rounded font-mono text-sm text-blue-800">
                  {settings.wifi_password}
                  <button onClick={() => copyToClipboard(settings.wifi_password, "wifi")}>
                    {copiedField === "wifi" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Promotions Section (Cardless) */}
        {promotions.length > 0 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-2xl font-bold text-center text-amber-900 dark:text-amber-100">Special Offers For You</h2>
            <AnimatePresence mode="wait">
              {currentPromo && (
                <motion.div
                  key={currentPromo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden"
                >
                  {currentPromo.image_url && (
                    <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-md">
                      <img src={currentPromo.image_url} alt={currentPromo.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-2xl font-bold drop-shadow">{currentPromo.title}</h3>
                        {currentPromo.discount_text && (
                          <p className="bg-primary text-primary-foreground px-3 py-1 rounded mt-1 inline-block">{currentPromo.discount_text}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {currentPromo.description && (
                    <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">{currentPromo.description}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Indicators */}
            {promotions.length > 1 && (
              <div className="flex justify-center gap-2">
                {promotions.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentPromoIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === currentPromoIndex ? "bg-primary w-8" : "bg-muted w-2"}`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg flex justify-center items-center gap-2"
            disabled={!tableNumber}
          >
            <span>Browse Our Menu</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>

      </motion.div>
    </div>
  )
}
