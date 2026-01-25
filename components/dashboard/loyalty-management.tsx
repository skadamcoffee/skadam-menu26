"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Gift, Zap, Search, Filter, Plus, Loader2, Download, RotateCcw, Coffee } from "lucide-react"

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
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-4 rounded-xl border-2 shadow-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                : "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <Gift className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3">
          <Coffee className="w-8 h-8 text-amber-600" />
          Loyalty Program
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your customers' stamps and rewards</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Customers</p>
                <p className="text-3xl md:text-4xl font-bold">{stats.totalCustomers}</p>
              </div>
              <Users className="w-12 h-12 opacity-80" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Ready to Claim</p>
                <p className="text-3xl md:text-4xl font-bold">{stats.rewardsAvailable}</p>
              </div>
              <Gift className="w-12 h-12 opacity-80" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Stamps Earned</p>
                <p className="text-3xl md:text-4xl font-bold">{stats.totalStamps}</p>
              </div>
              <Zap className="w-12 h-12 opacity-80" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowAddCustomer(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
            <Plus className="w-5 h-5" />
            Add Customer
          </Button>
          {stats.rewardsAvailable > 0 && (
            <Button variant="outline" onClick={bulkResetRewards} className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-3 rounded-lg">
              <RotateCcw className="w-5 h-5" />
              Bulk Reset
            </Button>
          )}
          <Button variant="outline" onClick={exportData} className="gap-2 border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-6 py-3 rounded-lg">
            <Download className="w-5 h-5" />
            Export
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "ready", "active"] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="lg"
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterType === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {type === "all" ? "All" : type === "ready" ? "Ready" : "Active"}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full text-center py-16"
            >
              <Users className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">No customers found.</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="p-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-800 border-0 rounded-xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200 truncate">{customer.email}</CardTitle>
                      {customer.reward_available && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="px-3 py-1 text-sm font-bold bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center gap-2 shadow-md"
                        >
                          <Gift className="w-4 h-4" />
                          Reward Ready!
                                                </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Realistic Stamp Card */}
                    <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 shadow-inner border-2 border-amber-200 dark:border-amber-700">
                      {/* Card Header */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
                          <Coffee className="w-5 h-5" />
                          Coffee Stamp Card
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Collect 10 stamps for a free coffee!</p>
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isFilled = i < (customer.stamps || 0)
                          const isNewStamp = recentStampCustomer === customer.id && i === (customer.stamps || 1) - 1

                          return (
                            <motion.div
                              key={i}
                              initial={isNewStamp ? { scale: 0, rotate: -180 } : {}}
                              animate={isNewStamp ? { scale: [0, 1.2, 1], rotate: [ -180, 0 ] } : {}}
                              transition={isNewStamp ? { duration: 0.8, ease: "easeOut" } : {}}
                              className={`aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                                isFilled
                                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-500 shadow-lg transform hover:scale-105"
                                  : "bg-white dark:bg-slate-700 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                              }`}
                              whileHover={!isFilled ? { scale: 1.05 } : {}}
                              whileTap={!isFilled ? { scale: 0.95 } : {}}
                            >
                              {isFilled ? (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className="text-2xl font-bold"
                                >
                                  ☕
                                </motion.div>
                              ) : (
                                <div className="text-amber-400 text-xl font-bold opacity-50">
                                  {i + 1}
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-amber-700 dark:text-amber-300">
                          <span>Progress</span>
                          <span>{customer.stamps || 0}/10</span>
                        </div>
                        <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-3 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Reward Message */}
                      {customer.reward_available && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700"
                        >
                          <p className="text-green-800 dark:text-green-300 text-sm font-semibold text-center">
                            🎉 Congratulations! Your free coffee is ready to claim!
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => addStamp(customer.id)}
                        disabled={customer.stamps >= 10}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-amber-500 hover:border-amber-600 transition-all duration-300 py-3 rounded-lg font-semibold"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Add Stamp
                      </Button>
                      {customer.reward_available && (
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => resetCustomerReward(customer.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white transition-all duration-300 py-3 rounded-lg font-semibold"
                        >
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Claim & Reset
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0"
              onClick={() => setShowAddCustomer(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 border-0"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Add New Customer
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddCustomer(false)} aria-label="Close modal" className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <motion.div whileHover={{ rotate: 90 }} className="w-6 h-6 text-slate-500">✕</motion.div>
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full py-3 px-4 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Initial Stamps (0-10)</label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newCustomer.initialStamps}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })
                      }
                      className="w-full h-3 bg-slate-200 rounded-lg cursor-pointer appearance-none slider"
                      aria-label="Initial stamps"
                    />
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>0</span>
                      <span className="font-bold text-lg text-blue-600">{newCustomer.initialStamps}/10</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                  {isAddingCustomer ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Customer...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
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
