"use client"

import { useState } from "react"
import { CartItem, useCart } from "./cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus, Edit3 } from "lucide-react"
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
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 shadow-2xl">
        {/* HEADER */}
        <SheetHeader className="border-b border-slate-100 dark:border-slate-900 pb-6 pt-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm">
              <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-white" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Your Order
              </SheetTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {items.length === 0 ? "No items yet" : `${items.length} item${items.length !== 1 ? "s" : ""} in cart`}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* EMPTY CART */}
        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex-1 flex flex-col items-center justify-center px-6 py-12"
            style={{ minHeight: "400px" }}
          >
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add some delicious items to get started!</p>
            </div>
            <video
              src="https://res.cloudinary.com/dgequg3ik/video/upload/v1761747176/Video_Edit_Request_Replace_Bean_With_SKADAM_m14uib.mp4"
              className="w-full max-w-sm h-auto object-contain rounded-xl shadow-lg"
              autoPlay
              loop
              muted
              playsInline
            />
          </motion.div>
        ) : (
          <>
            {/* ITEMS LIST */}
            <div className="flex-1 overflow-y-auto space-y-4 my-6 pr-2 custom-scrollbar">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
                  >
                    <div className="flex gap-4">
                      {/* IMAGE */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-sm">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = "none" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl opacity-60">☕</div>
                        )}
                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight mb-1">{item.productName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.price.toFixed(2)} د.ت each</p>
                          {item.customizations && item.customizations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.customizations.map((c, idx) => (
                                <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* QUANTITY + ACTIONS */}
                        <div className="flex items-center justify-between mt-4 gap-3">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, tableNumber)} 
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="px-3 text-sm font-semibold text-slate-900 dark:text-white min-w-[2rem] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, tableNumber)} 
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                              <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>

                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {((item.price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0)) * item.quantity).toFixed(2)} د.ت
                          </span>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => openCustomization(item)} 
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Customize"
                            >
                              <Edit3 className="w-4 h-4 text-blue-500" />
                            </button>
                            <button 
                              onClick={() => removeItem(item.productId, tableNumber)} 
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* PRICING */}
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
              {/* FIXED: Pass tableNumber to PromoCodeInput */}
              <PromoCodeInput subtotal={subtotal} tableNumber={tableNumber} />

              <div className="space-y-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{subtotal.toFixed(2)} د.ت</span>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-3" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                  <motion.span 
                    key={total(tableNumber)} 
                    initial={{ scale: 1.1, color: "#10b981" }} 
                    animate={{ scale: 1, color: "inherit" }} 
                    className="text-xl font-bold text-slate-900 dark:text-white"
                  >
                    {total(tableNumber).toFixed(2)} د.ت
                  </motion.span>
                </div>
              </div>

              {/* CHECKOUT */}
              {isCheckingOut ? (
                <OrderSubmission
                  tableNumber={tableNumber}
                  total={total(tableNumber)}
                  itemCount={items.length}
                  onSuccess={handleOrderSuccess}
                />
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg py-3 font-medium"
                  >
                    Keep Shopping
                  </Button>
                  <Button 
                    onClick={() => setIsCheckingOut(true)} 
                    className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-white dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900 text-white font-semibold rounded-lg py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Place Order
                  </Button>
                </div>
              )}

              {/* CLEAR CART */}
              <button 
                onClick={() => clearCart(tableNumber)} 
                className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 py-3 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear All Items
              </button>
            </div>
          </>
        )}

        {/* CUSTOMIZATION MODAL */}
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-950 rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Customize {editingItem.productName}</h3>
              <div className="space-y-4">
                {customizationsDraft.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.selected}
                      onChange={(e) => {
                        const newDraft = [...customizationsDraft]
                        newDraft[idx].selected = e.target.checked
                        setCustomizationsDraft(newDraft)
                      }}
                      className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <div className="flex-1">
                      <span className="text-slate-900 dark:text-white font-medium">{c.name}</span>
                      {c.price > 0 && <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">(+{c.price} د.ت)</span>}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingItem(null)}
                  className="px-6 py-2 rounded-lg border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveCustomizations}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  )
                    }
