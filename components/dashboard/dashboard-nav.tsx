'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { NotificationBadge } from "@/components/notifications/notification-badge"

interface DashboardNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "feedback", label: "Feedback" },
    { id: "analytics", label: "Analytics" },
    { id: "menu", label: "Menu" },
    { id: "qr", label: "QR Codes" },
    { id: "loyalty", label: "Loyalty" },
    { id: "promotions", label: "Promotions" },
    { id: "promo-codes", label: "Promo Codes" },
    { id: "customizations", label: "Customizations" },
    { id: "settings", label: "Settings" },
    { id: "staff", label: "Staff Management" },
  ]

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-primary">SKADAM Admin</h1>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBadge />

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-muted rounded transition"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`${
            isOpen ? "block" : "hidden"
          } md:flex md:items-center md:gap-2 bg-card md:bg-transparent rounded md:rounded-none shadow md:shadow-none p-4 md:p-0`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                setIsOpen(false)
              }}
              className={`w-full md:w-auto text-left md:text-center px-4 py-3 md:py-2 rounded text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
