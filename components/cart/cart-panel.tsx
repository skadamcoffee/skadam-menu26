"use client"

import { useState } from "react"
import { CartItem, useCart } from "./cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { OrderSubmission } from "./order-submission"
import { PromoCodeInput } from "./promo-code-input"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string
}

export function CartPanel({ isOpen, onClose, tableNumber }: CartPanelProps) {
  const router = useRouter()
  const {
    getTableItems,
    removeItem,
    updateQuantity,
    updateCustomization,
    total,
    clearCart,
  } = useCart()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [customizationsDraft, setCustomizationsDraft] = useState<
    { name: string; price: number; selected: boolean }[]
  >([])

  // Get items for the current table
  const items: CartItem[] = getTableItems(tableNumber)
  const subtotal = items.reduce((sum, item) => {
    const customTotal = item.customizations?.reduce((cSum, c) => cSum + c.price, 0) || 0
    return sum + (item.price + customTotal) * item.quantity
  }, 0)

  const handleOrderSuccess = () => {
    clearCart(tableNumber)
    setIsCheckingOut(false)
    onClose()
    router.push("/track-order")
  }

  const openCustomization = (item: CartItem) => {
    setEditingItem(item)
    setCustomizationsDraft([
      { name: "Extra Milk", price: 1, selected: item.customizations?.some(c => c.name === "Extra Milk") || false },
      { name: "No Sugar", price: 0, selected: item.customizations?.some(c => c.name === "No Sugar") || false },
      { name: "Extra Shot", price: 2, selected: item.customizations?.some(c => c.name === "Extra Shot") || false },
    ])
  }

  const saveCustomizations = () => {
    if (editingItem) {
      const selected = customizationsDraft.filter(c => c.selected).map(c => ({ name: c.name, price: c.price }))
      updateCustomization(editingItem.productId, tableNumber, selected)
      setEditingItem(null)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full h-full sm:h-auto sm:max-w-md sm:ml-auto bg-white dark:bg-slate-950 border-l border-slate-200/50 dark:border-slate-800">
        
        {/* HEADER */}
        <SheetHeader className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 pb-4 pt-2 flex items-center justify-between shadow-sm dark:shadow-black/20">
  <div className="flex items-center gap-3">
    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg">
      <ShoppingCart className="w-5 h-5 text-slate-900 dark:text-white" />
    </div>
    <div>
      <SheetTitle className="text-xl font-semibold text-slate-900 dark:text-white">
        Order Summary
      </SheetTitle>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {items.length === 0 ? "Empty" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
      </p>
    </div>
  </div>

  {/* X BUTTON */}
  <button
    onClick={onClose}
    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
    aria-label="Close Cart"
  >
    ✕
  </button>
</SheetHeader>

        {/* EMPTY CART */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-4 gap-2"
            style={{ minHeight: "300px" }}
          >
            <video
              src="https://res.cloudinary.com/dgequg3ik/video/upload/v1761747176/Video_Edit_Request_Replace_Bean_With_SKADAM_m14uib.mp4"
              className="w-full max-w-xs h-auto object-contain rounded-lg"
              autoPlay
              loop
              muted
              playsInline
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">Your cart is empty</p>
          </motion.div>
        ) : (
          <>
            {/* ITEMS LIST */}
<div className="flex-1 overflow-y-auto space-y-2 my-4 px-2 pb-4">
  <AnimatePresence>
    {items.map(item => (
      <motion.div
        key={item.productId}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 hover:border-slate-200 dark:hover:border-slate-700 transition-colors shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          
          {/* IMAGE */}
          <div className="w-full sm:w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.productName}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = "none" }}
              />
            ) : (
              <div className="text-lg opacity-50">☕</div>
            )}
          </div>

          {/* DETAILS */}
          <div className="flex-1 flex flex-col justify-between">
            <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-tight truncate">{item.productName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.price.toFixed(2)} د.ت</p>

            {/* QUANTITY + ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 gap-1">
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, tableNumber)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </button>
                <span className="px-2 text-sm font-medium text-slate-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, tableNumber)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 sm:mt-0">
                {((item.price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0)) * item.quantity).toFixed(2)} د.ت
              </span>

              <div className="flex gap-1 mt-0.5 sm:mt-0">
                <button
                  onClick={() => removeItem(item.productId, tableNumber)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>

                <button
                  onClick={() => openCustomization(item)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded transition-colors"
                >
                  <span className="text-xs text-primary font-semibold">Customize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </AnimatePresence>
</div>

            {/* PRICING + CHECKOUT */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-900 pt-4 sticky bottom-0 z-10 bg-white dark:bg-slate-950 shadow-sm dark:shadow-black/20 px-4 py-2">
              
              <PromoCodeInput subtotal={subtotal} tableNumber={tableNumber} />

              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">{subtotal.toFixed(2)} د.ت</span>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <motion.span key={total} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="text-lg font-bold text-slate-900 dark:text-white">
                    {total(tableNumber).toFixed(2)} د.ت
                  </motion.span>
                </div>
              </div>

              {isCheckingOut ? (
                <OrderSubmission
                  tableNumber={tableNumber}
                  total={total(tableNumber)}
                  itemCount={items.length}
                  onSuccess={handleOrderSuccess}
                />
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" onClick={onClose} className="w-full sm:flex-1 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900">
                    Continue Shopping
                  </Button>
                  <Button onClick={() => setIsCheckingOut(true)} className="w-full sm:flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold">
                    Place Order
                  </Button>
                </div>
              )}

              <button onClick={() => clearCart(tableNumber)} className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-2 transition-colors">
                Clear Cart
              </button>
            </div>
          </>
        )}

        {/* CUSTOMIZATION MODAL */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-950 rounded-lg p-6 w-full max-w-sm sm:w-80 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Customize {editingItem.productName}</h3>
              <div className="space-y-2">
                {customizationsDraft.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={c.selected}
                      onChange={(e) => {
                        const newDraft = [...customizationsDraft]
                        newDraft[idx].selected = e.target.checked
                        setCustomizationsDraft(newDraft)
                      }}
                    />
                    {c.name} {c.price > 0 ? `(+${c.price} د.ت)` : ""}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button onClick={saveCustomizations}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
