"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, X, Search, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Customization {
  id: string
  product_id: string
  name: string
  description: string | null
  price: number
  is_available: boolean
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  name: string
}

interface CustomizationFormData {
  name: string
  description: string
  price: string
  is_available: boolean
  product_id: string
}

export function CustomizationsManagement() {
  const supabase = createClient()

  const [customizations, setCustomizations] = useState<Customization[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [productFilter, setProductFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  const [formData, setFormData] = useState<CustomizationFormData>({
    name: "",
    description: "",
    price: "0",
    is_available: true,
    product_id: "",
  })

  // Fetch products and customizations on mount
  useEffect(() => {
    fetchProducts()
    fetchCustomizations()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name", { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchCustomizations = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("customizations")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error

      setCustomizations(
        (data || []).map((c) => ({
          ...c,
          price: Number(c.price),
        }))
      )
    } catch (error) {
      console.error("Error fetching customizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "0",
      is_available: true,
      product_id: "",
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (customization: Customization) => {
    setFormData({
      name: customization.name,
      description: customization.description || "",
      price: customization.price.toString(),
      is_available: customization.is_available,
      product_id: customization.product_id,
    })
    setEditingId(customization.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customization?")) return
    try {
      const { error } = await supabase.from("customizations").delete().eq("id", id)
      if (error) throw error
      await fetchCustomizations()
    } catch (error) {
      console.error("Error deleting customization:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.product_id) return

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        product_id: formData.product_id,
      }

      if (editingId) {
        const { error } = await supabase.from("customizations").update(payload).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("customizations").insert(payload)
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

  // FILTERED CUSTOMIZATIONS
  const filteredCustomizations = useMemo(() => {
    return customizations.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProduct = productFilter === "all" || c.product_id === productFilter
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && c.is_available) ||
        (availabilityFilter === "unavailable" && !c.is_available)
      return matchesSearch && matchesProduct && matchesAvailability
    })
  }, [customizations, searchTerm, productFilter, availabilityFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Customizations</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">Manage product customizations and add-ons</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-800 transition-all duration-200 shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Customization
          </Button>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
            />
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-2 min-w-[150px]">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Filter */}
          <div className="min-w-[120px]">
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-full py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setProductFilter("all")
              setAvailabilityFilter("all")
            }}
            className="whitespace-nowrap py-3 px-4 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            Clear Filters
          </Button>
        </div>

        {/* FORM MODAL */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={resetForm}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    {editingId ? "Edit Customization" : "Add New Customization"}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Product Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Product *
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                    >
                      <option value="" disabled>
                        Select a product
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Extra Shot"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 resize-none transition-all duration-200"
                      rows={3}
                    />
                  </div>

                  {/* Price */}
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                    />
                  </div>

                  {/* Available */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 cursor-pointer focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                    />
                    <label htmlFor="is_available" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Available for selection
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="button" onClick={resetForm} variant="outline" className="flex-1 py-3 rounded-xl bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || !formData.name || !formData.product_id}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-800 transition-all duration-200 shadow-md"
                    >
                      {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GROUPED CUSTOMIZATIONS BY PRODUCT */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-400 animate-spin mx-auto mb-6" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">Loading customizations...</p>
            </div>
          </div>
        ) : filteredCustomizations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="text-5xl mb-6">🔍</div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
              {customizations.length === 0 ? "No customizations yet" : "No customizations match your filters"}
            </p>
            {customizations.length > 0 && (
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setProductFilter("all")
                  setAvailabilityFilter("all")
                }}
                variant="outline"
                className="gap-2 py-3 px-6 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            {products.map((product) => {
              const productCustomizations = filteredCustomizations.filter((c) => c.product_id === product.id)
              if (productCustomizations.length === 0) return null

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Product Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">{product.name}</h3>
                    <Badge variant="secondary" className="px-3 py-1 rounded-full text-sm">
                      {productCustomizations.length} customization{productCustomizations.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Customizations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {productCustomizations.map((customization) => (
                        <motion.div
                          key={customization.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">{customization.name}</h4>
                                <Badge variant={customization.is_available ? "default" : "secondary"} className="shrink-0">
                                  {customization.is_available ? "Available" : "Unavailable"}
                                </Badge>
                              </div>
                              {customization.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                  {customization.description}
                                </p>
                              )}
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                +{customization.price.toFixed(2)} د.ت
                              </p>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-2 justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(customization)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-manipulation"
                                title="Edit"
                              >
                                <Edit2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(customization.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors touch-manipulation"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
