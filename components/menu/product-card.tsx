'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

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
      className='relative w-full min-h-[280px] sm:min-h-[320px] cursor-pointer rounded-3xl shadow-xl overflow-hidden border-none bg-white/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-white/50'
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
      <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent' />

      {/* POPULAR BADGE TOP-RIGHT */}
      {isPopular && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className='absolute top-4 right-4 z-30 flex items-center gap-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-lg drop-shadow-lg'
        >
          <span className='text-xs'>⭐</span> Popular
        </motion.div>
      )}

      {/* CONTENT */}
      <motion.div
        animate={{ y: active ? -50 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='relative z-10 h-full flex flex-col justify-end p-5 sm:p-6'
      >
        <h3 className='text-xl sm:text-2xl font-bold text-white drop-shadow-md mb-2'>{name}</h3>
        <p className='text-sm sm:text-base text-zinc-200 line-clamp-3 drop-shadow-sm mb-3'>{description}</p>
        <span className='inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-base sm:text-lg w-fit shadow-md'>
          {price.toFixed(2)} د.ت
        </span>
      </motion.div>

      {/* ACTION PANEL */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className='absolute bottom-0 left-0 right-0 z-20 p-4 bg-black/70 backdrop-blur-xl rounded-t-3xl shadow-2xl'
          >
            <div className='flex items-center justify-between bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 text-white mb-4'>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className='p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
                aria-label="Decrease quantity"
              >
                <Minus size={20} />
              </button>
              <span className='font-bold text-lg mx-4'>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className='p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
                aria-label="Increase quantity"
              >
                <Plus size={20} />
              </button>
            </div>
            <Button
              onClick={() => {
                onAddToCart(id, quantity)
                setQuantity(1)
                setActive(false)
              }}
              className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-lg transition-all duration-200'
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
