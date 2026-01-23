"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, X } from "lucide-react"
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
        className="relative w-full min-h-[280px] rounded-3xl overflow-hidden cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex justify-center items-end sm:items-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col"
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
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {toppings.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">Extras</h4>
                    <div className="flex flex-wrap gap-2">
                      {toppings.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleToppingToggle(t)}
                          className="px-3 py-1 rounded-full border bg-gray-100"
                        >
                          {t.name} +{t.price.toFixed(2)} د.ت
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-between items-center">
                <div className="flex gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
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
                  Add · {(calculateFinalPrice() * quantity).toFixed(2)} د.ت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
                            }
