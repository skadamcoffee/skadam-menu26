'use client'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart, Customization } from "@/components/cart/cart-context"
import { motion, useAnimation } from "framer-motion"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  popular: boolean | number | null
  category_id: string
}

export function MenuPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table") || "1"

  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("products").select("*").eq("available", true).order("name"),
      ])
      if (catRes.data) {
        setCategories(catRes.data)
        if (catRes.data.length > 0) {
          setSelectedCategory(catRes.data[0].id)
        }
      }
      if (prodRes.data) setProducts(prodRes.data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    } else {
      setFilteredProducts(products)
    }
  }, [products, selectedCategory])

  const handleAddToCart = (productId: string, quantity: number, customizations: Customization[]) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    addItem(
      {
        productId,
        productName: product.name,
        price: product.price,
        quantity,
        image_url: product.image_url,
        customizations,
      },
      tableNumber
    )

    cartControls.start({
      rotate: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    })
  }

  const tableCartItems = getTableItems(tableNumber)
  const totalItems = tableCartItems.reduce((sum, i) => sum + i.quantity, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-10" />
            <span className="font-bold text-lg">Table {tableNumber}</span>
          </div>
          <motion.div animate={cartControls}>
            <Button onClick={() => setIsCartOpen(true)} variant="ghost" className="relative">
              <img src="/icons/cart.svg" alt="Cart" className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </motion.div>
        </div>
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </main>

      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
