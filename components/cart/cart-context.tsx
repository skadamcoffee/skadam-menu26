"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Customization {
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
  discountValue: number
  discountType: "percentage" | "fixed"
}

interface CartContextType {
  carts: Record<string, CartItem[]>
  promos: Record<string, Promo | null>
  addItem: (item: CartItem, tableNumber: string) => void
  removeItem: (productId: string, tableNumber: string) => void
  updateQuantity: (productId: string, quantity: number, tableNumber: string) => void
  updateCustomization: (productId: string, tableNumber: string, customizations: Customization[]) => void
  clearCart: (tableNumber: string) => void
  total: (tableNumber: string) => number
  getTableItems: (tableNumber: string) => CartItem[]
  applyPromoCode: (tableNumber: string, code: string, value: number, type: "percentage" | "fixed") => void
  removePromoCode: (tableNumber: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({})
  const [promos, setPromos] = useState<Record<string, Promo | null>>({})
  const [mounted, setMounted] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const savedCarts = localStorage.getItem("skadam-carts")
    const savedPromos = localStorage.getItem("skadam-promos")

    if (savedCarts) setCarts(JSON.parse(savedCarts))
    if (savedPromos) setPromos(JSON.parse(savedPromos))

    setMounted(true)
  }, [])

  // Persist carts
  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-carts", JSON.stringify(carts))
  }, [carts, mounted])

  // Persist promos
  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-promos", JSON.stringify(promos))
  }, [promos, mounted])

  // ---------------- ACTIONS ----------------
  const addItem = (newItem: CartItem, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      const existing = tableCart.find(i => i.productId === newItem.productId)
      const updatedCart = existing
        ? tableCart.map(i =>
            i.productId === newItem.productId ? { ...i, quantity: i.quantity + newItem.quantity } : i
          )
        : [...tableCart, newItem]
      return { ...prev, [tableNumber]: updatedCart }
    })
  }

  const removeItem = (productId: string, tableNumber: string) => {
    setCarts(prev => ({
      ...prev,
      [tableNumber]: (prev[tableNumber] || []).filter(i => i.productId !== productId),
    }))
  }

  const updateQuantity = (productId: string, quantity: number, tableNumber: string) => {
    if (quantity <= 0) {
      removeItem(productId, tableNumber)
      return
    }
    setCarts(prev => ({
      ...prev,
      [tableNumber]: (prev[tableNumber] || []).map(i =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }))
  }

  const updateCustomization = (productId: string, tableNumber: string, customizations: Customization[]) => {
    setCarts(prev => ({
      ...prev,
      [tableNumber]: (prev[tableNumber] || []).map(i =>
        i.productId === productId ? { ...i, customizations } : i
      ),
    }))
  }

  const clearCart = (tableNumber: string) => {
    setCarts(prev => {
      const updated = { ...prev }
      delete updated[tableNumber]
      return updated
    })
    setPromos(prev => ({ ...prev, [tableNumber]: null }))
  }

  const getTableItems = (tableNumber: string) => carts[tableNumber] || []

  const applyPromoCode = (
    tableNumber: string,
    code: string,
    value: number,
    type: "percentage" | "fixed"
  ) => {
    setPromos(prev => ({ ...prev, [tableNumber]: { code, discountValue: value, discountType: type } }))
  }

  const removePromoCode = (tableNumber: string) => {
    setPromos(prev => ({ ...prev, [tableNumber]: null }))
  }

  const total = (tableNumber: string) => {
    const tableItems = carts[tableNumber] || []
    const subtotal = tableItems.reduce(
      (sum, i) => sum + (i.price + (i.customizations?.reduce((cSum, c) => cSum + c.price, 0) || 0)) * i.quantity,
      0
    )
    const promo = promos[tableNumber]
    let discount = 0
    if (promo) {
      discount = promo.discountType === "percentage" ? (subtotal * promo.discountValue) / 100 : promo.discountValue
      discount = Math.min(discount, subtotal)
    }
    return Math.max(0, subtotal - discount)
  }

  return (
    <CartContext.Provider
      value={{
        carts,
        promos,
        addItem,
        removeItem,
        updateQuantity,
        updateCustomization,
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
