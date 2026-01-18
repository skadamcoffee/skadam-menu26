"use client"

import React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Customization {
  id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  created_at: string
}

interface CustomizationFormData {
  name: string
  description: string
  price: string
  category: string
  is_available: boolean
}

export function CustomizationsManagement() {
  const [customizations, setCustomizations] = useState<Customization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<CustomizationFormData>({
    name: "",
    description: "",
    price: "0",
    category: "Addons",
    is_available: true,
  })

  const supabase = createClient()
  const categories = ["Addons", "Modifications", "Extras", "Premium"]

  useEffect(() => {
    fetchCustomizations()
  }, [])

  const fetchCustomizations = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("customizations")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCustomizations(data || [])
    } catch (error) {
      console.error("Error fetching customizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

    setIsSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from("customizations")
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            is_available: formData.is_available,
          })
          .eq("id", editingId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("customizations").insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          is_available: formData.is_available,
        })

        if (error) throw error
      }

      await fetchCustomizations()
      resetForm()
    } catch (error) {
      console.error("Error saving customization:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (customization: Customization) => {
    setFormData({
      name: customization.name,
      description: customization.description,
      price: customization.price.toString(),
      category: customization.category,
      is_available: customization.is_available,
    })
    setEditingId(customization.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customization?")) return

    try {
      const { error } = await supabase
        .from("customizations")
        .delete()
        .eq("id", id)

      if (error) throw error
      await fetchCustomizations()
    } catch (error) {
      console.error("Error deleting customization:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "0",
      category: "Addons",
      is_available: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const groupedCustomizations = categories.reduce((acc, cat) => {
    acc[cat] = customizations.filter(c => c.category === cat)
    return acc
  }, {} as Record<string, Customization[]>)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Customizations</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage product customizations and add-ons</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900"
        >
          <Plus className="w-4 h-4" />
          Add Customization
        </Button>
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId ? "Edit Customization" : "Add New Customization"}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Extra Shot"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the customization"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Price (د.ت) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="is_available" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Available for selection
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || !formData.name}
                    className="flex-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900"
                  >
                    {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOMIZATIONS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading customizations...</p>
          </div>
        </div>
      ) : customizations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="text-4xl mb-4">✨</div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">No customizations yet</p>
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Customization
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCustomizations).map(([category, items]) =>
            items.length > 0 ? (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((customization) => (
                      <motion.div
                        key={customization.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                {customization.name}
                              </h4>
                              <Badge
                                variant={customization.is_available ? "default" : "secondary"}
                                className="flex-shrink-0"
                              >
                                {customization.is_available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            {customization.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {customization.description}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                              +{customization.price.toFixed(2)} د.ت
                            </p>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => handleEdit(customization)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(customization.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
  }
                        
