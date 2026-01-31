"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Gift, Zap, Search, Plus, Loader2, Download, RotateCcw, Coffee, Star, Trophy, Calendar, Trash2, Edit } from "lucide-react"

interface LoyaltyCustomer {
  id: string
  phone_number: string
  stamps: number
  reward_available: boolean
  last_stamp_date: string | null
  created_at: string
}

interface AddCustomerForm {
  phone_number: string
  initialStamps: number
}

interface EditCustomerForm {
  phone_number: string
  stamps: number
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
  const [newCustomer, setNewCustomer] = useState<AddCustomerForm>({ phone_number: "", initialStamps: 0 })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [recentStampCustomer, setRecentStampCustomer] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<LoyaltyCustomer | null>(null)
  const [editCustomerData, setEditCustomerData] = useState<EditCustomerForm>({ phone_number: "", stamps: 0 })
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)

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
        .select("id, phone_number, stamps, reward_available, last_stamp_date, created_at")
        .order("stamps", { ascending: false })

      if (error) throw error

      const formattedData = data.map((item: any) => ({
        id: item.id,
        phone_number: item.phone_number || "Unknown",
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
    let filtered = customers.filter((c) => c.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))
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
      const { error } = await supabase.from("loyalty").update({ stamps: newStamps, reward_available: rewardAvailable, last_stamp_date: new Date().toISOString() }).eq("id", customerId)
      if (error) throw error

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, stamps: newStamps, reward_available: rewardAvailable, last_stamp_date: new Date().toISOString() } : c,
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

  const deleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("loyalty").delete().eq("id", customerId)
      if (error) throw error
      setCustomers(customers.filter((c) => c.id !== customerId))
      setMessage({ type: "success", text: "Customer deleted successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting customer:", error)
      setMessage({ type: "error", text: "Failed to delete customer." })
    }
  }

  const openEditCustomer = (customer: LoyaltyCustomer) => {
    setEditingCustomer(customer)
    setEditCustomerData({ phone_number: customer.phone_number, stamps: customer.stamps })
    setShowEditCustomer(true)
    setSelectedCustomer(null)
  }

  const handleEditCustomer = async () => {
    const phoneRegex = /^\+?[\d\s\-()]+$/
    if (!editCustomerData.phone_number || !phoneRegex.test(editCustomerData.phone_number)) {
      setMessage({ type: "error", text: "Please enter a valid phone number." })
      return
    }

    if (editingCustomer === null) return

    setIsEditingCustomer(true)
    try {
      const rewardAvailable = editCustomerData.stamps >= 10
      const { error } = await supabase
        .from("loyalty")
        .update({
          phone_number: editCustomerData.phone_number,
          stamps: editCustomerData.stamps,
          reward_available: rewardAvailable,
        })
        .eq("id", editingCustomer.id)

      if (error) throw error

      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                phone_number: editCustomerData.phone_number,
                stamps: editCustomerData.stamps,
                reward_available: rewardAvailable,
              }
            : c,
        ),
      )

      setShowEditCustomer(false)
      setEditingCustomer(null)
      setMessage({ type: "success", text: "Customer updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error updating customer:", error)
      setMessage({ type: "error", text: "Failed to update customer." })
    } finally {
      setIsEditingCustomer(false)
    }
  }

  const handleAddCustomer = async () => {
    const phoneRegex = /^\+?[\d\s\-()]+$/
    if (!newCustomer.phone_number || !phoneRegex.test(newCustomer.phone_number)) {
      setMessage({ type: "error", text: "Please enter a valid phone number." })
      return
    }
    setIsAddingCustomer(true)
    try {
      await supabase.from("loyalty").insert({
        phone_number: newCustomer.phone_number,
        stamps: newCustomer.initialStamps,
        reward_available: newCustomer.initialStamps >= 10,
      })
      await fetchLoyaltyData()
      setNewCustomer({ phone_number: "", initialStamps: 0 })
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
      ["Phone Number", "Stamps", "Reward Available", "Last Stamp Date", "Created At"],
      ...customers.map((c) => [
        c.phone_number,
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
      <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-amber-50 to-brown-100 text-brown-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse bg-cream-100 border-brown-200">
              <div className="h-4 bg-brown-200 rounded mb-2"></div>
              <div className="h-8 bg-brown-200 rounded"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse bg-cream-100 border-brown-200">
              <div className="h-4 bg-brown-200 rounded mb-2"></div>
              <div className="h-20 bg-brown-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-amber-50 to-brown-100 text-brown-900">
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
        <h1 className="text-2xl md:text-4xl font-bold flex items-center justify-center gap-4 text-brown-800">
          <Coffee className="w-8 h-8 text-brown-600" />
          Coffee Loyalty Program
        </h1>
        <p className="text-base md:text-lg text-brown-600">Brew up rewards for your loyal coffee lovers</p>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400" />
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
            <Card className="p-4 md:p-6 bg-cream-100 shadow-lg border border-brown-200 hover:shadow-xl transition-shadow">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brown-600 flex items-center gap-2">
                    <stat.icon className="w-4 h-4" />
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-brown-800">{stat.value}</p>
                </div>
                <stat.icon className="w-10 h-10 text-brown-400" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="p-4 md:p-6 rounded-lg shadow-lg border border-brown-200 mb-8 bg-cream-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setShowAddCustomer(true)}
              className="gap-2 bg-brown-600 hover:bg-brown-700 text-cream-100 px-4 py-3 rounded-lg text-sm md:text-base min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
            {stats.rewardsAvailable > 0 && (
              <Button variant="outline" onClick={bulkResetRewards} className="gap-2 px-4 py-3 rounded-lg border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]">
                <RotateCcw className="w-4 h-4" />
                Bulk Reset
              </Button>
            )}
            <Button variant="outline" onClick={exportData} className="gap-2 px-4 py-3 rounded-lg border-green-300 text-green-600 hover:bg-green-50 min-h-[44px]">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-lg border-brown-300 focus:border-brown-500 focus:ring-brown-500 min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "ready", "active"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-3 rounded-lg min-h-[44px] ${
                    filterType === type
                      ? "bg-brown-600 text-cream-100"
                      : "border-brown-300 text-brown-600 hover:bg-brown-50"
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
              <Users className="h-16 w-16 mx-auto text-brown-400 mb-6" />
              <p className="text-lg font-semibold text-brown-500">No customers found matching your criteria.</p>
              <p className="mt-2 text-sm text-brown-400">Try adjusting your search or filter.</p>
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
                <Card className="p-4 md:p-6 shadow-lg border border-brown-200 bg-cream-100 hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold truncate mb-1 text-brown-800">{customer.phone_number}</CardTitle>
                        <p className="text-sm flex items-center gap-2 text-brown-500">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                                            {customer.reward_available && (
                        <div className="px-3 py-1 text-sm font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-2 shadow-md">
                          <Trophy className="w-4 h-4" />
                          Reward Ready!
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stamp Card */}
                    <div
                      className="rounded-lg p-4 bg-cover bg-center border border-brown-300 shadow-inner relative overflow-hidden"
                      style={{
                        backgroundImage: "url('https://example.com/coffee-shop-background.jpg')", // Replace with your coffee shop image URL
                        minHeight: "200px",
                      }}
                    >
                      <div className="absolute inset-0 bg-brown-900/20 rounded-lg"></div> {/* Overlay for readability */}
                      <div className="relative z-10 text-center mb-4">
                        <h3 className="text-lg font-bold flex items-center justify-center gap-2 mb-2 text-cream-100 drop-shadow-lg">
                          <Coffee className="w-5 h-5" />
                          Coffee Card
                        </h3>
                        <p className="text-sm text-cream-200 drop-shadow">Collect 10 stamps for a FREE coffee!</p>
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-5 gap-2 mb-4 relative z-10">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isFilled = i < (customer.stamps || 0)
                          const isNewStamp = recentStampCustomer === customer.id && i === (customer.stamps || 1) - 1

                          return (
                            <motion.div
                              key={i}
                              initial={isNewStamp ? { scale: 0, opacity: 0 } : {}}
                              animate={isNewStamp ? { scale: [0, 1.2, 1], opacity: 1 } : {}}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-md ${
                                isFilled
                                  ? "bg-amber-500 text-cream-100 border-amber-600 shadow-amber-500/50"
                                  : "bg-cream-200 border-brown-300 text-brown-500"
                              } ${customer.reward_available && i === 9 ? "animate-pulse shadow-amber-500/75" : ""}`}
                            >
                              <Coffee className={`w-5 h-5 ${isFilled ? "text-cream-100" : "text-brown-500"}`} />
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-2 relative z-10">
                        <div className="flex justify-between items-center text-sm text-cream-100 drop-shadow">
                          <span className="font-semibold">Progress</span>
                          <span className="font-bold">{customer.stamps || 0}/10</span>
                        </div>
                        <div className="w-full rounded-full h-3 bg-brown-300 shadow-inner">
                          <motion.div
                            className="bg-amber-500 h-3 rounded-full shadow-md"
                            style={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-cream-200 drop-shadow">
                            {10 - (customer.stamps || 0)} more stamps to go!
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 relative z-10">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); addStamp(customer.id); }}
                          disabled={customer.stamps >= 10}
                          className="flex-1 bg-brown-600 hover:bg-brown-700 text-cream-100 py-3 rounded min-h-[44px] text-sm md:text-base"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Stamp
                        </Button>
                        {customer.reward_available && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => { e.stopPropagation(); resetCustomerReward(customer.id); }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-cream-100 py-3 rounded min-h-[44px] text-sm md:text-base"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Claim & Reset
                          </Button>
                        )}
                      </div>
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
                          <div className="mt-4 p-3 rounded border bg-brown-50 border-brown-200 shadow-md">
                            <h4 className="font-semibold mb-2 text-sm text-brown-800">Customer Details</h4>
                            <p className="text-sm text-brown-600">
                              <strong>Last Stamp:</strong> {customer.last_stamp_date ? new Date(customer.last_stamp_date).toLocaleDateString() : "Never"}
                            </p>
                            <p className="text-sm mt-1 text-brown-600">
                              <strong>Stamps Collected:</strong> {customer.stamps || 0}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openEditCustomer(customer); }}
                                className="flex-1 gap-2 border-amber-300 text-amber-600 hover:bg-amber-50"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id); }}
                                className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-cream-100 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-brown-200"
            >
              <div className="flex justify-between items-center p-6 border-b border-brown-200">
                <h2 className="text-xl font-bold flex items-center gap-4 text-brown-800">
                  <Plus className="w-6 h-6 text-brown-600" />
                  Add New Customer
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddCustomer(false)} aria-label="Close modal" className="min-h-[44px]">
                  <div className="w-5 h-5 text-brown-500">✕</div>
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3 text-brown-700">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={newCustomer.phone_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                    className="w-full py-3 px-3 rounded border-brown-300 focus:border-brown-500 focus:ring-brown-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 text-brown-700">Initial Stamps (0-10)</label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newCustomer.initialStamps}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })
                      }
                      className="w-full h-2 rounded cursor-pointer bg-brown-200"
                      aria-label="Initial stamps"
                    />
                    <div className="flex justify-between text-sm text-brown-600">
                      <span>0</span>
                      <span className="font-bold text-brown-800">{newCustomer.initialStamps}/10</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full bg-brown-600 hover:bg-brown-700 text-cream-100 py-3 rounded min-h-[44px]">
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

      {/* Edit Customer Modal */}
      <AnimatePresence>
        {showEditCustomer && editingCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-cream-100 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-brown-200"
            >
              <div className="flex justify-between items-center p-6 border-b border-brown-200">
                <h2 className="text-xl font-bold flex items-center gap-4 text-brown-800">
                  <Edit className="w-6 h-6 text-brown-600" />
                  Edit Customer
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditCustomer(false)} aria-label="Close modal" className="min-h-[44px]">
                  <div className="w-5 h-5 text-brown-500">✕</div>
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3 text-brown-700">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={editCustomerData.phone_number}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, phone_number: e.target.value })}
                    className="w-full py-3 px-3 rounded border-brown-300 focus:border-brown-500 focus:ring-brown-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 text-brown-700">Stamps (0-10)</label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={editCustomerData.stamps}
                      onChange={(e) =>
                        setEditCustomerData({ ...editCustomerData, stamps: Number.parseInt(e.target.value) })
                      }
                      className="w-full h-2 rounded cursor-pointer bg-brown-200"
                      aria-label="Customer stamps"
                    />
                    <div className="flex justify-between text-sm text-brown-600">
                      <span>0</span>
                      <span className="font-bold text-brown-800">{editCustomerData.stamps}/10</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleEditCustomer} disabled={isEditingCustomer} className="w-full bg-brown-600 hover:bg-brown-700 text-cream-100 py-3 rounded min-h-[44px]">
                  {isEditingCustomer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Save Changes
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
