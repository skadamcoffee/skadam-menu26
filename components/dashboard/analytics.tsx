"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { DollarSign, ShoppingCart, TrendingUp, CheckCircle, Loader2 } from "lucide-react" // Added icons for KPIs and loading

interface AnalyticsData {
  totalRevenue: number
  ordersCount: number
  avgOrderValue: number
  completedToday: number
  revenueByHour: Array<{ time: string; revenue: number }>
  topProducts: Array<{ name: string; count: number }>
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        // Get orders data
        const { data: orders, error } = await supabase.from("orders").select(`
            id,
            total_price,
            status,
            created_at,
            order_items(
              quantity,
              products(name)
            )
          `)

        if (error) throw error

        // Calculate analytics
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0
        const completedToday =
          orders?.filter((o) => {
            const orderDate = new Date(o.created_at)
            const today = new Date()
            return orderDate.toDateString() === today.toDateString() && (o.status === "served" || o.status === "ready")
          }).length || 0

        const avgOrderValue = orders && orders.length > 0 ? totalRevenue / orders.length : 0

        // Group by hour for revenue chart
        const hourlyData: { [key: string]: number } = {}
        orders?.forEach((order) => {
          const hour = new Date(order.created_at).getHours()
          const key = `${hour}:00`
          hourlyData[key] = (hourlyData[key] || 0) + (order.total_price || 0)
        })

        const revenueByHour = Object.entries(hourlyData)
          .map(([time, revenue]) => ({ time, revenue }))
          .sort((a, b) => Number.parseInt(a.time) - Number.parseInt(b.time))
          .slice(-8)

        // Top products
        const productCounts: { [key: string]: number } = {}
        orders?.forEach((order) => {
          order.order_items?.forEach((item) => {
            const name = item.products?.name || "Unknown"
            productCounts[name] = (productCounts[name] || 0) + item.quantity
          })
        })

        const topProducts = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setData({
          totalRevenue,
          ordersCount: orders?.length || 0,
          avgOrderValue,
          completedToday,
          revenueByHour,
          topProducts,
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Revenue: ${payload[0].value.toFixed(2)} د.ت`}</p>
        </div>
      )
    }
    return null
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Skeleton for KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
        {/* Skeleton for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-4 lg:col-span-2 animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </Card>
          <Card className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </Card>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ["#8B6F47", "#D4A574", "#C19A6B", "#B8956A", "#9D7E5D"]

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">
                {data.totalRevenue.toLocaleString()} د.ت
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center space-x-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Orders</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">{data.ordersCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Order Value</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">
                {data.avgOrderValue.toFixed(2)} د.ت
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed Today</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">{data.completedToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Hour */}
        <Card className="p-4 lg:col-span-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value.toFixed(0)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#8B6F47" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="p-4 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={false} // Hide labels on mobile for clarity
                >
                  {data.topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sold`, 'Count']} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    ></div>
                    <span className="text-muted-foreground truncate">{product.name}</span>
                  </div>
                  <span className="font-semibold">{product.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.ordersCount === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders data available yet. Start placing orders to see analytics!</p>
        </Card>
      )}
    </div>
  )
}
