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
  const [isCollapsed, setIsCollapsed] = useState(false)
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
    { id: "promotions", label: "Promotions", icon: Megaphone },
    { id: "promo-codes", label: "Promo Codes", icon: Ticket },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "staff", label: "Staff Management", icon: Users },
  ]

  return (
    <>
      {/* Mobile Backdrop with Creative Effect */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 bg-gradient-to-br from-black/80 via-[#5c4033]/20 to-[#c9a96a]/10 backdrop-blur-xl z-30 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          >
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#c9a96a]/30 rounded-full"
                  initial={{
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, -100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar with Innovative Design */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: -350, rotateY: -15 }}
            animate={{ x: 0, rotateY: 0 }}
            exit={{ x: -350, rotateY: -15 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-screen bg-gradient-to-br from-[#faf6ef] via-[#f0e9d8] to-[#e8dfd0] border-r border-[#d4c4a8] shadow-2xl z-40 md:hidden overflow-hidden"
            aria-label="Dashboard Navigation"
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="2" fill="#c9a96a" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
              </svg>
            </div>

            <div className="flex flex-col h-full relative z-10">
              {/* Header with Morphing Logo */}
              <div className="flex items-center justify-between p-6 border-b border-[#d4c4a8] bg-gradient-to-r from-[#c9a96a]/20 to-[#a68b5b]/20 backdrop-blur-sm">
                <Link href="/dashboard" className="flex items-center space-x-3 group">
                  <motion.div
                    whileHover={{ scale: 1.2, borderRadius: "50%" }}
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 bg-gradient-to-br from-[#5c4033] via-[#7a5a3d] to-[#c9a96a] rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="text-[#faf6ef] font-bold text-2xl absolute"
                    >
                      S
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-transparent to-[#faf6ef]/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                    className="text-2xl font-bold text-[#2d1f14] group-hover:text-[#5c4033] transition-colors duration-300 font-heading tracking-tight"
                  >
                    SKADAM Admin
                  </motion.h1>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-3 hover:bg-[#e8dfd0]/70 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] focus:ring-offset-2"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6 text-[#5c4033]" />
                </motion.button>
              </div>

              {/* Tabs with Staggered and Interactive Effects */}
              <div className="flex-1 overflow-y-auto p-6">
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.2,
                      },
                    },
                  }}
                >
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        variants={{
                          hidden: { opacity: 0, x: -50, rotateY: -20 },
                          visible: { opacity: 1, x: 0, rotateY: 0 },
                        }}
                        whileHover={{
                          scale: 1.05,
                          x: 10,
                          boxShadow: "0 10px 30px rgba(201, 169, 106, 0.3)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onTabChange(tab.id)
                          setIsOpen(false)
                        }}
                        className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] focus:ring-offset-2 group relative overflow-hidden ${
                          isActive
                            ? "bg-gradient-to-r from-[#5c4033] via-[#7a5a3d] to-[#c9a96a] text-[#faf6ef] shadow-2xl scale-105"
                            : "hover:bg-[#e8dfd0]/90 text-[#5c4033] hover:text-[#2d1f14] hover:shadow-lg"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                          transition={{ duration: 0.5 }}
                          className="relative z-10"
                        >
                          <Icon className={`w-6 h-6 transition-colors duration-300 flex-shrink-0 ${
                            isActive ? "text-[#faf6ef]" : "group-hover:text-[#c9a96a]"
                          }`} />
                        </motion.div>
                        <span className="truncate font-medium relative z-10">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTabMobile"
                            className="absolute inset-0 bg-gradient-to-r from-[#5c4033]/30 to-[#c9a96a]/30 rounded-2xl blur-sm"
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                          />
                        )}
                        {/* Hover Glow Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a96a]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100"
                          initial={false}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </motion.button>
                    )
                  })}
                </motion.div>
              </div>

              {/* Logout Button with Creative Hover */}
              <div className="p-6 border-t border-[#d4c4a8]">
                <motion.div
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500 transition-all duration-300 border-[#d4c4a8] text-[#5c4033] rounded-xl py-3 font-semibold shadow-sm relative overflow-hidden"
                    title="Sign Out"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <LogOut className="w-5 h-5" />
                    </motion.div>
                    <span className="font-medium">Sign Out</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent rounded-xl opacity-0 hover:opacity-100"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar with Enhanced Creativity */}
      <nav
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-gradient-to-br from-[#faf6ef] via-[#f0e9d8] to-[#e8dfd0] border-r border-[#d4c4a8] shadow-2xl z-40 flex-col transition-all duration-600 ease-in-out ${
          isCollapsed ? "w-28" : "w-84"
        }`}
        aria-label="Dashboard Navigation"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="w-full h-full bg-gradient-to-br from-[#c9a96a] to-[#5c4033]"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b border-[#d4c4a8] bg-gradient-to-r from-[#c9a96a]/20 to-[#a68b5b]/20 backdrop-blur-sm ${
            isCollapsed ? "justify-center" : ""
          }`}>
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <motion.div
                  whileHover={{ scale: 1.2, borderRadius: "50%" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 bg-gradient-to-br from-[#5c4033] via-[#7a5a3d] to-[#c9a96a] rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="text-[#faf6ef] font-bold text-2xl absolute"
                  >
                    S
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-transparent to-[#faf6ef]/20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                  className="text-2xl font-bold text-[#2d1f14] group-hover:text-[#5c4033] transition-colors duration-300 font-heading tracking-tight"
                >
                  SKADAM Admin
                </motion.h1>
              </Link>
            )}
            <div className="flex items-center gap-3">
              {!isCollapsed && <NotificationBadge />}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-3 hover:bg-[#e8dfd0]/70 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] focus:ring-offset-2"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className={`w-6 h-6 text-[#5c4033] transition-transform duration-300 ${isCollapsed ? "rotate-90" : ""}`} />
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto p-6">
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    variants={{
                      hidden: { opacity: 0, x: -50, rotateY: -20 },
                      visible: { opacity: 1, x: 0, rotateY: 0 },
                    }}
                    whileHover={{
                      scale: 1.05,
                      x: 10,
                      boxShadow: "0 10px 30px rgba(201, 169, 106, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] focus:ring-offset-2 group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-[#5c4033] via-[#7a5a3d] to-[#c9a96a] text-[#faf6ef] shadow-2xl scale-105"
                        : "hover:bg-[#e8dfd0]/90 text-[#5c4033] hover:text-[#2d1f14] hover:shadow-lg"
                    } ${isCollapsed ? "justify-center px-4 py-4" : ""}`}
                    title={isCollapsed ? tab.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                      className="relative z-10"
                    >
                      <Icon className={`w-6 h-6 transition-colors duration-300 flex-shrink-0 ${
                        isActive ? "text-[#faf6ef]" : "group-hover:text-[#c9a96a]"
                      }`} />
                    </motion.div>
                    {!isCollapsed && (
                      <span className="truncate font-medium relative z-10">{tab.label}</span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabDesktop"
                                            {isActive && (
                      <motion.div
                        layoutId="activeTabDesktop"
                        className="absolute inset-0 bg-gradient-to-r from-[#5c4033]/30 to-[#c9a96a]/30 rounded-2xl blur-sm"
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      />
                    )}
                    {/* Hover Glow Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a96a]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100"
                      initial={false}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.button>
                )
              })}
            </motion.div>
          </div>

          {/* Logout Button */}
          <div className="p-6 border-t border-[#d4c4a8]">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500 transition-all duration-300 border-[#d4c4a8] text-[#5c4033] rounded-xl py-3 font-semibold shadow-sm relative overflow-hidden ${
                  isCollapsed ? "justify-center px-4" : ""
                }`}
                title="Sign Out"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <LogOut className="w-5 h-5" />
                </motion.div>
                {!isCollapsed && <span className="font-medium">Sign Out</span>}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent rounded-xl opacity-0 hover:opacity-100"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Toggle Button with Creative Animation */}
      <motion.button
        initial={{ scale: 0, rotate: -180, y: 50 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 10, boxShadow: "0 10px 30px rgba(201, 169, 106, 0.4)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed top-6 left-6 z-50 md:hidden p-4 bg-[#faf6ef]/95 backdrop-blur-lg border border-[#d4c4a8] rounded-2xl shadow-xl hover:bg-[#e8dfd0]/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96a] focus:ring-offset-2 relative overflow-hidden ${
          isOpen ? "hidden" : ""
        }`}
        aria-label="Open navigation menu"
      >
        <Menu className="w-7 h-7 text-[#5c4033] relative z-10" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#c9a96a]/20 to-[#5c4033]/20 rounded-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>

      {/* Desktop Spacer */}
      <div className={`hidden md:block transition-all duration-600 ease-in-out ${isCollapsed ? "w-28" : "w-84"}`} />
    </>
  )
}
