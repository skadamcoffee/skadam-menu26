"use client"  
  
import { useState } from "react"  
import { CartItem, useCart } from "./cart-context"  
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"  
import { Button } from "@/components/ui/button"  
import { ShoppingCart, Trash2, Plus, Minus, Edit3 } from "lucide-react"  
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
      // FIXED: Use productId for DB query  
      updateCustomization(editingItem.productId, tableNumber, customizations)  
      setEditingItem(null)  
      setShowCustomizationModal(false)  
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
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.price.toFixed(2)} د.ت each</p>  
  
                          {item.customizations && item.customizations.length > 0 && (  
                            <div className="mt-3 space-y-2">  
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Customizations</p>  
                              <div className="flex flex-wrap gap-2">  
                                {item.customizations.map((c, idx) => (  
                                  <div key={idx} className="inline-flex items-center gap-1 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">  
                                    {c.image_url && (  
                                      <img   
                                        src={c.image_url}   
                                        alt={c.name}   
                                        className="w-4 h-4 rounded-full object-cover"   
                                        onError={(e) => { e.currentTarget.style.display = "none" }}  
                                      />  
                                    )}  
                                    <span className="text-xs font-medium text-slate-900 dark:text-white">{c.name}</span>  
                                    {c.category && (  
                                      <span className="text-xs text-slate-500 dark:text-slate-400">• {c.category}</span>  
                                    )}  
                                    {c.size_option && c.size_option !== 'none' && (  
                                      <span className="text-xs text-slate-600 dark:text-slate-400">({c.size_option})</span>  
                                    )}  
                                    {c.price > 0 && <span className="text-xs text-slate-600 dark:text-slate-400">+{c.price.toFixed(2)} د.ت</span>}  
                                  </div>  
                                ))}  
                              </div>  
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
                <div className="flex gap-3 pt-2">  
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
          </>  
        )}  
  
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
            productId={editingItem.productId} // ✅ FIXED  
          />  
        )}  
      </SheetContent>  
    </Sheet>  
  )  
}
