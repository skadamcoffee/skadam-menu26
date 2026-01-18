'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { OrderList } from '@/components/dashboard/order-list'
import { Analytics } from '@/components/dashboard/analytics'
import { MenuManagement } from '@/components/dashboard/menu-management'
import { LoyaltyManagement } from '@/components/dashboard/loyalty-management'
import { QRGenerator } from '@/components/dashboard/qr-generator'
import { PromotionsManagement } from '@/components/dashboard/promotions-management'
import { PromoCodesManagement } from '@/components/dashboard/promo-codes-management'
import { StoreSettings } from '@/components/dashboard/store-settings'
import { StaffManagement } from '@/components/dashboard/staff-management'
import { FeedbackManagement } from '@/components/dashboard/feedback-management'
import { CustomizationsManagement } from '@/components/dashboard/customizations-management'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders")
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
      } else {
        // Check if user is admin
        const { data: userData } = await supabase.from("users").select("role").eq("id", authUser.id).single()

        if (userData?.role !== "admin") {
          router.push("/")
        } else {
          setUser(authUser)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "orders" && <OrderList />}
        {activeTab === "feedback" && <FeedbackManagement />} 
        {activeTab === "analytics" && <Analytics />}
        {activeTab === "menu" && <MenuManagement />}
        {activeTab === "customizations" && <CustomizationsManagement />}
        {activeTab === "qr" && <QRGenerator />}
        {activeTab === "loyalty" && <LoyaltyManagement />}
        {activeTab === "promotions" && <PromotionsManagement />}
        {activeTab === "promo-codes" && <PromoCodesManagement />}
        {activeTab === "settings" && <StoreSettings />}
        {activeTab === "staff" && <StaffManagement />}
      </main>
    </div>
  )
}
