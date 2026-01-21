"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart } from "@/components/cart/cart-context"
import { motion, useAnimation } from "framer-motion"
import { Button } from "@/components/ui/button"

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

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // Ref for category scroll container
  const catContainerRef = useRef<HTMLDivElement | null>(null)

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

  // Filter products by category
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    }
  }, [products, selectedCategory])

  // Handle add to cart with animation
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

  // Scroll categories by width of 1 category (plus gap)
  const scrollCategories = (direction: "left" | "right") => {
    if (!catContainerRef.current) return

    // Width of one category item + gap between items (assumed 1rem = 16px gap)
    // Category item width is 80px (64px image + padding + label)
    // Adjust based on styling below if needed
    const scrollAmount = 96 // px - tweak if needed

    const container = catContainerRef.current

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Loading menu...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">

      {/* 1. Storefront Image */}
      <div className="w-full h-40 sm:h-52 md:h-56 lg:h-60 overflow-hidden">
        <img
          src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768991884/Screenshot_20260121_113710_ayy1r3.jpg"
          alt="Cafete Du Golf Storefront"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. SKADAM Banner - smaller, centered, no vertical padding/margin */}
      <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-lg">
        <img
          src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768992200/530c10113263681.602422d032396_2_ppe8o1.jpg"
          alt="SKADAM BANNER"
          className="w-full rounded-3xl object-cover"
          style={{ height: "140px" }} // smaller fixed height, adjust if needed
        />
      </div>

      {/* 3. Categories Carousel with fixed width showing 4 */}
      <div className="relative max-w-md mx-auto mt-5">

        {/* Left Arrow */}
        <button
          aria-label="Scroll categories left"
          onClick={() => scrollCategories("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          style={{ userSelect: "none" }}
        >
          ‹
        </button>

        {/* Category Scroll Container */}
        <div
          ref={catContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth px-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                const index = categories.findIndex((c) => c.id === cat.id)
                if (index !== -1) setSelectedCategoryIndex(index)
              }}
              className={`flex-shrink-0 flex flex-col items-center cursor-pointer rounded-full p-1 transition ${
                selectedCategory === cat.id ? "" : "opacity-80"
              }`}
              style={{ width: "72px" }}
              title={cat.name}
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-14 h-14 rounded-full object-cover shadow-sm"
              />
              <span className="mt-1 text-xs font-semibold text-gray-900 text-center select-none truncate w-full">
                {cat.name}
              </span>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          aria-label="Scroll categories right"
          onClick={() => scrollCategories("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          style={{ userSelect: "none" }}
        >
          ›
        </button>
      </div>

      {/* 4. Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* 5. Floating cart button bottom-right */}
      <motion.div
        animate={cartControls}
        className="fixed bottom-5 right-5 z-50"
        style={{ touchAction: "manipulation" }}
      >
        <Button
          onClick={() => setIsCartOpen(true)}
          variant="ghost"
          className="relative w-14 h-14 rounded-full p-0 hover:bg-yellow-400/20 shadow-lg"
          aria-label="Open cart"
        >
          <img
            src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png"
            alt="Cart"
            className="w-8 h-8"
          />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold select-none">
              {totalItems}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} tableNumber={tableNumber} />
    </div>
  )
}
