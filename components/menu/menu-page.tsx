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

interface Category {
  id: string
  name: string
  image_url: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  available: boolean
}

export function MenuPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [isMinimized, setIsMinimized] = useState(false)
  const [hideCategories, setHideCategories] = useState(false)

  const lastScrollY = useRef(0)

  const { items: cartItems, addItem } = useCart()
  const supabase = createClient()
  const cartControls = useAnimation()
  const tableControls = useAnimation()

  /* ---------------- SCROLL LOGIC ---------------- */
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY

      if (currentY > lastScrollY.current && currentY > 80) {
        // scrolling down
        setIsMinimized(true)
        setHideCategories(true)
      } else {
        // scrolling up
        setIsMinimized(false)
        setHideCategories(false)
      }

      lastScrollY.current = currentY
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true }),
          supabase
            .from("products")
            .select("*")
            .eq("available", true)
            .order("name", { ascending: true }),
        ])

        if (categoriesRes.data) setCategories(categoriesRes.data)
        if (productsRes.data) setProducts(productsRes.data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  /* ---------------- FILTER PRODUCTS ---------------- */
  useEffect(() => {
    let filtered = products

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

  /* ---------------- CART ---------------- */
  const handleAddToCart = async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    addItem({
      productId,
      productName: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url,
    })

    // Cart shake
    await cartControls.start({
      rotate: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    })
  }

  /* ---------------- TABLE ICON ANIMATION ---------------- */
  useEffect(() => {
    if (tableNumber) {
      tableControls.start({
        scale: [1, 1.2, 1],
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.5 },
      })
    }
  }, [tableNumber])

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  /* ---------------- LOADING ---------------- */
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
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dgequg3ik/image/upload/v1768316496/Design_sans_titre_20260113_160100_0000_o8y9s6.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/25" /> {/* lighter overlay */}
      <div className="relative z-10">

        {/* ================= HEADER ================= */}
        <motion.div
          className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10"
          animate={{ paddingTop: isMinimized ? 2 : 4, paddingBottom: isMinimized ? 2 : 4 }}
          transition={{ duration: 0.25 }}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">

            {/* LEFT: Logo + Table */}
            <div className="flex items-center gap-3">
              <div className="bg-white/90 rounded-xl px-3 py-2 shadow-lg">
                <img
                  src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
                  alt="SKADAM Logo"
                  className="w-auto h-10"
                />
              </div>

              {/* Table Icon with badge */}
              {tableNumber && (
                <motion.div
                  animate={tableControls}
                  className="relative inline-flex items-center justify-center w-10 h-10"
                >
                  <img
                    src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/9954957.png"
                    alt="Table"
                    className="w-full h-full object-contain"
                  />
                  <span className="
                    absolute -top-1 -right-1 
                    bg-yellow-400 text-black 
                    rounded-full w-5 h-5 
                    text-xs flex items-center justify-center font-bold shadow-md
                  ">
                    {tableNumber}
                  </span>
                </motion.div>
              )}
            </div>

            {/* RIGHT: Cart */}
            <div>
              {!isMinimized && (
                <motion.div animate={cartControls}>
                  <Button
                    variant="ghost"
                    onClick={() => setIsCartOpen(true)}
                    className="relative w-14 h-14 rounded-full text-white hover:bg-white/10"
                  >
                    <img
                      src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png"
                      alt="Cart"
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

          </div>

          {/* SEARCH */}
          <div className="max-w-7xl mx-auto px-4 py-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* CATEGORIES */}
          <motion.div
            className="overflow-hidden max-w-7xl mx-auto px-2 py-2"
            animate={{
              height: hideCategories ? 0 : "auto",
              opacity: hideCategories ? 0 : 1,
            }}
            transition={{ duration: 0.25 }}
          >
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </motion.div>
        </motion.div>

        {/* ================= PRODUCTS ================= */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-white opacity-80">
              {searchTerm
                ? "No items found matching your search"
                : "No items available"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image_url={product.image_url}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* FLOATING CART WHEN MINIMIZED */}
        {isMinimized && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            animate={cartControls}
          >
            <Button
              onClick={() => setIsCartOpen(true)}
              className="relative w-16 h-16 rounded-full bg-yellow-400 text-black shadow-xl"
            >
              <img
                src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/3643914.png"
                alt="Cart"
                className="w-8 h-8"
              />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-yellow-400 rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
          </motion.div>
        )}

        <CartPanel
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          tableNumber={tableNumber}
        />
      </div>
    </div>
  )
}
