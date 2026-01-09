"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CheckCircle2, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  notes: string
  product_name: string
  product_price: number
}

interface Order {
  id: string
  order_number: number
  status: string
  table_number: number
  total_price: number
  created_at: string
  order_items: OrderItem[]
}

export function BaristaOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()

    const subscription = supabase
      .channel("orders_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            quantity,
            notes,
            products (name, price)
          )
        `
        )
        .neq("status", "served")
        .neq("status", "archived")
        .order("created_at", { ascending: false })

      if (error) throw error

      const processedOrders = data?.map((order: any) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          product_name: item.products?.name || "Unknown",
          product_price: item.products?.price || 0,
        })),
      }))

      setOrders(processedOrders || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Could not fetch orders.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) {
        console.error("Supabase update error:", error)
        throw new Error(error.message)
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}.`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Update Failed",
        description: "The order status could not be updated. See console for details.",
        variant: "destructive",
      })
    }
  }

  const getFormattedTime = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "HH:mm")
    } catch (error) {
      console.error("Invalid date format:", dateString, error)
      return "Invalid time"
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-gray-100 text-gray-800",
  }

  const getStatusIcon = (status: string) => {
    return status === "ready" ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold">Active Orders</h2>
        <p className="text-muted-foreground">Total: {orders.length} orders</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No active orders</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order, idx) => {
            // Defensive coding: a fallback for status to prevent render crash
            const currentStatus = order.status || "pending"

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                    currentStatus === "ready" ? "border-l-4 border-l-green-500" : ""
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-primary">#{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">Table {order.table_number}</p>
                    </div>
                    <Badge className={statusColors[currentStatus] || "bg-gray-100"}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(currentStatus)}
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </div>
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-6 bg-muted p-4 rounded-lg">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          {item.notes && <p className="text-xs text-muted-foreground italic">Note: {item.notes}</p>}
                        </div>
                        <Badge variant="outline">x{item.quantity}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Order Time */}
                  <p className="text-xs text-muted-foreground mb-4">
                    Ordered: {getFormattedTime(order.created_at)}
                  </p>

                  {/* Status Buttons */}
                  <div className="flex gap-2">
                    {currentStatus === "pending" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="flex-1"
                        variant="default"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {currentStatus === "preparing" && (
                      <Button onClick={() => updateOrderStatus(order.id, "ready")} className="flex-1" variant="default">
                        Mark Ready
                      </Button>
                    )}
                    {currentStatus === "ready" && (
                      <Button onClick={() => updateOrderStatus(order.id, "served")} className="flex-1" variant="default">
                        Mark Served
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
