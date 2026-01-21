"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2, Search, Plus, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface Customization {
  id: string
  name: string
  description: string | null
  price: number
}

interface SelectedCustomization {
  id: string
  name: string
  price: number
}

interface CustomizationSelectorProps {
  isOpen: boolean
  productId: string
  productName: string
  productImage?: string
  productPrice: number
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
  productImage,
  productPrice,
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

  // Prevent infinite re-fetch
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!isOpen || !productId || fetchedRef.current) return

    fetchedRef.current = true
    setLoading(true)

    // Preselect existing customizations
    setSelectedIds(new Set(currentCustomizations.map(c => c.id)))

    supabase
      .from("customizations")
      .select("id, name, description, price")
      .eq("product_id", productId)
      .eq("is_available", true)
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
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [isOpen, productId])

  useEffect(() => {
    const filtered = customizations.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredCustomizations(filtered)
  }, [customizations, searchTerm])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false
      setCustomizations([])
      setFilteredCustomizations([])
      setSelectedIds(new Set())
      setSearchTerm("")
    }
  }, [isOpen])

  const toggleCustomization = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = () => {
    const selected = customizations
      .filter(c => selectedIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
      }))

    onSave(selected)
    toast.success("Customizations saved!")
    onClose()
  }

  const clearAll = () => {
    setSelectedIds(new Set())
  }

  // Calculate total price of selected items
  const totalPrice = customizations
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.price, 0)

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* PRODUCT CARD AT TOP */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex-shrink-0">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{productName}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{productPrice.toFixed(2)} {currencyCode}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Popular</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close customization dialog"
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Customize Your Order
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {selectedIds.size} {selectedIds.size === 1 ? "option" : "options"} selected
              </p>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredCustomizations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <Plus className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchTerm ? "No customizations match your search" : "No customizations available for this product"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredCustomizations.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleCustomization(item.id)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(-1)}
                  aria-pressed={selectedIds.has(item.id)}
                  className={`w-full p-4 rounded-xl border-2 flex justify-between items-start gap-4 transition-all duration-200 ${
                    selectedIds.has(item.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:shadow-md"
                  } ${focusedIndex === index ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {currencySymbol}{item.price.toFixed(2)} {currencyCode}
                    </span>
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedIds.has(item.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300 dark:border-slate-600 bg-transparent"
                      }`}
                    >
                      {selectedIds.has(item.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* SUMMARY & FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-800/50">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="flex justify-between items-center py-3 px-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Total add-ons:
              </span>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-blue-600 dark:text-blue-400"
              >
                {currencySymbol}{totalPrice.toFixed(2)} {currencyCode}
              </motion.span>
            </motion.div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
              }
