"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Gift, Zap, Users, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

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
  const [newCustomer, setNewCustomer] = useState<AddCustomerForm>({
    email: "",
    initialStamps: 0,
  })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterType])

  const fetchLoyaltyData = async () => {
    try {
      const { data, error } = await supabase
        .from("loyalty")
        .select(`
          id,
          user_id,
          stamps,
          reward_available,
          last_stamp_date,
          created_at
        `)
        .order("stamps", { ascending: false })

      if (error) throw error

      const userIds = data.map((item: any) => item.user_id)
      let emailMap: { [key: string]: string } = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabase.from("users").select("id, email").in("id", userIds)

        if (usersData) {
          emailMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]))
        }
      }

      const formattedData = data.map((item: any) => ({
        id: item.id,
        email: emailMap[item.user_id] || "Unknown User",
        stamps: item.stamps,
        reward_available: item.reward_available,
        last_stamp_date: item.last_stamp_date,
        created_at: item.created_at,
      }))

      setCustomers(formattedData)

      // Calculate stats
      const rewardsAvailable = formattedData.filter((c) => c.reward_available).length
      const totalStamps = formattedData.reduce((sum, c) => sum + c.stamps, 0)

      setStats({
        totalCustomers: formattedData.length,
        rewardsAvailable,
        totalStamps,
      })
    } catch (error) {
      console.error("Error fetching loyalty data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers.filter((c) => c.email.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterType === "ready") {
      filtered = filtered.filter((c) => c.reward_available)
    } else if (filterType === "active") {
      filtered = filtered.filter((c) => c.stamps > 0 && !c.reward_available)
    }

    setFilteredCustomers(filtered)
  }

  const resetCustomerReward = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from("loyalty")
        .update({
          stamps: 0,
          reward_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)

      if (error) throw error

      // Update local state
      setCustomers(customers.map((c) => (c.id === customerId ? { ...c, stamps: 0, reward_available: false } : c)))
    } catch (error) {
      console.error("Error resetting reward:", error)
    }
  }

  const addStamp = async (customerId: string) => {
    try {
      const customer = customers.find((c) => c.id === customerId)
      if (!customer) return

      const newStamps = Math.min(customer.stamps + 1, 10)
      const rewardAvailable = newStamps >= 10

      const { error } = await supabase
        .from("loyalty")
        .update({
          stamps: newStamps,
          reward_available: rewardAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)

      if (error) throw error

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, stamps: newStamps, reward_available: rewardAvailable } : c,
        ),
      )
    } catch (error) {
      console.error("Error adding stamp:", error)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.email || !newCustomer.email.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    setIsAddingCustomer(true)
    try {
      // First, create auth user
      const { data: authData, error: authError } = await supabase.auth.signUpWithPassword({
        email: newCustomer.email,
        password: Math.random().toString(36).slice(-12), // Generate random password
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error("Failed to create user")

      // Create user profile
      await supabase.from("users").insert({
        id: userId,
        email: newCustomer.email,
        role: "customer",
      })

      // Create loyalty card
      await supabase.from("loyalty").insert({
        user_id: userId,
        stamps: newCustomer.initialStamps,
        reward_available: newCustomer.initialStamps >= 10,
      })

      // Refresh the list
      await fetchLoyaltyData()

      // Reset form
      setNewCustomer({ email: "", initialStamps: 0 })
      setShowAddCustomer(false)

      alert("Customer created successfully!")
    } catch (error) {
      console.error("Error adding customer:", error)
      alert(error instanceof Error ? error.message : "Failed to add customer")
    } finally {
      setIsAddingCustomer(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-20 bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCustomers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-30" />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready to Claim</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.rewardsAvailable}</p>
              </div>
              <Gift className="w-10 h-10 text-green-600 dark:text-green-400 opacity-30" />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stamps Earned</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.totalStamps}</p>
              </div>
              <Zap className="w-10 h-10 text-amber-600 dark:text-amber-400 opacity-30" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Customer Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Customer Management</h3>
          <Button
            onClick={() => setShowAddCustomer(!showAddCustomer)}
            variant={showAddCustomer ? "outline" : "default"}
            size="sm"
          >
            {showAddCustomer ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </>
            )}
          </Button>
        </div>

        {showAddCustomer && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted p-4 rounded-lg space-y-3 mb-4 border border-border"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Stamps (0-10)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={newCustomer.initialStamps}
                    onChange={(e) => setNewCustomer({ ...newCustomer, initialStamps: Number.parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-bold w-8 text-right">{newCustomer.initialStamps}/10</span>
                </div>
              </div>

              <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full">
                {isAddingCustomer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Customer"
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </Card>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "ready", "active"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {type === "all" ? "All Customers" : type === "ready" ? "Ready to Claim" : "Active"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customers List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Customers ({filteredCustomers.length})</h3>
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No customers found</p>
            </Card>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left - Customer Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Middle - Stamps */}
                    <div className="text-center">
                      <div className="flex gap-1 justify-center mb-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-sm text-xs flex items-center justify-center font-bold ${
                              i < customer.stamps ? "bg-amber-400 text-amber-900" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {i < customer.stamps ? "✓" : ""}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{customer.stamps}/10 stamps</p>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex gap-2">
                      {customer.reward_available && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold whitespace-nowrap"
                        >
                          Ready 🎁
                        </motion.div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addStamp(customer.id)}
                        disabled={customer.stamps >= 10}
                      >
                        +1
                      </Button>

                      {customer.reward_available && (
                        <Button size="sm" variant="default" onClick={() => resetCustomerReward(customer.id)}>
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
