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
  const [availableToppings, setAvailableToppings] = useState<{ id: string; name: string; price: number }[]>([])
  const [isLoadingCustomizations, setIsLoadingCustomizations] = useState(false)

  // Fetch customizations when modal opens
  const fetchCustomizations = async () => {
    setIsLoadingCustomizations(true)
    try {
      const response = await fetch(`/api/customizations?product_id=${id}&type=all`)
      if (response.ok) {
        const result = await response.json()
        setDrinkSizes(result.sizes || [])
        setAvailableToppings(result.toppings || [])
      }
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

  // Handle Escape key to close modal
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
        onClick={() => handleModalOpen()}
      >
        {/* IMAGE */}
        <img
          src={image_url || '/placeholder.svg'}
          alt={name}
          className='w-full h-full object-cover absolute inset-0 aspect-[4/3] sm:aspect-[3/2]'
          loading="lazy"
        />

        {/* PRODUCT NAME BOTTOM-LEFT */}
        <div className='absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg'>
          <h3 className='text-sm sm:text-base font-bold text-white drop-shadow-lg leading-tight'>{name}</h3>
        </div>

        {/* POPULAR BADGE TOP-RIGHT */}
        {isPopular && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className='absolute top-4 right-4 z-30 flex items-center gap-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-lg drop-shadow-lg'
          >
            <span className='text-xs'>⭐</span> Popular
          </motion.div>
        )}

        {/* ADD TO CART BUTTON - Opens customization modal */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            handleModalOpen()
          }}
          className='absolute bottom-4 right-4 z-20 p-3 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 rounded-full shadow-lg transition-all duration-200 touch-manipulation'
          aria-label={`Customize and add ${name} to cart`}
        >
          <Plus size={20} className='text-white' />
        </motion.button>
      </Card>

      {/* CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md'
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full mx-0 sm:mx-4 overflow-hidden max-h-[90vh] flex flex-col'
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(false)}
                className='absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors'
                aria-label="Close modal"
              >
                <X size={24} className='text-gray-700' />
              </motion.button>

              {/* HEADER WITH BACK BUTTON */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(false)}
                className='absolute top-4 left-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors'
                aria-label="Go back"
              >
                <X size={24} className='text-gray-700' />
              </motion.button>

              {/* SCROLLABLE CONTENT */}
              <div className='overflow-y-auto flex-1'>
                {/* IMAGE */}
                <div className='relative'>
                  <img
                    src={image_url || '/placeholder.svg'}
                    alt={name}
                    className='w-full h-48 sm:h-56 object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent' />
                </div>

                {/* CONTENT */}
                <div className='p-6 sm:p-8 space-y-6'>
                  {/* PRODUCT INFO */}
                  <div>
                    <h3 id="modal-title" className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
                      {name}
                    </h3>
                    <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>
                      {description}
                    </p>
                  </div>

                  {/* DRINK SIZE SECTION */}
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-4'>Drink Size</h4>
                    <div className='flex gap-4 justify-center'>
                      {drinkSizes.map(size => (
                        <motion.button
                          key={size.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSizeSelect(size)}
                          className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full font-semibold transition-all duration-200 ${
                            customization.selectedSize === size.id
                              ? 'bg-pink-400 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className={`text-3xl mb-1 ${customization.selectedSize === size.id ? 'text-white' : 'text-gray-500'}`}>
                            🥤
                          </div>
                          <span className='text-xs'>{size.name}</span>
                          {size.price_modifier > 0 && (
                            <span className='text-xs font-normal mt-1 opacity-80'>
                              +{size.price_modifier.toFixed(2)} د.ت
                            </span>
                          )}
                          {customization.selectedSize === size.id && (
                            <motion.div
                              layoutId="size-indicator"
                              className='absolute inset-0 border-2 border-white rounded-full'
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* TOPPINGS SECTION */}
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-4'>Toppings</h4>
                    <div className='flex flex-wrap gap-3'>
                      {availableToppings.map(topping => {
                        const isSelected = customization.selectedToppings.some(t => t.id === topping.id)
                        return (
                          <motion.button
                            key={topping.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToppingToggle(topping)}
                            className={`px-5 py-3 rounded-full font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-pink-400 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected && <Check size={16} />}
                            {topping.name}
                            <span className='text-xs opacity-80 ml-1'>
                              +{topping.price.toFixed(2)} د.ت
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ADDITIONAL REQUESTS */}
                  <div>
                    <h4 className='text-lg font-bold text-gray-900 mb-3'>Additional Requests</h4>
                    <textarea
                      value={customization.specialRequests}
                      onChange={(e) =>
                        setCustomization(prev => ({
                          ...prev,
                          specialRequests: e.target.value,
                        }))
                      }
                      placeholder='Add any special requests...'
                      className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 resize-none'
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTION BAR - STICKY */}
              <div className='border-t border-gray-100 bg-gray-50 p-6 sm:p-8 space-y-4'>
                {/* QUANTITY AND PRICE */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 bg-white border-2 border-gray-200 rounded-full px-4 py-2'>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} className='text-gray-700' />
                    </motion.button>
                    <span className='text-lg font-semibold text-gray-900 min-w-[2rem] text-center'>
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} className='text-gray-700' />
                    </motion.button>
                  </div>
                  <div className='text-right'>
                    <div className='text-xs text-gray-600 mb-1'>Total per item</div>
                    <span className='text-2xl font-bold text-gray-900'>
                      {(calculateFinalPrice()).toFixed(2)} د.ت
                    </span>
                  </div>
                </div>

                {/* ADD TO CART BUTTON */}
                <Button
                  onClick={handleAddToCart}
                  className='w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  <Plus size={22} className='mr-2' />
                  Add {quantity} to Cart · {(calculateFinalPrice() * quantity).toFixed(2)} د.ت
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
