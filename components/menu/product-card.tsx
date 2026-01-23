'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Minus, Check } from 'lucide-react'


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
  const [customization, setCustomization] = useState<ProductCustomization>({
    selectedSize: null,
    sizePrice: 0,
    selectedToppings: [],
    specialRequests: '',
  })

  const [drinkSizes, setDrinkSizes] = useState<
    { id: string; name: string; price_modifier: number }[]
  >([])
  const [availableToppings, setAvailableToppings] = useState<
    { id: string; name: string; price: number }[]
  >([])
  const [isLoadingCustomizations, setIsLoadingCustomizations] = useState(false)

  // ✅ Fetch sizes and toppings from Supabase
  const fetchCustomizations = async () => {
    setIsLoadingCustomizations(true)
    try {
      // --- Fetch drink sizes ---
      const { data: sizes, error: sizesError } = await supabase
        .from('drink_sizes')
        .select('id, name, price_modifier')
        .eq('product_id', id)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (sizesError) throw sizesError
      setDrinkSizes(sizes || [])

      // --- Fetch toppings ---
      const { data: toppings, error: toppingsError } = await supabase
        .from('toppings') // make sure your toppings table is named exactly 'toppings'
        .select('id, name, price')
        .eq('product_id', id)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (toppingsError) throw toppingsError
      setAvailableToppings(toppings || [])
    } catch (error) {
      console.error('Error fetching customizations:', error)
    } finally {
      setIsLoadingCustomizations(false)
    }
  }

  const handleModalOpen = () => {
    setIsModalOpen(true)
    fetchCustomizations()
  }

  const handleSizeSelect = (size: { id: string; name: string; price_modifier: number }) => {
    setCustomization(prev => ({
      ...prev,
      selectedSize: size.id,
      sizePrice: size.price_modifier,
    }))
  }

  const handleToppingToggle = (topping: { id: string; name: string; price: number }) => {
    setCustomization(prev => {
      const isSelected = prev.selectedToppings.some(t => t.id === topping.id)
      return {
        ...prev,
        selectedToppings: isSelected
          ? prev.selectedToppings.filter(t => t.id !== topping.id)
          : [...prev.selectedToppings, topping],
      }
    })
  }

  const calculateFinalPrice = () => {
    const basePrice = price + (customization.sizePrice || 0)
    const toppingsPrice = customization.selectedToppings.reduce((sum, t) => sum + t.price, 0)
    return basePrice + toppingsPrice
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  return (
    <>
      <Card
        className="relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl shadow-xl overflow-hidden border-none bg-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer"
        tabIndex={0}
        role="button"
        onClick={handleModalOpen}
      >
        <img
          src={image_url || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute bottom-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-lg">
          <h3 className="text-sm sm:text-base font-bold text-white">{name}</h3>
        </div>
        {isPopular && (
          <motion.div className="absolute top-4 right-4 z-30 bg-yellow-400 text-white px-3 py-1 rounded-full">
            ⭐ Popular
          </motion.div>
        )}
      </Card>

      {/* --- CUSTOMIZATION MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                <h3 className="text-2xl font-bold">{name}</h3>
                <p className="text-gray-600">{description}</p>

                {/* --- SIZES --- */}
                <div>
                  <h4 className="font-bold mb-2">Drink Sizes</h4>
                  <div className="flex gap-3">
                    {drinkSizes.map(size => (
                      <button
                        key={size.id}
                        onClick={() => handleSizeSelect(size)}
                        className={`px-4 py-2 rounded-full border ${
                          customization.selectedSize === size.id
                            ? 'bg-pink-400 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        {size.name} {size.price_modifier > 0 && `+${size.price_modifier.toFixed(2)}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- TOPPINGS --- */}
                <div>
                  <h4 className="font-bold mb-2">Toppings</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableToppings.map(topping => {
                      const isSelected = customization.selectedToppings.some(t => t.id === topping.id)
                      return (
                        <button
                          key={topping.id}
                          onClick={() => handleToppingToggle(topping)}
                          className={`px-3 py-2 rounded-full border flex items-center gap-1 ${
                            isSelected ? 'bg-pink-400 text-white' : 'bg-gray-100'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                          {topping.name} {topping.price > 0 && `+${topping.price.toFixed(2)}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* --- SPECIAL REQUESTS --- */}
                <div>
                  <textarea
                    placeholder="Additional requests..."
                    className="w-full border p-3 rounded-xl"
                    value={customization.specialRequests}
                    onChange={e =>
                      setCustomization(prev => ({ ...prev, specialRequests: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* --- ADD TO CART --- */}
              <div className="p-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus size={16} />
                    </button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div>{calculateFinalPrice() * quantity} د.ت</div>
                </div>
                <Button onClick={handleAddToCart} className="w-full bg-pink-400 text-white">
                  Add {quantity} to Cart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
                  }
