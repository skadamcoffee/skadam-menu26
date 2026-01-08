"use client"

import { useState } from "react"
import { useCart } from "./cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react"
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
      <SheetContent className="flex flex-col w-full sm:max-w-lg bg-gradient-to-b from-card to-background border-l-2 border-primary/20">
        {/* Header with icon and title */}
        <SheetHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">Your Order</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {items.length === 0
                  ? "Add items to get started"
                  : `${items.length} item${items.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="text-6xl mb-4"
            >
              ☕
            </motion.div>
            <p className="text-muted-foreground text-center text-lg font-medium">Your cart is empty</p>
            <p className="text-muted-foreground text-center text-sm mt-2">Add delicious items from the menu</p>
          </div>
        ) : (
          <>
            {/* Items List with featured design */}
            <div className="flex-1 overflow-y-auto space-y-2 my-4 pr-2">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted to-muted/50 border border-border/50 p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.productName}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.price.toFixed(2)} د.ت × {item.quantity} ={" "}
                          <span className="font-semibold text-foreground">
                            {(item.price * item.quantity).toFixed(2)} د.ت
                          </span>
                        </p>
                      </div>

                      {/* Quantity controls with featured buttons */}
                      <div className="flex items-center gap-1 bg-background/80 border border-border rounded-full p-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 hover:bg-muted rounded-full transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1.5 hover:bg-muted rounded-full transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {/* Remove button */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Featured totals section */}
            <div className="border-t border-border pt-4 space-y-3">
              <PromoCodeInput subtotal={subtotal} />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{subtotal.toFixed(2)} د.ت</span>
                </div>
                {promoDiscount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex justify-between text-sm text-green-600"
                  >
                    <span>Discount</span>
                    <span className="font-medium">-{promoDiscount.toFixed(2)} د.ت</span>
                  </motion.div>
                )}
              </div>

              {/* Featured total price display */}
              <motion.div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl font-bold text-primary"
                  >
                    {total.toFixed(2)} د.ت
                  </motion.span>
                </div>
              </motion.div>

              {/* Featured checkout section */}
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
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="w-full bg-background/60 hover:bg-background border-border"
                    >
                      Continue Shopping
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button onClick={() => setIsCheckingOut(true)} className="w-full">
                      Checkout
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Clear cart option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearCart}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cart
              </motion.button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
