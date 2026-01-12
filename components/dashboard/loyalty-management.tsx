"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Gift, Zap, Users, Plus, X, Loader2 } from "lucide-react"

import {
  fetchLoyaltyData,
  addLoyaltyCustomer,
  updateCustomerStamps,
  resetCustomerReward as resetRewardServer,
} from "@/app/actions/loyalty-actions"

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
  const [stats, setStats] = useState({ totalCustomers: 0, rewardsAvailable: 0, totalStamps: 0 })
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState<AddCustomerForm>({ email: "", initialStamps: 0 })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  // Fetch loyalty data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchLoyaltyData()
      setCustomers(data)
      setStats({
        totalCustomers: data.length,
        rewardsAvailable: data.filter((c) => c.reward_available).length,
        totalStamps: data.reduce((sum, c) => sum + c.stamps, 0),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter customers
  useEffect(() => {
    let filtered = customers.filter((c) => c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterType === "ready") filtered = filtered.filter((c) => c.reward_available)
    if (filterType === "active") filtered = filtered.filter((c) => c.stamps > 0 && !c.reward_available)
    setFilteredCustomers(filtered)
  }, [customers, searchTerm, filterType])

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.email || !newCustomer.email.includes("@")) return alert("Enter a valid email")
    setIsAddingCustomer(true)
    try {
      await addLoyaltyCustomer(newCustomer.email, newCustomer.initialStamps)
      await loadData()
      setNewCustomer({ email: "", initialStamps: 0 })
      setShowAddCustomer(false)
      alert("Customer added!")
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to add customer")
    } finally {
      setIsAddingCustomer(false)
    }
  }

  // Add stamp
  const addStamp = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) return
    const newStamps = Math.min(customer.stamps + 1, 10)
    const rewardAvailable = newStamps >= 10
    await updateCustomerStamps(customerId, newStamps, rewardAvailable)
    await loadData()
  }

  // Reset reward
  const resetCustomerReward = async (customerId: string) => {
    await resetRewardServer(customerId)
    await loadData()
  }

  if (isLoading)
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-20 bg-muted" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

      {/* Customer Management & Add Customer */}
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
                    onChange={(e) => setNewCustomer({ ...newCustomer, initialStamps: Number(e.target.value) })}
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

      {/* Search & Filter */}
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>

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
