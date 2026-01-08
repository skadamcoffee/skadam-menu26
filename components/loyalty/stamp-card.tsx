"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface StampCardProps {
  userId?: string
  showReward?: boolean
}

interface LoyaltyData {
  stamps: number
  reward_available: boolean
  id: string
}

export function StampCard({ userId, showReward = false }: StampCardProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentStamp, setRecentStamp] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchLoyalty = async () => {
      setIsLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase.from("loyalty").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") throw error

        if (data) {
          setLoyaltyData(data)
        }
      } catch (error) {
        console.error("Error fetching loyalty data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoyalty()

    // Subscribe to loyalty updates
    const subscription = supabase
      .channel("loyalty_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loyalty",
        },
        (payload) => {
          if (payload.new) {
            setLoyaltyData(payload.new as LoyaltyData)
            if (payload.eventType === "UPDATE") {
              setRecentStamp(true)
              setTimeout(() => setRecentStamp(false), 1000)
            }
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="p-6 aspect-video flex items-center justify-center">
        <p className="text-muted-foreground">Loading loyalty card...</p>
      </Card>
    )
  }

  if (!loyaltyData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Sign in to view your loyalty card</p>
      </Card>
    )
  }

  const stamps = loyaltyData.stamps || 0
  const isRewardReady = loyaltyData.reward_available
  const stampPercentage = (stamps / 10) * 100

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent p-8 text-primary-foreground">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><text x="20" y="40" fontSize="30" fill="%23000">☕</text></svg>\')',
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm opacity-90 mb-1">SKADAM Coffee</p>
              <h2 className="text-2xl font-bold">Loyalty Card</h2>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Member Since</p>
              <p className="text-sm font-semibold">{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Stamps Grid */}
          <div className="mb-8">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={recentStamp && i === stamps - 1 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.6 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                    i < stamps ? "bg-white/30 text-white shadow-lg scale-105" : "bg-white/10 text-white/30"
                  }`}
                >
                  {i < stamps ? "✓" : i + 1}
                </motion.div>
              ))}
            </div>
            <div className="text-sm opacity-90">{stamps} of 10 stamps collected</div>
          </div>

          {/* Reward Badge */}
          {isRewardReady && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white text-primary px-4 py-2 rounded-full text-center font-bold text-sm"
            >
              🎁 Free Drink Ready!
            </motion.div>
          )}
        </div>
      </Card>

      {/* Progress Info */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm text-muted-foreground">{Math.round(stampPercentage)}%</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stampPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{10 - stamps} more stamps to unlock free drink</p>
        </div>
      </Card>

      {/* Reward Button */}
      {isRewardReady && (
        <Button className="w-full" size="lg" disabled={!isRewardReady}>
          Claim Free Drink
        </Button>
      )}
    </div>
  )
}
