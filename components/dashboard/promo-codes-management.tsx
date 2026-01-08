"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit2, Plus, Copy, Check } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
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

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPromoCodes(data || [])
    } catch (err) {
      console.error("Error fetching promo codes:", err)
      setError("Failed to fetch promo codes")
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
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

      console.log("[v0] Saving promo code with dates:", { startDate, endDate })

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

        if (updateError) {
          console.log("[v0] Update error:", updateError)
          throw updateError
        }
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

        if (insertError) {
          console.log("[v0] Insert error:", insertError)
          throw insertError
        }
      }

      await fetchPromoCodes()
      resetForm()
      toast.success(editingId ? "Promo code updated!" : "Promo code created!")
    } catch (err) {
      console.error("Error saving promo code:", err)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save promo code. Please check your permissions and try again."
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
      await fetchPromoCodes()
      toast.success("Promo code deleted!")
    } catch (err) {
      console.error("Error deleting promo code:", err)
      setError("Failed to delete promo code")
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-muted-foreground">Manage discount codes for your customers</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Promo Code" : "Create New Promo Code"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Code</label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., SUMMER20"
                      />
                      <Button size="sm" variant="outline" onClick={generateCode} type="button">
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Discount Type</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Discount Value</label>
                    <Input
                      type="number"
                      value={String(formData.discount_value || 0)}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min. Order Value</label>
                    <Input
                      type="number"
                      value={formData.min_order_value === null ? "" : formData.min_order_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_order_value: e.target.value ? Number.parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Max Uses (leave empty for unlimited)</label>
                  <Input
                    type="number"
                    value={formData.max_uses === null ? "" : formData.max_uses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_uses: e.target.value ? Number.parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Promo Code"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {promoCodes.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <code className="bg-muted px-3 py-2 rounded font-mono font-bold text-sm flex-1 mr-2">
                      {promo.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(promo.code)}
                      className="p-2 hover:bg-muted rounded transition-colors"
                    >
                      {copiedCode === promo.code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
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
                    <div className="text-xs text-muted-foreground">
                      {new Date(promo.start_date).toLocaleDateString()} -{" "}
                      {new Date(promo.end_date).toLocaleDateString()}
                    </div>
                    {!promo.is_active && <div className="text-xs text-destructive">Inactive</div>}
                  </div>

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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {promoCodes.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <div className="text-4xl mb-2">🎟️</div>
          <p>No promo codes yet. Create one to offer discounts!</p>
        </motion.div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
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
