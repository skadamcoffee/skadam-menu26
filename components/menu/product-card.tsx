'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const [drinkSizes, setDrinkSizes] = useState<
    { id: string; name: string; price_modifier: number }[]
  >([])

  const [availableToppings, setAvailableToppings] = useState<
    { id: string; name: string; price: number }[]
  >([])

  const [customization, setCustomization] = useState<ProductCustomization>({
    selectedSize: null,
    sizePrice: 0,
    selectedToppings: [],
    specialRequests: '',
  })

  /* ================= FETCH FROM SUPABASE ================= */
  const fetchCustomizations = async () => {
    console.log('Fetching customizations for product:', id)

    const { data: sizes, error: sizesError } = await supabase
      .from('drink_sizes')
      .select('id, name, price_modifier')
      .eq('product_id', id)
      .eq('is_available', true)
      .order('display_order', { ascending: true })

    if (sizesError) {
      console.error('Drink sizes error:', sizesError)
    } else {
      console.log('Drink sizes:', sizes)
      setDrinkSizes(sizes || [])
    }

    const { data: toppings, error: toppingsError } = await supabase
      .from('toppings')
      .select('id, name, price')
      .eq('product_id', id)
      .eq('is_available', true)
      .order('display_order', { ascending: true })

    if (toppingsError) {
      console.error('Toppings error:', toppingsError)
    } else {
      console.log('Toppings:', toppings)
      setAvailableToppings(toppings || [])
    }
  }

  const handleModalOpen = () => {
    setIsModalOpen(true)
    fetchCustomizations()
  }

  /* ================= HANDLERS ================= */
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
      const exists = prev.selectedToppings.find(t => t.id === topping.id)
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
      specialRequests: '',
    })
  }

  /* ================= UI ================= */
  return (
    <>
      <Card
        className="relative cursor-pointer"
        onClick={handleModalOpen}
      >
        <img
          src={image_url || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover"
        />
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 flex justify-center items-end sm:items-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">

                {/* SIZES */}
                {drinkSizes.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3">Drink Size</h4>
                    <div className="flex gap-3">
                      {drinkSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSizeSelect(size)}
                          className={`px-4 py-3 rounded-full ${
                            customization.selectedSize === size.id
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          {size.name}
                          {size.price_modifier > 0 && (
                            <span className="block text-xs">
                              +{size.price_modifier} د.ت
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TOPPINGS */}
                {availableToppings.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3">Toppings</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableToppings.map(t => {
                        const selected = customization.selectedToppings.some(
                          s => s.id === t.id
                        )
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleToppingToggle(t)}
                            className={`px-4 py-2 rounded-full ${
                              selected
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            {selected && <Check size={14} />}
                            {t.name} +{t.price}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ADD TO CART */}
                <Button onClick={handleAddToCart} className="w-full">
                  Add to cart · {(calculateFinalPrice() * quantity).toFixed(2)} د.ت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
