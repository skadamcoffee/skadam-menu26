"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  onAddToCart: (productId: string, quantity: number) => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  onAddToCart,
}: ProductCardProps) {
  const [active, setActive] = useState(false)
  const [quantity, setQuantity] = useState(1)

  return (
    <Card
      onClick={() => setActive(!active)}
      className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer border-none shadow-lg"
    >
      {/* IMAGE */}
      <img
        src={image_url || "/placeholder.svg"}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* DARK GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* CONTENT (absolute to prevent layout shift) */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col justify-end p-4"
        animate={{ y: active ? -32 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <h3 className="text-lg font-semibold text-zinc-100 drop-shadow-sm">
          {name}
        </h3>

        <p className="text-xs text-zinc-300 line-clamp-2 leading-snug drop-shadow-sm">
          {description}
        </p>

        <span className="mt-1 inline-block bg-black/50 backdrop-blur px-3 py-1 rounded-full text-zinc-100 font-bold text-sm w-fit">
          {price.toFixed(2)} د.ت
        </span>
      </motion.div>

      {/* ACTION PANEL */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-4 right-4 z-20 space-y-2"
          >
            <div className="flex items-center justify-between bg-white/20 backdrop-blur rounded-xl px-3 py-2 text-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1"
              >
                <Minus size={18} />
              </button>

              <span className="font-bold">{quantity}</span>

              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1"
              >
                <Plus size={18} />
              </button>
            </div>

            <Button
              onClick={() => {
                onAddToCart(id, quantity)
                setQuantity(1)
                setActive(false)
              }}
              className="w-full font-semibold"
            >
              Add {(price * quantity).toFixed(2)} د.ت
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
