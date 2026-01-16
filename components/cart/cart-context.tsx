"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  image_url?: string // Added product image URL
  customizations?: {
    size?: string
    addOns?: string[]
    notes?: string
    customizationPrice?: number
  }
  cartItemId?: string // Unique ID for items with different customizations
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  updateCustomizations: (cartItemId: string, customizations: CartItem["customizations"]) => void
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem("skadam-cart")
    const savedPromo = localStorage.getItem("skadam-promo")
    const savedDiscount = localStorage.getItem("skadam-discount")

    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
    if (savedPromo) {
      setPromoCode(savedPromo)
    }
    if (savedDiscount) {
      setPromoDiscount(JSON.parse(savedDiscount))
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-cart", JSON.stringify(items))
    }
  }, [items, mounted])

  useEffect(() => {
    if (mounted) {
      if (promoCode) {
        localStorage.setItem("skadam-promo", promoCode)
      } else {
        localStorage.removeItem("skadam-promo")
      }
    }
  }, [promoCode, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skadam-discount", JSON.stringify(promoDiscount))
    }
  }, [promoDiscount, mounted])

  const generateCartItemId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const addItem = (newItem: CartItem) => {
    const itemWithId = {
      ...newItem,
      cartItemId: newItem.cartItemId || generateCartItemId(),
    }
    setItems((prev) => [...prev, itemWithId])
  }

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
  }

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId)
      return
    }
    setItems((prev) => prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item)))
  }

  const updateCustomizations = (cartItemId: string, customizations: CartItem["customizations"]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              customizations,
              price: item.price + (customizations?.customizationPrice || 0),
            }
          : item,
      ),
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
        updateCustomizations,
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
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
