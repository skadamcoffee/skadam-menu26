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
  const [isCollapsed, setIsCollapsed] = useState(false) // For desktop collapsible sidebar
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-card to-card/95 border-r border-border/50 shadow-xl z-40 transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${isCollapsed ? "md:w-16" : "md:w-64"}`}
        aria-label="Dashboard Navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              {!isCollapsed && (
                <h1 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors duration-200">
                  SKADAM Admin
                </h1>
              )}
            </Link>

            <div className="flex items-center gap-2">
              {!isCollapsed && <NotificationBadge />}

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:block p-2 hover:bg-muted rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? "rotate-90" : ""}`} />
              </button>

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
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsOpen(false) // Close sidebar on tab click
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary group ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:scale-102"
                    } ${isCollapsed ? "md:justify-center md:px-2" : ""}`}
                    title={isCollapsed ? tab.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? "text-primary-foreground" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 ${
                isCollapsed ? "md:justify-center md:px-2" : ""
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Toggle Button (outside sidebar) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 md:hidden p-3 bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-lg hover:bg-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary animate-in slide-in-from-left-2 ${
          isOpen ? "hidden" : ""
        }`}
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Spacer */}
      <div className={`hidden md:block transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
    </>
  )
}
