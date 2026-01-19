"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Gift, Zap, Search, Filter, Plus, Loader2, Download, RotateCcw } from "lucide-react"

interface LoyaltyCustomer {
  id: string
  email: string
  stamps: number
  reward_available: boolean
  last_stamp_date: string | null
  created_at: string
}

interface AddCustomerForm {
  email: string
  initialStamps: number
}

export function LoyaltyManagement() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<LoyaltyCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "ready" | "active">("all")
  const [stats, setStats] = useState({
    totalCustomers: 0,
    rewardsAvailable: 0,
    totalStamps: 0,
  })
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState<AddCustomerForm>({ email: "", initialStamps: 0 })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [recentStampCustomer, setRecentStampCustomer] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterType])

  // Fetch loyalty data
  const fetchLoyaltyData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("loyalty")
        .select("id, email, stamps, reward_available, last_stamp_date, created_at")
        .order("stamps", { ascending: false })

      if (error) throw error

      const formattedData = data.map((item: any) => ({
        id: item.id,
        email: item.email || "Unknown",
        stamps: item.stamps,
        reward_available: item.reward_available,
        last_stamp_date: item.last_stamp_date,
        created_at: item.created_at,
      }))

      setCustomers(formattedData)

      const rewardsAvailable = formattedData.filter((c) => c.reward_available).length
      const totalStamps = formattedData.reduce((sum, c) => sum + (c.stamps || 0), 0)

      setStats({ totalCustomers: formattedData.length, rewardsAvailable, totalStamps })
    } catch (error) {
      console.error("Error fetching loyalty data:", error)
      setMessage({ type: "error", text: "Failed to load loyalty data." })
    } finally {
      setIsLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers.filter((c) => c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterType === "ready") filtered = filtered.filter((c) => c.reward_available)
    else if (filterType === "active") filtered = filtered.filter((c) => c.stamps > 0 && !c.reward_available)
    setFilteredCustomers(filtered)
  }

  const resetCustomerReward = async (customerId: string) => {
    try {
      const { error } = await supabase.from("loyalty").update({ stamps: 0, reward_available: false }).eq("id", customerId)
      if (error) throw error
      setCustomers(customers.map((c) => (c.id === customerId ? { ...c, stamps: 0, reward_available: false } : c)))
      setMessage({ type: "success", text: "Reward reset successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error resetting reward:", error)
      setMessage({ type: "error", text: "Failed to reset reward." })
    }
  }

  const addStamp = async (customerId: string) => {
    try {
      const customer = customers.find((c) => c.id === customerId)
      if (!customer) return
      const newStamps = Math.min((customer.stamps || 0) + 1, 10)
      const rewardAvailable = newStamps >= 10
      const { error } = await supabase.from("loyalty").update({ stamps: newStamps, reward_available: rewardAvailable }).eq("id", customerId)
      if (error) throw error

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, stamps: newStamps, reward_available: rewardAvailable } : c,
        ),
      )

      // Animate the latest stamp
      setRecentStampCustomer(customerId)
      setTimeout(() => setRecentStampCustomer(null), 800)
      setMessage({ type: "success", text: "Stamp added!" })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error("Error adding stamp:", error)
      setMessage({ type: "error", text: "Failed to add stamp." })
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.email || !newCustomer.email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." })
      return
    }
    setIsAddingCustomer(true)
    try {
      await supabase.from("loyalty").insert({
        email: newCustomer.email,
        stamps: newCustomer.initialStamps,
        reward_available: newCustomer.initialStamps >= 10,
      })
      await fetchLoyaltyData()
      setNewCustomer({ email: "", initialStamps: 0 })
      setShowAddCustomer(false)
      setMessage({ type: "success", text: "Customer added successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error adding customer:", error)
      setMessage({ type: "error", text: "Failed to add customer." })
    } finally {
      setIsAddingCustomer(false)
    }
  }

  const bulkResetRewards = async () => {
    if (!confirm("Reset all ready rewards? This cannot be undone.")) return
    try {
      const { error } = await supabase.from("loyalty").update({ stamps: 0, reward_available: false }).eq("reward_available", true)
      if (error) throw error
      await fetchLoyaltyData()
      setMessage({ type: "success", text: "All ready rewards reset!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error bulk resetting:", error)
      setMessage({ type: "error", text: "Failed to reset rewards." })
    }
  }

  const exportData = () => {
    const csv = [
      ["Email", "Stamps", "Reward Available", "Last Stamp Date", "Created At"],
      ...customers.map((c) => [
        c.email,
        c.stamps,
        c.reward_available ? "Yes" : "No",
        c.last_stamp_date || "N/A",
        c.created_at,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `loyalty-customers-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalCustomers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready to Claim</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.rewardsAvailable}</p>
              </div>
              <Gift className="w-10 h-10 text-green-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stamps Earned</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.totalStamps}</p>
              </div>
              <Zap className="w-10 h-10 text-amber-600 opacity-30" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowAddCustomer(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          {stats.rewardsAvailable > 0 && (
            <Button variant="outline" onClick={bulkResetRewards} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Bulk Reset
            </Button>
          )}
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "ready", "active"] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {type === "all" ? "All" : type === "ready" ? "Ready" : "Active"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No customers found.</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                                <Card className="p-4 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg truncate">{customer.email}</CardTitle>
                      {customer.reward_available && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1"
                        >
                          <Gift className="w-3 h-3" />
                          Ready
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Visual Stamp Card with animation */}
                    <div className="relative">
                      <div className="h-16 bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-2 flex items-center justify-between">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isFilled = i < (customer.stamps || 0)
                          const isNewStamp = recentStampCustomer === customer.id && i === (customer.stamps || 1) - 1

                          return (
                            <motion.div
                              key={i}
                              initial={isNewStamp ? { scale: 0 } : {}}
                              animate={isNewStamp ? { scale: [0, 1.5, 1] } : {}}
                              transition={isNewStamp ? { duration: 0.5, ease: "easeOut" } : {}}
                              className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm border-2 ${
                                isFilled
                                  ? "bg-amber-500 text-white border-amber-600"
                                  : "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                              }`}
                            >
                              {isFilled ? "✓" : ""}
                            </motion.div>
                          )
                        })}
                      </div>
                      <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-amber-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {customer.stamps || 0}/10 stamps
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addStamp(customer.id)}
                        disabled={customer.stamps >= 10}
                        className="flex-1"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Add Stamp
                      </Button>
                      {customer.reward_available && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => resetCustomerReward(customer.id)}
                          className="flex-1"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddCustomer(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Customer
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddCustomer(false)} aria-label="Close modal">
                  <motion.div whileHover={{ rotate: 90 }} className="w-5 h-5">✕</motion.div>
                </Button>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Initial Stamps (0-10)</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newCustomer.initialStamps}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })
                      }
                      className="w-full h-2 bg-muted rounded-lg cursor-pointer"
                      aria-label="Initial stamps"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0</span>
                      <span className="font-bold">{newCustomer.initialStamps}/10</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full">
                  {isAddingCustomer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Customer
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
