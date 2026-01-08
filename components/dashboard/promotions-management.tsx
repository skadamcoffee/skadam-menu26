"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit2, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Promotion {
  id: string
  title: string
  description: string
  image_url: string
  discount_text: string
  start_date: string
  end_date: string
  is_active: boolean
  display_order: number
  created_at: string
}

export function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    discount_text: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: true,
    display_order: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPromotions()
  }, [])

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase.from("promotions").select("*").order("display_order", { ascending: true })

      if (error) throw error
      setPromotions(data || [])
    } catch (err) {
      console.error("Error fetching promotions:", err)
      setError("Failed to fetch promotions")
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a promotion title")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("promotions")
          .update({
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
          })
          .eq("id", editingId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("promotions").insert([
          {
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
          },
        ])

        if (insertError) throw insertError
      }

      await fetchPromotions()
      resetForm()
    } catch (err) {
      console.error("Error saving promotion:", err)
      setError("Failed to save promotion")
    } finally {
      setIsLoading(false)
    }
  }

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", id)

      if (error) throw error
      setDeleteConfirm(null)
      await fetchPromotions()
    } catch (err) {
      console.error("Error deleting promotion:", err)
      setError("Failed to delete promotion")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      discount_text: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_active: true,
      display_order: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (promo: Promotion) => {
    setFormData({
      title: promo.title,
      description: promo.description || "",
      image_url: promo.image_url || "",
      discount_text: promo.discount_text || "",
      start_date: promo.start_date.split("T")[0],
      end_date: promo.end_date.split("T")[0],
      is_active: promo.is_active,
      display_order: promo.display_order,
    })
    setEditingId(promo.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promotions & Offers</h2>
          <p className="text-muted-foreground">Manage your coffee shop promotions and special offers</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Promotion
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
                <CardTitle>{editingId ? "Edit Promotion" : "Create New Promotion"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="e.g., Weekend Special"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Discount Text</label>
                    <Input
                      placeholder="e.g., Buy 2 Get 1 Free"
                      value={formData.discount_text}
                      onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Promotion details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Display Order</label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) })}
                    />
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
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Promotion"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                {promo.image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={promo.image_url || "/placeholder.svg"}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1">{promo.title}</h3>
                  {promo.discount_text && (
                    <div className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium mb-2 w-fit">
                      {promo.discount_text}
                    </div>
                  )}
                  {promo.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promo.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-auto mb-3">
                    {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
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

      {promotions.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <div className="text-4xl mb-2">🎯</div>
          <p>No promotions yet. Create one to showcase your special offers!</p>
        </motion.div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The promotion will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deletePromotion(deleteConfirm)}
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
