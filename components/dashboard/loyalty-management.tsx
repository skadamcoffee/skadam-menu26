"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client" // client-side fetch
import { addLoyaltyCustomer } from "@/app/actions/loyalty-actions" // server action
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Gift, Zap, Plus, X, Loader2, Search } from "lucide-react"

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
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState<AddCustomerForm>({ email: "", initialStamps: 0 })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [stats, setStats] = useState({ totalCustomers: 0, rewardsAvailable: 0, totalStamps: 0 })

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const { data: loyaltyData, error } = await supabase
        .from("loyalty")
        .select("id, user_id, stamps, reward_available, last_stamp_date, created_at")
        .order("stamps", { ascending: false })

      if (error) throw error

      const userIds = loyaltyData.map((item: any) => item.user_id)
      let emailMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabase.from("users").select("id,email").in("id", userIds)
        if (usersData) emailMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]))
      }

      const formattedData: LoyaltyCustomer[] = loyaltyData.map((item: any) => ({
        id: item.id,
        email: emailMap[item.user_id] || "Unknown User",
        stamps: item.stamps,
        reward_available: item.reward_available,
        last_stamp_date: item.last_stamp_date,
        created_at: item.created_at,
      }))

      setCustomers(formattedData)
      setFilteredCustomers(formattedData)

      // Update stats
      const rewardsAvailable = formattedData.filter((c) => c.reward_available).length
      const totalStamps = formattedData.reduce((sum, c) => sum + c.stamps, 0)
      setStats({ totalCustomers: formattedData.length, rewardsAvailable, totalStamps })
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Filter customers based on search & type
  useEffect(() => {
    let filtered = customers.filter((c) => c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterType === "ready") filtered = filtered.filter((c) => c.reward_available)
    if (filterType === "active") filtered = filtered.filter((c) => c.stamps > 0 && !c.reward_available)
    setFilteredCustomers(filtered)
  }, [customers, searchTerm, filterType])

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.email.includes("@")) return alert("Enter a valid email")
    setIsAddingCustomer(true)
    try {
      await addLoyaltyCustomer(newCustomer.email, newCustomer.initialStamps)
      await fetchCustomers()
      setNewCustomer({ email: "", initialStamps: 0 })
      setShowAddCustomer(false)
      alert("Customer added successfully!")
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to add customer")
    } finally {
      setIsAddingCustomer(false)
    }
  }

  // Add a stamp
  const addStamp = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) return
    const newStamps = Math.min(customer.stamps + 1, 10)
    const rewardAvailable = newStamps >= 10
    try {
      const { error } = await supabase.from("loyalty").update({ stamps: newStamps, reward_available: rewardAvailable }).eq("id", customerId)
      if (error) throw error
      setCustomers(customers.map((c) => (c.id === customerId ? { ...c, stamps: newStamps, reward_available: rewardAvailable } : c)))
    } catch (error) {
      console.error("Error adding stamp:", error)
    }
  }

  // Reset reward
  const resetCustomerReward = async (customerId: string) => {
    try {
      const { error } = await supabase.from("loyalty").update({ stamps: 0, reward_available: false }).eq("id", customerId)
      if (error) throw error
      setCustomers(customers.map((c) => (c.id === customerId ? { ...c, stamps: 0, reward_available: false } : c)))
    } catch (error) {
      console.error("Error resetting reward:", error)
    }
  }

  if (isLoading) return <p>Loading customers...</p>

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Customers</p>
              <p className="text-3xl font-bold">{stats.totalCustomers}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-30" />
          </div>
        </Card>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Ready to Claim</p>
              <p className="text-3xl font-bold">{stats.rewardsAvailable}</p>
            </div>
            <Gift className="w-10 h-10 text-green-600 opacity-30" />
          </div>
        </Card>
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Stamps Earned</p>
              <p className="text-3xl font-bold">{stats.totalStamps}</p>
            </div>
            <Zap className="w-10 h-10 text-amber-600 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Add Customer Form */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Customer Management</h3>
          <Button onClick={() => setShowAddCustomer(!showAddCustomer)} variant={showAddCustomer ? "outline" : "default"} size="sm">
            {showAddCustomer ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Add Customer</>}
          </Button>
        </div>

        {showAddCustomer && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-muted p-4 rounded-lg space-y-3 mb-4 border border-border">
              <Input type="email" placeholder="customer@example.com" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="10" value={newCustomer.initialStamps} onChange={(e) => setNewCustomer({ ...newCustomer, initialStamps: Number(e.target.value) })} className="flex-1 h-2 rounded-lg cursor-pointer" />
                <span>{newCustomer.initialStamps}/10</span>
              </div>
              <Button onClick={handleAddCustomer} disabled={isAddingCustomer} className="w-full">
                {isAddingCustomer ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Customer"}
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
            <Input placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {(["all", "ready", "active"] as const).map((type) => (
              <Button key={type} variant={filterType === type ? "default" : "outline"} size="sm" onClick={() => setFilterType(type)}>
                {type === "all" ? "All" : type === "ready" ? "Ready" : "Active"}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customers List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Customers ({filteredCustomers.length})</h3>
        <AnimatePresence>
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">No customers found</p></Card>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div key={customer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium truncate">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">Member since {new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-sm ${i < customer.stamps ? "bg-amber-400 text-amber-900" : "bg-muted text-muted-foreground"}`}>{i < customer.stamps ? "✓" : ""}</div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {customer.reward_available && <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Ready 🎁</div>}
                    <Button size="sm" variant="outline" onClick={() => addStamp(customer.id)} disabled={customer.stamps >= 10}>+1</Button>
                    {customer.reward_available && <Button size="sm" variant="default" onClick={() => resetCustomerReward(customer.id)}>Reset</Button>}
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
