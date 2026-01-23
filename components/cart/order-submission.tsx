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
  
export function OrderSubmission({ tableNumber, total, itemCount, onSuccess }: OrderSubmissionProps) {  
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
      const {  
        data: { user },  
      } = await supabase.auth.getUser()  
  
      let discountAmount = 0  
      if (promoCode) {  
        const { data: promo } = await supabase  
          .from("promo_codes")  
          .select("discount_type, discount_value")  
          .eq("code", promoCode)  
          .single()  
  
        if (promo) {  
          discountAmount =  
            promo.discount_type === "percentage" ? (total * promo.discount_value) / 100 : promo.discount_value  
        }  
      }  
  
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
  
      const orderItems = items.map((item) => ({  
        order_id: order.id,  
        product_id: item.productId,  
        quantity: item.quantity,  
        notes: null,  
      }))  
  
      const { data: insertedItems, error: itemsError } = await supabase  
        .from("order_items")  
        .insert(orderItems)  
        .select()  
  
      if (itemsError) throw itemsError  
  
      // Insert customizations for each order item  
      if (insertedItems && insertedItems.length > 0) {  
        const customizationInserts = []  
        const productCustomizationInserts = []  
        const toppingInserts = []  
          
        for (let i = 0; i < items.length; i++) {  
          const item = items[i]  
          const insertedItem = insertedItems[i]  
            
          // Insert old customizations  
          if (item.customizations && item.customizations.length > 0) {  
            for (const customization of item.customizations) {  
              customizationInserts.push({  
                order_item_id: insertedItem.id,  
                customization_id: customization.id,  
              })  
            }  
          }  
            
          // Insert new product customization data  
          if (item.productCustomization) {  
            productCustomizationInserts.push({  
              order_item_id: insertedItem.id,  
              selected_size: item.productCustomization.selectedSize,  
              size_price: item.productCustomization.sizePrice,  
              special_requests: item.productCustomization.specialRequests,  
            })  
              
            // Insert toppings if any  
            if (item.productCustomization.selectedToppings && item.productCustomization.selectedToppings.length > 0) {  
              for (const topping of item.productCustomization.selectedToppings) {  
                toppingInserts.push({  
                  order_item_id: insertedItem.id,  
                  topping_id: topping.id,  
                  topping_name: topping.name,  
                  topping_price: topping.price,  
                })  
              }  
            }  
          }  
        }  
  
        // Insert old customizations  
        if (customizationInserts.length > 0) {  
          const { error: customError } = await supabase  
            .from("order_item_customizations")  
            .insert(customizationInserts)  
          if (customError) console.error("Error inserting customizations:", customError)  
        }  
          
        // Insert new product customizations  
        if (productCustomizationInserts.length > 0) {  
          const { error: productCustomError } = await supabase  
            .from("order_item_customizations")  
            .insert(productCustomizationInserts)  
          if (productCustomError) console.error("Error inserting product customizations:", productCustomError)  
        }  
          
        // Insert toppings  
        if (toppingInserts.length > 0) {  
          const { error: toppingError } = await supabase  
            .from("order_item_toppings")  
            .insert(toppingInserts)  
          if (toppingError) console.error("Error inserting toppings:", toppingError)  
        }  
      }  
  
      if (promoCode) {  
        const { error: rpcError } = await supabase.rpc("increment_promo_code_usage", { code: promoCode })  
        if (rpcError) console.error("Failed to increment promo usage:", rpcError)  
      }  
  
      if (user?.id) {  
        await supabase.from("notifications").insert({  
          user_id: user.id,  
          type: "order_placed",  
          title: "✓ Order Placed Successfully",  
          message: `Your order #${order.id.slice(0, 8)} has been placed. Table ${tableNumber}`,  
          order_id: order.id,  
        })  
      }  
  
      clearCart(tableNumber)  
      setOrderId(order.id)  
      setIsSuccess(true)  
  
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
        <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />  
        <div className="text-center space-y-1">  
          <h3 className="font-bold text-lg">Order Confirmed!</h3>  
          <p className="text-sm text-muted-foreground">Order ID: {orderId?.slice(0, 8)}</p>  
          <p className="text-sm text-muted-foreground">Redirecting to tracking...</p>  
        </div>  
      </div>  
    )  
  }  
  
  return (  
    <div className="space-y-4 mt-4">  
      {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}  
  
      <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">  
        <p>  
          <span className="text-muted-foreground">Items:</span> <span className="font-semibold">{itemCount}</span>  
        </p>  
        <p>  
          <span className="text-muted-foreground">Total:</span>{" "}  
          <span className="font-bold text-lg text-primary">{total.toFixed(2)} د.ت</span>  
        </p>  
        <p>  
          <span className="text-muted-foreground">Table:</span> <span className="font-semibold">{tableNumber}</span>  
        </p>  
      </div>  
  
      <Button onClick={handleSubmitOrder} disabled={isLoading} className="w-full" size="lg">  
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
