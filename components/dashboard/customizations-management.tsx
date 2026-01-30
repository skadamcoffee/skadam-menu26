"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, X, Search, Filter, ChevronDown, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion" // Assuming shadcn/ui Accordion is available

interface Customization {
  id: string
  product_id: string
  name: string
  description: string | null
  price: number
  is_available: boolean
  group_key: string
  group_label: string
  required: boolean
  min_select: number
  max_select: number
  sort_order: number
  price_type: "fixed" | "percentage"
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  name: string
}

interface CustomizationFormData {
  product_id: string
  name: string
  description: string
  price: string
  is_available: boolean
  group_key: string
  group_label: string
  required: boolean
  min_select: string
  max_select: string
  sort_order: string
  price_type: "fixed" | "percentage"
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
    product_id: "",
    name: "",
    description: "",
    price: "0.00",
    is_available: true,
    group_key: "extras",
    group_label: "Extras",
    required: false,
    min_select: "0",
    max_select: "1",
    sort_order: "0",
    price_type: "fixed",
  })

  // Fetch products and customizations on mount
  useEffect(() => {
    fetchProducts()
    fetchCustomizations()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("id, name").order("name")
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchCustomizations = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("customizations").select("*").order("sort_order")
      if (error) throw error
      setCustomizations((data || []).map((c) => ({ ...c, price: Number(c.price) })))
    } catch (error) {
      console.error("Error fetching customizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: "",
      name: "",
      description: "",
      price: "0.00",
      is_available: true,
      group_key: "extras",
      group_label: "Extras",
      required: false,
      min_select: "0",
      max_select: "1",
      sort_order: "0",
      price_type: "fixed",
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (c: Customization) => {
    setFormData({
      product_id: c.product_id,
      name: c.name,
      description: c.description || "",
      price: c.price.toFixed(2),
      is_available: c.is_available,
      group_key: c.group_key,
      group_label: c.group_label,
      required: c.required,
      min_select: c.min_select.toString(),
      max_select: c.max_select.toString(),
      sort_order: c.sort_order.toString(),
      price_type: c.price_type,
    })
    setEditingId(c.id)
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
        product_id: formData.product_id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        group_key: formData.group_key,
        group_label: formData.group_label,
        required: formData.required,
        min_select: parseInt(formData.min_select),
        max_select: parseInt(formData.max_select),
        sort_order: parseInt(formData.sort_order),
        price_type: formData.price_type,
        updated_at: new Date().toISOString(),
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

  // GROUP CUSTOMIZATIONS BY PRODUCT
  const groupedCustomizations = useMemo(() => {
    const groups: Record<string, { product: Product | undefined; customizations: Customization[] }> = {}
    filteredCustomizations.forEach((c) => {
      const product = products.find((p) => p.id === c.product_id)
    if (!product) return // 🔥 THIS LINE FIXES IT
      
      if (!groups[c.product_id]) {
        groups[c.product_id] = {
          product: products.find((p) => p.id === c.product_id),
          customizations: [],
        }
      }
      groups[c.product_id].customizations.push(c)
    })
    return Object.values(groups).sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || ""))
  }, [filteredCustomizations, products])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Customizations</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">Manage product customizations and add-ons</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-800 transition-all duration-200 shadow-md w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add Customization
          </Button>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 md:p-6 shadow-lg border border-slate-200 dark:border-slate-700 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
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
          <div className="flex items-center gap-2 min-w-[150px] md:min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Filter */}
          <div className="min-w-[120px] md:min-w-[150px]">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setProductFilter("all")
              setAvailabilityFilter("all")
            }}
            className="whitespace-nowrap py-3 px-4 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 w-full md:w-auto"
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
                className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {editingId ? "Edit Customization" : "Add New Customization"}
                  </h3>
                  <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  {/* Product Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Product *</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200"
                    >
                      <option value="" disabled>Select a product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Name & Description & Price */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Extra Shot" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 resize-none transition-all duration-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price (د.ت) *</label>
                    <input type="number" step="0.1" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                  </div>

                  {/* Group key/label */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Group Key</label>
                      <input type="text" value={formData.group_key} onChange={(e) => setFormData({ ...formData, group_key: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Group Label</label>
                      <input type="text" value={formData.group_label} onChange={(e) => setFormData({ ...formData, group_label: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                    </div>
                  </div>

                  {/* Required, Min/Max Select, Sort Order */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.required} onChange={(e) => setFormData({ ...formData, required: e.target.checked })} className="w-5 h-5 rounded border-slate-300 cursor-pointer focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400" />
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Required</label>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min Select</label>
                                            <input type="number" step="1" min="0" value={formData.min_select} onChange={(e) => setFormData({ ...formData, min_select: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Max Select</label>
                      <input type="number" step="1" min="1" value={formData.max_select} onChange={(e) => setFormData({ ...formData, max_select: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                    </div>
                  </div>

                  {/* Sort Order & Price Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sort Order</label>
                      <input type="number" step="1" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price Type</label>
                      <select value={formData.price_type} onChange={(e) => setFormData({ ...formData, price_type: e.target.value as "fixed" | "percentage" })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 transition-all duration-200">
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving} className="w-full gap-2">
                    {editingId ? "Update Customization" : "Add Customization"}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CUSTOMIZATIONS GROUPED BY PRODUCT - ENHANCED WITH ACCORDION */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-400 dark:text-slate-500">Loading customizations...</p>
            </div>
          ) : groupedCustomizations.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-400 dark:text-slate-500">No customizations found</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {groupedCustomizations.map((group) => (
                <AccordionItem key={group.product?.id || "unknown"} value={group.product?.id || "unknown"} className="bg-white dark:bg-slate-950 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white text-left">{group.product?.name || "Unknown Product"}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{group.customizations.length} customization{group.customizations.length !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 md:px-6 pb-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4">Available</th>
                            <th className="py-3 px-4">Required</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.customizations.map((c) => (
                            <tr key={c.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                              <td className="py-3 px-4">{c.name}</td>
                              <td className="py-3 px-4">{c.price.toFixed(2)} ({c.price_type})</td>
                              <td className="py-3 px-4">{c.is_available ? "Yes" : "No"}</td>
                              <td className="py-3 px-4">{c.required ? "Yes" : "No"}</td>
                              <td className="py-3 px-4 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {group.customizations.map((c) => (
                        <div key={c.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{c.name}</h4>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>Price: {c.price.toFixed(2)} ({c.price_type})</p>
                            <p>Available: {c.is_available ? "Yes" : "No"}</p>
                            <p>Required: {c.required ? "Yes" : "No"}</p>
                            {c.description && <p>Description: {c.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  )
}
