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
import { motion, AnimatePresence } from "framer-motion"

interface DashboardNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // For desktop collapsible sidebar
  const router = useRouter()
  const supabase = createClient()

  // Debug logs (remove in production)
  console.log("DashboardNav - isOpen:", isOpen, "isCollapsed:", isCollapsed)

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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar (Animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-screen bg-gradient-to-b from-[#faf6ef] to-[#e8dfd0] border-r border-[#e0d5c4] shadow-2xl z-40 md:hidden"
            aria-label="Dashboard Navigation"
          >
            {/* Mobile Sidebar Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#e0d5c4] bg-gradient-to-r from-[#c9a96a]/10 to-[#a68b5b]/10">
                <Link href="/dashboard" className="flex items-center space-x-3 group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 bg-gradient-to-br from-[#5c4033] to-[#c9a96a] rounded-xl flex items-center justify-center shadow-md"
                  >
                    <span className="text-[#faf6ef] font-bold text-lg">S</span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold text-[#2d1f14] group-hover:text-[#5c4033] transition-colors duration-200 font-heading"
                  >
                    SKADAM Admin
                  </motion.h1>
                </Link>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#e8dfd0] rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96a]"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6 text-[#5c4033]" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {tabs.map((tab, index) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onTabChange(tab.id)
                          setIsOpen(false)
                        }}
                        className={`flex items-center gap-4 w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] group ${
                          isActive
                            ? "bg-gradient-to-r from-[#5c4033] to-[#c9a96a] text-[#faf6ef] shadow-lg scale-105"
                            : "hover:bg-[#e8dfd0]/80 text-[#5c4033] hover:text-[#2d1f14] hover:shadow-md"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ${
                          isActive ? "text-[#faf6ef]" : "group-hover:text-[#c9a96a]"
                        }`} />
                        <span className="truncate font-medium">{tab.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-[#e0d5c4]">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 border-[#e0d5c4] text-[#5c4033]"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Static, No Animation) */}
      <nav
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-gradient-to-b from-[#faf6ef] to-[#e8dfd0] border-r border-[#e0d5c4] shadow-2xl z-40 flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        aria-label="Dashboard Navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b border-[#e0d5c4] bg-gradient-to-r from-[#c9a96a]/10 to-[#a68b5b]/10 ${
            isCollapsed ? "justify-center" : ""
          }`}>
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-br from-[#5c4033] to-[#c9a96a] rounded-xl flex items-center justify-center shadow-md"
                >
                  <span className="text-[#faf6ef] font-bold text-lg">S</span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-[#2d1f14] group-hover:text-[#5c4033] transition-colors duration-200 font-heading"
                >
                  SKADAM Admin
                </motion.h1>
              </Link>
            )}

            <div className="flex items-center gap-2">
              {!isCollapsed && <NotificationBadge />}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-[#e8dfd0] rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96a]"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className={`w-5 h-5 text-[#5c4033] transition-transform duration-200 ${isCollapsed ? "rotate-90" : ""}`} />
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-4 w-full text-left px-4 py-4 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] group ${
                      isActive
                        ? "bg-gradient-to-r from-[#5c4033] to-[#c9a96a] text-[#faf6ef] shadow-lg scale-105"
                        : "hover:bg-[#e8dfd0]/80 text-[#5c4033] hover:text-[#2d1f14] hover:shadow-md"
                    } ${isCollapsed ? "justify-center px-3 py-3" : ""}`}
                    title={isCollapsed ? tab.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ${
                      isActive ? "text-[#faf6ef]" : "group-hover:text-[#c9a96a]"
                    }`} />
                    {!isCollapsed && (
                      <span className="truncate font-medium">{tab.label}</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-[#e0d5c4]">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 border-[#e0d5c4] text-[#5c4033] ${
                  isCollapsed ? "justify-center px-3" : ""
                }`}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 md:hidden p-3 bg-[#faf6ef]/90 backdrop-blur-md border border-[#e0d5c4] rounded-xl shadow-lg hover:bg-[#e8dfd0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] ${
          isOpen ? "hidden" : ""
        }`}
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-[#5c4033]" />
      </motion.button>

      {/* Desktop Spacer */}
      <div className={`hidden md:block transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`} />
    </>
  )
}
