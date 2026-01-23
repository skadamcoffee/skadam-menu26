"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export interface ProductCustomization {
  selectedSize: string | null
  sizePrice: number
  selectedToppings: { id: string; name: string; price: number }[]
  specialRequests: string
}

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  popular: boolean | number | null
  onAddToCart: (
    productId: string,
    quantity: number,
    customization?: ProductCustomization
  ) => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  popular,
  onAddToCart,
}: ProductCardProps) {
  const isPopular = !!popular

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [drinkSizes, setDrinkSizes] = useState<
    { id: string; name: string; price_modifier: number }[]
  >([])
  const [toppings, setToppings] = useState<
    { id: string; name: string; price: number }[]
  >([])

  const [customization, setCustomization] = useState<ProductCustomization>({
    selectedSize: null,
    sizePrice: 0,
    selectedToppings: [],
    specialRequests: "",
  })

  // ================= FETCH CUSTOMIZATIONS =================
  const fetchCustomizations = async () => {
    setIsLoading(true)
    try {
      const { data: sizesData, error: sizesError } = await supabase
        .from("drink_sizes")
        .select("id, name, price_modifier")
        .eq("product_id", id)
        .eq("is_available", true)
        .order("display_order", { ascending: true })

      if (sizesError) throw sizesError

      const { data: toppingsData, error: toppingsError } = await supabase
        .from("toppings")
        .select("id, name, price")
        .eq("product_id", id)
        .eq("is_available", true)
        .order("display_order", { ascending: true })

      if (toppingsError) throw toppingsError

      setDrinkSizes(sizesData || [])
      setToppings(toppingsData || [])
    } catch (err) {
      console.error("Customization fetch error:", err)
      setDrinkSizes([])
      setToppings([])
    } finally {
      setIsLoading(false)
    }
  }

  // ================= HANDLERS =================
  const handleModalOpen = () => {
    setIsModalOpen(true)
    fetchCustomizations()
  }

  const handleSizeSelect = (size: {
    id: string
    name: string
    price_modifier: number
  }) => {
    setCustomization(prev => ({
      ...prev,
      selectedSize: size.id,
      sizePrice: size.price_modifier,
    }))
  }

  const handleToppingToggle = (topping: {
    id: string
    name: string
    price: number
  }) => {
    setCustomization(prev => {
      const exists = prev.selectedToppings.some(t => t.id === topping.id)
      return {
        ...prev,
        selectedToppings: exists
          ? prev.selectedToppings.filter(t => t.id !== topping.id)
          : [...prev.selectedToppings, topping],
      }
    })
  }

  const calculateFinalPrice = () => {
    const base = price + customization.sizePrice
    const toppingsTotal = customization.selectedToppings.reduce(
      (sum, t) => sum + t.price,
      0
    )
    return base + toppingsTotal
  }

  const handleAddToCart = () => {
    onAddToCart(id, quantity, customization)
    setIsModalOpen(false)
    setQuantity(1)
    setCustomization({
      selectedSize: null,
      sizePrice: 0,
      selectedToppings: [],
      specialRequests: "",
    })
  }

  const sizeRequired =
    drinkSizes.length > 0 && !customization.selectedSize

  // ================= ESC CLOSE =================
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false)
    }
    if (isModalOpen) {
      document.addEventListener("keydown", onEsc)
      return () => document.removeEventListener("keydown", onEsc)
    }
  }, [isModalOpen])

  // ================= UI =================
  return (
    <>
      <Card
        className="relative w-full min-h-[280px] rounded-3xl shadow-xl overflow-hidden cursor-pointer"
        onClick={handleModalOpen}
      >
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {isPopular && (
          <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-sm">
            ⭐ Popular
          </div>
        )}
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>

              <div className="p-6 space-y-6 overflow-y-auto">
                <h3 className="text-2xl font-bold">{name}</h3>
                <p className="text-gray-600">{description}</p>

                {/* SIZES */}
                {drinkSizes.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Choose size</h4>
                    <div className="flex gap-3 flex-wrap">
                      {drinkSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSizeSelect(size)}
                          className={`px-4 py-2 rounded-full border ${
                            customization.selectedSize === size.id
                              ? "bg-pink-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {size.name}
                          {size.price_modifier > 0 &&
                            ` +${size.price_modifier.toFixed(2)} د.ت`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TOPPINGS */}
                {toppings.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Extras</h4>
                    <div className="flex flex-wrap gap-2">
                      {toppings.map(t => {
                        const selected =
                          customization.selectedToppings.some(
                            s => s.id === t.id
                          )
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleToppingToggle(t)}
                            className={`px-3 py-1 rounded-full border ${
                              selected
                                ? "bg-pink-500 text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            {t.name} +{t.price.toFixed(2)} د.ت
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* NOTES */}
                <textarea
                  rows={3}
                  placeholder="Special requests..."
                  className="w-full border rounded-xl p-3"
                  value={customization.specialRequests}
                  onChange={e =>
                    setCustomization(prev => ({
                      ...prev,
                      specialRequests: e.target.value,
                    }))
                  }
                />

                {/* PRICE BREAKDOWN */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Base</span>
                    <span>{price.toFixed(2)} د.ت</span>
                  </div>

                  {customization.sizePrice > 0 && (
                    <div className="flex justify-between">
                      <span>Size</span>
                      <span>
                        +{customization.sizePrice.toFixed(2)} د.ت
                      </span>
                    </div>
                  )}

                  {customization.selectedToppings.map(t => (
                    <div key={t.id} className="flex justify-between">
                      <span>{t.name}</span>
                      <span>+{t.price.toFixed(2)} د.ت</span>
                    </div>
                  ))}

                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{calculateFinalPrice().toFixed(2)} د.ت</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM BAR */}
              <div className="p-6 border-t flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus size={18} />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}>
                    <Plus size={18} />
                  </button>
                </div>

                <Button
                  disabled={sizeRequired}
                  onClick={handleAddToCart}
                  className="bg-pink-500 disabled:opacity-50"
                >
                  Add {quantity} ·{" "}
                  {(calculateFinalPrice() * quantity).toFixed(2)} د.ت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
