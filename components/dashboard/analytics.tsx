"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

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

  if (isLoading || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </Card>
    )
  }

  const COLORS = ["#8B6F47", "#D4A574", "#C19A6B", "#B8956A", "#9D7E5D"]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">{data.totalRevenue.toFixed(2)} د.ت</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{data.ordersCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
          <p className="text-2xl font-bold">{data.avgOrderValue.toFixed(2)} د.ت</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Completed Today</p>
          <p className="text-2xl font-bold">{data.completedToday}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Hour */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-bold mb-4">Revenue by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#8B6F47" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card className="p-4">
          <h3 className="font-bold mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.topProducts}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {data.topProducts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-1 text-sm">
            {data.topProducts.map((product, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{product.name}</span>
                <span className="font-semibold">{product.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
