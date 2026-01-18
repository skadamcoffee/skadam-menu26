"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "./cart-context"
import { Loader2, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface PromoCodeInputProps {
  subtotal: number
  tableNumber: string
}

export function PromoCodeInput({ subtotal, tableNumber }: PromoCodeInputProps) {
  const { mounted, promos, applyPromoCode, removePromoCode } = useCart()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  if (!mounted) return null

  const handleApplyCode = async () => {
    if (!code.trim()) return toast.error("Please enter a promo code")
    setIsLoading(true)

    try {
      const { data: promoData, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .single()

      if (error || !promoData) return toast.error("Invalid promo code")

      const now = new Date()
      if (!promoData.is_active || new Date(promoData.start_date) > now || new Date(promoData.end_date) < now) {
        return toast.error("This promo code is no longer valid")
      }

      if (promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        return toast.error("This promo code has reached its usage limit")
      }

      if (promoData.min_order_value && subtotal < promoData.min_order_value) {
        return toast.error(`Minimum order value of ${promoData.min_order_value} د.ت required`)
      }

      // Apply per table
      applyPromoCode(tableNumber, code.toUpperCase(), promoData.discount_type, promoData.discount_value)
      setCode("")
      toast.success(`Promo code applied!`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to apply promo code")
    } finally {
      setIsLoading(false)
    }
  }

  const promo = promos[tableNumber]
  if (promo) {
    const discountAmount = promo.discountType === "percentage" ? (subtotal * promo.discountValue) / 100 : promo.discountValue
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm text-green-900">{promo.code}</p>
              <p className="text-xs text-green-700">Discount: {discountAmount.toFixed(2)} د.ت</p>
            </div>
          </div>
          <button onClick={() => removePromoCode(tableNumber)} className="p-1 hover:bg-green-100 rounded transition-colors">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <label className="text-sm font-medium">Promo Code</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleApplyCode()}
          disabled={isLoading}
          className="text-sm"
        />
        <Button onClick={handleApplyCode} disabled={isLoading} size="sm" variant="outline">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
    </motion.div>
  )
}
