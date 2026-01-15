"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem, tableNumber: string) => void
  removeItem: (productId: string, tableNumber: string) => void
  updateQuantity: (productId: string, quantity: number, tableNumber: string) => void
  clearCart: (tableNumber: string) => void
  total: (tableNumber: string) => number
  promoCode: string | null
  promoDiscount: number
  applyPromoCode: (code: string, discount: number) => void
  removePromoCode: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  // Store carts per table
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({})
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Load carts from localStorage on mount
  useEffect(() => {
    const savedCarts = localStorage.getItem("skadam-carts")
    const savedPromo = localStorage.getItem("skadam-promo")
    const savedDiscount = localStorage.getItem("skadam-discount")

    if (savedCarts) setCarts(JSON.parse(savedCarts))
    if (savedPromo) setPromoCode(savedPromo)
    if (savedDiscount) setPromoDiscount(JSON.parse(savedDiscount))

    setMounted(true)
  }, [])

  // Save carts to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-carts", JSON.stringify(carts))
    }
  }, [carts, mounted])

  // Promo code storage
  useEffect(() => {
    if (mounted) {
      if (promoCode) localStorage.setItem("skadam-promo", promoCode)
      else localStorage.removeItem("skadam-promo")
    }
  }, [promoCode, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-discount", JSON.stringify(promoDiscount))
    }
  }, [promoDiscount, mounted])

  // ---------------- CART ACTIONS ----------------
  const addItem = (newItem: CartItem, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      const existing = tableCart.find(item => item.productId === newItem.productId)
      const updatedCart = existing
        ? tableCart.map(item =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item,
          )
        : [...tableCart, newItem]

      return { ...prev, [tableNumber]: updatedCart }
    })
  }

  const removeItem = (productId: string, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      return {
        ...prev,
        [tableNumber]: tableCart.filter(item => item.productId !== productId),
      }
    })
  }

  const updateQuantity = (productId: string, quantity: number, tableNumber: string) => {
    if (quantity <= 0) {
      removeItem(productId, tableNumber)
      return
    }

    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      return {
        ...prev,
        [tableNumber]: tableCart.map(item =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      }
    })
  }

  const clearCart = (tableNumber: string) => {
    setCarts(prev => ({ ...prev, [tableNumber]: [] }))
  }

  const total = (tableNumber: string) => {
    const tableCart = carts[tableNumber] || []
    const subtotal = tableCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return Math.max(0, subtotal - promoDiscount)
  }

  // ---------------- PROMO ----------------
  const applyPromoCode = (code: string, discount: number) => {
    setPromoCode(code)
    setPromoDiscount(discount)
  }

  const removePromoCode = () => {
    setPromoCode(null)
    setPromoDiscount(0)
  }

  // ---------------- CURRENT TABLE CART ----------------
  const currentTableItems = (tableNumber: string) => carts[tableNumber] || []

  return (
    <CartContext.Provider
      value={{
        items: [], // keep blank, use currentTableItems in MenuPage
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        promoCode,
        promoDiscount,
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
