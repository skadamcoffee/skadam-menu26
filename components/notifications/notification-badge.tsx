"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel("notifications_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", notificationId)

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-12 w-80 z-50"
          >
            <Card className="bg-background border shadow-lg max-h-96 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Notifications List */}
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
