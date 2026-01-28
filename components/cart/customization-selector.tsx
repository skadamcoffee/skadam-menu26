"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2, Search, Plus } from "lucide-react"
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

  const fetchedRef = useRef(false)

  // Load customizations for the product
  useEffect(() => {
    if (!isOpen || !productId || fetchedRef.current) return

    fetchedRef.current = true
    setLoading(true)

    // Preselect current customizations
    setSelectedIds(new Set(currentCustomizations.map(c => c.id)))

    supabase
      .from("customizations")
      .select("id, name, description, price")
      .eq("product_id", productId)
      .eq("is_available", true)
      .order("name", { ascending: true })
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
  }, [isOpen, productId, currentCustomizations])

  // Filter customizations based on search term
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
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Toggle customization selection
  const toggleCustomization = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Save selected customizations
  const handleSave = () => {
    const selected = customizations
      .filter(c => selectedIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name, // keep the name as in the table
        price: c.price,
      }))
    onSave(selected)
    toast.success("Customizations saved!")
    onClose()
  }

  // Calculate total price of selected customizations
  const totalPrice = customizations
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.price, 0)

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-lg shadow-2xl overflow-hidden border border-border"
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Customize {productName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedIds.size} {selectedIds.size === 1 ? "option" : "options"} selected
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close customization dialog"
            className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* CUSTOMIZATION LIST */}
        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCustomizations.length === 0 ? (
            <div className="py-12 text-center">
              <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No customizations match your search" : "No customizations available for this product"}
              </p>
            </div>
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
                  className={`w-full p-4 rounded-lg border-2 flex justify-between items-start gap-4 transition-all duration-150 ${
                    selectedIds.has(item.id)
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md"
                      : "border-border hover:border-muted-foreground/50 bg-card hover:shadow-sm"
                  } ${focusedIndex === index ? "ring-2 ring-ring" : ""}`}
                >
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-foreground leading-tight">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {currencySymbol}{item.price.toFixed(2)} {currencyCode}
                    </span>
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedIds.has(item.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                    >
                      {selectedIds.has(item.id) && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-border space-y-4 bg-muted/30">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="flex justify-between items-center py-2 px-2 bg-card rounded-lg shadow-sm"
            >
              <span className="text-sm font-medium text-foreground">
                Total add-ons:
              </span>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-primary"
              >
                {currencySymbol}{totalPrice.toFixed(2)} {currencyCode}
              </motion.span>
            </motion.div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6"
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
