"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, Package, Bell, X, Star, Send, Loader2, ChevronDown, ChevronUp, Share2, RotateCcw, MapPin, Calendar, CreditCard } from "lucide-react"
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
      image_url?: string
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
  { status: "pending", label: "Order Placed", icon: Clock, description: "We've received your order" },
  { status: "preparing", label: "Preparing", icon: ChefHat, description: "Our chefs are crafting your meal" },
  { status: "ready", label: "Ready for Pickup", icon: Package, description: "Your order is ready at the counter" },
  { status: "served", label: "Served", icon: CheckCircle2, description: "Enjoy your meal!" },
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
              products(name, price,image_url)
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
      <div className="min-h-screen bg-gradient-to-br from-[#faf6ef] via-[#e8dfd0] to-[#d4c4a8] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 mx-auto border-4 border-[#c9a96a] border-t-transparent rounded-full"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#2d1f14] font-heading">Brewing Your Order</h2>
            <p className="text-[#5c4033] text-sm">Please wait while we fetch your details...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf6ef] via-[#e8dfd0] to-[#d4c4a8] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="text-6xl">☕</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#2d1f14] font-heading">Order Not Found</h2>
            <p className="text-[#5c4033] text-sm">We couldn't locate your order. It might have been completed or removed.</p>
          </div>
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"}>
            <Button className="bg-gradient-to-r from-[#5c4033] to-[#c9a96a] hover:from-[#6b5040] hover:to-[#d4b87a] text-[#faf6ef] px-8 py-3 rounded-full font-semibold shadow-lg">
              Back to Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6ef] via-[#e8dfd0] to-[#d4c4a8] py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl sm:text-6xl"
          >
            ☕
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2d1f14] font-heading tracking-tight">
              Your Order Journey
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-[#5c4033]">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
            <p className="text-[#5c4033] font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence mode="popLayout">
          <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
            {notifications.slice(0, 3).map((notif, index) => {
              const config = notificationTypeConfig[notif.type as keyof typeof notificationTypeConfig] || notificationTypeConfig.info
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 400, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 400, scale: 0.8 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`${config.bg} ${config.border} border rounded-xl p-4 backdrop-blur-md shadow-xl pointer-events-auto`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="text-xl flex-shrink-0">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${config.text}`}>{notif.title}</p>
                      <p className={`text-xs ${config.text} opacity-90 mt-1 break-words`}>{notif.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                      className="p-1 hover:bg-white/20 rounded-full"
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-[#e0d5c4] shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#c9a96a] to-[#a68b5b] text-[#faf6ef] py-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Package className="w-6 h-6" />
                Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="w-full bg-[#e8dfd0] rounded-full h-3 shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-[#5c4033] to-[#c9a96a] h-3 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-[#5c4033] font-medium">
                  {statusSteps.map((step, index) => (
                    <span key={step.status} className={index <= currentStatusIndex ? "text-[#c9a96a]" : "text-[#a68b5b]"}>
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Steps */}
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon
                  const isComplete = isOrderComplete || index < currentStatusIndex
                  const isCurrent = !isOrderComplete && index === currentStatusIndex
                  const isActive = index <= currentStatusIndex

                  return (
                    <motion.div
                      key={step.status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      className="relative flex items-center gap-4"
                    >
                      {index !== statusSteps.length - 1 && (
                        <div
                          className={`absolute left-6 top-12 w-0.5 h-12 ${
                            isActive ? "bg-gradient-to-b from-[#c9a96a] to-[#a68b5b]" : "bg-[#e8dfd0]"
                          }`}
                        />
                      )}

                      <motion.div
                        animate={isCurrent ? { scale: 1.1, boxShadow: "0 0 20px rgba(201, 169, 106, 0.5)" } : { scale: 1, boxShadow: "none" }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold relative z-10 border-2 ${
                          isComplete
                            ? "bg-[#4ade80] border-[#22c55e] text-white"
                            : isActive
                              ? "bg-[#c9a96a] border-[#a68b5b] text-[#2d1f14] shadow-lg"
                              : "bg-[#e8dfd0] border-[#d4c4a8] text-[#5c4033]"
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base ${isActive ? "text-[#2d1f14]" : "text-[#5c4033]"}`}>
                          {step.label}
                        </p>
                        <p className="text-sm text-[#5c4033] mt-1">{step.description}</p>
                        <div className="text-xs mt-2">
                          {isComplete && (
                            <p className="text-[#22c55e] font-medium">✓ Completed</p>
                          )}
                          {isCurrent && (
                            <motion.p
                              animate={{ opacity: [0.6, 1, 0.6] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="text-[#c9a96a] font-semibold"
                            >
                              In progress...
                            </motion.p>
                          )}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-[#e0d5c4] shadow-xl">
            <CardHeader className="bg-gradient-to-r from-[#5c4033] to-[#c9a96a] text-[#faf6ef] py-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <CreditCard className="w-6 h-6" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                {order.order_items?.map((item, itemIndex) => {
                  const isExpanded = expandedItems.has(item.id)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + itemIndex * 0.1, duration: 0.4 }}
                      className="bg-[#f5f0e6] rounded-xl border border-[#e0d5c4] overflow-hidden shadow-sm"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#e8dfd0] to-[#d4c4a8] shadow-md">
                              {item.products?.image_url ? (
                                <img
                                  src={item.products.image_url}
                                  alt={item.products.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-3xl opacity-60 ${item.products?.image_url ? "hidden" : ""}`}>
                                ☕
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <span className="bg-[#c9a96a]/20 text-[#2d1f14] px-3 py-1 rounded-full text-sm font-semibold border border-[#c9a96a]/30">
                                  {item.quantity}x
                                </span>
                                <span className="text-[#2d1f14] font-bold text-lg break-words">{item.products?.name}</span>
                              </div>
                              <span className="text-[#c9a96a] font-bold text-lg">
                                {((item.products?.price || 0) * item.quantity).toFixed(2)} د.ت
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemExpansion(item.id)}
                            className="p-2 hover:bg-[#e8dfd0] rounded-full"
                            aria-label={isExpanded ? "Collapse item details" : "Expand item details"}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#5c4033]" /> : <ChevronDown className="w-5 h-5 text-[#5c4033]" />}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#e0d5c4]">
                                  {item.customizations.map((c, idx) => (
                                    <motion.span
                                      key={idx}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.1 + idx * 0.05 }}
                                      className="text-sm bg-[#e8dfd0] text-[#2d1f14] px-4 py-2 rounded-full border border-[#d4c4a8] shadow-sm"
                                    >
                                      {c.name} {c.price > 0 && <span className="text-[#c9a96a] ml-1 font-medium">+{c.price.toFixed(2)} د.ت</span>}
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

              <div className="border-t border-[#e0d5c4] pt-6 space-y-3">
                <div className="flex justify-between text-[#5c4033] text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {order.order_items
                      ?.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0)
                      .toFixed(2)}{" "}
                    د.ت
                  </span>
                </div>
                <div className="flex justify-between text-[#2d1f14] text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#c9a96a]">{order.total_price.toFixed(2)} د.ت</span>
                </div>
              </div>

              <div className="bg-[#f5f0e6] border border-[#e0d5c4] p-4 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#c9a96a]" />
                <div>
                  <p className="text-[#5c4033] text-sm font-medium">Table Number</p>
                  <p className="text-[#2d1f14] font-bold text-xl">#{order.table_number}</p>
                </div>
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
              className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4 py-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full sm:max-w-md border border-[#e0d5c4] max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#2d1f14] flex items-center gap-2 font-heading">
                    <Star className="w-5 h-5 text-[#c9a96a]" />
                    Rate Your Experience
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedbackModal(false)}
                    className="text-[#5c4033] hover:text-[#2d1f14] hover:bg-[#e8dfd0] rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {feedbackSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8 space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.6 }}
                      className="text-4xl"
                    >
                      🙏
                    </motion.div>
                    <p className="text-[#2d1f14] font-bold text-lg">Thank you for your feedback!</p>
                    <p className="text-[#5c4033] text-sm">Your thoughts help us serve you better.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[#2d1f14] text-sm font-semibold mb-4">How would you rate your order?</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFeedbackRating(rating)}
                            className={`p-3 rounded-full transition-all shadow-md ${
                              feedbackRating >= rating
                                ? "bg-[#c9a96a] text-[#2d1f14] shadow-[#c9a96a]/50"
                                : "bg-[#e8dfd0] text-[#5c4033] hover:bg-[#d4c4a8]"
                            }`}
                            aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
                          >
                            <Star className={`w-6 h-6 ${feedbackRating >= rating ? "fill-current" : ""}`} />
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-xs text-[#5c4033] text-center mt-3">
                        {feedbackRating > 0 && `${feedbackRating} star${feedbackRating !== 1 ? "s" : ""}`}
                      </p>
                    </div>

                    <div>
                      <label className="text-[#2d1f14] text-sm font-semibold mb-3 block">
                        Any comments? (Optional)
                      </label>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value.slice(0, 500))}
                        placeholder="Tell us what you loved or how we can improve..."
                        className="w-full bg-[#f5f0e6] border border-[#e0d5c4] rounded-xl px-4 py-3 text-[#2d1f14] placeholder-[#5c4033] focus:outline-none focus:border-[#c9a96a] focus:bg-white transition-all resize-none text-sm shadow-sm"
                        rows={4}
                      />
                      <p className="text-xs text-[#5c4033] mt-2">{feedbackComment.length}/500</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackModal(false)}
                        className="bg-transparent border-[#e0d5c4] text-[#5c4033] hover:bg-[#e8dfd0] hover:text-[#2d1f14] rounded-full"
                      >
                        Maybe Later
                      </Button>
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback || feedbackRating === 0}
                        className="bg-gradient-to-r from-[#5c4033] to-[#c9a96a] hover:from-[#6b5040] hover:to-[#d4b87a] text-[#faf6ef] rounded-full font-semibold shadow-lg disabled:opacity-60"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Feedback
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-[#e8dfd0] to-[#d4c4a8] hover:from-[#d4c4a8] hover:to-[#c9a96a] text-[#2d1f14] border border-[#e0d5c4] rounded-full font-semibold py-3 shadow-lg flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Order Again
            </Button>
          </Link>
          <Button
            onClick={shareOrder}
            variant="outline"
            className="flex-1 bg-white border-[#e0d5c4] text-[#5c4033] hover:bg-[#f5f0e6] hover:text-[#2d1f14] rounded-full font-semibold py-3 shadow-lg flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Order
          </Button>
          {order.status === "ready" && (
            <Button
              onClick={handleConfirmReceipt}
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white rounded-full font-semibold py-3 shadow-lg flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  I've Got It!
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
