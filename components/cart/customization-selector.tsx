"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"

interface Customization {
  id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
}

interface CustomizationOption {
  id: string
  name: string
  price: number
  description?: string
}

interface CustomizationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customizations: CustomizationOption[]) => void
  currentCustomizations: CustomizationOption[]
  productName: string
}

export function CustomizationSelector({
  isOpen,
  onClose,
  onSave,
  currentCustomizations,
  productName,
}: CustomizationSelectorProps) {
  const [customizations, setCustomizations] = useState<Customization[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentCustomizations.map(c => c.id))
  )
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchCustomizations()
    }
  }, [isOpen])

  const fetchCustomizations = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("customizations")
        .select("*")
        .eq("is_available", true)
        .order("category")

      if (error) throw error
      setCustomizations(data || [])
    } catch (error) {
      console.error("Error fetching customizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
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
    onClose()
  }

  const groupedCustomizations = customizations.reduce((acc, c) => {
    if (!acc[c.category]) {
      acc[c.category] = []
    }
    acc[c.category].push(c)
    return acc
  }, {} as Record<string, Customization[]>)

  const totalPrice = customizations
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.price, 0)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Customize {productName}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedIds.size > 0 && `${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""} selected`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-400 animate-spin mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Loading customizations...</p>
                </div>
              </div>
            ) : Object.keys(groupedCustomizations).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No customizations available</p>
              </div>
            ) : (
              Object.entries(groupedCustomizations).map(([category, items]) => (
                <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((customization) => (
                      <motion.button
                        key={customization.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleToggle(customization.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedIds.has(customization.id)
                            ? "border-slate-900 dark:border-slate-400 bg-slate-50 dark:bg-slate-900/50"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {customization.name}
                            </p>
                            {customization.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {customization.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              +{customization.price.toFixed(2)} د.ت
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedIds.has(customization.id)
                                  ? "bg-slate-900 dark:bg-slate-400 border-slate-900 dark:border-slate-400"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {selectedIds.has(customization.id) && (
                                <Check className="w-4 h-4 text-white dark:text-slate-950" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <div>
              {totalPrice > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Additional cost:{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    +{totalPrice.toFixed(2)} د.ت
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-900 gap-2"
              >
                <Check className="w-4 h-4" />
                Save Customizations
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

