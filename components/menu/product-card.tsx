'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

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

  return (
    <Card
      className='relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl shadow-xl overflow-hidden border-none bg-white/5 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50'
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

      {/* LIGHTER GRADIENT OVER IMAGE FOR BETTER VISIBILITY */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent' />

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

      {/* CONTENT - WITH SEMI-TRANSPARENT BACKGROUND FOR READABILITY */}
      <div className='relative z-10 h-full flex flex-col justify-end p-5 sm:p-6'>
        {/* Semi-transparent background for text area */}
        <div className='bg-black/50 backdrop-blur-md rounded-2xl p-4 space-y-2'>
          <h3 className='text-xl sm:text-2xl font-bold text-white drop-shadow-lg leading-tight'>{name}</h3>
          <p className='text-sm sm:text-base text-zinc-100 line-clamp-3 drop-shadow-md leading-relaxed'>{description}</p>
          <span className='inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-base sm:text-lg w-fit shadow-md'>
            {price.toFixed(2)} د.ت
          </span>
        </div>
      </div>

      {/* ADD TO CART BUTTON - Well-designed + button in bottom right */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation()
          onAddToCart(id, 1)
        }}
        className='absolute bottom-4 right-4 z-20 p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full shadow-lg transition-all duration-200 touch-manipulation'
        aria-label={`Add ${name} to cart for ${price.toFixed(2)} د.ت`}
      >
        <Plus size={24} className='text-white' />
      </motion.button>
    </Card>
  )
}
