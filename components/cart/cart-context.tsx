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
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  promoCode: string | null
  promoDiscount: number
  applyPromoCode: (code: string, discount: number) => void
  removePromoCode: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [mounted, setMounted] = useState(false) // track first load

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("skadam-cart")
    const savedPromo = localStorage.getItem("skadam-promo")
    const savedDiscount = localStorage.getItem("skadam-discount")

    if (savedCart) setItems(JSON.parse(savedCart))
    if (savedPromo) setPromoCode(savedPromo)
    if (savedDiscount) setPromoDiscount(JSON.parse(savedDiscount))

    setMounted(true)
  }, [])

  // Save items to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-cart", JSON.stringify(items))
    }
  }, [items, mounted])

  // Save promo code to localStorage
  useEffect(() => {
    if (mounted) {
      if (promoCode) {
        localStorage.setItem("skadam-promo", promoCode)
      } else {
        localStorage.removeItem("skadam-promo")
      }
    }
  }, [promoCode, mounted])

  // Save promo discount to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-discount", JSON.stringify(promoDiscount))
    }
  }, [promoDiscount, mounted])

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === newItem.productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        )
      }
      return [...prev, newItem]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    )
  }

  const clearCart = () => {
    setItems([])
    setPromoCode(null)
    setPromoDiscount(0)
    localStorage.removeItem("skadam-cart")
    localStorage.removeItem("skadam-promo")
    localStorage.removeItem("skadam-discount")
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Math.max(0, subtotal - promoDiscount)

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
        items,
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
