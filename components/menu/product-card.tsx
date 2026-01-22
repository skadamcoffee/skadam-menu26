'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'

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

  return (
    <>
      <Card
        className='relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl shadow-xl overflow-hidden border-none bg-transparent hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer'
        // Added: bg-transparent to ensure the background behind the image is fully transparent
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

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className='relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setIsModalOpen(false)}
                className='absolute top-4 right-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors'
                aria-label="Close modal"
              >
                <X size={20} className='text-white' />
              </button>

              {/* IMAGE ON TOP */}
              <img
                src={image_url || '/placeholder.svg'}
                alt={name}
                className='w-full h-48 object-cover'
              />

              {/* DETAILS BELOW */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>{name}</h3>
                <p className='text-sm text-gray-600 mb-4 leading-relaxed'>{description}</p>
                <div className='flex items-center justify-between'>
                  <span className='text-lg font-bold text-gray-900'>
                    {price.toFixed(2)} د.ت
                  </span>
                  <Button
                    onClick={() => {
                      onAddToCart(id, 1)
                      setIsModalOpen(false)
                    }}
                    className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full'
                  >
                    <Plus size={16} className='mr-2' />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
