"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Gift, Zap, Search, Plus, Loader2, Download, RotateCcw, Coffee, Star, Trophy, Calendar } from "lucide-react"

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
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

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
      setMessage({ type: "success", text: "Reward claimed and reset successfully!" })
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

      setRecentStampCustomer(customerId)
      setTimeout(() => setRecentStampCustomer(null), 1000)
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
      <div className="min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse bg-white">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse bg-white">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 text-gray-900">
      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-20 left-4 right-4 z-30 p-4 rounded-lg border shadow-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-300"
                : "bg-red-50 text-red-800 border-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === "success" ? <Trophy className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
              <span className="font-semibold">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-2xl md:text-4xl font-bold flex items-center justify-center gap-4">
          <Coffee className="w-8 h-8 text-gray-600" />
          Loyalty Program
        </h1>
        <p className="text-base md:text-lg text-gray-600">Manage your customers' stamps and rewards</p>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-gray-400" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {[
          { label: "Total Customers", value: stats.totalCustomers, icon: Users },
          { label: "Ready to Claim", value: stats.rewardsAvailable, icon: Gift },
          { label: "Total Stamps Earned", value: stats.totalStamps, icon: Zap },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 md:p-6 bg-white shadow-md border border-gray-200">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <stat.icon className="w-4 h-4" />
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-10 h-10 text-gray-400" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="p-4 md:p-6 rounded-lg shadow-md border border-gray-200 mb-8 bg-white">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowAddCustomer(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
            {stats.rewardsAvailable > 0 && (
              <Button variant="outline" onClick={bulkResetRewards} className="gap-2 px-4 py-2 rounded-lg border-red-300 text-red-600 hover:bg-red-50">
                <RotateCcw className="w-4 h-4" />
                Bulk Reset
              </Button>
            )}
            <Button variant="outline" onClick={exportData} className="gap-2 px-4 py-2 rounded-lg border-green-300 text-green-600 hover:bg-green-50">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "ready", "active"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg ${
                    filterType === type
                      ? "bg-blue-600 text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {type === "all" ? "All" : type === "ready" ? "Ready" : "Active"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <p className="text-lg font-semibold text-gray-500">No customers found matching your criteria.</p>
              <p className="mt-2 text-sm text-gray-400">Try adjusting your search or filter.</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)}
              >
                <Card className="p-4 md:p-6 shadow-md border border-gray-200 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold truncate mb-1">{customer.email}</CardTitle>
                        <p className="text-sm flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {customer.reward_available && (
                        <div className="px-3 py-1 text-sm font-bold bg-green-100 text-green-800 rounded-full flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Reward Ready!
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stamp Card */}
                    <div className="rounded-lg p-4 bg-gray-100 border border-gray-200">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold flex items-center justify-center gap-2 mb-2">
                          <Coffee className="w-5 h-5" />
                          Soda Card
                        </h3>
                        <p className="text-sm text-gray-600">Collect 10 stamps for a FREE soda!</p>
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isFilled = i < (customer.stamps || 0)
                          const isNewStamp = recentStampCustomer === customer.id && i === (customer.stamps || 1) - 1

                          return (
                            <motion.div
                              key={i}
                              initial={isNewStamp ? { scale: 0 } : {}}
                              animate={isNewStamp ? { scale: [0, 1.2, 1] } : {}}
                              transition={{ duration: 0.5 }}
                                                        className={`aspect-square rounded border-2 flex items-center justify-center transition-all duration-300 ${
                            isFilled
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-gray-200 border-gray-300 text-gray-500"
                          }`}
                        >
                          <Coffee className={`w-6 h-6 ${isFilled ? "text-white" : "text-gray-500"}`} />
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Progress</span>
                      <span className="font-bold">{customer.stamps || 0}/10</span>
                    </div>
                    <div className="w-full rounded-full h-2 bg-gray-200">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">
                        {10 - (customer.stamps || 0)} more stamps to go!
                      </p>
                    </div>
                  </div>

                  {/* Reward Celebration */}
                  {customer.reward_available && (
                    <div className="mt-4 p-3 rounded border bg-green-50 border-green-200">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-sm font-bold text-green-800">
                          Congratulations! Your FREE soda is ready to claim!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); addStamp(customer.id); }}
                    disabled={customer.stamps >= 10}
                    className="flex-1 py-2 rounded border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Add Stamp
                  </Button>
                  {customer.reward_available && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => { e.stopPropagation(); resetCustomerReward(customer.id); }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Claim & Reset
                    </Button>
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedCustomer === customer.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-3 rounded border bg-gray-50 border-gray-200">
                        <h4 className="font-semibold mb-2 text-sm">Customer Details</h4>
                        <p className="text-sm text-gray-600">
                          <strong>Last Stamp:</strong> {customer.last_stamp_date ? new Date(customer.last_stamp_date).toLocaleDateString() : "Never"}
                        </p>
                        <p className="text-sm mt-1 text-gray-600">
                          <strong>Stamps Collected:</strong> {customer.stamps || 0}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-4">
              <Plus className="w-6 h-6 text-blue-600" />
              Add New Customer
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowAddCustomer(false)} aria-label="Close modal">
              <div className="w-5 h-5 text-gray-500">✕</div>
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700">Email Address</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full py-2 px-3 rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700">Initial Stamps (0-10)</label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={newCustomer.initialStamps}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })
                  }
                  className="w-full h-2 rounded cursor-pointer bg-gray-200"
                  aria-label="Initial stamps"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0</span>
                  <span className="font-bold text-blue-600">{newCustomer.initialStamps}/10</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
              {isAddingCustomer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Customer...
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
    ) }
