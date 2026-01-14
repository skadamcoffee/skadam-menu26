"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Clock, Wifi, Copy, Check, Facebook, Instagram, Twitter, Music, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Poppins } from "next/font/google"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

interface StoreSettings {
  opening_time: string
  closing_time: string
  wifi_password: string
  wifi_qr_code_url: string
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
      <div className="flex items-center justify-center min-h-screen bg-black/10">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-white/80 text-lg font-medium">Loading promotions...</p>
        </div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div
      className={`relative min-h-screen flex flex-col items-center justify-center p-4 ${poppins.className}`}
      style={{
        backgroundImage:
          'url("https://res.cloudinary.com/dgequg3ik/image/upload/v1768306818/20260113_131943_0000_tevwii.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <motion.div className="relative max-w-4xl w-full space-y-10 z-10">
        {/* Only Table Number */}
        {tableNumber && (
          <motion.p
            className="text-center text-lg text-white/80 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Table {tableNumber}
          </motion.p>
        )}

        {/* Store Info Cards */}
        {settings && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Opening Hours */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/30 hover:scale-[1.03] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-6 h-6 text-yellow-300" />
                <h3 className="font-bold text-lg text-white">Opening Hours</h3>
              </div>
              <p className="text-white">
                <span className="font-semibold">Opens:</span> {settings.opening_time || "06:00"}
              </p>
              <p className="text-white">
                <span className="font-semibold">Closes:</span> {settings.closing_time || "22:00"}
              </p>
            </div>

            {/* WiFi Password */}
            {settings.wifi_password && (
              <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/30 hover:scale-[1.03] transition-transform">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-6 h-6 text-blue-300" />
                  <h3 className="font-bold text-lg text-white">WiFi Password</h3>
                </div>
                <div className="flex items-center justify-between bg-white/20 p-2 rounded font-mono text-sm text-white">
                  {settings.wifi_password}
                  <button onClick={() => copyToClipboard(settings.wifi_password, "wifi")}>
                    {copiedField === "wifi" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Promotions */}
        {promotions.length > 0 && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-2xl font-bold text-center text-white drop-shadow-md">
              Special Offers For You
            </h2>
            <AnimatePresence mode="wait">
              {currentPromo && (
                <motion.div
                  key={currentPromo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative rounded-3xl overflow-hidden shadow-lg"
                >
                  {currentPromo.image_url && (
                    <div className="relative w-full aspect-video overflow-hidden rounded-3xl">
                      <img
                        src={currentPromo.image_url}
                        alt={currentPromo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-2xl font-bold drop-shadow-lg">{currentPromo.title}</h3>
                        {currentPromo.discount_text && (
                          <p className="bg-yellow-500 text-white px-3 py-1 rounded mt-1 inline-block drop-shadow-md">
                            {currentPromo.discount_text}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {currentPromo.description && (
                    <p className="mt-2 text-sm text-white px-2">{currentPromo.description}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carousel Dots */}
            {promotions.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                {promotions.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentPromoIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentPromoIndex ? "bg-yellow-400 w-8" : "bg-white/50 w-2"
                    }`}
                    whileHover={{ scale: 1.3 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Social Links */}
        {settings && (
          <motion.div className="flex justify-center gap-4 mt-4">
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500">
                <Facebook className="w-6 h-6" />
              </a>
            )}
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-500">
                <Instagram className="w-6 h-6" />
              </a>
            )}
            {settings.twitter_url && (
              <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400">
                <Twitter className="w-6 h-6" />
              </a>
            )}
            {settings.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-black">
                <Music className="w-6 h-6" />
              </a>
            )}
            {settings.youtube_url && (
              <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-500">
                <Youtube className="w-6 h-6" />
              </a>
            )}
          </motion.div>
        )}

        {/* Order Now Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg flex justify-center items-center gap-2"
            disabled={!tableNumber}
          >
            <span>ORDER NOW</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
            }
