"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Clock, Wifi, MapPin, Phone, Mail, Facebook, Instagram, Twitter, Music, Youtube } from "lucide-react"
import { motion } from "framer-motion"

interface StoreSettings {
  opening_time: string
  closing_time: string
  wifi_password?: string
  wifi_qr_code_url?: string
  shop_name: string
  shop_description?: string
  phone_number?: string
  email?: string
  address?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  youtube_url?: string
}

export default function WelcomePage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("store_settings").select("*").single()
      if (error) console.error("Error fetching settings:", error)
      else setSettings(data)
    } catch (error) {
      console.error("Error fetching store settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">☕</div>
          <p className="text-gray-500 text-lg">Loading store information...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-gray-500 text-lg">Store information not available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 md:px-8 lg:px-16 py-8">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome to {settings.shop_name}!</h1>
        {settings.shop_description && (
          <p className="text-gray-600 text-lg">{settings.shop_description}</p>
        )}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Opening Hours */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800">Opening Hours</h2>
            </div>
            <p className="text-gray-600">
              {settings.opening_time} - {settings.closing_time}
            </p>
          </Card>
        </motion.div>

        {/* WiFi Info */}
        {settings.wifi_password && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-3">
                <Wifi className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-gray-800">WiFi</h2>
              </div>
              <p className="text-gray-600 mb-3">Password: <span className="font-medium">{settings.wifi_password}</span></p>
              {settings.wifi_qr_code_url && (
                <img
                  src={settings.wifi_qr_code_url}
                  alt="WiFi QR Code"
                  className="w-32 h-32 border border-gray-300 rounded-lg shadow-sm"
                />
              )}
            </Card>
          </motion.div>
        )}

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800">Contact</h2>
            </div>
            {settings.phone_number && <p className="text-gray-600">Phone: {settings.phone_number}</p>}
            {settings.email && <p className="text-gray-600">Email: {settings.email}</p>}
            {settings.address && <p className="text-gray-600">Address: {settings.address}</p>}
          </Card>
        </motion.div>

        {/* Social Media */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-3">
              <Facebook className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-800">Social Media</h2>
            </div>
            <div className="space-y-2">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" className="text-primary hover:underline block">
                  Facebook
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" className="text-pink-500 hover:underline block">
                  Instagram
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" className="text-blue-500 hover:underline block">
                  Twitter/X
                </a>
              )}
              {settings.tiktok_url && (
                <a href={settings.tiktok_url} target="_blank" className="text-black hover:underline block">
                  TikTok
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" className="text-red-500 hover:underline block">
                  YouTube
                </a>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
