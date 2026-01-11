"use client"

import { useState } from "react"
import { useCart } from "./cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { OrderSubmission } from "./order-submission"
import { PromoCodeInput } from "./promo-code-input"
import { motion, AnimatePresence } from "framer-motion"

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
}

export function CartPanel({ isOpen, onClose, tableNumber }: CartPanelProps) {
  const { items, removeItem, updateQuantity, total, clearCart, promoDiscount } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-white dark:bg-slate-950 border-l border-slate-200/50 dark:border-slate-800">
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 dark:border-slate-900 pb-6 pt-2">
          <div className="flex items-center justify-between">
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
          </div>
        </SheetHeader>

        {/* Empty Cart Video */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-sm aspect-video">
              <iframe
                src="https://player.cloudinary.com/embed/?cloud_name=dgequg3ik&public_id=Video_Edit_Request_Replace_Bean_With_SKADAM_m14uib&profile=cld-looping"
                className="w-full h-full rounded-lg shadow-lg"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </motion.div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 my-6 pr-2">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                        {item.image_url ? (
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl opacity-50">☕</div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {item.price.toFixed(2)} د.ت each
                        </p>

                        {/* Quantity and Total */}
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="px-2 text-sm font-medium text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>

                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {(item.price * item.quantity).toFixed(2)} د.ت
                          </span>

                          <button
                            onClick={() => removeItem(item.productId)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-900 pt-6">
              <PromoCodeInput subtotal={subtotal} />

              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">{subtotal.toFixed(2)} د.ت</span>
                </div>

                <AnimatePresence>
                  {promoDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-between text-sm text-green-600 dark:text-green-400"
                    >
                      <span>Discount</span>
                      <span className="font-medium">-{promoDiscount.toFixed(2)} د.ت</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {total.toFixed(2)} د.ت
                  </motion.span>
                </div>
              </div>

              {/* Action Buttons */}
              {isCheckingOut ? (
                <OrderSubmission
                  tableNumber={tableNumber}
                  total={total}
                  itemCount={items.length}
                  onSuccess={() => {
                    clearCart()
                    setIsCheckingOut(false)
                    onClose()
                  }}
                />
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 bg-transparent"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={() => setIsCheckingOut(true)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold"
                  >
                    Place Order
                  </Button>
                </div>
              )}

              <button
                onClick={clearCart}
                className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-2 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
