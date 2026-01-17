"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { SearchBar } from "./search-bar"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  // Filter products
  useEffect(() => {
    let filtered = products
    if (selectedCategory) filtered = filtered.filter(p => p.category_id === selectedCategory)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      )
    }
    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

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
      <div className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-yellow-400/20 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <span className="text-white font-bold">Table {tableNumber}</span>
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            className="relative w-14 h-14 rounded-full p-0 hover:bg-white/10"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id)
          const index = categories.findIndex(c => c.id === id)
          if (index !== -1) setSelectedCategoryIndex(index)
        }}
      />

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} />
    </div>
  )
}
