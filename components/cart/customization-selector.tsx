> 
     ) } 
"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2, Search, Plus, Ruler, Palette, Zap, Package, CupSoda, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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

  const fetchedRef = useRef(false)

  // Function to get icon based on group_key
  const getGroupIcon = (groupKey: string) => {
    switch (groupKey.toLowerCase()) {
      case "size":
        return <CupSoda className="w-6 h-6" />
      case "color":
        return <Palette className="w-6 h-6" />
      case "addon":
        return <Zap className="w-6 h-6" />
      default:
        return <Package className="w-6 h-6" />
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="truncate">Customize {productName}</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {selectedIds.size} {selectedIds.size === 1 ? "option" : "options"} selected
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close customization dialog"
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
          >
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* SEARCH */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 text-lg rounded-xl border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* CUSTOMIZATION LIST */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : Object.keys(groupedCustomizations).length === 0 ? (
            <div className="py-16 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
                <Plus className="h-12 w-12 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {searchTerm ? "No customizations match your search" : "No customizations available for this product"}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {Object.entries(groupedCustomizations).map(([groupKey, items], groupIndex) => (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                      {getGroupIcon(groupKey)}
                      {items[0].group_label}
                    </h3>
                    {validationErrors[groupKey] && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors[groupKey]}
                      </div>
                    )}
                  </div>
                  {groupKey.toLowerCase() === "size" ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                      {items.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleCustomization(item.id)}
                          className={`flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg min-w-[100px] snap-center ${
                            selectedIds.has(item.id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-200 dark:ring-blue-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          <div className={`p-3 rounded-lg ${selectedIds.has(item.id) ? "bg-blue-100 dark:bg-blue-900" : "bg-slate-100 dark:bg-slate-700"}`}>
                            <CupSoda className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                          </div>
                          <span className="text-sm font-medium text-center text-slate-900 dark:text-white leading-tight">{item.name}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{currencySymbol}{item.price.toFixed(2)} {currencyCode}</span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => toggleCustomization(item.id)}
                          onFocus={() => setFocusedIndex(index)}
                          onBlur={() => setFocusedIndex(-1)}
                          aria-pressed={selectedIds.has(item.id)}
                          className={`w-full p-6 rounded-xl border-2 flex items-start gap-4 transition-all duration-300 hover:shadow-lg ${
                            selectedIds.has(item.id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-200 dark:ring-blue-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
                          } ${focusedIndex === index ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <div className={`p-2 rounded-lg ${selectedIds.has(item.id) ? "bg-blue-100 dark:bg-blue-900" : "bg-slate-100 dark:bg-slate-700"}`}>
                            {getGroupIcon(item.group_key)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{item.name}</p>
                            {item.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{item.description}</p>}
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-3 flex flex-wrap gap-3">
                              {item.required && <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">Required</span>}
                              <span>Min: {item.min_select}</span>
                              <span>Max: {item.max_select}</span>
                              <span>Price type: {item.price_type}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {currencySymbol}{item.price.toFixed(2)} {currencyCode}
                            </span>
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                selectedIds.has(item.id)
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-slate-300 dark:border-slate-600 bg-transparent"
                              }`}
                            >
                              {selectedIds.has(item.id) && <Check className="w-5 h-5 text-white" />}
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
        <div className="px-6 py-6 border-t border-slate-200 dark:border-slate-700 space-y-6 bg-slate-50 dark:bg-slate-800">
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="flex justify-between items-center py-4 px-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-slate-200 dark:border-slate-600"
            >
              <span className="text-lg font-semibold text-slate-900 dark:text-white">Total add-ons:</span>
              <motion.span 
                key={totalPrice} 
                initial={{ scale: 1.2 }} 
                animate={{ scale: 1 }} 
                className="text-2xl font-bold text-blue-600 dark:text-blue-400"
              >
                {currencySymbol}{totalPrice.toFixed(2)} {currencyCode}
              </motion.span>
            </motion.div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="px-8 py-3 text-lg rounded-xl border-slate-300 dark:border-slate-600 hover:bg-slate-100
              dark:hover:bg-slate-700 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="px-8 py-3 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto"
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
      }
