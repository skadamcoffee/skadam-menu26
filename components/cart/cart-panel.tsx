"use client"

import { useState } from "react"
import { useCart } from "./cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Plus, Minus, Settings } from "lucide-react"
import { OrderSubmission } from "./order-submission"
import { PromoCodeInput } from "./promo-code-input"
import CustomizationModal from "./customization-modal"
import { motion, AnimatePresence } from "framer-motion"

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string | null
}

export function CartPanel({ isOpen, onClose, tableNumber }: CartPanelProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    updateCustomizations,
    total,
    clearCart,
    promoDiscount,
  } = useCart()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [customizationItem, setCustomizationItem] =
    useState<(typeof items)[0] | null>(null)

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const handleApplyCustomization = (customizations: any) => {
    if (!customizationItem?.cartItemId) return
    updateCustomizations(customizationItem.cartItemId, customizations)
    setCustomizationItem(null)
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="flex flex-col w-full sm:max-w-md bg-white dark:bg-slate-950 border-l border-slate-200/50 dark:border-slate-800">
          {/* Header */}
          <SheetHeader className="border-b border-slate-100 dark:border-slate-900 pb-6 pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold">
                  Order Summary
                </SheetTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {items.length === 0
                    ? "Empty"
                    : `${items.length} item${items.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Empty */}
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-5xl mb-4 opacity-40">☕</div>
              <p className="font-medium">No items yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Browse the menu to start your order
              </p>
            </motion.div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto space-y-3 my-6 pr-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.cartItemId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group bg-slate-50 dark:bg-slate-900/50 border rounded-lg p-4"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="w-20 aspect-square rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.productName}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="opacity-50 text-xl">☕</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">
                            {item.productName}
                          </h3>

                          {item.customizations && (
                            <div className="text-xs text-slate-500 mt-1">
                              {item.customizations.size && (
                                <div>{item.customizations.size}</div>
                              )}
                              {item.customizations.addOns?.length > 0 && (
                                <div>
                                  {item.customizations.addOns.join(", ")}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-slate-500 mt-1">
                            {item.price.toFixed(2)} د.ت each
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            {/* Qty */}
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId!,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId!,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-semibold text-sm">
                              {(item.price * item.quantity).toFixed(2)} د.ت
                            </span>

                            <button
                              onClick={() => setCustomizationItem(item)}
                              className="opacity-0 group-hover:opacity-100"
                            >
                              <Settings className="w-4 h-4 text-blue-500" />
                            </button>

                            <button
                              onClick={() => removeItem(item.cartItemId!)}
                              className="opacity-0 group-hover:opacity-100"
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

              {/* Pricing */}
              <div className="space-y-4 border-t pt-6">
                <PromoCodeInput subtotal={subtotal} />

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} د.ت</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mt-1">
                      <span>Discount</span>
                      <span>-{promoDiscount.toFixed(2)} د.ت</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold mt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)} د.ت</span>
                  </div>
                </div>

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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Continue
                    </Button>
                    <Button
                      onClick={() => setIsCheckingOut(true)}
                      className="flex-1"
                    >
                      Place Order
                    </Button>
                  </div>
                )}

                <button
                  onClick={clearCart}
                  className="w-full text-xs text-slate-500 py-2"
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ✅ OUTSIDE Sheet */}
      {customizationItem && (
        <CustomizationModal
          isOpen
          onClose={() => setCustomizationItem(null)}
          productName={customizationItem.productName}
          basePrice={customizationItem.price}
          onApply={handleApplyCustomization}
        />
      )}
    </>
  )
}
