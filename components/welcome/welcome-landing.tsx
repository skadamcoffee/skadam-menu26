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
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
    return time.slice(0, 5) // HH:mm
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
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    setPromotions(data || [])
    setIsLoading(false)
  }

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from("store_settings").select("*").single()
    if (data) setSettings(data)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField("wifi")
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleContinue = () => {
    router.push(`/menu?table=${encodeURIComponent(tableNumber || "")}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black/20">
        <div className="text-white text-lg">Loading…</div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center p-4 ${poppins.className}`}
      style={{
        backgroundImage:
          'url("https://res.cloudinary.com/dgequg3ik/image/upload/v1768306818/20260113_131943_0000_tevwii.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <motion.div className="relative max-w-4xl w-full space-y-10 z-10">
        {tableNumber && (
          <p className="text-center text-white/80 font-medium">
            Table {tableNumber}
          </p>
        )}

        {/* INFO CARDS */}
        {settings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPENING HOURS */}
            <div className="relative bg-[#2f2f2f] p-6 rounded-xl shadow-2xl border-4 border-[#d6b98c]">
              <div className="absolute inset-0 rounded-xl border-2 border-[#e6cfa3]" />

              <div className="relative text-center text-white">
                <h3 className="text-xl font-bold tracking-widest mb-3">
                  OPENING HOURS
                </h3>

                {isOpenNow(settings.opening_time, settings.closing_time) ? (
                  <span className="inline-block mb-4 px-4 py-1 text-sm font-bold bg-green-300 text-green-900 rounded-full">
                    🟢 OPEN NOW
                  </span>
                ) : (
                  <span className="inline-block mb-4 px-4 py-1 text-sm font-bold bg-red-300 text-red-900 rounded-full">
                    🔴 CLOSED
                  </span>
                )}

                <div className="font-mono text-lg space-y-2">
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
            </div>

            {/* WIFI */}
            {settings.wifi_password && (
              <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi />
                  <h3 className="font-bold">WiFi Password</h3>
                </div>
                <div className="flex justify-between bg-white/20 p-2 rounded font-mono">
                  {settings.wifi_password}
                  <button onClick={() => copyToClipboard(settings.wifi_password)}>
                    {copiedField ? <Check /> : <Copy />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROMOTIONS */}
        {currentPromo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl overflow-hidden shadow-lg"
            >
              <img
                src={currentPromo.image_url}
                className="w-full h-full object-cover"
                alt={currentPromo.title}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* SOCIALS */}
        {settings && (
          <div className="flex justify-center gap-4">
            {settings.facebook_url && <a href={settings.facebook_url}><Facebook /></a>}
            {settings.instagram_url && <a href={settings.instagram_url}><Instagram /></a>}
            {settings.twitter_url && <a href={settings.twitter_url}><Twitter /></a>}
            {settings.tiktok_url && <a href={settings.tiktok_url}><Music /></a>}
            {settings.youtube_url && <a href={settings.youtube_url}><Youtube /></a>}
          </div>
        )}

        {/* ORDER */}
        <Button
          onClick={handleContinue}
          disabled={!tableNumber}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-lg font-bold"
        >
          ORDER NOW <ArrowRight />
        </Button>
      </motion.div>
    </div>
  )
}
