"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "./cart-context"
import { Loader2, CheckCircle2, X, Tag, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface PromoCodeInputProps {
  subtotal: number
  tableNumber: string
}

export function PromoCodeInput({ subtotal, tableNumber }: PromoCodeInputProps) {
  const { promos, applyPromoCode, removePromoCode } = useCart()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  // Current promo for this table
  const currentPromo = promos[tableNumber]

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Please enter a promo code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Fetch the promo code from database
      const { data: promoData, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .single()

      if (error || !promoData) {
        setError("Invalid promo code")
        setIsLoading(false)
        return
      }

      // Check if code is active
      const now = new Date()
      if (!promoData.is_active || new Date(promoData.start_date) > now || new Date(promoData.end_date) < now) {
        setError("This promo code is no longer valid")
        setIsLoading(false)
        return
      }

      // Check if max uses reached
      if (promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        setError("This promo code has reached its usage limit")
        setIsLoading(false)
        return
      }

      // Check minimum order value
      if (promoData.min_order_value && subtotal < promoData.min_order_value) {
        setError(`Minimum order value of ${promoData.min_order_value} د.ت required`)
        setIsLoading(false)
        return
      }

      // Calculate discount
      let discount = 0
      if (promoData.discount_type === "percentage") {
        discount = (subtotal * promoData.discount_value) / 100
      } else {
        discount = promoData.discount_value
      }

      // Apply promo code for THIS table only
      applyPromoCode(tableNumber, code.toUpperCase(), Math.min(discount, subtotal))
      setCode("")
      setError("")
      toast.success(`Promo code applied! Discount: ${discount.toFixed(2)} د.ت`)
    } catch (err) {
      console.error("Error applying promo code:", err)
      setError("Failed to apply promo code")
      toast.error("Failed to apply promo code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCode = () => {
    removePromoCode(tableNumber)
    toast.success("Promo code removed")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <label className="text-sm font-medium flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Promo Code
      </label>

      {currentPromo ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-sm text-green-900 dark:text-green-100">{currentPromo.code}</p>
                <p className="text-xs text-green-700 dark:text-green-300">Discount: {currentPromo.discount.toFixed(2)} د.ت</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCode}
              className="p-2 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full transition-colors"
              aria-label="Remove promo code"
            >
              <X className="w-4 h-4 text-green-600" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
              disabled={isLoading}
              className="text-sm flex-1"
              aria-label="Promo code input"
            />
            <Button
              onClick={handleApplyCode}
              disabled={isLoading || !code.trim()}
              size="sm"
              className="px-4"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
