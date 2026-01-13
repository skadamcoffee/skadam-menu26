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

  /* ====================== UI ====================== */
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dgequg3ik/image/upload/v1768316496/Design_sans_titre_20260113_160100_0000_o8y9s6.jpg')",
      }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT */}
      <div className="relative z-10">
        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://ncfbpqsziufcjxsrhbeo.supabase.co/storage/v1/object/public/category-icons/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000.png"
                  alt="SKADAM Logo"
                  className="h-14 w-auto"
                />

                {tableNumber && (
                  <span className="text-sm text-white bg-white/10 px-3 py-1 rounded-full backdrop-blur">
                    Table {tableNumber}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative hover:bg-white/10"
              >
                <img
                  src="https://res.cloudinary.com/drn49acqf/image/upload/v1768141962/barista_pf2ksk.png"
                  alt="Cart"
                  className="w-6 h-6"
                />

                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>

            {/* SEARCH */}
            <div className="mb-4">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>

            {/* CATEGORIES */}
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
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

        {/* ================= CART ================= */}
        <CartPanel
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          tableNumber={tableNumber}
        />
      </div>
    </div>
  )
}
