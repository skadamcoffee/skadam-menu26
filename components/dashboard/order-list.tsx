"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, ChefHat, Package, CheckCircle2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface Order {
  id: string
  table_number: number
  status: string
  total_price: number
  created_at: string
  order_items: Array<{
    quantity: number
    products: { name: string }
  }>
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  preparing: { label: "Preparing", icon: ChefHat, color: "bg-blue-100 text-blue-800" },
  ready: { label: "Ready", icon: Package, color: "bg-green-100 text-green-800" },
  served: { label: "Served", icon: CheckCircle2, color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", icon: Clock, color: "bg-red-100 text-red-800" },
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            table_number,
            status,
            total_price,
            created_at,
            order_items(
              quantity,
              products(name)
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()

    // Subscribe to order updates
    const subscription = supabase
      .channel("orders_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev])
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o)))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter((o) => o.status === statusFilter))
    }
  }, [orders, statusFilter])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }

  const deleteOrder = async (orderId: string) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId)

      if (error) throw error

      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      toast.success("Order deleted successfully")
      setDeleteOrderId(null)
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Failed to delete order")
    } finally {
      setIsDeleting(false)
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <p className="text-xs text-muted-foreground mb-1">Preparing</p>
          <p className="text-2xl font-bold text-blue-700">{stats.preparing}</p>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-xs text-muted-foreground mb-1">Ready</p>
          <p className="text-2xl font-bold text-green-700">{stats.ready}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Filter by status:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="served">Served</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading orders...</p>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
            const Icon = config.icon

            return (
              <Card key={order.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5" />
                      <h3 className="font-bold">Table {order.table_number}</h3>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {order.order_items?.map((item, i) => (
                        <div key={i}>
                          {item.quantity}x {item.products?.name}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-lg">{order.total_price.toFixed(2)} د.ت</p>
                    <div className="flex gap-2">
                      <Select value={order.status} onValueChange={(status) => updateOrderStatus(order.id, status)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="served">Served</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteOrderId(order.id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <AlertDialog open={deleteOrderId !== null} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && deleteOrder(deleteOrderId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
