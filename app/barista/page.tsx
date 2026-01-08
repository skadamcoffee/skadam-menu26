"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { BaristaOrders } from "@/components/barista/barista-orders"

export default function BaristaPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Check if user is barista or admin
      const { data: userData } = await supabase.from("users").select("role").eq("id", authUser.id).single()

      if (userData?.role !== "barista" && userData?.role !== "admin") {
        router.push("/")
        return
      }

      // Log activity
      try {
        await supabase.from("staff_activity_logs").insert({
          user_id: authUser.id,
          activity_type: "login",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Error logging activity:", error)
      }

      setUser(authUser)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    // Log logout activity
    if (user) {
      try {
        await supabase.from("staff_activity_logs").insert({
          user_id: user.id,
          activity_type: "logout",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Error logging activity:", error)
      }
    }

    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading barista dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Barista Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <BaristaOrders />
      </main>
    </div>
  )
}
