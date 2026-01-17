"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart } from "@/components/cart/cart-context"
import { motion, useAnimation } from "framer-motion"

export function MenuPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table") || "1"

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  const lastScrollY = useRef(0)
  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // Update selected category
  useEffect(() => {
    if (categories.length === 0) return
    const catId = categories[selectedCategoryIndex]?.id || null
    setSelectedCategory(catId)
  }, [selectedCategoryIndex, categories])

  // Scroll behavior (no shaking)
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      const minimized = currentY > lastScrollY.current && currentY > 80
      if (minimized !== isMinimized) setIsMinimized(minimized)
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [isMinimized])

  // Fetch categories & products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*").order("display_order", { ascending: true }),
          supabase.from("products").select("*").eq("available", true).order("name", { ascending: true }),
        ])
        if (catRes.data) setCategories(catRes.data)
        if (prodRes.data) setProducts(prodRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter products by category
  useEffect(() => {
    let filtered = products
    if (selectedCategory) filtered = filtered.filter(p => p.category_id === selectedCategory)
    setFilteredProducts(filtered)
  }, [products, selectedCategory])

  const handleAddToCart = (productId, quantity) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    addItem(
      { productId, productName: product.name, price: product.price, quantity, image_url: product.image_url },
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
    <div className="min-h-screen bg-gray-100 relative">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-yellow-400/20 flex items-center justify-between gap-4 px-4 py-3"
        animate={{ paddingTop: isMinimized ? 3 : 4, paddingBottom: isMinimized ? 3 : 4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-white/90 rounded-xl px-3 py-2 shadow-lg">
            <motion.img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
              alt="Logo"
              animate={{ height: isMinimized ? 28 : 40 }}
            />
          </div>

          {/* Table Icon */}
          <div className="relative">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png"
              className="w-10 h-10"
            />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold animate-pulse">
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
      </motion.div>

      {/* Categories Tabs */}
      <div className="px-4 py-3 bg-gray-100">
        <div className="flex gap-3 overflow-x-auto">
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategory
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  const index = categories.findIndex(c => c.id === cat.id)
                  if (index !== -1) setSelectedCategoryIndex(index)
                }}
                className={`px-4 py-2 rounded-xl font-medium text-sm flex-shrink-0 transition-colors duration-200 ${
                  isSelected ? "bg-yellow-400 text-black" : "bg-black/60 text-white"
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} />
    </div>
  )
}
