"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Clock, Wifi, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Poppins } from "next/font/google"

// Fonts
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

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
      <div className="flex items-center justify-center min-h-screen bg-black/10">
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
      className={`relative min-h-screen flex items-center justify-center p-4 ${poppins.className}`}
      style={{
        backgroundImage:
          'url("https://res.cloudinary.com/dgequg3ik/image/upload/v1768300687/Design_sans_titre_20260113_113736_0000_vkkpzl.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <motion.div className="relative max-w-3xl w-full space-y-10 z-10">
        {/* Welcome Header with pulsing logo */}
{/* Welcome Header with pulsing logo and glass background */}
<motion.div
  className="text-center flex flex-col items-center justify-center"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
  {/* Glass Container for Logo Only */}
  <div className="relative p-8 rounded-[40px] overflow-hidden flex items-center justify-center">
    {/* The Glass Layer */}
    <div 
      className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20"
      style={{
        maskImage: 'radial-gradient(circle, black 40%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 90%)',
      }}
    />
    
    <motion.img
      src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768304931/3c12030f-505a-4e04-95ba-cc4c0b7f7756_20260113_124821_0000_c3jcms.png"
      alt={settings?.shop_name || "SKADAM COFFEE SHOP"}
      className="relative z-10 w-72 sm:w-96 md:w-[500px] max-w-full drop-shadow-2xl"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>

  {tableNumber && (
    <p className="text-lg text-white/90 font-medium mt-4 drop-shadow-md">
      Table {tableNumber}
    </p>
  )}
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
            <div className="bg-white/30 p-6 rounded-2xl shadow-md border border-white/20 hover:scale-[1.02] transition-transform">
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

            {/* WiFi */}
            {settings.wifi_password && (
              <div className="bg-white/30 p-6 rounded-2xl shadow-md border border-white/20 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-6 h-6 text-blue-300" />
                  <h3 className="font-bold text-lg text-white">WiFi Password</h3>
                </div>
                <div className="flex items-center justify-between bg-white/20 p-2 rounded font-mono text-sm text-white">
                  {settings.wifi_password}
                  <button onClick={() => copyToClipboard(settings.wifi_password, "wifi")}>
                    {copiedField === "wifi" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Promotions Section */}
        {promotions.length > 0 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="text-2xl font-bold text-center text-white">Special Offers For You</h2>
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
                          <p className="bg-yellow-500 text-white px-3 py-1 rounded mt-1 inline-block">{currentPromo.discount_text}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {currentPromo.description && <p className="mt-2 text-sm text-white">{currentPromo.description}</p>}
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
                    className={`h-2 rounded-full transition-all ${index === currentPromoIndex ? "bg-yellow-400 w-8" : "bg-white/50 w-2"}`}
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
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg flex justify-center items-center gap-2"
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
