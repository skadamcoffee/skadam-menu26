"use client"

import { useState, useEffect } from "react"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Loading menu...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">

      {/* 1. Header Image (Storefront) */}
      <div className="w-full h-40 sm:h-52 md:h-64 lg:h-72 overflow-hidden">
        <img
          src="https://your-image-hosting.com/cafete-du-golf-storefront.jpg" // Replace with your image URL
          alt="Cafete Du Golf Storefront"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. SWING Banner Image */}
      <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden mt-5 sm:mt-6 shadow-lg px-4 sm:px-0">
        <img
          src="https://your-image-hosting.com/swing-banner.jpg" // Replace with your image URL
          alt="SWING Banner"
          className="w-full"
        />
      </div>

      {/* 3. Categories horizontal scroll */}
      <div
        className="flex items-center bg-white py-6 px-4 max-w-4xl mx-auto space-x-6 overflow-x-auto scrollbar-hide scroll-smooth mt-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id)
              const index = categories.findIndex(c => c.id === cat.id)
              if (index !== -1) setSelectedCategoryIndex(index)
            }}
            className={`flex flex-col items-center cursor-pointer rounded-full p-1 transition flex-shrink-0 ${
              selectedCategory === cat.id ? "ring-4 ring-yellow-400" : ""
            }`}
          >
            <img
              src={cat.image_url}
              alt={cat.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md"
            />
            <span className="mt-1 text-xs sm:text-sm font-semibold text-gray-900 text-center select-none leading-tight">
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* 4. Products grid: 1 col mobile, 2 sm, 3 lg, 4 xl */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} {...product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {/* 5. Floating cart button bottom-right, sized for mobile */}
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
