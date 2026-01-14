"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { CategoryTabs } from "./category-tabs"
import { SearchBar } from "./search-bar"
import { Button } from "@/components/ui/button"
import { CartPanel } from "@/components/cart/cart-panel"
import { useCart } from "@/components/cart/cart-context"

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

  const { items: cartItems, addItem } = useCart()
  const supabase = createClient()

  /* ---------------- FETCH DATA ---------------- */
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
  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    addItem({
      productId,
      productName: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url,
    })
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

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
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10">

        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-yellow-400/20">
          <div className="max-w-7xl mx-auto px-4 py-4 text-white">

            {/* TOP ROW */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">

                {/* LOGO FIX */}
                <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-lg">
                  <img
                    src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
                    alt="SKADAM Logo"
                    className="h-10 w-auto"
                  />
                </div>

                {tableNumber && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full">
                    Table {tableNumber}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative text-white hover:bg-white/10"
              >
                <img
                  src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/ed72e316-ccf6-4b12-b699-34d910b873e3_20260114_161946_0000.png"
                  alt="Cart"
                  className="w-6 h-6"
                />

                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>

            {/* SEARCH */}
            <div className="mb-4">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>

            {/* ================= CATEGORY FIX ================= */}
            <div className="relative">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl px-2 py-3">

                {/* FORCE TEXT VISIBILITY */}
                <div className="text-white [&_*]:text-white [&_span]:text-white [&_p]:text-white">
                  <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ================= PRODUCTS ================= */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-white">
              <p className="text-lg opacity-80">
                {searchTerm
                  ? "No items found matching your search"
                  : "No items available"}
              </p>
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

        <CartPanel
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          tableNumber={tableNumber}
        />
      </div>
    </div>
  )
}
