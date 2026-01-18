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

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (statusFilter === "all") setFilteredOrders(orders)
    else setFilteredOrders(orders.filter((o) => o.status === statusFilter))
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total },
          { label: "Pending", value: stats.pending, color: "text-yellow-700 bg-yellow-50" },
          { label: "Preparing", value: stats.preparing, color: "text-blue-700 bg-blue-50" },
          { label: "Ready", value: stats.ready, color: "text-green-700 bg-green-50" },
        ].map((stat, i) => (
          <Card key={i} className={`p-4 rounded-xl shadow-sm ${stat.color ?? ""}`}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
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
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-10 text-center">Loading orders…</Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-10 text-center">No orders found</Card>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
            const Icon = config.icon

            return (
              <Card
                key={order.id}
                className="p-4 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">Table {order.table_number}</h3>
                      <Badge className={`rounded-full ${config.color}`}>{config.label}</Badge>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      {order.order_items?.map((item, i) => (
                        <div key={i}>
                          <span className="font-medium">{item.quantity}×</span> {item.products?.name}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-xl font-bold">{order.total_price.toFixed(2)} د.ت</p>

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
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteOrderId(order.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOrderId !== null} onOpenChange={(o) => !o && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && deleteOrder(deleteOrderId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
