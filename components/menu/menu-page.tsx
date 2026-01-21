"use client"

import { useState, useEffect } from "react"
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

  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  /* -------------------- FETCH DATA -------------------- */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("products").select("*").eq("available", true),
      ])
      if (catRes.data) setCategories(catRes.data)
      if (prodRes.data) setProducts(prodRes.data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  /* -------------------- FILTER PRODUCTS -------------------- */
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    }
    setCurrentIndex(0)
  }, [products, selectedCategory])

  /* -------------------- CART -------------------- */
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

  const totalItems = getTableItems(tableNumber).reduce((s, i) => s + i.quantity, 0)

  /* -------------------- CAROUSEL LOGIC -------------------- */
  const clampIndex = (i: number) =>
    Math.max(0, Math.min(filteredProducts.length - 1, i))

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -80) setCurrentIndex(i => clampIndex(i + 1))
    if (info.offset.x > 80) setCurrentIndex(i => clampIndex(i - 1))
  }

  /* -------------------- LOADING -------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70 animate-pulse">Preparing menu…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">

      {/* ---------------- HEADER ---------------- */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-yellow-400/20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-12 px-3 bg-white rounded-xl shadow">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
              className="h-full object-contain"
            />
          </div>

          <div className="relative">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png"
              className="w-10 h-10"
            />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">
              {tableNumber}
            </span>
          </div>
        </div>

        <motion.div animate={cartControls}>
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            className="relative w-14 h-14 rounded-full"
          >
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png"
              className="w-8 h-8"
            />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* ---------------- CATEGORIES ---------------- */}
      <div className="px-4 py-3">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* ---------------- STACKED CAROUSEL ---------------- */}
      <div className="relative h-[520px] flex items-center justify-center">

        {filteredProducts.map((product, index) => {
          const offset = index - currentIndex
          const isActive = offset === 0

          return (
            <motion.div
              key={product.id}
              drag="x"
              onDragEnd={handleDragEnd}
              animate={{
                x: offset * 70,
                scale: isActive ? 1 : 0.88,
                opacity: Math.abs(offset) > 2 ? 0 : 1,
                filter: isActive ? "blur(0px)" : "blur(1.5px)",
                zIndex: 10 - Math.abs(offset),
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute w-[85%] max-w-sm cursor-grab active:cursor-grabbing"
            >
              <ProductCard {...product} onAddToCart={handleAddToCart} />
            </motion.div>
          )
        })}
      </div>

      {/* ---------------- DOTS ---------------- */}
      <div className="flex justify-center gap-2 pb-6">
        {filteredProducts.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full ${
              i === currentIndex ? "bg-yellow-400" : "bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* ---------------- CART PANEL ---------------- */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
