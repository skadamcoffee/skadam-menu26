"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2, Search, Plus, Ruler, Palette, Zap, Package, CupSoda, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import Image from "next/image" // Assuming you're using Next.js for images

interface Customization {
  id: string
  name: string
  description: string | null
  price: number
  group_key: string
  group_label: string
  required: boolean
  min_select: number
  max_select: number
  sort_order: number
  price_type: "fixed" | "percentage"
}

interface SelectedCustomization {
  id: string
  name: string
  price: number
  group_key: string
  group_label: string
  required: boolean
  min_select: number
  max_select: number
  sort_order: number
  price_type: "fixed" | "percentage"
}

interface CustomizationSelectorProps {
  isOpen: boolean
  productId: string
  productName: string
  currentCustomizations: SelectedCustomization[]
  onSave: (customizations: SelectedCustomization[]) => void
  onClose: () => void
  currencyCode?: string
  currencySymbol?: string
}

export function CustomizationSelector({
  isOpen,
  productId,
  productName,
  currentCustomizations,
  onSave,
  onClose,
  currencyCode = "د.ت",
  currencySymbol = "+",
}: CustomizationSelectorProps) {
  const supabase = createClient()

  const [customizations, setCustomizations] = useState<Customization[]>([])
  const [filteredCustomizations, setFilteredCustomizations] = useState<Customization[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null) // Updated to match schema

  const fetchedRef = useRef(false)

  // Function to get icon based on group_key
  const getGroupIcon = (groupKey: string) => {
    switch (groupKey.toLowerCase()) {
      case "size":
        return <CupSoda className="w-5 h-5" />
      case "color":
        return <Palette className="w-5 h-5" />
      case "addon":
        return <Zap className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  // Group customizations by group_key
  const groupedCustomizations = useMemo(() => {
    return filteredCustomizations.reduce((acc, item) => {
      if (!acc[item.group_key]) {
        acc[item.group_key] = []
      }
      acc[item.group_key].push(item)
      return acc
    }, {} as Record<string, Customization[]>)
  }, [filteredCustomizations])

  // Validate selections for each group
  const validateSelections = (selected: Set<string>): Record<string, string> => {
    const errors: Record<string, string> = {}
    Object.entries(groupedCustomizations).forEach(([groupKey, items]) => {
      const selectedInGroup = items.filter(item => selected.has(item.id)).length
      const firstItem = items[0]
      if (selectedInGroup < firstItem.min_select) {
        errors[groupKey] = `Select at least ${firstItem.min_select} option(s) for ${firstItem.group_label}.`
      }
      if (selectedInGroup > firstItem.max_select) {
        errors[groupKey] = `Select at most ${firstItem.max_select} option(s) for ${firstItem.group_label}.`
      }
      if (firstItem.required && selectedInGroup === 0) {
        errors[groupKey] = `${firstItem.group_label} is required.`
      }
    })
    return errors
  }

  useEffect(() => {
    if (!isOpen || !productId || fetchedRef.current) return

    fetchedRef.current = true
    setLoading(true)

    // Preselect current customizations
    setSelectedIds(new Set(currentCustomizations.map(c => c.id)))

    // Fetch product image_url
    supabase
      .from("products")
      .select("image_url")
      .eq("id", productId)
      .single()
      .then(({ data: productData, error: productError }) => {
        if (productError) {
          console.error("Error loading product image:", productError)
          // Optionally show a toast, but since it's not critical, we'll just log it
        } else {
          setProductImageUrl(productData?.image_url || null)
        }
      })

    // Fetch customizations
    supabase
      .from("customizations")
      .select(`
        id, name, description, price,
        group_key, group_label, required,
        min_select, max_select, sort_order, price_type
      `)
      .eq("product_id", productId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading customizations:", error)
          toast.error("Failed to load customizations")
          return
        }

        setCustomizations(
          (data || []).map(item => ({
            ...item,
            price: Number(item.price),
            min_select: Number(item.min_select),
            max_select: Number(item.max_select),
            sort_order: Number(item.sort_order),
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [isOpen, productId, currentCustomizations])

  useEffect(() => {
    const filtered = customizations.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredCustomizations(filtered)
  }, [customizations, searchTerm])

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false
      setCustomizations([])
      setFilteredCustomizations([])
      setSelectedIds(new Set())
      setSearchTerm("")
      setFocusedIndex(-1)
      setValidationErrors({})
      setProductImageUrl(null) // Reset product image URL
    }
  }, [isOpen])

  const toggleCustomization = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const isSelected = next.has(id)
      if (isSelected) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // Validate after change
      const errors = validateSelections(next)
      setValidationErrors(errors)
      return next
    })
  }

  const handleSave = () => {
    const errors = validateSelections(selectedIds)
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the selection errors before saving.")
      return
    }

    const selected = customizations
      .filter(c => selectedIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        group_key: c.group_key,
        group_label: c.group_label,
        required: c.required,
        min_select: c.min_select,
        max_select: c.max_select,
        sort_order: c.sort_order,
        price_type: c.price_type,
      }))
    onSave(selected)
    toast.success("Customizations saved!")
    onClose()
  }

  const totalPrice = useMemo(() => {
    return customizations
      .filter(c => selectedIds.has(c.id))
      .reduce((sum, c) => sum + c.price, 0)
  }, [customizations, selectedIds])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* PRODUCT IMAGE HEADER */}
        <div className="relative h-48 sm:h-64 bg-gray-100 dark:bg-gray-800">
          {productImageUrl ? (
            <Image
              src={productImageUrl}
              alt={productName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-1">{productName}</h2>
            <p className="text-white/80 text-sm">
              {selectedIds.size} {selectedIds.size === 1 ? "option" : "options"} selected
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* CUSTOMIZATION LIST */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              ))}
            </div>
          ) : Object.keys(groupedCustomizations).length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? "No customizations match your search" : "No customizations available"}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {Object.entries(groupedCustomizations).map(([groupKey, items], groupIndex) => (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {getGroupIcon(groupKey)}
                      {items[0].group_label}
                    </h3>
                    {validationErrors[groupKey] && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors[groupKey]}
                      </div>
                    )}
                  </div>
                  {groupKey.toLowerCase() === "size" ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {items.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => toggleCustomization(item.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-md border transition-colors ${
                            selectedIds.has(item.id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <CupSoda className="w-6 h-6 text-gray-600" />
                          <span className="text-sm font-medium text-center">{item.name}</span>
                          <span className="text-xs text-gray-500">{currencySymbol}{item.price.toFixed(2)}</span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => toggleCustomization(item.id)}
                          className={`w-full p-4 rounded-md border flex items-center gap-4 transition-colors ${
                            selectedIds.has(item.id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className={`p-2 rounded ${selectedIds.has(item.id) ? "bg-blue-100" : "bg-gray-100"}`}>
                            {getGroupIcon(item.group_key)}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            {item.description && <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{currencySymbol}{item.price.toFixed(2)}</p>
                            <div className={`w-5 h-5 rounded-full border mt-1 ${
                              selectedIds.has(item.id) ? "border-blue-500 bg-blue-500" : "border-gray-300"
                            }`}>
                              {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white m-auto" />}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {selectedIds.size > 0 && (
            <div className="flex justify-between items-center mb-4 p-3 bg-white dark:bg-gray-700 rounded-md">
              <span className="font-semibold text-gray-900 dark:text-white">Total add-ons:</span>
              <span className="text-xl font-bold text-blue-600">{currencySymbol}{totalPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
            }
