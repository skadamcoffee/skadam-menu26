"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, Package, Bell, X, Star, Send, Loader2, ChevronDown, ChevronUp, Share2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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
    customizations?: Array<{
      name: string
      price: number
    }>
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

const notificationTypeConfig = {
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-900 dark:text-blue-100", icon: "ℹ️" },
  success: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", text: "text-green-900 dark:text-green-100", icon: "✓" },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-900 dark:text-amber-100", icon: "⚠️" },
  alert: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", text: "text-red-900 dark:text-red-100", icon: "🔔" },
}

export function OrderTracking({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")

  const [order, setOrder] = useState<Order | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<Feedback | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const supabase = createClient()

  // Auto-dismiss toasts after 10 seconds
  React.useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((notif) => {
      return setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
      }, 10000)
    })

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [notifications])

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

        if (data?.order_items) {
          const itemsWithCustomizations = await Promise.all(
            data.order_items.map(async (item) => {
              // Fetch only the customizations actually selected for this order item
              const { data: orderCustomizations, error } = await supabase
                .from("order_item_customizations")
                .select(`
                  customization_id
                `)
                .eq("order_item_id", item.id)

              if (error) {
                console.error("Error fetching order customizations:", error)
                return { ...item, customizations: [] }
              }

              // If no customizations for this item, return empty array
              if (!orderCustomizations || orderCustomizations.length === 0) {
                return { ...item, customizations: [] }
              }

              // Get the actual customization details
              const customizationIds = orderCustomizations.map(oc => oc.customization_id)
              const { data: customizationDetails, error: detailsError } = await supabase
                .from("customizations")
                .select("name, price")
                .in("id", customizationIds)

              if (detailsError) {
                console.error("Error fetching customization details:", detailsError)
                return { ...item, customizations: [] }
              }

              return { ...item, customizations: customizationDetails || [] }
            })
          )

          setOrder((prev) =>
            prev ? { ...prev, order_items: itemsWithCustomizations } : prev
          )
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast.error("Failed to load order")
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
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("order_id", orderId)
          .limit(1)

        if (error) throw error
        if (data && data.length > 0) {
          setOrderFeedback(data[0])
        } else if (order?.status === "served") {
          setShowFeedbackModal(true)
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
          if (payload.new.status === "served" && !orderFeedback) {
            setShowFeedbackModal(true)
          }
        }
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
        }
      )
      .subscribe()

    return () => {
      orderSubscription.unsubscribe()
      notificationSubscription.unsubscribe()
    }
  }, [orderId, orderFeedback])

  const handleConfirmReceipt = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.rpc("update_order_to_served", {
        order_id_param: orderId,
      })

      if (error) throw error

      toast.success("Order Complete! Thank you! You can now leave feedback for your order.")
      setShowFeedbackModal(true)
    } catch (error: any) {
      console.error("Error confirming receipt:", error)
      toast.error(error.message || "Could not update the order. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast.error("Please rate your order")
      return
    }

    setIsSubmittingFeedback(true)
    try {
      const { error } = await supabase.from("feedback").insert({
        order_id: orderId,
        rating: feedbackRating,
        comment: feedbackComment,
      })

      if (error) throw error

      setFeedbackSubmitted(true)
      setTimeout(() => {
        setShowFeedbackModal(false)
        setFeedbackSubmitted(false)
        setFeedbackRating(0)
        setFeedbackComment("")
      }, 2000)
    } catch (error: any) {
      console.error("Error submitting feedback:", error)
      toast.error("Could not submit feedback. Please try again.")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.has(itemId) ? next.delete(itemId) : next.add(itemId)
      return next
    })
  }

  const shareOrder = async () => {
    const url = window.location.href
    try {
      await navigator.share({ title: "My Order", url })
    } catch {
      await navigator.clipboard.writeText(url)
      toast.success("Order link copied to clipboard!")
    }
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order?.status)
  const isOrderComplete = order?.status === "served"
  const progressPercentage = isOrderComplete ? 100 : ((currentStatusIndex + 1) / statusSteps.length) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-5xl sm:text-6xl"
          >
            ☕
          </motion.div>
          <p className="text-slate-400 text-sm sm:text-base">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <Card className="p-8 text-center max-w-md bg-slate-800 border-slate-700">
          <p className="text-slate-400 mb-4">Order not found</p>
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Back to Menu</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-8"
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Your Order
          </motion.h1>
          <p className="text-sm sm:text-base text-slate-400">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs sm:text-sm text-slate-500">
            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </motion.div>

        {/* Notifications Toast Container */}
        <AnimatePresence mode="popLayout">
          <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
            {notifications.slice(0, 3).map((notif, index) => {
              const config = notificationTypeConfig[notif.type as keyof typeof notificationTypeConfig] || notificationTypeConfig.info
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 400, y: 0 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 400, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`${config.bg} ${config.border} border rounded-lg p-4 backdrop-blur-md shadow-lg pointer-events-auto`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="text-xl flex-shrink-0">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${config.text}`}>{notif.title}</p>
                      <p className={`text-xs ${config.text} opacity-90 mt-0.5 break-words`}>{notif.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                      className="p-1 hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 sm:p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                            {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              {/* Status Steps */}
              <div className="space-y-3 sm:space-y-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon
                  const isComplete = isOrderComplete || index < currentStatusIndex
                  const isCurrent = !isOrderComplete && index === currentStatusIndex
                  const isActive = index <= currentStatusIndex

                  return (
                    <motion.div
                      key={step.status}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="relative"
                    >
                      {index !== statusSteps.length - 1 && (
                        <div
                          className={`absolute left-5 top-12 w-0.5 h-8 ${
                            isActive ? "bg-gradient-to-b from-blue-500 to-blue-400" : "bg-slate-600"
                          }`}
                        />
                      )}

                      <div className="flex items-center gap-2 sm:gap-4">
                        <motion.div
                          animate={isCurrent ? { scale: 1.1 } : { scale: 1 }}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold relative z-10 ${
                            isComplete
                              ? "bg-green-500/20 border border-green-400 text-green-400"
                              : isActive
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                                : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {isComplete ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${isActive ? "text-white" : "text-slate-400"}`}>
                            {step.label}
                          </p>
                          <div className="text-xs mt-1">
                            {isComplete && (
                              <p className="text-green-400">Completed</p>
                            )}
                            {isCurrent && (
                              <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-blue-400 font-semibold"
                              >
                                In progress
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 sm:p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-3">
                {order.order_items?.map((item, itemIndex) => {
                  const isExpanded = expandedItems.has(item.id)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + itemIndex * 0.05 }}
                      className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden"
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                              <div className="w-full h-full flex items-center justify-center text-2xl opacity-60">☕</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="text-white font-semibold text-sm sm:text-base break-words">{item.products?.name}</span>
                              </div>
                              <span className="text-blue-400 font-bold text-sm sm:text-base">
                                {((item.products?.price || 0) * item.quantity).toFixed(2)} د.ت
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemExpansion(item.id)}
                            className="p-2 hover:bg-slate-600"
                            aria-label={isExpanded ? "Collapse item details" : "Expand item details"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-600/50">
                                  {item.customizations.map((c, idx) => (
                                    <motion.span
                                      key={idx}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.25 + idx * 0.05 }}
                                      className="text-xs bg-slate-600/50 text-slate-300 px-3 py-1.5 rounded-full border border-slate-500/50"
                                    >
                                      {c.name} {c.price > 0 && <span className="text-blue-400 ml-1">+{c.price.toFixed(2)} د.ت</span>}
                                    </motion.span>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="border-t border-slate-600/50 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-slate-300 text-xs sm:text-sm">
                  <span>Subtotal</span>
                  <span>
                    {order.order_items
                      ?.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0)
                      .toFixed(2)}{" "}
                    د.ت
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 text-xs sm:text-sm">
                  <span>Total</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-400">{order.total_price.toFixed(2)} د.ت</span>
                </div>
              </div>

              <div className="bg-slate-700/50 border border-slate-600/50 p-4 rounded-lg">
                <p className="text-slate-400 text-xs sm:text-sm">
                  Table Number:{" "}
                  <span className="font-semibold text-white text-base sm:text-lg bg-blue-500/20 px-3 py-1 rounded inline-block ml-2">
                    #{order.table_number}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedbackModal && !orderFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 z-50 backdrop-blur-sm px-3 py-4 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 w-full sm:max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Share Your Feedback
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedbackModal(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {feedbackSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6 sm:py-8 space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl sm:text-4xl mx-auto"
                    >
                      🙏
                    </motion.div>
                    <p className="text-white font-semibold text-base sm:text-lg">Thank you for your feedback!</p>
                    <p className="text-slate-400 text-xs sm:text-sm">Your input helps us improve.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <p className="text-slate-300 text-xs sm:text-sm font-semibold mb-3">How was your order?</p>
                      <div className="flex justify-center gap-1 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFeedbackRating(rating)}
                            className={`p-2 rounded-full transition-all ${
                              feedbackRating >= rating ? "bg-yellow-500 text-black" : "bg-slate-600 text-slate-400 hover:bg-slate-500"
                            }`}
                            aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
                          >
                            <Star className={`w-6 h-6 ${feedbackRating >= rating ? "fill-current" : ""}`} />
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 text-center mt-2">
                        {feedbackRating > 0 && `${feedbackRating} star${feedbackRating !== 1 ? "s" : ""}`}
                      </p>
                    </div>

                    <div>
                      <label className="text-slate-300 text-xs sm:text-sm font-semibold mb-2 block">
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value.slice(0, 500))}
                        placeholder="Tell us what you think..."
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-all resize-none text-sm"
                        rows={3}
                      />
                      <p className="text-xs text-slate-500 mt-1">{feedbackComment.length}/500</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackModal(false)}
                        className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback || feedbackRating === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} className="flex-1">
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reorder
            </Button>
          </Link>
          <Button
            onClick={shareOrder}
            variant="outline"
            className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Order
          </Button>
          {order.status === "ready" && (
            <Button
              onClick={handleConfirmReceipt}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Receipt
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
