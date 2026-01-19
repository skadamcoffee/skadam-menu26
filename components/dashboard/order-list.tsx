"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, ChefHat, Package, CheckCircle2, Trash2, Search, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
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
    id: string
    quantity: number
    products: { name: string }
    order_item_customizations?: Array<{
      customization_name: string
      customization_price: number
    }>
  }>
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  preparing: { label: "Preparing", icon: ChefHat, color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", icon: Package, color: "bg-green-100 text-green-800 border-green-200" },
  served: { label: "Served", icon: CheckCircle2, color: "bg-gray-100 text-gray-800 border-gray-200" },
  cancelled: { label: "Cancelled", icon: Clock, color: "bg-red-100 text-red-800 border-red-200" },
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
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
              id,
              quantity,
              products(name),
              order_item_customizations(
                customization_name,
                customization_price
              )
            )
          `)
          .order("created_at", { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast.error("Failed to load orders")
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
          toast.success("New order received!")
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o)))
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = orders.filter((o) =>
      o.table_number.toString().includes(searchTerm) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (statusFilter !== "all") filtered = filtered.filter((o) => o.status === statusFilter)
    setFilteredOrders(filtered)
  }, [orders, statusFilter, searchTerm])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error
      toast.success(`Order status updated to ${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}`)
    } catch (error) {
      console.error("Error updating order:", error)
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

  const exportOrders = () => {
    const csv = [
      ["Table", "Status", "Total Price", "Created At", "Items"],
      ...filteredOrders.map((o) => [
        o.table_number,
        o.status,
        o.total_price.toFixed(2),
        o.created_at,
        o.order_items?.map((item) => `${item.quantity}x ${item.products?.name}`).join("; ") || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Orders exported!")
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Order Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage customer orders in real-time</p>
        </div>
        {filteredOrders.length > 0 && (
          <Button variant="outline" onClick={exportOrders}>
            <Download className="w-4 h-4 mr-2" />
            Export Orders
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <label className="text-sm font-medium self-center">Filter:</label>
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
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-16 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found matching your criteria.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order, index) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              const Icon = config.icon
              const isExpanded = expandedOrder === order.id

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <h3 className="font-bold text-lg">Table {order.table_number}</h3>
                              <Badge className={`${config.color} border`}>{config.label}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="md:hidden"
                              aria-label={isExpanded ? "Collapse order details" : "Expand order details"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                          <AnimatePresence>
                            {(isExpanded || window.innerWidth >= 768) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="text-sm text-muted-foreground mb-2 space-y-1">
                                  {order.order_items?.map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                      <span>{item.quantity}x {item.products?.name}</span>
                                      {item.order_item_customizations && item.order_item_customizations.length > 0 && (
                                        <div className="ml-4 text-xs text-slate-500 space-y-1">
                                          {item.order_item_customizations.map((cust, idx) => (
                                            <div key={idx}>
                                              + {cust.customization_name} (+{cust.customization_price.toFixed(2)} د.ت)
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
  <p className="font-bold text-lg md:text-xl">
    {order.total_price.toFixed(2)} د.ت
  </p>
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <Select value={order.status} onValueChange={(status) => updateOrderStatus(order.id, status)}>
      <SelectTrigger className="w-full sm:w-32">
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
      className="w-full sm:w-auto"
      aria-label={`Delete order for table ${order.table_number}`}
    >
      <Trash2 className="w-4 h-4 mr-1" />
      Delete
    </Button>
  </div>
</div>
</CardContent>
</Card>
</motion.div>
) })}
</AnimatePresence>
) })}
</div>

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
      
) }
