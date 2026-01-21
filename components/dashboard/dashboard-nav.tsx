'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Menu,
  X,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Utensils,
  Palette,
  QrCode,
  Heart,
  Megaphone,
  Ticket,
  Settings,
  Users
} from "lucide-react"
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
    router.push("/auth/login")
  }

  const tabs = [
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "customizations", label: "Customizations", icon: Palette },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "loyalty", label: "Loyalty", icon: Heart },
    { id: "promotions", label: "Promotions", icon: Megaphone },
    { id: "promo-codes", label: "Promo Codes", icon: Ticket },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "staff", label: "Staff Management", icon: Users },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
                SKADAM Admin
              </h1>
            </Link>

            <div className="flex items-center gap-3">
              <NotificationBadge />

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsOpen(false) // Close sidebar on tab click
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Toggle Button (outside sidebar) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 md:hidden p-2 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
          isOpen ? "hidden" : ""
        }`}
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}
