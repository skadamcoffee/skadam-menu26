"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Clock, Wifi, Copy, Check } from "lucide-react"

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
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error)
      }
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching store settings:", error)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading promotions...</p>
        </div>
      </div>
    )
  }

  const currentPromo = promotions[currentPromoIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <motion.div className="max-w-2xl w-full space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Welcome Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold">{settings?.shop_name || "Welcome to SKADAM"}</h1>
          {tableNumber && <p className="text-lg text-muted-foreground">Table {tableNumber}</p>}
        </motion.div>

        {/* Store Hours & WiFi Section */}
        {settings && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Opening Hours Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Opening Hours</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">Opens:</span> {settings.opening_time || "06:00"}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">Closes:</span> {settings.closing_time || "22:00"}
                </p>
              </div>
            </div>

            {/* WiFi Password Card */}
            {settings.wifi_password && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">WiFi Password</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-black/30 p-2 rounded">
                    {settings.wifi_password}
                  </p>
                  <button
                    onClick={() => copyToClipboard(settings.wifi_password, "wifi")}
                    className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {copiedField === "wifi" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* WiFi QR Code Section */}
        {settings?.wifi_qr_code_url && (
          <motion.div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-lg border border-purple-200 dark:border-purple-800 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">Scan for WiFi</p>
            <img
              src={settings.wifi_qr_code_url || "/placeholder.svg"}
              alt="WiFi QR Code"
              className="w-40 h-40 mx-auto border-2 border-purple-300 dark:border-purple-700 rounded-lg"
            />
          </motion.div>
        )}

        {/* Promotions Section */}
        {promotions.length > 0 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-xl font-bold text-center">Special Offers For You</h2>

            <AnimatePresence mode="wait">
              {currentPromo && (
                <motion.div
                  key={currentPromo.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="overflow-hidden border-primary/20 shadow-lg">
                    {currentPromo.image_url && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={currentPromo.image_url || "/placeholder.svg"}
                          alt={currentPromo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-3">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{currentPromo.title}</h3>
                        {currentPromo.discount_text && (
                          <div className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-lg">
                            {currentPromo.discount_text}
                          </div>
                        )}
                      </div>
                      {currentPromo.description && <p className="text-muted-foreground">{currentPromo.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(currentPromo.end_date).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
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
                    className={`h-2 rounded-full transition-all ${
                      index === currentPromoIndex ? "bg-primary w-8" : "bg-muted w-2"
                    }`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button onClick={handleContinue} size="lg" className="w-full group" disabled={!tableNumber}>
            <span>Browse Our Menu</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          className="grid grid-cols-3 gap-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: "🎯", text: "Easy Ordering" },
            { icon: "🎁", text: "Earn Rewards" },
            { icon: "⚡", text: "Quick Service" },
          ].map((feature, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl">{feature.icon}</div>
              <p className="text-xs font-medium">{feature.text}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
