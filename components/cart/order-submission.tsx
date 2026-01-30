"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useCart, CartItem } from "./cart-context"
import { Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface OrderSubmissionProps {
  tableNumber: string | null
  total: number
  itemCount: number
  onSuccess: () => void
}

export function OrderSubmission({
  tableNumber,
  total,
  itemCount,
  onSuccess,
}: OrderSubmissionProps) {
  const { getTableItems, promoCode, clearCart } = useCart()
  const items: CartItem[] = tableNumber ? getTableItems(tableNumber) : []
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      setError("Table number is required")
      return
    }

    if (items.length === 0) {
      setError("Cart is empty")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Calculate discount if promo code exists
      let discountAmount = 0
      if (promoCode) {
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("discount_type, discount_value")
          .eq("code", promoCode)
          .single()

        if (promo) {
          discountAmount =
            promo.discount_type === "percentage"
              ? (total * promo.discount_value) / 100
              : promo.discount_value
        }
      }

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          table_number: Number.parseInt(tableNumber),
          user_id: user?.id || null,
          status: "pending",
          total_price: total - discountAmount,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        notes: item.notes || null,
      }))

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select()

      if (itemsError) throw itemsError

      // Insert customizations safely
      const customizationInserts: any[] = []

      for (const insertedItem of insertedItems) {
        // find the original cart item that matches this order item
        const matchingItem = items.find(
          item =>
            item.productId === insertedItem.product_id &&
            item.quantity === insertedItem.quantity &&
            item.notes === insertedItem.notes
        )

        if (!matchingItem) continue

        const customizations = matchingItem.customizations || []

        customizations.forEach(customization => {
          customizationInserts.push({
            order_item_id: insertedItem.id,
            customization_id: customization.id || null,
            customization_name: customization.name,
            customization_price: customization.price,
          })
        })
      }

      if (customizationInserts.length > 0) {
        const { error: customError } = await supabase
          .from("order_item_customizations")
          .insert(customizationInserts)
        if (customError) console.error("Error inserting customizations:", customError)
      }

      // Increment promo code usage if applicable
      if (promoCode) {
        const { error: rpcError } = await supabase.rpc("increment_promo_code_usage", { code: promoCode })
        if (rpcError) console.error("Failed to increment promo usage:", rpcError)
      }

      // Add notification for user
      if (user?.id) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "order_placed",
          title: "✓ Order Placed Successfully",
          message: `Your order #${order.id.slice(0, 8)} has been placed. Table ${tableNumber}`,
          order_id: order.id,
        })
      }

      // Clear cart, set success state
      clearCart(tableNumber)
      setOrderId(order.id)
      setIsSuccess(true)
      setIsLoading(false)

      // Redirect to order tracking
      setTimeout(() => {
        onSuccess()
        router.push(`/order/${order.id}?table=${tableNumber}`)
      }, 2000)
    } catch (err) {
      console.error("Order submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit order")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <CheckCircle className="w-12 h-12 text-[#2d8b5c] dark:text-[#4ade80] animate-bounce" />
        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg text-[#2d1f14] dark:text-[#f5f0e6] font-heading">Order Confirmed!</h3>
          <p className="text-sm text-[#5c4033] dark:text-[#c9b8a0]">
            Order ID: {orderId?.slice(0, 8)}
          </p>
          <p className="text-sm text-[#5c4033] dark:text-[#c9b8a0]">
            Redirecting to tracking...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-[#e8dfd0] dark:bg-[#2d2520] p-4 rounded-xl space-y-2 text-sm border border-[#e0d5c4] dark:border-[#3d3228]">
        <p>
          <span className="text-[#5c4033] dark:text-[#c9b8a0]">Items:</span>{" "}
          <span className="font-semibold text-[#2d1f14] dark:text-[#f5f0e6]">{itemCount}</span>
        </p>
        <p>
          <span className="text-[#5c4033] dark:text-[#c9b8a0]">Total:</span>{" "}
          <span className="font-bold text-lg text-[#5c4033] dark:text-[#c9a96a]">
            {total.toFixed(2)} د.ت
          </span>
        </p>
        <p>
          <span className="text-[#5c4033] dark:text-[#c9b8a0]">Table:</span>{" "}
          <span className="font-semibold text-[#2d1f14] dark:text-[#f5f0e6]">{tableNumber}</span>
        </p>
      </div>

      <Button
        onClick={handleSubmitOrder}
        disabled={isLoading}
        className="w-full bg-[#5c4033] hover:bg-[#6b5040] text-[#faf6ef] dark:bg-[#c9a96a] dark:hover:bg-[#d4b87a] dark:text-[#2d1f14] border border-[#c9a96a]/30"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Place Order"
        )}
      </Button>
    </div>
  )
}
