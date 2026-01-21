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

  const cartControls = useAnimation()
  const supabase = createClient()
  const { addItem, getTableItems } = useCart()

  // 1. Fetch Categories & Products
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

  // 2. Filter Products based on Category Selection
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(p => p.category_id === selectedCategory))
    }
  }, [products, selectedCategory])

  // 3. Featured Products Logic (Top 5 items for Carousel)
  const featuredProducts = products.filter(p => p.is_featured).slice(0, 5)

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
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🌘</div>
          <p className="font-medium tracking-widest uppercase text-xs">Preparing Brew...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative pb-24">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 px-3 bg-white rounded-lg flex items-center">
            <img
              src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
              alt="Logo"
              className="h-6 w-auto object-contain"
            />
          </div>
          <div className="relative">
            <img src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png" className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
              {tableNumber}
            </span>
          </div>
        </div>

        <motion.div animate={cartControls}>
          <Button onClick={() => setIsCartOpen(true)} variant="ghost" className="relative w-12 h-12 rounded-full p-0 hover:bg-white/10">
            <img src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png" className="w-6 h-6 invert" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* FEATURED CAROUSEL (Visible only when 'All' is selected) */}
      {!selectedCategory && featuredProducts.length > 0 && (
        <section className="mt-6">
          <div className="px-6 mb-4 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Today's Specials</h2>
              <p className="text-sm text-gray-500">Smart picks based on the time of day</p>
            </div>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 no-scrollbar">
            {featuredProducts.map((item) => (
              <motion.div 
                key={item.id}
                whileTap={{ scale: 0.97 }}
                className="snap-center shrink-0 w-[82vw] sm:w-80 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
              >
                <div className="relative h-64">
                  <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                    {item.calories ? `${item.calories} kcal` : 'Popular'}
                  </div>
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                    <p className="text-sm opacity-80 line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <div className="p-6 flex justify-between items-center bg-white">
                  <span className="text-2xl font-black text-gray-900">${item.price}</span>
                  <Button 
                    onClick={() => handleAddToCart(item.id, 1)}
                    className="rounded-2xl bg-black text-white hover:bg-yellow-400 hover:text-black h-12 w-12 p-0 transition-colors shadow-lg"
                  >
                    <span className="text-2xl">+</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES TABS */}
      <div className="sticky top-[65px] z-40 px-4 py-4 bg-[#F8F9FA]/80 backdrop-blur-md">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(id)}
        />
      </div>

      {/* PRODUCT GRID */}
      <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            {...product} 
            onAddToCart={handleAddToCart} 
          />
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredProducts.length === 0 && !isLoading && (
        <div className="py-20 text-center text-gray-400">
          <p>No products found in this category.</p>
        </div>
      )}

      {/* CART OVERLAY */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
