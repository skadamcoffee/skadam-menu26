'use client'

import { useState, useEffect } from 'react'  // Added useEffect for keyboard handling
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Minus } from 'lucide-react'  // Added Minus for quantity

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  popular: boolean | number | null
  onAddToCart: (productId: string, quantity: number) => void
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
  const [quantity, setQuantity] = useState(1)  // Quantity state for modal
  // Additional UI state for modal interaction
  const [selectedSize, setSelectedSize] = useState('Basic')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [additionalReq, setAdditionalReq] = useState('')

  const drinkSizes = ['Basic', 'Middle', 'Large']
  const toppingsList = ['Boba', 'Almond', 'Cheese', 'Oat']

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
        onClick={() => setIsModalOpen(true)}
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

        {/* ADD TO CART BUTTON - Well-designed + button in bottom right */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(id, 1)
          }}
          className='absolute bottom-4 right-4 z-20 p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full shadow-lg transition-all duration-200 touch-manipulation'
          aria-label={`Add ${name} to cart for ${price.toFixed(2)} د.ت`}
        >
          <Plus size={20} className='text-white' />
        </motion.button>
      </Card>

      {/* RESTYLED MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className='relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-full overflow-auto p-6'
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setIsModalOpen(false)}
                className='absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors'
                aria-label="Close modal"
              >
                <X size={24} className='text-gray-700' />
              </button>

              {/* CIRCULAR IMAGE */}
              <div className='flex justify-center mb-6 mt-4'>
                <div className='w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden'>
                  <img
                    src={image_url || '/placeholder.svg'}
                    alt={name}
                    className='w-full h-full object-cover'
                  />
                </div>
              </div>

              {/* TITLE AND DESCRIPTION */}
              <h3 id="modal-title" className='text-2xl font-bold text-gray-900 text-center mb-1'>{name}</h3>
              <p className='text-center text-gray-600 text-sm mb-1'>{description}</p>
              <p className='text-center text-gray-400 text-xs mb-4'>📍 Coffee Shop, Est. Ma, 2026</p>

              {/* Drink Size */}
              <p className='font-semibold mb-1'>Drink Size</p>
              <div className='flex justify-between gap-3 mb-6'>
                {drinkSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                      ${selectedSize === size ? 'bg-pink-200 text-black' : 'bg-gray-200 text-gray-600'}`}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Toppings */}
              <p className='font-semibold mb-2'>Toppings</p>
              <div className='flex gap-3 flex-wrap mb-6'>
                {toppingsList.map((topping) => {
                  const selected = selectedToppings.includes(topping);
                  return (
                    <button
                      key={topping}
                      onClick={() => {
                        if (selected) {
                          setSelectedToppings(selectedToppings.filter(t => t !== topping));
                        } else {
                          setSelectedToppings([...selectedToppings, topping]);
                        }
                      }}
                      className={`py-1.5 px-4 rounded-full text-sm font-medium transition-colors
                        ${selected ? 'bg-pink-300 text-black' : 'bg-gray-200 text-gray-600'}`}
                      aria-pressed={selected}
                    >
                      {topping}
                    </button>
                  )
                })}
              </div>

              {/* Additional Request */}
              <p className='font-semibold mb-1'>Additional Req</p>
              <textarea
                placeholder='Type your request...'
                value={additionalReq}
                onChange={(e) => setAdditionalReq(e.target.value)}
                className='w-full border border-gray-300 rounded-lg p-3 mb-6 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300'
                rows={3}
                aria-label='Additional requests'
              />

              {/* Quantity and Add to Cart Button */}
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center border border-gray-300 rounded-full px-3 py-1'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className='text-gray-700 text-xl font-bold px-2 focus:outline-none hover:text-pink-500'
                    aria-label='Decrease quantity'
                  >
                    −
                  </button>
                  <span className='mx-4 text-lg font-semibold text-gray-900 min-w-[2rem] text-center'>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className='text-gray-700 text-xl font-bold px-2 focus:outline-none hover:text-pink-500'
                    aria-label='Increase quantity'
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={() => {
                    onAddToCart(id, quantity)
                    setIsModalOpen(false)
                    setQuantity(1)
                    setSelectedSize('Basic')
                    setSelectedToppings([])
                    setAdditionalReq('')
                  }}
                  className='flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex-1 justify-center'
                >
                  <Plus size={20} /> Add to Cart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
