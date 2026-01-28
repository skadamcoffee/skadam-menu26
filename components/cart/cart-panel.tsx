'use client'

import { useState } from "react"
import { CartItem, useCart } from "./cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { OrderSubmission } from "./order-submission"
import { PromoCodeInput } from "./promo-code-input"
import { motion, AnimatePresence } from "framer-motion"

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string
}

export function CartPanel({ isOpen, onClose, tableNumber }: CartPanelProps) {
  const { getTableItems, removeItem, updateQuantity, total, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const items = getTableItems(tableNumber)

  const handleOrderSuccess = () => {
    clearCart(tableNumber)
    setIsCheckingOut(false)
    onClose()
    // Optional: redirect to an order tracking page
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl h-[85vh] flex flex-col"
        >
          <div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-center">Your Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              items.map((item, index) => (
                <motion.div
                  key={index} // It's better to have a unique key
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                >
                  <img src={item.image_url || 'placeholder.svg'} alt={item.productName} className="w-16 h-16 rounded-md object-cover"/>
                  <div className="flex-1">
                    <p className="font-bold">{item.productName}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.customizations?.map(c => c.name).join(', ')}
                    </div>
                    <p className="font-semibold">{(item.price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0)).toFixed(2)} د.ت</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, item.quantity - 1, tableNumber, item.customizations)} disabled={item.quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, item.quantity + 1, tableNumber, item.customizations)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId, tableNumber, item.customizations)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t dark:border-gray-700 space-y-4">
            <PromoCodeInput subtotal={total(tableNumber)} tableNumber={tableNumber} />
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>{total(tableNumber).toFixed(2)} د.ت</span>
            </div>
            {isCheckingOut ? (
              <OrderSubmission 
                tableNumber={tableNumber} 
                total={total(tableNumber)} 
                itemCount={items.reduce((s, i) => s + i.quantity, 0)} 
                onSuccess={handleOrderSuccess} 
              />
            ) : (
              <Button className="w-full h-12" onClick={() => setIsCheckingOut(true)}>Order Now</Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
