"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, Package, Bell } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { FeedbackForm } from "@/components/feedback/feedback-form"

interface Order {
  id: string
  status: string
  total_price: number
  created_at: string
  table_number: number
  order_items: Array<{
    id: string
    quantity: number
    product_id: string
    products: {
      name: string
      price: number
    }
  }>
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
}

interface Feedback {
  id: string
  order_id: string
  rating: number
  comment: string
}

const statusSteps = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "ready", label: "Ready for Pickup", icon: Package },
  { status: "served", label: "Served", icon: CheckCircle2 },
]

const emojiMap: { [key: number]: string } = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "🤩",
}

export function OrderTracking({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")

  const [order, setOrder] = useState<Order | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [orderFeedback, setOrderFeedback] = useState<Feedback | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            status,
            total_price,
            created_at,
            table_number,
            order_items(
              id,
              quantity,
              product_id,
              products(name, price)
            )
          `)
          .eq("id", orderId)
          .single()

        if (error) throw error
        setOrder(data)
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setNotifications(data || [])
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase.from("feedback").select("*").eq("order_id", orderId).limit(1)

        if (error) throw error
        if (data && data.length > 0) {
          setOrderFeedback(data[0])
        }
      } catch (err) {
        console.error("Error fetching feedback:", err)
      }
    }

    fetchOrder()
    fetchNotifications()
    fetchFeedback()

    const orderSubscription = supabase
      .channel(`orders:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null))
        },
      )
      .subscribe()

    const notificationSubscription = supabase
      .channel(`notifications:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        },
      )
      .subscribe()

    return () => {
      orderSubscription.unsubscribe()
      notificationSubscription.unsubscribe()
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"}>
            <Button>Back to Menu</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order.status)

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Your Order</h1>
          <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <Bell className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <h3 className="font-semibold">Updates</h3>
            </div>
            <AnimatePresence>
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-sm p-2 bg-background/50 rounded border border-border"
                  >
                    <p className="font-medium text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="p-6">
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = index <= currentStatusIndex
              const isComplete = index < currentStatusIndex

              return (
                <div key={step.status} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {isComplete && <p className="text-xs text-muted-foreground">Completed</p>}
                    {isActive && index === currentStatusIndex && (
                      <p className="text-xs text-primary font-semibold animate-pulse">In progress</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg">Order Details</h2>

          <div className="space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.products?.name}
                </span>
                <span className="font-medium">{((item.products?.price || 0) * item.quantity).toFixed(2)} د.ت</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{order.total_price.toFixed(2)} د.ت</span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded text-sm">
            <p className="text-muted-foreground">
              Table Number: <span className="font-semibold text-foreground">{order.table_number}</span>
            </p>
          </div>
        </Card>

        {/* Feedback Section */}
        {order.status === "served" && !orderFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <FeedbackForm orderId={orderId} />
          </motion.div>
        )}

        {/* Submitted Feedback */}
        {orderFeedback && (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="text-center space-y-2">
              <p className="text-4xl">{emojiMap[orderFeedback.rating] || "😊"}</p>
              <p className="font-semibold">Thank you for your feedback!</p>
              {orderFeedback.comment && (
                <p className="text-sm text-muted-foreground italic">"{orderFeedback.comment}"</p>
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Menu
            </Button>
          </Link>
          {order.status === "ready" && <Button className="flex-1">Notify Staff</Button>}
        </div>
      </div>
    </div>
  )
}
