"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"

interface CustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  basePrice: number
  onApply: (customizations: {
    size?: string
    addOns?: string[]
    notes?: string
    customizationPrice: number
  }) => void
}

interface CustomizationOption {
  id: string
  type: "size" | "addon"
  label: string
  price: number
}

export function CustomizationModal({ isOpen, onClose, productName, basePrice, onApply }: CustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>("Medium")
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [sizes, setSizes] = useState<CustomizationOption[]>([])
  const [addOns, setAddOns] = useState<CustomizationOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data, error } = await supabase
          .from("customization_options")
          .select("*")
          .eq("is_active", true)
          .order("type")
          .order("display_order")

        if (error) throw error

        const sizeOptions = (data || []).filter((opt: CustomizationOption) => opt.type === "size")
        const addOnOptions = (data || []).filter((opt: CustomizationOption) => opt.type === "addon")

        setSizes(sizeOptions)
        setAddOns(addOnOptions)

        // Set default size
        if (sizeOptions.length > 0) {
          const mediumSize = sizeOptions.find((s) => s.label === "Medium")
          setSelectedSize(mediumSize ? mediumSize.label : sizeOptions[0].label)
        }
      } catch (error) {
        console.error("[v0] Error fetching customization options:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchCustomizations()
    }
  }, [isOpen])

  const calculatePrice = () => {
    let price = 0
    const sizeOption = sizes.find((s) => s.label === selectedSize)
    if (sizeOption) price += sizeOption.price

    selectedAddOns.forEach((addOn) => {
      const addOnOption = addOns.find((a) => a.label === addOn)
      if (addOnOption) price += addOnOption.price
    })

    return price
  }

  const customizationPrice = calculatePrice()
  const totalPrice = basePrice + customizationPrice

  const handleApply = () => {
    onApply({
      size: selectedSize,
      addOns: selectedAddOns,
      notes: notes || undefined,
      customizationPrice,
    })
    onClose()
  }

  const toggleAddOn = (addOn: string) => {
    setSelectedAddOns((prev) => (prev.includes(addOn) ? prev.filter((a) => a !== addOn) : [...prev, addOn]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize {productName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Size Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <Label className="text-base font-semibold">Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.label)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSize === size.label
                        ? "border-slate-900 dark:border-white bg-slate-900/10 dark:bg-white/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="font-medium text-sm">{size.label}</div>
                    {size.price > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">+{size.price.toFixed(2)} د.ت</div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Add-ons Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <Label className="text-base font-semibold">Add-ons</Label>
              <div className="space-y-2">
                {addOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAddOns.includes(addOn.label)}
                      onCheckedChange={() => toggleAddOn(addOn.label)}
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium cursor-pointer">{addOn.label}</Label>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">+{addOn.price.toFixed(2)} د.ت</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Special Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Label htmlFor="notes" className="text-base font-semibold">
                Special Instructions
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20 resize-none"
              />
            </motion.div>

            {/* Price Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Base Price</span>
                <span className="font-medium">{basePrice.toFixed(2)} د.ت</span>
              </div>
              {customizationPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Customizations</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    +{customizationPrice.toFixed(2)} د.ت
                  </span>
                </div>
              )}
              <div className="h-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{totalPrice.toFixed(2)} د.ت</span>
              </div>
            </motion.div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
          >
            Apply Customization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
