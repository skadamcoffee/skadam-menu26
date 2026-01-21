'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, X } from 'lucide-react'

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
  const [active, setActive] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const isPopular = !!popular

  return (
    <Card
      onClick={() => setActive(!active)}
      className='relative w-full min-h-[280px] sm:min-h-[320px] cursor-pointer rounded-3xl shadow-xl overflow-hidden border-none bg-white/5 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50'
      tabIndex={0}
      role="button"
      aria-label={`View details for ${name}`}
    >
      {/* IMAGE */}
      <img
        src={image_url || '/placeholder.svg'}
        alt={name}
        className='w-full h-full object-cover absolute inset-0 aspect-[4/3] sm:aspect-[3/2]'
        loading="lazy"
      />

      {/* GRADIENT OVER IMAGE */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20' />

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

      {/* CONTENT */}
      <motion.div
        animate={{ y: active ? -60 : 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='relative z-10 h-full flex flex-col justify-end p-5 sm:p-6'
      >
        <h3 className='text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-2 leading-tight'>{name}</h3>
        <p className='text-sm sm:text-base text-zinc-100 line-clamp-3 drop-shadow-md mb-4 leading-relaxed'>{description}</p>
        <span className='inline-block bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-base sm:text-lg w-fit shadow-md'>
          {price.toFixed(2)} د.ت
        </span>
      </motion.div>

      {/* ACTION PANEL - Redesigned for cleaner, more modern UX */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className='absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6'
          >
            {/* Close Button - Positioned at top-right */}
            <button
              onClick={() => setActive(false)}
              className='absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
              aria-label="Close details"
            >
              <X size={20} className='text-gray-600' />
            </button>

            {/* Quantity Selector - Redesigned as a compact row */}
            <div className='flex items-center justify-center mb-6'>
              <div className='flex items-center bg-gray-100 rounded-full px-4 py-2'>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className='p-2 rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation shadow-sm'
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} className='text-gray-700' />
                </button>
                <span className='font-semibold text-lg mx-6 min-w-[40px] text-center text-gray-800'>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className='p-2 rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation shadow-sm'
                  aria-label="Increase quantity"
                >
                  <Plus size={18} className='text-gray-700' />
                </button>
              </div>
            </div>

            {/* Add to Cart Button - Full-width with gradient */}
            <Button
              onClick={() => {
                onAddToCart(id, quantity)
                setQuantity(1)
                setActive(false)
              }}
              className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:from-blue-700 active:to-purple-800 text-white rounded-2xl shadow-lg transition-all duration-200 touch-manipulation'
              aria-label={`Add ${quantity} ${name} to cart for ${(price * quantity).toFixed(2)} د.ت`}
            >
              Add to Cart - {(price * quantity).toFixed(2)} د.ت
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
