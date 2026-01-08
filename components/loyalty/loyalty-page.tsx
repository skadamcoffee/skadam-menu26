"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { StampCard } from "./stamp-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function LoyaltyPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)
      setIsLoading(false)
    }

    getUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">My Loyalty Card</h1>
            <p className="text-sm text-muted-foreground">{user ? user.email : "Sign in to view rewards"}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {user ? (
          <div className="space-y-8">
            <StampCard userId={user.id} />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-bold mb-2">How It Works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Earn one stamp with every order. Collect 10 stamps to unlock a free drink of your choice.
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-2">Rewards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your rewards are automatically tracked. Redeem them anytime during your next visit.
                </p>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-4">
              <h3 className="font-bold mb-4">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Your order history will appear here</p>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Sign in to view your loyalty rewards</p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
