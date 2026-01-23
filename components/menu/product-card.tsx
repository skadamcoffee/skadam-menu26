"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, X, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const supabase = createClient() // ✅ CORRECT

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

  const fetchCustomizations = async () => {
    setIsLoading(true)
    try {
      const { data: sizesData, error: sizesError } = await supabase
        .from("drink_sizes")
        .select("id, name, price_modifier")
        .eq("product_id", id)
        .eq("is_available", true)
        .order("display_order")

      if (sizesError) throw sizesError

      const { data: toppingsData, error: toppingsError } = await supabase
        .from("toppings")
        .select("id, name, price")
        .eq("product_id", id)
        .eq("is_available", true)
        .order("display_order")

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
    const extras = customization.selectedToppings.reduce(
      (sum, t) => sum + t.price,
      0
    )
    return base + extras
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

  useEffect(() => {
    if (isModalOpen) fetchCustomizations()
  }, [isModalOpen])

  return (
    <>
      <Card
        className="relative w-full min-h-[280px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-300"
        onClick={() => setIsModalOpen(true)}
      >
        {popular && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
            <Star size={12} fill="currentColor" />
            Popular
          </div>
        )}
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-bold text-lg">{name}</h3>
          <p className="text-white/80 text-sm">{price.toFixed(2)} د.ت</p>
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex justify-center items-end sm:items-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Product Image and Basic Info */}
                <div className="flex gap-4">
                  <img
                    src={image_url || "/placeholder.svg"}
                    alt={name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{description}</p>
                    <p className="text-lg font-semibold text-pink-600 mt-2">
                      Base Price: {price.toFixed(2)} د.ت
                    </p>
                  </div>
                </div>

                {/* Size Selection */}
                {drinkSizes.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 text-lg">Choose Size</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {drinkSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSizeSelect(size)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            customization.selectedSize === size.id
                              ? "bg-pink-500 text-white border-pink-500 shadow-lg"
                              : "bg-gray-50 border-gray-200 hover:border-pink-300"
                          }`}
                        >
                          <div className="font-medium">{size.name}</div>
                          {size.price_modifier > 0 && (
                            <div className="text-sm opacity-80">
                              +{size.price_modifier.toFixed(2)} د.ت
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings Selection */}
                {toppings.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 text-lg">Add Extras</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {toppings.map(t => {
                        const isSelected = customization.selectedToppings.some(
                          selected => selected.id === t.id
                        )
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleToppingToggle(t)}
                            className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              isSelected
                                ? "bg-pink-500 text-white border-pink-500 shadow-lg"
                                : "bg-gray-50 border-gray-200 hover:border-pink-300"
                            }`}
                          >
                            <div className="font-medium">{t.name}</div>
                            <div className="text-sm opacity-80">
                              +{t.price.toFixed(2)} د.ت
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div>
                  <h4 className="font-bold mb-3 text-lg">Special Requests</h4>
                  <textarea
                    value={customization.specialRequests}
                    onChange={e =>
                      setCustomization(prev => ({
                        ...prev,
                        specialRequests: e.target.value,
                      }))
                    }
                    placeholder="Any special instructions..."
                    className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-bold mb-2">Price Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>{price.toFixed(2)} د.ت</span>
                    </div>
                    {customization.sizePrice > 0 && (
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span>+{customization.sizePrice.toFixed(2)} د.ت</span>
                      </div>
                    )}
                    {customization.selectedToppings.length > 0 && (
                      <div className="flex justify-between">
                        <span>Extras</span>
                        <span>
                          +{customization.selectedToppings
                            .reduce((sum, t) => sum + t.price, 0)
                            .toFixed(2)} د.ت
                        </span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total per item</span>
                      <span>{calculateFinalPrice().toFixed(2)} د.ت</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Quantity and Add to Cart */}
              <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white rounded-full p-1 border">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="px-3 font-medium min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <Button
                  disabled={sizeRequired || isLoading}
                  onClick={handleAddToCart}
                  className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-lg transition-colors"
                >
                  {isLoading ? "Loading..." : `Add to Cart · ${(calculateFinalPrice() * quantity).toFixed(2)} د.ت`}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
