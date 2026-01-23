'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Minus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client' // ✅ Import once

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
  onAddToCart: (productId: string, quantity: number, customization?: ProductCustomization) => void
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

  const [drinkSizes, setDrinkSizes] = useState<{ id: string; name: string; price_modifier: number }[]>([])
  const [toppings, setToppings] = useState<{ id: string; name: string; price: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch sizes and toppings
  const fetchCustomizations = async () => {
    setIsLoading(true)
    try {
      // Fetch Sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('drink_sizes')
        .select('id, name, price_modifier')
        .eq('product_id', id)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (sizesError) throw sizesError

      // Fetch Toppings (replace 'toppings' with your table)
      const { data: toppingsData, error: toppingsError } = await supabase
        .from('toppings')
        .select('id, name, price')
        .eq('product_id', id)
        .eq('is_available', true)
        .order('name', { ascending: true })

      if (toppingsError) throw toppingsError

      console.log('Sizes:', sizesData)
      console.log('Toppings:', toppingsData)

      setDrinkSizes(sizesData || [])
      setToppings(toppingsData || [])
    } catch (err) {
      console.error('Error fetching customizations:', err)
      setDrinkSizes([])
      setToppings([])
    } finally {
      setIsLoading(false)
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
        className='relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl shadow-xl overflow-hidden border-none bg-transparent hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer'
        tabIndex={0}
        role="button"
        aria-label={`View details for ${name}`}
        onClick={handleModalOpen}
      >
        <img src={image_url || '/placeholder.svg'} alt={name} className='w-full h-full object-cover absolute inset-0' loading="lazy"/>
        {isPopular && (
          <motion.div className='absolute top-4 right-4 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white font-semibold'>
            ⭐ Popular
          </motion.div>
        )}
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md'
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 100 }}
              className='relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col'
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setIsModalOpen(false)} className='absolute top-4 right-4 p-2 bg-black/10 rounded-full'>
                <X size={24} />
              </button>

              <div className='overflow-y-auto flex-1 p-6 space-y-6'>
                <h3 className='text-2xl font-bold'>{name}</h3>
                <p className='text-gray-600'>{description}</p>

                {/* Sizes */}
                <div>
                  <h4 className='text-lg font-bold mb-2'>Sizes</h4>
                  {isLoading ? <p>Loading sizes...</p> : (
                    <div className='flex gap-4'>
                      {drinkSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSizeSelect(size)}
                          className={`px-4 py-2 rounded-full border ${customization.selectedSize === size.id ? 'bg-pink-400 text-white' : 'bg-gray-100'}`}
                        >
                          {size.name} {size.price_modifier > 0 && `+${size.price_modifier.toFixed(2)} د.ت`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toppings */}
                <div>
                  <h4 className='text-lg font-bold mb-2'>Toppings</h4>
                  {isLoading ? <p>Loading toppings...</p> : (
                    <div className='flex flex-wrap gap-2'>
                      {toppings.map(t => {
                        const selected = customization.selectedToppings.some(s => s.id === t.id)
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleToppingToggle(t)}
                            className={`px-3 py-1 rounded-full border ${selected ? 'bg-pink-400 text-white' : 'bg-gray-100'}`}
                          >
                            {t.name} +{t.price.toFixed(2)} د.ت
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Requests */}
                <textarea
                  value={customization.specialRequests}
                  onChange={e => setCustomization(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Special requests..."
                  className='w-full border p-3 rounded-xl'
                  rows={3}
                />
              </div>

              {/* Bottom Bar */}
              <div className='p-6 border-t flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <button onClick={() => setQuantity(Math.max(1, quantity-1))}><Minus size={18}/></button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity+1)}><Plus size={18}/></button>
                </div>
                <Button onClick={handleAddToCart} className='bg-pink-500 text-white px-4 py-2 rounded-full'>
                  Add {quantity} · {(calculateFinalPrice()*quantity).toFixed(2)} د.ت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
