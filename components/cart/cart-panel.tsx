"use client"

import { useState } from "react"
import { CartItem, useCart } from "./cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus, Edit3, X } from "lucide-react"
import { OrderSubmission } from "./order-submission"
import { PromoCodeInput } from "./promo-code-input"
import { CustomizationSelector } from "./customization-selector"
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
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)

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
    setShowCustomizationModal(true)
  }

  const handleCustomizationSave = (customizations: any[]) => {
    if (editingItem) {
      updateCustomization(
        editingItem.productId,
        tableNumber,
        editingItem.customizations || [],
        customizations
      )
      setEditingItem(null)
      setShowCustomizationModal(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl h-[85vh] flex flex-col"
          >
            {/* DRAG HANDLE / TOP BAR */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <ShoppingCart className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500">Your cart is empty</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${JSON.stringify(item.customizations || [])}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#F9F9F9] dark:bg-slate-800/40 rounded-[2rem] p-4 relative"
                    >
                      {/* DELETE BUTTON - TOP RIGHT */}
                      <button
                        onClick={() => removeItem(item.productId, tableNumber, item.customizations)}
                        className="absolute top-3 right-3 p-2 bg-[#FF6B6B] hover:bg-red-600 rounded-xl shadow-md transition-colors group"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>

                      <div className="flex gap-4">
                        {/* PRODUCT IMAGE */}
                        <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 dark:border-slate-600">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">☕</span>
                          )}
                        </div>

                        {/* PRODUCT DETAILS */}
                        <div className="flex-1 flex flex-col pr-8">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-1">
                            {item.productName}
                          </h3>
                          
                          {/* PILL CUSTOMIZATIONS */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.customizations?.map((c, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-tight">
                                  {c.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* PRICE AND CONTROLS ROW */}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              ${((item.price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0))).toFixed(2)}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* EDIT BUTTON */}
                              <button 
                                onClick={() => openCustomization(item)}
                                className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm"
                              >
                                <Edit3 className="w-4 h-4 text-slate-400" />
                              </button>

                              {/* STEPPER */}
                              <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1, tableNumber, item.customizations)}
                                  className="p-1 text-slate-400 disabled:opacity-20"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                                <span className="px-3 font-bold text-slate-900 dark:text-white min-w-[1.5rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1, tableNumber, item.customizations)}
                                  className="p-1 text-slate-400"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* FOOTER SECTION */}
            <div className="px-6 pb-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <PromoCodeInput subtotal={subtotal} tableNumber={tableNumber} />

              <div className="flex justify-between items-center py-4">
                <span className="text-slate-400 font-medium">Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {total(tableNumber).toFixed(2)} <span className="text-sm font-bold">د.ت</span>
                </span>
              </div>

              {isCheckingOut ? (
                <OrderSubmission
                  tableNumber={tableNumber}
                  total={total(tableNumber)}
                  itemCount={items.length}
                  onSuccess={handleOrderSuccess}
                />
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl text-lg font-bold border-2">
                    Back
                  </Button>
                  <Button onClick={() => setIsCheckingOut(true)} className="flex-1 h-14 rounded-2xl text-lg font-bold bg-slate-900 dark:bg-white dark:text-slate-900">
                    Order Now
                  </Button>
                </div>
              )}
            </div>

            {/* CUSTOMIZATION MODAL */}
            {editingItem && (
              <CustomizationSelector
                isOpen={showCustomizationModal}
                onClose={() => {
                  setShowCustomizationModal(false)
                  setEditingItem(null)
                }}
                onSave={handleCustomizationSave}
                currentCustomizations={editingItem.customizations || []}
                productName={editingItem.productName}
                productId={editingItem.productId}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
