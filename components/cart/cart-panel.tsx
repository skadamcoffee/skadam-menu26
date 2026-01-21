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
      {/* BACKDROP */}
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

      {/* BOTTOM PANEL - REDUCED HEIGHT TO LEAVE MENU PAGE VISIBLE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl h-[70vh] flex flex-col"
          >
            {/* DRAG HANDLE */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* HEADER */}
            <div className="px-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm">
                    <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Your Order
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {items.length === 0 ? "No items yet" : `${items.length} item${items.length !== 1 ? "s" : ""} in cart`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* ITEMS LIST - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar min-h-0">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 h-full"
                >
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add some delicious items to get started!</p>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={`${item.productId}-${JSON.stringify(item.customizations || [])}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex gap-4">
                        {/* IMAGE */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-sm">
                          {item.image_url ? (
                            <img
                              src={item.image_url || "/placeholder.svg"}
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
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.price.toFixed(2)} د.ت </p>

                            {item.customizations && item.customizations.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Customizations</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.customizations.map((c, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                      <span className="text-xs font-medium text-slate-900 dark:text-white">{c.name}</span>
                                      {c.price > 0 && <span className="text-xs text-slate-600 dark:text-slate-400">+{c.price.toFixed(2)} د.ت</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* QUANTITY, PRICE, AND ACTIONS - STACKED FOR BETTER CONTAINMENT */}
                          <div className="flex flex-col gap-3 mt-4">
                            {/* QUANTITY AND PRICE ROW */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1, tableNumber, item.customizations)}
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                                <span className="px-3 text-sm font-semibold text-slate-900 dark:text-white min-w-[2rem] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1, tableNumber, item.customizations)}
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                >
                                  <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                              </div>

                              <span className="text-base font-bold text-slate-900 dark:text-white">
                                {((item.price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0)) * item.quantity).toFixed(2)} د.ت
                              </span>
                            </div>

                            {/* ACTIONS ROW */}
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openCustomization(item)}
                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Customize"
                              >
                                <Edit3 className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => removeItem(item.productId, tableNumber, item.customizations)}
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
              )}
            </div>

            {/* PRICING & ACTIONS - FIXED AT BOTTOM */}
            <div className="flex-shrink-0 px-6 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4 bg-white dark:bg-slate-900">
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

              {isCheckingOut ? (
                <OrderSubmission
                  tableNumber={tableNumber}
                  total={total(tableNumber)}
                  itemCount={items.length}
                  onSuccess={handleOrderSuccess}
                />
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Keep Shopping
                  </Button>
                  <Button onClick={() => setIsCheckingOut(true)} className="flex-1">
                    Place Order
                  </Button>
                </div>
              )}

              <button
                onClick={() => clearCart(tableNumber)}
                className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 py-3 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear All Items
              </button>
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
