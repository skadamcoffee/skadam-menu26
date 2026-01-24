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
  const [quantity, setQuantity] = useState(1)  // New: Quantity state for modal

  // New: Handle Escape key to close modal
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
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md'
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
              className='relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON - Enhanced with animation */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(false)}
                className='absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors'
                aria-label="Close modal"
              >
                <X size={24} className='text-gray-700' />
              </motion.button>

              {/* IMAGE ON TOP - Circular with white border and shadow */}
              <div className='flex justify-center pt-8 pb-4'>
                <div className='w-40 h-40 rounded-full border-8 border-white shadow-lg overflow-hidden'>
                  <img
                    src={image_url || '/placeholder.svg'}
                    alt={name}
                    className='w-full h-full object-cover'
                  />
                </div>
              </div>

              {/* DETAILS BELOW - Improved layout and spacing */}
              <div className='p-6 sm:p-8'>
                <h3 id="modal-title" className='text-2xl font-bold text-gray-900 mb-3 leading-tight'>{name}</h3>
                <p className='text-base text-gray-600 mb-6 leading-relaxed'>{description}</p>
                
                {/* PRICE AND QUANTITY SELECTOR */}
                <div className='flex items-center justify-between mb-6'>
                  <span className='text-2xl font-bold text-gray-900'>
                    {price.toFixed(2)} د.ت
                  </span>
                  <div className='flex items-center gap-3'>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className='p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors'
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} className='text-gray-700' />
                    </motion.button>
                    <span className='text-lg font-semibold text-gray-900 min-w-[2rem] text-center'>{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className='p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors'
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} className='text-gray-700' />
                    </motion.button>
                  </div>
                </div>

                {/* ADD TO CART BUTTON - Enhanced */}
                <Button
                  onClick={() => {
                    onAddToCart(id, quantity)
                    setIsModalOpen(false)
                    setQuantity(1)  // Reset quantity after adding
                  }}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  <Plus size={20} className='mr-2' />
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
