"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard, type ProductCustomization } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart } from "@/components/cart/cart-context"
import { motion, useAnimation, AnimatePresence } from "framer-motion"

interface Promotion {
  id: string
  title: string
  description: string
  image_url: string
  discount_text: string
}

export function MenuPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table") || "1"

  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0)

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // Update selected category
  useEffect(() => {
    if (!categories.length) return
    setSelectedCategory(categories[selectedCategoryIndex]?.id ?? null)
  }, [selectedCategoryIndex, categories])

  // Fetch categories & products & promotions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [catRes, prodRes, promoRes] = await Promise.all([
          supabase.from("categories").select("*").order("display_order", { ascending: true }),
          supabase.from("products").select("*").eq("available", true).order("name"),
          supabase.from("promotions").select("*").eq("is_active", true).order("display_order", { ascending: true })
        ])

        if (catRes.data) setCategories(catRes.data)
        if (prodRes.data) setProducts(prodRes.data)
        if (promoRes.data) setPromotions(promoRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-rotate promotions
  useEffect(() => {
    if (promotions.length > 1) {
      const timer = setInterval(() => {
        setCurrentPromoIndex((p) => (p + 1) % promotions.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [promotions.length])

  // Filter products
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    }
  }, [products, selectedCategory])

  const handleAddToCart = (productId: string, quantity: number, customization?: ProductCustomization) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    addItem(
      {
        productId,
        productName: product.name,
        price: product.price,
        quantity,
        image_url: product.image_url,
        productCustomization: customization,
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🌙</div>
          <p className="text-white/80">Preparing menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(135deg, #f4e4bc 0%, #e6d4a7 50%, #d4c08a 100%)',
        backgroundSize: 'cover',
      }}
    >

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-yellow-400/20 flex items-center justify-between gap-4 px-4 py-3">

        {/* Logo + Table */}
        <div className="flex items-center gap-3">
          {/* Rectangular Logo */}
          <div className="h-12 px-3 bg-white/90 rounded-xl flex items-center shadow-lg">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
              alt="Logo"
              className="h-full w-auto object-contain"
            />
          </div>

          {/* Table Number Badge */}
          <div className="relative">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png"
              className="w-10 h-10"
            />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold">
              {tableNumber}
            </span>
          </div>
        </div>

        {/* Cart */}
        <motion.div animate={cartControls}>
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            className="relative w-14 h-14 rounded-full p-0 hover:bg-white/10"
          >
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png"
              className="w-8 h-8"
            />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </motion.div>

      </div>

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={promotions[currentPromoIndex]?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={promotions[currentPromoIndex]?.image_url || "/placeholder.svg"}
                className="w-full h-48 object-cover"
                alt={promotions[currentPromoIndex]?.title}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Categories */}
      <div 
        className="px-4 py-3 overflow-x-auto"
        style={{
          background: 'linear-gradient(135deg, #f4e4bc 0%, #e6d4a7 50%, #d4c08a 100%)',
        }}
      >
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id)
            const index = categories.findIndex(c => c.id === id)
            if (index !== -1) setSelectedCategoryIndex(index)
          }}
        />
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* Cart Panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
