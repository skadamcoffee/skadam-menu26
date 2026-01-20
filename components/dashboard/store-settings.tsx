"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
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
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Save,
} from "lucide-react"
import { toast } from "sonner"

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
  const [previewMode, setPreviewMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("store_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings")
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

        if (insertError) {
          console.error("Error inserting default settings:", insertError)
          toast.error("Failed to create default settings")
        } else {
          setSettings(newData ?? null)
        }
      } else {
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImage = async (file: File) => {
    if (!file) return null
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const filePath = `wifi-qr/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) throw error

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("UPLOAD ERROR:", error)
      toast.error("Failed to upload image")
      return null
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    // No required fields, so always valid
    setErrors({})
    return true
  }

  const handleSave = async () => {
    if (!settings || !validateForm()) {
      toast.error("Please fix the errors before saving")
      return
    }
    setIsSaving(true)

    try {
      const { error } = await supabase.from("store_settings").update(settings).eq("id", settings.id)
      if (error) throw error
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Manage your coffee shop information and preferences</p>
        </div>
        <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {previewMode ? "Edit Mode" : "Preview"}
        </Button>
      </div>

      {settings && (
        <div className="grid gap-6">
          {/* Opening Hours */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Opening Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Opening Time</label>
                    <Input
                      type="time"
                      value={settings.opening_time ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, opening_time: e.target.value }))
                      }
                      disabled={previewMode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Closing Time</label>
                    <Input
                      type="time"
                      value={settings.closing_time ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, closing_time: e.target.value }))
                      }
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WiFi Settings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  WiFi Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">WiFi Password</label>
                  <Input
                    type="text"
                    placeholder="Enter WiFi password"
                    value={settings.wifi_password ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, wifi_password: e.target.value }))
                    }
                    disabled={previewMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WiFi QR Code</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (!e.target.files?.[0]) return
                      const url = await uploadImage(e.target.files[0])
                      if (url) setSettings((prev) => ({ ...prev!, wifi_qr_code_url: url }))
                    }}
                    disabled={uploading || previewMode}
                    className="mb-2"
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  {settings.wifi_qr_code_url && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={settings.wifi_qr_code_url}
                        alt="WiFi QR Code"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                      {!previewMode && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => setSettings((prev) => ({ ...prev!, wifi_qr_code_url: "" }))}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Shop Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Shop Name</label>
                  <Input
                    type="text"
                    value={settings.shop_name ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, shop_name: e.target.value }))
                    }
                    disabled={previewMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={settings.shop_description ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, shop_description: e.target.value }))
                    }
                    disabled={previewMode}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={settings.phone_number ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, phone_number: e.target.value }))
                      }
                      disabled={previewMode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </label>
                    <Input
                      type="email"
                      value={settings.email ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, email: e.target.value }))
                      }
                      disabled={previewMode}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </label>
                  <Input
                    type="text"
                    value={settings.address ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev!, address: e.target.value }))
                    }
                    disabled={previewMode}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Social Media */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: <Facebook className="w-4 h-4" />, key: "facebook_url", label: "Facebook" },
                  { icon: <Instagram className="w-4 h-4" />, key: "instagram_url", label: "Instagram" },
                  { icon: <Twitter className="w-4 h-4" />, key: "twitter_url", label: "Twitter/X" },
                  { icon: <Music className="w-4 h-4" />, key: "tiktok_url", label: "TikTok" },
                  { icon: <Youtube className="w-4 h-4" />, key: "youtube_url", label: "YouTube" },
                ].map((social) => (
                  <div key={social.key}>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      {social.icon} {social.label} URL
                    </label>
                    <Input
                      type="url"
                      placeholder={`https://www.${social.label.toLowerCase()}.com/yourprofile`}
                      value={(settings as any)[social.key] ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev!, [social.key]: e.target.value }))
                      }
                      disabled={previewMode}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          {!previewMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Settings
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
                      }
