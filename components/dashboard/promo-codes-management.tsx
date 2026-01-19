"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit2, Plus, Copy, Check, Search, Filter, Download, Eye, EyeOff, Ticket, Calendar, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface PromoCode {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_value: number | null
  max_uses: number | null
  current_uses: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export function PromoCodesManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [filteredPromoCodes, setFilteredPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all")
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as const,
    discount_value: 10,
    min_order_value: null as number | null,
    max_uses: null as number | null,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  useEffect(() => {
    filterPromoCodes()
  }, [promoCodes, searchTerm, filterType])

  const fetchPromoCodes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPromoCodes(data || [])
    } catch (err) {
      console.error("Error fetching promo codes:", err)
      setError("Failed to fetch promo codes")
    } finally {
      setIsLoading(false)
    }
  }

  const filterPromoCodes = () => {
    let filtered = promoCodes.filter((p) => p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterType === "active") filtered = filtered.filter((p) => p.is_active)
    else if (filterType === "inactive") filtered = filtered.filter((p) => !p.is_active)
    setFilteredPromoCodes(filtered)
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
    toast.success("Code generated!")
  }

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      setError("Please enter a promo code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const startDate = new Date(formData.start_date + "T00:00:00Z").toISOString()
      const endDate = new Date(formData.end_date + "T00:00:00Z").toISOString()

      if (editingId) {
        const { error: updateError } = await supabase
          .from("promo_codes")
          .update({
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order_value: formData.min_order_value,
            max_uses: formData.max_uses,
            start_date: startDate,
            end_date: endDate,
            is_active: formData.is_active,
          })
          .eq("id", editingId)

        if (updateError) throw updateError
        toast.success("Promo code updated!")
      } else {
        const { error: insertError } = await supabase.from("promo_codes").insert([
          {
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order_value: formData.min_order_value,
            max_uses: formData.max_uses,
            start_date: startDate,
            end_date: endDate,
            is_active: formData.is_active,
          },
        ])

        if (insertError) throw insertError
        toast.success("Promo code created!")
      }

      await fetchPromoCodes()
      resetForm()
    } catch (err) {
      console.error("Error saving promo code:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save promo code."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id)

      if (error) throw error
      setDeleteConfirm(null)
      setSelectedCodes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      await fetchPromoCodes()
      toast.success("Promo code deleted!")
    } catch (err) {
      console.error("Error deleting promo code:", err)
      setError("Failed to delete promo code")
      toast.error("Failed to delete promo code")
    }
  }

  const bulkDelete = async () => {
    if (selectedCodes.size === 0) return
    try {
      const { error } = await supabase.from("promo_codes").delete().in("id", Array.from(selectedCodes))
      if (error) throw error
      setSelectedCodes(new Set())
      await fetchPromoCodes()
      toast.success("Selected promo codes deleted!")
    } catch (err) {
      console.error("Error bulk deleting:", err)
      setError("Failed to delete selected promo codes")
      toast.error("Failed to delete selected promo codes")
    }
  }

  const exportData = () => {
    const csv = [
      ["Code", "Discount Type", "Discount Value", "Min Order", "Max Uses", "Current Uses", "Start Date", "End Date", "Active"],
      ...promoCodes.map((p) => [
        p.code,
        p.discount_type,
        p.discount_value,
        p.min_order_value || "N/A",
        p.max_uses || "Unlimited",
        p.current_uses,
        p.start_date,
        p.end_date,
        p.is_active ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `promo-codes-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Data exported!")
  }

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: null,
      max_uses: null,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_value: promo.min_order_value,
      max_uses: promo.max_uses,
      start_date: promo.start_date.split("T")[0],
      end_date: promo.end_date.split("T")[0],
      is_active: promo.is_active,
    })
    setEditingId(promo.id)
    setShowForm(true)
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleSelection = (id: string) => {
    setSelectedCodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="h-16 bg-muted rounded"></div>
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
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Promo Codes
          </h2>
          <p className="text-muted-foreground">Manage discount codes for your customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "inactive"] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {type === "all" ? "All" : type === "active" ? "Active" : "Inactive"}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {selectedCodes.size > 0 && (
            <Button variant="destructive" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedCodes.size})
            </Button>
          )}
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? "Edit Promo Code" : "Create New Promo Code"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Code *</label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., SUMMER20"
                        className="flex-1"
                      />
                      <Button size="sm" variant="outline" onClick={generateCode} type="button">
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Type</label>
                    <Select
                      value={formData.discount_type}
                                            onValueChange={(value) =>
                        setFormData({ ...formData, discount_type: value as "percentage" | "fixed" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (د.ت)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Value</label>
                    <Input
                      type="number"
                      value={formData.discount_value || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Min. Order Value (Optional)</label>
                    <Input
                      type="number"
                      value={formData.min_order_value === null ? "" : formData.min_order_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_order_value: e.target.value ? Number.parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Uses (Optional, leave empty for unlimited)</label>
                  <Input
                    type="number"
                    value={formData.max_uses === null ? "" : formData.max_uses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_uses: e.target.value ? Number.parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="e.g., 100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active
                  </label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading || !formData.code.trim()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {editingId ? "Update" : "Create"} Promo Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPromoCodes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No promo codes found.</p>
            </motion.div>
          ) : (
            filteredPromoCodes.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  {!previewMode && (
                    <div className="p-2 bg-muted/50 flex items-center gap-2">
                      <Checkbox
                        checked={selectedCodes.has(promo.id)}
                        onCheckedChange={() => toggleSelection(promo.id)}
                        aria-label={`Select promo code ${promo.code}`}
                      />
                      <span className="text-xs text-muted-foreground">Select</span>
                    </div>
                  )}
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <code className="bg-muted px-3 py-2 rounded font-mono font-bold text-sm flex-1 mr-2">
                        {promo.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(promo.code)}
                        aria-label={`Copy promo code ${promo.code}`}
                      >
                        {copiedCode === promo.code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2 mb-4 flex-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-semibold ml-2">
                          {promo.discount_value}
                          {promo.discount_type === "percentage" ? "%" : " د.ت"}
                        </span>
                      </div>
                      {promo.min_order_value && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Min Order:</span>
                          <span className="font-semibold ml-2">{promo.min_order_value} د.ت</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Usage:</span>
                        <span className="font-semibold ml-2">
                          {promo.current_uses}/{promo.max_uses || "∞"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                      </div>
                      {!promo.is_active && (
                        <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full w-fit">
                          Inactive
                        </div>
                      )}
                    </div>

                    {!previewMode && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(promo)} className="flex-1">
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm(promo.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {promoCodes.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <Ticket className="h-12 w-12 mx-auto mb-4" />
          <p>No promo codes yet. Create one to offer discounts!</p>
        </motion.div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The promo code will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deletePromoCode(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
