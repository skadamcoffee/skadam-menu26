"use client"  
  
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"  
  
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
  discount_type: "percentage" | "fixed"  
  discount_value: number  
}  
  
interface CartContextType {  
  carts: Record<string, CartItem[]>  
  promos: Record<string, Promo>  
  
  addItem: (item: CartItem, tableNumber: string) => void  
  removeItem: (productId: string, tableNumber: string, customizations?: Customization[]) => void  
  updateQuantity: (productId: string, quantity: number, tableNumber: string, customizations?: Customization[]) => void  
  updateCustomization: (  
    productId: string,  
    tableNumber: string,  
    oldCustomizations: Customization[],  
    newCustomizations: Customization[]  
  ) => void  
  
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
  
  // Helper function to create unique item key  
  const getItemKey = (item: CartItem) =>   
    `${item.productId}:${JSON.stringify(item.customizations || [])}`  
  
  // ---------- LOAD FROM LOCALSTORAGE ----------  
  useEffect(() => {  
    const savedCarts = localStorage.getItem("skadam-carts")  
    const savedPromos = localStorage.getItem("skadam-promos")  
  
    if (savedCarts) {  
      try {  
        setCarts(JSON.parse(savedCarts))  
      } catch (error) {  
        console.error("Failed to parse carts from localStorage:", error)  
        localStorage.removeItem("skadam-carts")  
      }  
    }  
      
    if (savedPromos) {  
      try {  
        setPromos(JSON.parse(savedPromos))  
      } catch (error) {  
        console.error("Failed to parse promos from localStorage:", error)  
        localStorage.removeItem("skadam-promos")  
      }  
    }  
  
    setMounted(true)  
  }, [])  
  
  // ---------- PERSIST CARTS ----------  
  useEffect(() => {  
    if (mounted) {  
      localStorage.setItem("skadam-carts", JSON.stringify(carts))  
    }  
  }, [carts, mounted])  
  
  // ---------- PERSIST PROMOS ----------  
  useEffect(() => {  
    if (mounted) {  
      localStorage.setItem("skadam-promos", JSON.stringify(promos))  
    }  
  }, [promos, mounted])  
  
  // ---------- CART ACTIONS ----------  
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
    setCarts(prev => ({  
      ...prev,  
      [tableNumber]: (prev[tableNumber] || []).filter(i =>   
        !(i.productId === productId &&   
          JSON.stringify(i.customizations || []) === JSON.stringify(customizations || []))  
      ),  
    }))  
  }  
  
  const updateQuantity = (productId: string, quantity: number, tableNumber: string, customizations?: Customization[]) => {  
    if (quantity <= 0) {  
      removeItem(productId, tableNumber, customizations)  
      return  
    }  
  
    setCarts(prev => ({  
      ...prev,  
      [tableNumber]: (prev[tableNumber] || []).map(i =>  
        (i.productId === productId &&   
         JSON.stringify(i.customizations || []) === JSON.stringify(customizations || []))  
          ? { ...i, quantity }  
          : i  
      ),  
    }))  
  }  
  
  const updateCustomization = (  
    productId: string,  
    tableNumber: string,  
    oldCustomizations: Customization[],  
    newCustomizations: Customization[]  
  ) => {  
    setCarts(prev => ({  
      ...prev,  
      [tableNumber]: (prev[tableNumber] || []).map(i =>  
        (i.productId === productId &&   
         JSON.stringify(i.customizations || []) === JSON.stringify(oldCustomizations))  
          ? { ...i, customizations: newCustomizations }  
          : i  
      ),  
    }))  
  }  
  
  // ---------- PROMO CODE ACTIONS (PER TABLE) ----------  
  const applyPromoCode = (tableNumber: string, code: string, discount_type: "percentage" | "fixed", discount_value: number) => {  
    setPromos(prev => ({  
      ...prev,  
      [tableNumber]: { code, discount_type, discount_value },  
    }))  
  }  
  
  const removePromoCode = (tableNumber: string) => {  
    setPromos(prev => {  
      const updated = { ...prev }  
      delete updated[tableNumber]  
      return updated  
    })  
  }  
  
  // ---------- CLEAR CART ----------  
  const clearCart = (tableNumber: string) => {  
    setCarts(prev => {  
      const updated = { ...prev }  
      delete updated[tableNumber]  
      return updated  
    })  
  
    removePromoCode(tableNumber)  
  }  
  
  // ---------- TOTAL ----------  
  const total = (tableNumber: string) => {  
    const subtotal = (carts[tableNumber] || []).reduce((sum, i) => {  
      const customTotal =  
        i.customizations?.reduce((cSum, c) => cSum + c.price, 0) || 0  
      return sum + (i.price + customTotal) * i.quantity  
    }, 0)  
  
    const promo = promos[tableNumber]  
    let discount = 0  
      
    if (promo) {  
      if (promo.discount_type === "percentage") {  
        discount = (subtotal * promo.discount_value) / 100  
      } else {  
        discount = promo.discount_value  
      }  
      discount = Math.min(discount, subtotal) // Prevent negative totals  
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
