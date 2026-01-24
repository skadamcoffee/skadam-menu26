"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit2, Plus, Search, Filter, Download, Eye, EyeOff, Megaphone, Calendar, Loader2 } from "lucide-react"
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
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all")
  const [selectedPromotions, setSelectedPromotions] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)

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

  useEffect(() => {
    filterPromotions()
  }, [promotions, searchTerm, filterType])

  const fetchPromotions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("promotions").select("*").order("display_order", { ascending: true })

      if (error) throw error
      setPromotions(data || [])
    } catch (err) {
      console.error("Error fetching promotions:", err)
      setError("Failed to fetch promotions")
    } finally {
      setIsLoading(false)
    }
  }

  const filterPromotions = () => {
    let filtered = promotions.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterType === "active") filtered = filtered.filter((p) => p.is_active)
    else if (filterType === "inactive") filtered = filtered.filter((p) => !p.is_active)
    setFilteredPromotions(filtered)
  }

  const uploadImage = async (file: File) => {
    if (!file) return null
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const filePath = `promotions/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) throw error

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("UPLOAD ERROR:", error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a promotion title")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

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
        setSuccess("Promotion updated successfully!")
      } else {
        const { error: insertError } = await supabase.from("promotions").insert([
          {
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
          },
        ])

        if (insertError) throw insertError
        setSuccess("Promotion created successfully!")
      }

      await fetchPromotions()
      resetForm()
      setTimeout(() => setSuccess(""), 3000)
      // ✅ Call Edge Function for push notifications
    if (promotionId) {
      await fetch(
        "https://ncfbpqsziufcjxsrhbeo.supabase.co/functions/v1/push-notifications",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "promotion",
            title: formData.title,
            body: formData.description || "New promotion available!",
          }),
        }
      )
    }
      
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
      setSelectedPromotions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      await fetchPromotions()
      setSuccess("Promotion deleted successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting promotion:", err)
      setError("Failed to delete promotion")
    }
  }

  const bulkDelete = async () => {
    if (selectedPromotions.size === 0) return
    try {
      const { error } = await supabase.from("promotions").delete().in("id", Array.from(selectedPromotions))
      if (error) throw error
      setSelectedPromotions(new Set())
      await fetchPromotions()
      setSuccess("Selected promotions deleted!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error bulk deleting:", err)
      setError("Failed to delete selected promotions")
    }
  }

  const exportData = () => {
    const csv = [
      ["Title", "Description", "Discount Text", "Start Date", "End Date", "Active", "Display Order"],
      ...promotions.map((p) => [
        p.title,
        p.description,
        p.discount_text,
        p.start_date,
        p.end_date,
        p.is_active ? "Yes" : "No",
        p.display_order,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `promotions-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
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

  const toggleSelection = (id: string) => {
    setSelectedPromotions((prev) => {
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
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
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
            <Megaphone className="h-6 w-6" />
            Promotions & Offers
          </h2>
          <p className="text-muted-foreground">Manage your coffee shop promotions and special offers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Promotion
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
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promotions..."
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
          {selectedPromotions.size > 0 && (
            <Button variant="destructive" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedPromotions.size})
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
                  {editingId ? "Edit Promotion" : "Create New Promotion"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      placeholder="e.g., Weekend Special"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Text</label>
                    <Input
                      placeholder="e.g., Buy 2 Get 1 Free"
                      value={formData.discount_text}
                      onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Promotion details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <Input
                    type="file"
                    accept="image/*"
                                        onChange={async (e) => {
                      if (!e.target.files?.[0]) return
                      const url = await uploadImage(e.target.files[0])
                      if (url) setFormData({ ...formData, image_url: url })
                    }}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                  {formData.image_url && (
                    <div className="mt-2 relative inline-block">
                      <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number.parseInt(e.target.value) || 0 })}
                    />
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
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading || !formData.title.trim()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {editingId ? "Update" : "Create"} Promotion
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPromotions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No promotions found.</p>
            </motion.div>
          ) : (
            filteredPromotions.map((promo, index) => (
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
                        checked={selectedPromotions.has(promo.id)}
                        onCheckedChange={() => toggleSelection(promo.id)}
                        aria-label={`Select promotion ${promo.title}`}
                      />
                      <span className="text-xs text-muted-foreground">Select</span>
                    </div>
                  )}
                  {promo.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={promo.image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{promo.title}</h3>
                      {!promo.is_active && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Inactive</span>
                      )}
                    </div>
                    {promo.discount_text && (
                      <div className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium mb-2 w-fit">
                        {promo.discount_text}
                      </div>
                    )}
                    {promo.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promo.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-auto mb-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
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
