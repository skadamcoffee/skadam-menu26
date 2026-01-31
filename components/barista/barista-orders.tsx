"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CheckCircle2, Clock, Coffee, DollarSign, Users, Search, ChefHat, Package, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

interface OrderItem {
  id: string
  quantity: number
  products: { name: string }
  order_item_customizations?: Array<{
    customization_name: string
    customization_price: number
  }>
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

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  preparing: { label: "Preparing", icon: ChefHat, color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", icon: Package, color: "bg-green-100 text-green-800 border-green-200" },
  served: { label: "Served", icon: CheckCircle2, color: "bg-gray-100 text-gray-800 border-gray-200" },
}

export function BaristaOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [baristaName, setBaristaName] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    fetchBaristaName()
    fetchOrders()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("orders_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev])
          toast.success("New order received!")
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
    let filtered = orders.filter((o) =>
      o.table_number.toString().includes(searchTerm) ||
      o.order_number.toString().includes(searchTerm) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filterStatus !== "all") filtered = filtered.filter((o) => o.status === filterStatus)
    setFilteredOrders(filtered)
  }, [orders, filterStatus, searchTerm])

  const fetchBaristaName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("staff")
          .select("barista_name")
          .eq("email", user.email)
          .single()

        if (error) {
          // If no matching staff record, use "Barista" as fallback
          if (error.code === 'PGRST116') { // No rows returned
            setBaristaName("Barista")
          } else {
            throw error
          }
        } else {
          setBaristaName(data?.barista_name || "Barista")
        }
      }
    } catch (error) {
      console.error("Error fetching barista name:", error)
      setBaristaName("Barista")
    }
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          table_number,
          status,
          total_price,
          created_at,
          order_items (
            id,
            quantity,
            products (name),
            order_item_customizations (
              customization_name,
              customization_price
            )
          )
        `,
        )
        .neq("status", "served")
        .neq("status", "archived")
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error("[v0] Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)
      if (error) throw error

      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      await supabase.from("notifications").insert({
        order_id: orderId,
        type: "order_status",
        title: `Order #${orders.find((o) => o.id === orderId)?.order_number} Status Update`,
        message: `Your order status is now: ${newStatus}`,
        read: false,
      })

      toast.success(`Order status updated to ${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}`)
    } catch (error) {
      console.error("[v0] Error updating order:", error)
      toast.error("Failed to update order status")
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const getTotalItems = (order: Order) => order.order_items.reduce((sum, item) => sum + item.quantity, 0)

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl animate-bounce">☕</div>
          <p className="text-muted-foreground text-lg">Brewing up the latest orders...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Barista Dashboard - {baristaName}</h1>
          <p className="text-muted-foreground">Manage and track active orders in real-time</p>
        </div>
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Active Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">{orders.reduce((sum, order) => sum + order.total_price, 0).toFixed(2)} د.ت</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table, order #, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <label className="text-sm font-medium self-center">Filter:</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground opacity-30" />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-700">{stats.preparing}</p>
              </div>
              <ChefHat className="w-8 h-8 text-blue-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-4 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl md:text-3xl font-bold text-green-700">{stats.ready}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No active orders matching your filter</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredOrders.map((order, idx) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              const Icon = config.icon
              const isExpanded = expandedOrders.has(order.id)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    order.status === "ready" ? "ring-2 ring-green-200" : ""
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">Table {order.table_number}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(order.created_at), "MMM dd, HH:mm")}
                          </p>
                        </div>
                        <Badge className={`${config.color} border`}>
                          <div className="flex items-center gap-1">
                            <Icon className="w-5 h-5" />
                            {config.label}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quick Summary */}
                      <div className="flex justify-between items-center text-sm">
                        <span>{getTotalItems(order)} items</span>
                        <span className="font-semibold text-lg">{order.total_price.toFixed(2)} د.ت</span>
                      </div>

                      {/* Expandable Details */}
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(order.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                            <span className="text-sm font-medium">View Details</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
                          <Separator />
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium">{item.quantity}x {item.products?.name}</p>
                                    {item.order_item_customizations && item.order_item_customizations.length > 0 && (
                                      <div className="ml-4 text-xs text-slate-500 space-y-1 mt-1">
                                        {item.order_item_customizations.map((cust, idx) => (
                                          <div key={idx}>
                                            + {cust.customization_name} (+{cust.customization_price.toFixed(2)} د.ت)
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                                                        </div>
                                    
                                  </div>
                                
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {order.status === "pending" && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                            className="flex-1"
                            variant="default"
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="flex-1"
                            variant="default"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, "served")}
                            className="flex-1"
                            variant="default"
                          >
                            Mark Served
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteOrderId(order.id)}
                          aria-label={`Delete order #${order.order_number}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOrderId !== null} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && deleteOrder(deleteOrderId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
