"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  image_url?: string
}

interface CartContextType {
  carts: Record<string, CartItem[]> // carts per table
  addItem: (item: CartItem, tableNumber: string) => void
  removeItem: (productId: string, tableNumber: string) => void
  updateQuantity: (productId: string, quantity: number, tableNumber: string) => void
  clearCart: (tableNumber: string) => void
  total: (tableNumber: string) => number
  getTableItems: (tableNumber: string) => CartItem[]
  promoCode: string | null
  promoDiscount: number
  applyPromoCode: (code: string, discount: number) => void
  removePromoCode: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({})
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Load carts and promo from localStorage
  useEffect(() => {
    const savedCarts = localStorage.getItem("skadam-carts")
    const savedPromo = localStorage.getItem("skadam-promo")
    const savedDiscount = localStorage.getItem("skadam-discount")

    if (savedCarts) setCarts(JSON.parse(savedCarts))
    if (savedPromo) setPromoCode(savedPromo)
    if (savedDiscount) setPromoDiscount(JSON.parse(savedDiscount))

    setMounted(true)
  }, [])

  // Save carts to localStorage
  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-carts", JSON.stringify(carts))
  }, [carts, mounted])

  // Save promo
  useEffect(() => {
    if (!mounted) return
    if (promoCode) localStorage.setItem("skadam-promo", promoCode)
    else localStorage.removeItem("skadam-promo")
  }, [promoCode, mounted])

  useEffect(() => {
    if (mounted) localStorage.setItem("skadam-discount", JSON.stringify(promoDiscount))
  }, [promoDiscount, mounted])

  // ---------------- CART ACTIONS ----------------
  const addItem = (newItem: CartItem, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      const existing = tableCart.find(i => i.productId === newItem.productId)
      const updatedCart = existing
        ? tableCart.map(i =>
            i.productId === newItem.productId
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          )
        : [...tableCart, newItem]

      return { ...prev, [tableNumber]: updatedCart }
    })
  }

  const removeItem = (productId: string, tableNumber: string) => {
    setCarts(prev => {
      const tableCart = prev[tableNumber] || []
      return { ...prev, [tableNumber]: tableCart.filter(i => i.productId !== productId) }
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
        [tableNumber]: tableCart.map(i =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      }
    })
  }

  const clearCart = (tableNumber: string) => {
    setCarts(prev => ({ ...prev, [tableNumber]: [] }))
  }

  const total = (tableNumber: string) => {
    const tableCart = carts[tableNumber] || []
    const subtotal = tableCart.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return Math.max(0, subtotal - promoDiscount)
  }

  const getTableItems = (tableNumber: string) => carts[tableNumber] || []

  const applyPromoCode = (code: string, discount: number) => {
    setPromoCode(code)
    setPromoDiscount(discount)
  }

  const removePromoCode = () => {
    setPromoCode(null)
    setPromoDiscount(0)
  }

  return (
    <CartContext.Provider
      value={{
        carts,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        getTableItems,
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
