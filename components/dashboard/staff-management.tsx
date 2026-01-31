"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  LogOut,
  LogIn,
  Users,
  Plus,
  Trash2,
  Search,
  Download,
  Loader2,
  Eye,
  EyeOff,
  Edit,
} from "lucide-react"
import { toast } from "sonner"

interface StaffLog {
  id: string
  user_id: string
  activity_type: "login" | "logout"
  timestamp: string
  ip_address: string
  device_info: string
  user_email: string
}

interface StaffMember {
  id: string
  email: string
  role: string
  created_at: string
  barista_name?: string
  is_active?: boolean
  lastLogin?: string
  isCurrentlyLoggedIn?: boolean
}

export function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [logs, setLogs] = useState<StaffLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<StaffLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"staff" | "logs">("staff")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [newStaff, setNewStaff] = useState({ email: "", password: "", role: "barista", barista_name: "" })
  const [editStaff, setEditStaff] = useState({ email: "", role: "barista", barista_name: "", is_active: true })
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchStaff, setSearchStaff] = useState("")
  const [searchLogs, setSearchLogs] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set())
  const [previewMode, setPreviewMode] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [staffMembers, searchStaff])

  useEffect(() => {
    filterLogs()
  }, [logs, searchLogs])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (!supabase) {
        toast.error("Supabase client not available")
        return
      }

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, email, role, created_at, barista_name, is_active")
        .order("created_at", { ascending: false })

      if (staffError) {
        console.error("Error fetching staff:", staffError)
        toast.error("Failed to load staff data")
        throw staffError
      }

      const { data: logsData, error: logsError } = await supabase
        .from("staff_activity_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)

      if (logsError) {
        console.error("Error fetching logs:", logsError)
        toast.error("Failed to load activity logs")
      }

      if (staffData) {
        const staffIds = staffData.map((s) => s.id)
        const lastLogs = await Promise.all(
          staffIds.map((id) =>
            supabase
              .from("staff_activity_logs")
              .select("*")
              .eq("user_id", id)
              .order("timestamp", { ascending: false })
              .limit(1)
          )
        )

        const processedStaff = staffData.map((staffMember, index) => {
          const lastLog = lastLogs[index]?.data?.[0]
          const isLoggedIn = lastLog?.activity_type === "login"
          return {
            ...staffMember,
            lastLogin: lastLog?.timestamp,
            isCurrentlyLoggedIn: isLoggedIn,
          }
        })
        setStaffMembers(processedStaff)
      }

      if (logsData && staffData) {
        const processedLogs = logsData.map((log) => ({
          ...log,
          user_email: staffData.find((s) => s.id === log.user_id)?.email || "Unknown",
        }))
        setLogs(processedLogs)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterStaff = () => {
    setFilteredStaff(
      staffMembers.filter((s) => s.email.toLowerCase().includes(searchStaff.toLowerCase()))
    )
  }

  const filterLogs = () => {
    setFilteredLogs(
      logs.filter((l) =>
        l.user_email.toLowerCase().includes(searchLogs.toLowerCase()) ||
        l.activity_type.toLowerCase().includes(searchLogs.toLowerCase())
      )
    )
  }

  const validateForm = (isEdit = false) => {
    const formData = isEdit ? editStaff : newStaff
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!isEdit && !newStaff.password.trim()) newErrors.password = "Password is required"
    if (!["barista", "staff", "admin"].includes(formData.role)) newErrors.role = "Invalid role selected"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddStaff = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before adding")
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newStaff.email,
          password: newStaff.password,
          role: newStaff.role,
          barista_name: newStaff.barista_name || null,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to add staff member"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setNewStaff({ email: "", password: "", role: "barista", barista_name: "" })
      setShowAddForm(false)
      toast.success("Staff member added successfully!")
      fetchData()
    } catch (error) {
      console.error("Error adding staff:", error)
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditStaff = async () => {
    if (!editingStaff || !validateForm(true)) {
      toast.error("Please fix the errors before editing")
      return
    }

    setIsEditing(true)
    try {
      const response = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingStaff.id,
          role: editStaff.role,
          barista_name: editStaff.barista_name || null,
          is_active: editStaff.is_active,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to edit staff member"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setShowEditForm(false)
      setEditingStaff(null)
      toast.success("Staff member updated successfully!")
      fetchData()
    } catch (error) {
      console.error("Error editing staff:", error)
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setIsEditing(false)
    }
  }

  const openEditForm = (staff: StaffMember) => {
    setEditingStaff(staff)
    setEditStaff({
      email: staff.email,
      role: staff.role,
      barista_name: staff.barista_name || "",
      is_active: staff.is_active ?? true,
    })
    setShowEditForm(true)
  }

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return

    try {
      const response = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete staff member"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      toast.success("Staff member deleted successfully!")
      fetchData()
    } catch (error) {
      console.error("Error deleting staff:", error)
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(`Error: ${errorMsg}`)
    }
  }

  const bulkDeleteStaff = async () => {
    if (selectedStaff.size === 0) return
    if (!confirm(`Delete ${selectedStaff.size} selected staff members?`)) return

    try {
      await Promise.all(Array.from(selectedStaff).map((id) => handleDeleteStaff(id)))
      setSelectedStaff(new Set())
      toast.success("Selected staff deleted!")
    } catch (error) {
      toast.error("Failed to delete selected staff")
    }
  }

  const exportLogs = () => {
    const csv = [
      ["Email", "Activity", "Timestamp", "IP Address", "Device Info"],
      ...logs.map((l) => [
        l.user_email,
        l.activity_type,
        l.timestamp,
        l.ip_address || "N/A",
        l.device_info || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `staff-activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Logs exported!")
  }

  const toggleSelection = (id: string) => {
    setSelectedStaff((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading staff data...</p>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Staff Management
          </h1>
          <p className="text-muted-foreground">Manage your staff members and monitor activity</p>
        </div>
        <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {previewMode ? "Edit Mode" : "Preview"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 rounded-t-md ${
            activeTab === "staff"
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Members ({filteredStaff.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 rounded-t-md ${
            activeTab === "logs"
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Clock className="w-4 h-4" />
          Activity Logs ({filteredLogs.length})
        </button>
      </div>

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!previewMode && (
                <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              )}
            </div>
            {selectedStaff.size > 0 && !previewMode && (
              <Button variant="destructive" onClick={bulkDeleteStaff}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedStaff.size})
              </Button>
            )}
          </div>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && !previewMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-primary/20 bg-primary/5 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Staff Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input
                        type="email"
                        placeholder="staff@example.com"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password *</label>
                      <Input
                        type="password"
                        placeholder="Enter a secure password"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      />
                      {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role *</label>
                      <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barista">barista</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">barista Name (Optional)</label>
                      <Input
                        placeholder="e.g., John Doe"
                        value={newStaff.barista_name}
                        onChange={(e) => setNewStaff({ ...newStaff, barista_name: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStaff} disabled={isAdding}>
                        {isAdding ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Staff
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Form */}
          <AnimatePresence>
            {showEditForm && !previewMode && editingStaff && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-primary/20 bg-primary/5 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Edit Staff Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email (Read-only)</label>
                      <Input
                        type="email"
                        value={editStaff.email}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role *</label>
                      <Select value={editStaff.role} onValueChange={(value) => setEditStaff({ ...editStaff, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barista">barista</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Barista Name (Optional)</label>
                      <Input
                        placeholder="e.g., John Doe"
                        value={editStaff.barista_name}
                        onChange={(e) => setEditStaff({ ...editStaff, barista_name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaff.is_active}
                        onChange={(e) => setEditStaff({ ...editStaff, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowEditForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditStaff} disabled={isEditing}>
                        {isEditing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Staff
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staff List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredStaff.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
                >
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No staff members found.</p>
                </motion.div>
              ) : (
                filteredStaff.map((staff, idx) => (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 ${!staff.is_active ? 'opacity-50' : ''}`}>
                      {!previewMode && (
                        <div className="p-2 bg-muted/50 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedStaff.has(staff.id)}
                            onChange={() => toggleSelection(staff.id)}
                            className="w-4 h-4"
                            aria-label={`Select ${staff.email}`}
                          />
                          <span className="text-xs text-muted-foreground">Select</span>
                        </div>
                      )}
                      <CardContent className="pt-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              staff.isCurrentlyLoggedIn ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <h3 className="font-bold text-lg truncate">{staff.email}</h3>
                          <Badge variant="outline" className="text-xs">
                            {staff.role}
                          </Badge>
                          {staff.barista_name && (
                            <Badge variant="secondary" className="text-xs">
                              {staff.barista_name}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 flex-1">
                          <p className="text-sm text-muted-foreground">
                            Member since: {format(new Date(staff.created_at), "MMM d, yyyy")}
                          </p>
                          {staff.lastLogin && (
                            <p className="text-sm text-muted-foreground">
                              Last activity: {format(new Date(staff.lastLogin), "MMM d, yyyy HH:mm")}
                            </p>
                          )}
                          <Badge variant={staff.is_active ? "default" : "destructive"} className="text-xs">
                            {staff.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {!previewMode && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => openEditForm(staff)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                            <Badge
                              variant={staff.isCurrentlyLoggedIn ? "default" : "secondary"}
                              className="flex-1 justify-center"
                            >
                              {staff.isCurrentlyLoggedIn ? (
                                <div className="flex items-center gap-1">
                                  <LogIn className="w-3 h-3" />
                                  Logged In
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <LogOut className="w-3 h-3" />
                                  Logged Out
                                </div>
                              )}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search and Export */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or activity..."
                value={searchLogs}
                onChange={(e) => setSearchLogs(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>

          {/* Logs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
                >
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity logs found.</p>
                </motion.div>
              ) : (
                filteredLogs.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          {log.activity_type === "login" ? (
                            <LogIn className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                          ) : (
                            <LogOut className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{log.user_email}</p>
                              <Badge variant={log.activity_type === "login" ? "default" : "secondary"} className="text-xs">
                                {log.activity_type === "login" ? "Login" : "Logout"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                            </p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                              {log.device_info && <span>Device: {log.device_info}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )
}
