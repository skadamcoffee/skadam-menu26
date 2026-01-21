"use client"

import { useState, useEffect, useRef } from "react"  // Added useRef for measuring container width
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart } from "@/components/cart/cart-context"
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion"  // Added useAnimation to imports

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
  const [currentIndex, setCurrentIndex] = useState(0)

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // Ref for the carousel container to measure width
  const carouselRef = useRef<HTMLDivElement>(null)

  // For carousel drag - now in pixels
  const x = useMotionValue(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Update container width on resize or mount
  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setContainerWidth(carouselRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  // Update selected category
  useEffect(() => {
    if (!categories.length) return
    setSelectedCategory(categories[selectedCategoryIndex]?.id ?? null)
  }, [selectedCategoryIndex, categories])

  // Fetch categories & products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*").order("display_order", { ascending: true }),
          supabase.from("products").select("*").eq("available", true).order("name"),
        ])

        if (catRes.data) setCategories(catRes.data)
        if (prodRes.data) setProducts(prodRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter products
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    }
  }, [products, selectedCategory])

  const handleAddToCart = (productId: string, quantity: number) => {
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

    cartControls.start({
      rotate: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    })
  }

  const tableCartItems = getTableItems(tableNumber)
  const totalItems = tableCartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Carousel logic
  const itemsPerView = 1 // For mobile, show 1; you can adjust for desktop
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView)

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  // Improved drag end: Snap to nearest slide
  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Calculate target index based on drag distance and velocity
    const moveBy = Math.round(-offset / containerWidth) + Math.sign(velocity) * 0.5
    const targetIndex = Math.max(0, Math.min(maxIndex, currentIndex + moveBy))

    setCurrentIndex(targetIndex)
  }

  // Reset carousel on category change
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedCategory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🌘</div>
          <p className="text-white/80">Preparing menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
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

      {/* Categories */}
      <div className="px-4 py-3 bg-gray-100 overflow-x-auto">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id)
            const index = categories.findIndex(c => c.id === id)
            if (index !== -1) setSelectedCategoryIndex(index)
            // Reset handled by useEffect above
          }}
        />
      </div>

      {/* Products Carousel */}
      <div className="relative max-w-7xl mx-auto px-4 py-6">
        <div className="overflow-hidden" ref={carouselRef}>
          <motion.div
            className="flex"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -maxIndex * containerWidth, right: 0 }}  // Fixed: Pixel-based constraints for full range
            onDragEnd={handleDragEnd}
            animate={{ x: -currentIndex * containerWidth }}  // Fixed: Pixel-based animation
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="flex-shrink-0 w-full px-2"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                >
                  <ProductCard {...product} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        {filteredProducts.length > itemsPerView && (
          <>
            <Button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 disabled:opacity-50"
            >
              ‹
            </Button>
            <Button
              onClick={nextSlide}
              disabled={currentIndex === maxIndex}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 disabled:opacity-50"
            >
              ›
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-yellow-400" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
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
