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
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hideCategories, setHideCategories] = useState(false)

  const lastScrollY = useRef(0)
  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // Swipe refs
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  // Update selected category when index changes
  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(categories[selectedCategoryIndex]?.id || null)
    }
  }, [selectedCategoryIndex, categories])

  // Scroll header
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current && currentY > 80) {
        setIsMinimized(true)
        setHideCategories(true)
      } else {
        setIsMinimized(false)
        setHideCategories(false)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          supabase.from("categories").select("*").order("display_order", { ascending: true }),
          supabase.from("products").select("*").eq("available", true).order("name", { ascending: true }),
        ])
        if (categoriesRes.data) setCategories(categoriesRes.data)
        if (productsRes.data) setProducts(productsRes.data)
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
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      )
    }
    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

  const handleAddToCart = async (productId, quantity) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    addItem(
      {
        productId,
        productName: product.name,
        price: product.price,
        quantity,
        image_url: product.image_url,
      },
      tableNumber
    )
    await cartControls.start({
      rotate: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    })
  }

  const tableCartItems = getTableItems(tableNumber)
  const totalItems = tableCartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current

    // Ignore swipe if vertical movement is bigger than horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX)) return

    if (Math.abs(deltaX) < 50) return // ignore small moves

    if (deltaX < 0) {
      // swipe left → next category
      setSelectedCategoryIndex(prev => Math.min(prev + 1, categories.length - 1))
    } else {
      // swipe right → previous category
      setSelectedCategoryIndex(prev => Math.max(prev - 1, 0))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🌙</div>
          <p className="text-white/80">Preparing Ramadan menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://res.cloudinary.com/dgequg3ik/image/upload/v1768316496/Design_sans_titre_20260113_160100_0000_o8y9s6.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">

        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-yellow-400/20"
          animate={{ paddingTop: isMinimized ? 2 : 4, paddingBottom: isMinimized ? 2 : 4 }}
          transition={{ duration: 0.25 }}
        >
          <div className="max-w-7xl mx-auto px-4 text-white flex items-center justify-between gap-4 py-2">

            {/* Logo + Table */}
            <div className="flex items-center gap-3">
              <div className="bg-white/90 rounded-xl px-3 py-2 shadow-lg">
                <motion.img
                  src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
                  alt="Logo"
                  animate={{ height: isMinimized ? 28 : 40 }}
                />
              </div>
              <div className="relative">
                <img src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png" className="w-10 h-10" />
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold animate-pulse">
                  {tableNumber}
                </span>
              </div>
            </div>

            {/* Cart */}
            {!isMinimized && (
              <motion.div animate={cartControls}>
                <Button
  onClick={() => setIsCartOpen(true)}
  variant="ghost" // make it transparent
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
            )}
          </div>

          {/* Search */}
          <div className="px-4 mt-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Categories */}
          <motion.div
            className="overflow-x-auto py-3 px-2"
            animate={{ height: hideCategories ? 0 : "auto", opacity: hideCategories ? 0 : 1 }}
            transition={{ duration: 0.25 }}
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
          </motion.div>
        </motion.div>

        {/* Products */}
        <div
          className="max-w-7xl mx-auto px-4 py-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-white opacity-80">
              {searchTerm ? "No items found matching your search" : "No items available"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart */}
        {isMinimized && (
          <motion.div className="fixed bottom-6 right-6 z-50" animate={cartControls}>
            <Button
  onClick={() => setIsCartOpen(true)}
  variant="ghost" // make it transparent
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
        )}

        <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} />
      </div>
    </div>
  )
              }
