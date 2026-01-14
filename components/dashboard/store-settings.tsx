"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Wifi,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Music,
  Youtube,
} from "lucide-react"
import { motion } from "framer-motion"

interface StoreSettings {
  id: string
  opening_time: string
  closing_time: string
  wifi_password: string
  wifi_qr_code_url: string
  shop_name: string
  shop_description: string
  phone_number: string
  email: string
  address: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  youtube_url?: string
}

export function StoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("store_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error)
      }

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("store_settings")
          .insert([
            {
              opening_time: "06:00",
              closing_time: "22:00",
              shop_name: "SKADAM Coffee Shop",
              shop_description: "",
              phone_number: "",
              email: "",
              address: "",
            },
          ])
          .select()
          .single()

        if (insertError) console.error("Error inserting default settings:", insertError)
        else setSettings(newData!)
      } else setSettings(data)
    } catch (error) {
      console.error("[v0] Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("store_settings")
        .update(settings)
        .eq("id", settings.id)
      if (error) throw error
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">☕</div>
          <p className="text-gray-500 text-lg">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 md:px-8 lg:px-16 py-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Store Settings</h1>

      {settings && (
        <div className="grid gap-6">
          {/* Opening Hours */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-5">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-gray-800">Opening Hours</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-500">Opening Time</label>
                  <input
                    type="time"
                    value={settings.opening_time || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, opening_time: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Closing Time</label>
                  <input
                    type="time"
                    value={settings.closing_time || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, closing_time: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* WiFi Settings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-5">
                <Wifi className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-gray-800">WiFi Configuration</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">WiFi Password</label>
                  <input
                    type="text"
                    placeholder="Enter WiFi password"
                    value={settings.wifi_password || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, wifi_password: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">WiFi QR Code URL</label>
                  <input
                    type="url"
                    placeholder="Upload WiFi QR code image URL"
                    value={settings.wifi_qr_code_url || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, wifi_qr_code_url: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  {settings.wifi_qr_code_url && (
                    <div className="mt-4">
                      <img
                        src={settings.wifi_qr_code_url}
                        alt="WiFi QR Code"
                        className="w-36 h-36 border border-gray-300 rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Shop Information */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">Shop Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Shop Name</label>
                  <input
                    type="text"
                    value={settings.shop_name || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, shop_name: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <textarea
                    value={settings.shop_description || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, shop_description: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.phone_number || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, phone_number: e.target.value }))
                      }
                      className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </label>
                    <input
                      type="email"
                      value={settings.email || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, email: e.target.value }))
                      }
                      className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </label>
                  <input
                    type="text"
                    value={settings.address || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, address: e.target.value }))
                    }
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Social Media */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 shadow-lg border border-gray-200 rounded-xl hover:shadow-xl transition">
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">Social Media Links</h2>
              <div className="space-y-4">
                {[
                  { icon: <Facebook className="w-4 h-4" />, label: "Facebook", key: "facebook_url" },
                  { icon: <Instagram className="w-4 h-4" />, label: "Instagram", key: "instagram_url" },
                  { icon: <Twitter className="w-4 h-4" />, label: "Twitter/X", key: "twitter_url" },
                  { icon: <Music className="w-4 h-4" />, label: "TikTok", key: "tiktok_url" },
                  { icon: <Youtube className="w-4 h-4" />, label: "YouTube", key: "youtube_url" },
                ].map((social) => (
                  <div key={social.key}>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      {social.icon} {social.label} URL
                    </label>
                    <input
                      type="url"
                      placeholder={`https://www.${social.label.toLowerCase()}.com/yourprofile`}
                      value={(settings as any)[social.key] || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, [social.key]: e.target.value }))
                      }
                      className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl shadow-md transition"
            >
              {isSaving ? "Saving..." : "Save All Settings"}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
                      }
