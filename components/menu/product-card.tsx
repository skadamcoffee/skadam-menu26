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
      className='relative w-full min-h-[400px] sm:min-h-[450px] rounded-3xl shadow-xl overflow-hidden border-none bg-white hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
      tabIndex={0}
      role="button"
      aria-label={`View details for ${name}`}
    >
      {/* IMAGE SECTION - TOP HALF */}
      <div className='relative h-2/3 w-full'>
        <img
          src={image_url || '/placeholder.svg'}
          alt={name}
          className='w-full h-full object-cover rounded-t-3xl'
          loading="lazy"
        />

        {/* LIGHT GRADIENT OVER IMAGE FOR SUBTLE EFFECT */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-3xl' />

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
      </div>

      {/* TEXT SECTION - BOTTOM HALF */}
      <div className='relative z-10 h-1/3 flex flex-col justify-center p-5 sm:p-6 bg-white rounded-b-3xl'>
        <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight'>{name}</h3>
        <p className='text-sm sm:text-base text-gray-600 line-clamp-2 mb-4 leading-relaxed'>{description}</p>
        <div className='flex items-center justify-between'>
          <span className='text-lg sm:text-xl font-bold text-gray-900'>
            {price.toFixed(2)} د.ت
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(id, 1)
            }}
            className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full shadow-lg transition-all duration-200 touch-manipulation'
            aria-label={`Add ${name} to cart for ${price.toFixed(2)} د.ت`}
          >
            <Plus size={20} className='text-white' />
          </motion.button>
        </div>
      </div>
    </Card>
  )
}
