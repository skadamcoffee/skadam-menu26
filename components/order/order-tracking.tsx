"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, Package, AlertCircle } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { FeedbackForm } from "@/components/feedback/feedback-form"
import { useToast } from "@/hooks/use-toast"

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
  type?: "info" | "success" | "warning" | "error"
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
  const [toasts, setToasts] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<Feedback | null>(null)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

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
        if (data.status === "served") setIsFeedbackModalOpen(true)
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
        if (data) {
          setNotifications(data)
          data.forEach(addToast)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("order_id", orderId)
          .limit(1)
        if (error) throw error
        if (data && data.length > 0) {
          setOrderFeedback(data[0])
          setIsFeedbackModalOpen(false)
        }
      } catch (err) {
        console.error("Error fetching feedback:", err)
      }
    }

    fetchOrder()
    fetchNotifications()
    fetchFeedback()

    // Real-time subscriptions
    const orderSub = supabase
      .channel(`orders:${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => setOrder((prev) => (prev ? { ...prev, ...payload.new } : null)),
      )
      .subscribe()

    const notifSub = supabase
      .channel(`notifications:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          addToast(newNotif)
        },
      )
      .subscribe()

    return () => {
      orderSub.unsubscribe()
      notifSub.unsubscribe()
    }
  }, [orderId])

  const addToast = (notif: Notification) => {
    setToasts((prev) => [notif, ...prev])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== notif.id)), 5000)
  }

  const handleConfirmReceipt = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.rpc("update_order_to_served", { order_id_param: orderId })
      if (error) throw error
      toast({ title: "Order Complete!", description: "Thank you! You can leave feedback now." })
      setIsFeedbackModalOpen(true)
    } catch (err: any) {
      console.error("Error confirming receipt:", err)
      toast({ title: "Error", description: err.message || "Could not update order.", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

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
    <div className="min-h-screen bg-background py-8 relative">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Your Order</h1>
          <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
        </div>

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

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Menu
            </Button>
          </Link>
          {order.status === "ready" && (
            <Button className="flex-1" onClick={handleConfirmReceipt} disabled={isUpdating}>
              {isUpdating ? "Confirming..." : "Confirm Receipt"}
            </Button>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toastNotif) => (
            <motion.div
              key={toastNotif.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="flex items-start gap-2 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg w-80 border border-yellow-600"
            >
              <AlertCircle className="w-5 h-5 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">{toastNotif.message}</p>
                <p className="text-[10px] text-yellow-200 mt-1">
                  {new Date(toastNotif.created_at).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Animated Feedback Modal */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-96 shadow-xl flex flex-col items-center space-y-4 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setIsFeedbackModalOpen(false)}
              >
                ✕
              </button>
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.2, 1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-6xl"
              >
                {emojiMap[3] /* Default happy emoji */}
              </motion.div>
              <h2 className="text-2xl font-bold text-center">How was your order?</h2>
              <p className="text-sm text-muted-foreground text-center">
                Rate your experience and leave a comment (optional)
              </p>

              <FeedbackForm orderId={orderId} onSubmit={() => setIsFeedbackModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
