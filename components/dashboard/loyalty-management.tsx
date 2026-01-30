"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Users, Gift, Zap, Search, Filter, Plus, Loader2, Download, RotateCcw, Coffee, Star, Trophy, Calendar, Moon, Sun } from "lucide-react"

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
  const [isDarkMode, setIsDarkMode] = useState(false)

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
      setMessage({ type: "success", text: "Stamp added! ☕" })
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
      setMessage({ type: "success", text: "Customer added successfully! 🎉" })
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
      setMessage({ type: "success", text: "All ready rewards reset! 🧹" })
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen p-4 md:p-6 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className={`p-6 animate-pulse ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}`}>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={`p-4 animate-pulse ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}`}>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800 text-white' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900'}`}>
      {/* Dark Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 z-40"
      >
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
          className={`rounded-full shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </motion.div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className={`fixed top-20 left-4 right-4 z-30 p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-sm ${
              message.type === "success"
                ? "bg-green-50/90 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                : "bg-red-50/90 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
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
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-8"
      >
        <h1 className="text-3xl md:text-5xl font-bold flex items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Coffee className="w-10 h-10 text-amber-600" />
          </motion.div>
          Loyalty Program
        </h1>
        <p className={`text-lg md:text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Manage your customers' stamps and rewards with style</p>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-500" />
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {[
          { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "from-blue-500 to-blue-700" },
          { label: "Ready to Claim", value: stats.rewardsAvailable, icon: Gift, color: "from-green-500 to-green-700" },
          { label: "Total Stamps Earned", value: stats.totalStamps, icon: Zap, color: "from-amber-500 to-amber-700" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="perspective-1000"
          >
            <Card className={`p-4 md:p-6 bg-gradient-to-br ${stat.color} text-white shadow-2xl hover:shadow-3xl transition-all duration-500 border-0 rounded-2xl overflow-hidden relative`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
              <CardContent className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm opacity-90 flex items-center gap-2">
                    <stat.icon className="w-4 h-4" />
                    {stat.label}
                  </p>
                  <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-12 h-12 md:w-14 md:h-14 opacity-80" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`p-4 md:p-6 rounded-2xl shadow-xl border backdrop-blur-lg mb-8 ${isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-white/20'}`}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setShowAddCustomer(true)} className="gap-2 md:gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base md:text-lg">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                Add Customer
              </Button>
            </motion.div>
            {stats.rewardsAvailable > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" onClick={bulkResetRewards} className={`gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold text-base md:text-lg ${isDarkMode ? 'border-red-300 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                  Bulk Reset
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={exportData} className={`gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold text-base md:text-lg ${isDarkMode ? 'border-green-300 text-green-400 hover:bg-green-900/20' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                <Download className="w-5 h-5 md:w-6 md:h-6" />
                Export Data
              </Button>
            </motion.div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-12 md:pl-14 pr-4 py-3 md:py-4 rounded-xl shadow-sm transition-colors text-base md:text-lg ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
              />
            </div>
            <div className="flex gap-2 md:gap-3">
              {(["all", "ready", "active"] as const).map((type) => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(type)}
                    className={`px-4 md:px-6 py-2 md:py-4 rounded-xl transition-all duration-300 font-semibold text-sm md:text-lg ${
                      filterType === type
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : isDarkMode
                        ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type === "all" ? "All" : type === "ready" ? "Ready" : "Active"}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full text-center py-12 md:py-20"
            >
              <Users className="h-16 w-16 md:h-20 md:w-20 mx-auto text-slate-400 mb-6" />
              <p className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No customers found matching your criteria.</p>
              <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Try adjusting your search or filter.</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ delay: index * 0.15, duration: 0.6, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
                onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)}
              >
                <Card className={`p-4 md:p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 border-0 rounded-2xl overflow-hidden relative ${isDarkMode ? 'bg-slate-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'}`}>
                  {/* Card Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-200 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-blue-200 rounded-full -ml-8 md:-ml-12 -mb-8 md:-mb-12"></div>
                  </div>

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className={`text-lg md:text-xl font-bold truncate mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{customer.email}</CardTitle>
                        <p className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {customer.reward_available && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-bold bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center gap-2 shadow-lg"
                        >
                          <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                          Reward Ready!
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 md:space-y-6 relative z-10">
                    {/* Enhanced Realistic Stamp Card */}
                    <div className={`relative rounded-2xl p-4 md:p-6 shadow-inner border-2 transform rotate-1 hover:rotate-0 transition-transform duration-300 ${isDarkMode ? 'bg-amber-900/30 border-amber-600' : 'bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-amber-300'}`}>
                      {/* Card Texture */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-2xl"></div>
                      {/* Perforated Edges */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-t-2xl opacity-50"></div>
                                            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-b-2xl opacity-50"></div>

                      {/* Card Header */}
                      <div className="text-center mb-4 md:mb-6 relative z-10">
                        <h3 className={`text-lg md:text-xl font-bold flex items-center justify-center gap-2 md:gap-3 mb-2 ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                          </motion.div>
                          Premium Coffee Card
                        </h3>
                        <p className={`text-xs md:text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Collect 10 stamps for a FREE premium coffee!</p>
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-5 gap-2 md:gap-3 mb-4 md:mb-6 relative z-10">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isFilled = i < (customer.stamps || 0)
                          const isNewStamp = recentStampCustomer === customer.id && i === (customer.stamps || 1) - 1

                          return (
                            <motion.div
                              key={i}
                              initial={isNewStamp ? { scale: 0, rotate: -180 } : {}}
                              animate={isNewStamp ? { scale: [0, 1.3, 1], rotate: [ -180, 0 ] } : {}}
                              transition={isNewStamp ? { duration: 1, ease: "easeOut" } : {}}
                              className={`aspect-square rounded-lg md:rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                                isFilled
                                  ? "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white border-amber-500 shadow-lg transform hover:scale-110"
                                  : isDarkMode
                                  ? "bg-slate-700/80 border-amber-600 hover:bg-amber-900/30 hover:scale-105"
                                  : "bg-white/80 border-amber-300 hover:bg-amber-50 hover:scale-105"
                              }`}
                              whileHover={!isFilled ? { scale: 1.1 } : { scale: 1.15 }}
                              whileTap={!isFilled ? { scale: 0.9 } : { scale: 1.05 }}
                            >
                              {/* Stamp Background Pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="w-full h-full bg-gradient-to-br from-transparent via-white to-transparent transform rotate-45"></div>
                              </div>
                              {/* Stamp Texture */}
                              <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "4px 4px" }}></div>

                              {isFilled ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 }}
                                  className="text-2xl md:text-3xl font-bold relative z-10"
                                >
                                  ☕
                                </motion.div>
                              ) : (
                                <div className={`text-lg md:text-2xl font-bold opacity-60 relative z-10 ${isDarkMode ? 'text-amber-400' : 'text-amber-400'}`}>
                                  {i + 1}
                                </div>
                              )}

                              {/* Shine Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-3 md:space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-xs md:text-sm">
                          <span className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Progress</span>
                          <span className={`font-bold text-base md:text-lg ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>{customer.stamps || 0}/10</span>
                        </div>
                        <div className={`w-full rounded-full h-3 md:h-4 overflow-hidden shadow-inner ${isDarkMode ? 'bg-amber-800' : 'bg-amber-200'}`}>
                          <motion.div
                            className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 h-3 md:h-4 rounded-full shadow-sm"
                            initial={{ width: 0 }}
                            animate={{ width: `${((customer.stamps || 0) / 10) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <div className="text-center">
                          <p className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            {10 - (customer.stamps || 0)} more stamps to go!
                          </p>
                        </div>
                      </div>

                      {/* Reward Celebration */}
                      {customer.reward_available && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className={`mt-4 md:mt-6 p-3 md:p-4 rounded-xl border shadow-lg relative z-10 ${isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-gradient-to-r from-green-100 to-green-200 border-green-300'}`}
                        >
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-3xl md:text-4xl mb-2"
                            >
                              🎉
                            </motion.div>
                            <p className={`text-xs md:text-sm font-bold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                              Congratulations! Your FREE premium coffee is ready to claim!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); addStamp(customer.id); }}
                          disabled={customer.stamps >= 10}
                          className={`w-full py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-500 hover:border-amber-600'}`}
                        >
                          <Zap className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3" />
                          Add Stamp
                        </Button>
                      </motion.div>
                      {customer.reward_available && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => { e.stopPropagation(); resetCustomerReward(customer.id); }}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-lg hover:shadow-xl"
                          >
                            <Trophy className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3" />
                            Claim & Reset
                          </Button>
                        </motion.div>
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
                          <div className={`mt-4 p-3 md:p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className={`font-semibold mb-2 text-sm md:text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Customer Details</h4>
                            <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              <strong>Last Stamp:</strong> {customer.last_stamp_date ? new Date(customer.last_stamp_date).toLocaleDateString() : "Never"}
                            </p>
                            <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="absolute inset-0"
              onClick={() => setShowAddCustomer(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`relative rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 border ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-white/20'}`}
            >
              <div className={`flex justify-between items-center p-6 md:p-8 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Plus className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </motion.div>
                  Add New Customer
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddCustomer(false)} aria-label="Close modal" className={`hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full w-8 h-8 md:w-10 md:h-10 ${isDarkMode ? 'text-slate-400' : ''}`}>
                  <motion.div whileHover={{ rotate: 90 }} className="w-5 h-5 md:w-6 md:h-6 text-slate-500">✕</motion.div>
                </Button>
              </div>
              <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                <div>
                  <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className={`w-full py-3 md:py-4 px-4 rounded-xl shadow-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-base md:text-lg'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Initial Stamps (0-10)</label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newCustomer.initialStamps}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })
                      }
                      className={`w-full h-3 md:h-4 rounded-lg cursor-pointer appearance-none slider ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}
                      aria-label="Initial stamps"
                    />
                    <div className="flex justify-between text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      <span>0</span>
                      <span className="font-bold text-lg md:text-xl text-blue-600">{newCustomer.initialStamps}/10</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    {isAddingCustomer ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-3 animate-spin" />
                        Creating Customer...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                        Create Customer
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
