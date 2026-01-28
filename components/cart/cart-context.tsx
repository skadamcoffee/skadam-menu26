'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Customization {
  id: string
  name: string
  price: number
}

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  image_url?: string
  customizations?: Customization[]
}

interface Promo {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
}

interface CartContextType {
  carts: Record<string, CartItem[]>
  promos: Record<string, Promo>
  
  addItem: (item: CartItem, tableNumber: string) => void
  removeItem: (productId: string, tableNumber: string, customizations?: Customization[]) => void
  updateQuantity: (productId: string, quantity: number, tableNumber: string, customizations?: Customization[]) => void
  
  clearCart: (tableNumber: string) => void
  total: (tableNumber: string) => number
  getTableItems: (tableNumber: string) => CartItem[]
  
  applyPromoCode: (tableNumber: string, code: string, discount_type: "percentage" | "fixed", discount_value: number) => void
  removePromoCode: (tableNumber: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({})
  const [promos, setPromos] = useState<Record<string, Promo>>({})
  const [mounted, setMounted] = useState(false)
  
  const getItemKey = (item: Pick<CartItem, 'productId' | 'customizations'>) => 
    `${item.productId}:${JSON.stringify(item.customizations?.map(c => c.id).sort() || [])}`

  useEffect(() => {
    const savedCarts = localStorage.getItem("skadam-carts")
    const savedPromos = localStorage.getItem("skadam-promos")

    if (savedCarts) setCarts(JSON.parse(savedCarts))
    if (savedPromos) setPromos(JSON.parse(savedPromos))
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-carts", JSON.stringify(carts))
  }, [carts, mounted])

  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-promos", JSON.stringify(promos))
  }, [promos, mounted])

  const addItem = (newItem: CartItem, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      const newItemKey = getItemKey(newItem)
      
      const existingIndex = tableCart.findIndex(i => getItemKey(i) === newItemKey)
      
      const updatedCart = existingIndex >= 0
        ? tableCart.map((i, index) => 
            index === existingIndex
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          )
        : [...tableCart, newItem]

      return { ...prev, [tableNumber]: updatedCart }
    })
  }

  const removeItem = (productId: string, tableNumber: string, customizations?: Customization[]) => {
    const keyToRemove = getItemKey({ productId, customizations })
    setCarts(prev => ({
      ...prev,
      [tableNumber]: (prev[tableNumber] || []).filter(i => getItemKey(i) !== keyToRemove),
    }))
  }

  const updateQuantity = (productId: string, quantity: number, tableNumber: string, customizations?: Customization[]) => {
    if (quantity <= 0) {
      removeItem(productId, tableNumber, customizations)
      return
    }
    const keyToUpdate = getItemKey({ productId, customizations })
    setCarts(prev => ({
      ...prev,
      [tableNumber]: (prev[tableNumber] || []).map(i =>
        getItemKey(i) === keyToUpdate
          ? { ...i, quantity }
          : i
      ),
    }))
  }
  
  const applyPromoCode = (tableNumber: string, code: string, discount_type: "percentage" | "fixed", discount_value: number) => {
    setPromos(prev => ({ ...prev, [tableNumber]: { code, discount_type, discount_value } }))
  }

  const removePromoCode = (tableNumber: string) => {
    setPromos(prev => {
      const updated = { ...prev }; delete updated[tableNumber]; return updated
    })
  }

  const clearCart = (tableNumber: string) => {
    setCarts(prev => {
      const updated = { ...prev }; delete updated[tableNumber]; return updated
    })
    removePromoCode(tableNumber)
  }

  const total = (tableNumber: string) => {
    const subtotal = (carts[tableNumber] || []).reduce((sum, i) => {
      const customTotal = i.customizations?.reduce((cSum, c) => cSum + c.price, 0) || 0
      return sum + (i.price + customTotal) * i.quantity
    }, 0)

    const promo = promos[tableNumber]
    let discount = 0
    if (promo) {
      discount = promo.discount_type === 'percentage' 
        ? (subtotal * promo.discount_value) / 100 
        : promo.discount_value
      discount = Math.min(discount, subtotal)
    }

    return Math.max(0, subtotal - discount)
  }

  const getTableItems = (tableNumber: string) => carts[tableNumber] || []

  return (
    <CartContext.Provider
      value={{
        carts,
        promos,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        getTableItems,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
