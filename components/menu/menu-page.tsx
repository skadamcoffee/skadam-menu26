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

  // State for hiding arrows (true = hidden)
  const [hideLeftArrow, setHideLeftArrow] = useState(true)
  const [hideRightArrow, setHideRightArrow] = useState(true)

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
          supabase
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true }),
          supabase
            .from("products")
            .select("*")
            .eq("available", true)
            .order("name"),
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
      setFilteredProducts(
        products.filter((p) => p.category_id === selectedCategory)
      )
    }
  }, [products, selectedCategory])

  // Handle add to cart with animation
  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
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

  // Width of one category tab + gap (adjust if you change styling)
  const tabWidth = 88 // px (includes gap)

  // Scroll categories by 1 tab width and update arrow visibility
  const scrollCategories = (direction: "left" | "right") => {
    if (!catContainerRef.current) return

    const container = catContainerRef.current
    const scrollAmount = tabWidth

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  // Update arrow visibility on scroll
  const checkArrowsVisibility = () => {
    if (!catContainerRef.current) return

    const container = catContainerRef.current
    const scrollLeft = container.scrollLeft
    const maxScrollLeft = container.scrollWidth - container.clientWidth

    setHideLeftArrow(scrollLeft <= 5) // small buffer for float precision
    setHideRightArrow(scrollLeft >= maxScrollLeft - 5)
  }

  // Attach scroll listener for arrows visibility
  useEffect(() => {
    const container = catContainerRef.current
    if (!container) return
    checkArrowsVisibility()

    container.addEventListener("scroll", checkArrowsVisibility, {
      passive: true,
    })

    return () => {
      container.removeEventListener("scroll", checkArrowsVisibility)
    }
  }, [categories, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Loading menu...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative select-none">

      {/* Storefront Image */}
      <div className="w-full h-40 sm:h-52 md:h-56 lg:h-60 overflow-hidden">
        <img
          src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768991884/Screenshot_20260121_113710_ayy1r3.jpg"
          alt="Cafete Du Golf Storefront"
          className="w-full h-full object-cover"
        />
      </div>

      {/* SKADAM Banner */}
      <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-lg mt-0">
        <img
          src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768992200/530c10113263681.602422d032396_2_ppe8o1.jpg"
          alt="SKADAM BANNER"
          className="w-full rounded-3xl object-cover"
          style={{ height: "150px" }}
        />
      </div>

      {/* Categories Carousel Container with fade overlays */}
      <div className="relative max-w-md mx-auto mt-5 select-none">

        {/* Fade Left Overlay */}
        {!hideLeftArrow && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white to-transparent z-30" />
        )}

        {/* Fade Right Overlay */}
        {!hideRightArrow && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-30" />
        )}

        {/* Left Arrow */}
        {!hideLeftArrow && (
          <button
            aria-label="Scroll categories left"
            onClick={() => scrollCategories("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
            style={{ userSelect: "none" }}
          >
            ‹
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={catContainerRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                const index = categories.findIndex((c) => c.id === cat.id)
                if (index !== -1) setSelectedCategoryIndex(index)
              }}
              className={`flex-shrink-0 flex flex-col items-center cursor-pointer p-1 snap-start rounded-lg transition ${
                selectedCategory === cat.id ? "ring-4 ring-yellow-400" : "opacity-75 hover:opacity-100"
              }`}
              title={cat.name}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: selectedCategory === cat.id ? 1.1 : 1, opacity: 1 }}
              whileHover={{ scale: 1.15, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ width: "64px" }}
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
              <span className="mt-1 text-xs font-semibold text-gray-900 text-center truncate w-full select-none">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Right Arrow */}
        {!hideRightArrow && (
          <button
            aria-label="Scroll categories right"
            onClick={() => scrollCategories("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
            style={{ userSelect: "none" }}
          >
            ›
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* Floating Cart Button */}
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
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
              }
