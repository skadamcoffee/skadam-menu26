"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Wifi,
  Copy,
  Check,
  Facebook,
  Instagram,
  Twitter,
  Music,
  Youtube,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Poppins } from "next/font/google"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

interface StoreSettings {
  opening_time: string
  closing_time: string
  wifi_password: string
  shop_name: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  youtube_url?: string
}

interface Promotion {
  id: string
  title: string
  description: string
  image_url: string
  discount_text: string
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

  /* ---------------- HELPERS ---------------- */
  const formatTime = (time?: string) => {
    if (!time) return "--:--"
    return time.slice(0, 5)
  }

  const isOpenNow = (opening?: string, closing?: string) => {
    if (!opening || !closing) return false

    const now = new Date()

    const [openH, openM] = opening.split(":").map(Number)
    const [closeH, closeM] = closing.split(":").map(Number)

    const openTime = new Date()
    openTime.setHours(openH, openM, 0)

    const closeTime = new Date()
    closeTime.setHours(closeH, closeM, 0)

    return now >= openTime && now <= closeTime
  }

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchPromotions()
    fetchStoreSettings()
  }, [])

  useEffect(() => {
    if (promotions.length > 1) {
      const timer = setInterval(() => {
        setCurrentPromoIndex((p) => (p + 1) % promotions.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [promotions.length])

  const fetchPromotions = async () => {
    try {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      setPromotions(data || [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast.error("Failed to load promotions")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStoreSettings = async () => {
    try {
      const { data } = await supabase.from("store_settings").select("*").single()
      if (data) setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load store settings")
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField("wifi")
      toast.success("WiFi password copied!")
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  const handleContinue = () => {
    router.push(`/menu?table=${encodeURIComponent(tableNumber || "")}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          <p className="text-white text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center p-4 ${poppins.className} bg-cover bg-center`}
      style={{
        backgroundImage:
          'url("https://res.cloudinary.com/dgequg3ik/image/upload/v1768306818/20260113_131943_0000_tevwii.jpg")',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl w-full space-y-8 sm:space-y-10"
      >
        {tableNumber && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/90 font-medium text-sm sm:text-base"
          >
            Welcome to Table {tableNumber}
          </motion.p>
        )}

        {/* INFO CARDS */}
        {settings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPENING HOURS */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a] p-6 rounded-xl shadow-2xl border-4 border-[#d6b98c] hover:shadow-3xl transition-shadow"
            >
              <div className="absolute inset-0 rounded-xl border-2 border-[#e6cfa3]" />
              <div className="relative text-center text-white">
                <h3 className="text-xl sm:text-2xl font-bold tracking-widest mb-4">
                  OPENING HOURS
                </h3>
                {isOpenNow(settings.opening_time, settings.closing_time) ? (
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="inline-block mb-4 px-4 py-2 text-sm font-bold bg-green-300 text-green-900 rounded-full shadow-lg"
                  >
                    🟢 OPEN NOW
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="inline-block mb-4 px-4 py-2 text-sm font-bold bg-red-300 text-red-900 rounded-full shadow-lg"
                  >
                    🔴 CLOSED
                  </motion.span>
                )}
                <div className="font-mono text-lg sm:text-xl space-y-2">
                  <p className="flex justify-between">
                    <span>Opens</span>
                    <span>{formatTime(settings.opening_time)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Closes</span>
                    <span>{formatTime(settings.closing_time)}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* WIFI */}
            {settings.wifi_password && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/20 backdrop-blur-md p-6 rounded-3xl text-white shadow-2xl border border-white/10 hover:bg-white/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-5 h-5" />
                  <h3 className="font-bold text-lg sm:text-xl">WiFi Password</h3>
                </div>
                <div className="flex justify-between items-center bg-white/20 p-3 rounded-lg font-mono text-sm sm:text-base">
                  <span className="truncate">{settings.wifi_password}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(settings.wifi_password)}
                    className="p-2 hover:bg-white/30 rounded-full"
                    aria-label="Copy WiFi password"
                  >
                    {copiedField ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* PROMOTIONS */}
        {currentPromo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPromo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={currentPromo.image_url}
                className="w-full h-48 sm:h-64 object-cover"
                alt={currentPromo.title}
                loading="lazy"
              />
            </AnimatePresence>
            {/* Promo Indicators */}
            {promotions.length > 1 && (
              <div className="flex justify-center gap-2 p-4 bg-black/20">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPromoIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentPromoIndex ? "bg-white scale-125" : "bg-white/50"
                    }`}
                    aria-label={`Go to promotion ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SOCIALS */}
        {settings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            {settings.facebook_url && (
              <motion.a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                aria-label="Visit Facebook"
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
            )}
            {settings.instagram_url && (
              <motion.a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                aria-label="Visit Instagram"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
            )}
            {settings.twitter_url && (
              <motion.a
                href={settings.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                aria-label="Visit Twitter"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            )}
            {settings.tiktok_url && (
              <motion.a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                aria-label="Visit TikTok"
              >
                <Music className="w-5 h-5" />
              </motion.a>
            )}
            {settings.youtube_url && (
              <motion.a
                href={settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
                aria-label="Visit YouTube"
              >
                <Youtube className="w-5 h-5" />
              </motion.a>
            )}
          </motion.div>
        )}

        {/* ORDER BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={!tableNumber}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-lg sm:text-xl font-bold text-black shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
          >
            ORDER NOW
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {!tableNumber && (
            <p className="text-center text-white/70 text-sm mt-2">Please scan the QR code at your table</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
