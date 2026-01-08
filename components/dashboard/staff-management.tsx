'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Clock, LogOut, LogIn, Users, Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface StaffLog {
  id: string
  user_id: string
  activity_type: 'login' | 'logout'
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
  lastLogin?: string
  isCurrentlyLoggedIn?: boolean
  user_id?: string // Corrected to match the staff table
}

export function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [logs, setLogs] = useState<StaffLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'staff' | 'logs'>('staff')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStaff, setNewStaff] = useState({ email: '', password: '' })
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch staff members from the 'staff' table
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*') // Fetches all columns, including user_id
        .order('created_at', { ascending: false })

      if (staffError) {
        console.error('Error fetching staff:', staffError)
        throw staffError;
      }

      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('staff_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (logsError) console.error('Error fetching logs:', logsError)

      if (staffData) {
        // Process staff members with their latest login/logout info
        const processedStaff = staffData.map((staffMember) => {
          const userLogs = logsData?.filter((log) => log.user_id === staffMember.user_id) || []
          const lastLog = userLogs[0]
          const isLoggedIn = lastLog?.activity_type === 'login'

          return {
            ...staffMember,
            id: staffMember.user_id, // Use user_id for key and delete operations
            lastLogin: lastLog?.timestamp,
            isCurrentlyLoggedIn: isLoggedIn,
          }
        })

        setStaffMembers(processedStaff)
      }

      if (logsData && staffData) {
        const processedLogs = logsData.map((log) => ({
          ...log,
          user_email: staffData?.find((s) => s.user_id === log.user_id)?.email || 'Unknown',
        }))
        setLogs(processedLogs)
      }
    } catch (error) {
      console.error('[v0] Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.password) {
      alert('Please fill in all fields')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newStaff.email,
          password: newStaff.password,
          role: 'staff', // Role for both users and staff table
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to add staff member')
      }

      setNewStaff({ email: '', password: '' })
      setShowAddForm(false)
      alert('Staff member added successfully!')
      fetchData() // Refresh the data
    } catch (error) {
      console.error('[v0] Error adding staff:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred'
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const response = await fetch('/api/staff', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }), // Pass the user_id
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to delete staff member')
      }

      alert('Staff member deleted successfully!')
      fetchData() // Refresh the data
    } catch (error) {
      console.error('[v0] Error deleting staff:', error)
      alert('Failed to delete staff member')
    }
  }

  // ... (rest of the component remains the same)


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">☕</div>
          <p className="text-muted-foreground">Loading staff data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Management</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Members ({staffMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          Activity Logs
        </button>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {showAddForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="p-6 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddStaff} disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Staff'}
                </Button>
              </Card>
            </motion.div>
          )}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          )}
          {staffMembers.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No staff members found</Card>
          ) : (
            staffMembers.map((staff, idx) => (
              <motion.div
                key={staff.id} // This is now the user_id
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: staff.isCurrentlyLoggedIn ? '#10b981' : '#ef4444' }}
                      ></div>
                      <h3 className="font-bold text-lg">{staff.email}</h3>
                      <Badge variant="outline" className="text-xs">
                        {staff.role}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Member since: {format(new Date(staff.created_at), 'MMM d, yyyy')}
                      </p>
                      {staff.lastLogin && (
                        <p className="text-muted-foreground">
                          Last activity: {format(new Date(staff.lastLogin), 'MMM d, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleDeleteStaff(staff.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                    <Badge variant={staff.isCurrentlyLoggedIn ? 'default' : 'secondary'}>
                      {staff.isCurrentlyLoggedIn ? (
                        <div className="flex items-center gap-2">
                          <LogIn className="w-3 h-3" />
                          Logged In
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogOut className="w-3 h-3" />
                          Logged Out
                        </div>
                      )}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No activity logs found</Card>
          ) : (
            logs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {log.activity_type === 'login' ? (
                        <LogIn className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      ) : (
                        <LogOut className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.user_email}</p>
                          <Badge variant={log.activity_type === 'login' ? 'default' : 'secondary'} className="text-xs">
                            {log.activity_type === 'login' ? 'Login' : 'Logout'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                          {log.device_info && <span>Device: {log.device_info}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
