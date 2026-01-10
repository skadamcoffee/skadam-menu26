"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { motion } from "framer-motion"

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
  const [quantity, setQuantity] = useState(1)
  const [active, setActive] = useState(false)

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 260 }}
    >
      <Card
        onClick={() => setActive(!active)}
        className="relative h-72 w-full overflow-hidden rounded-2xl cursor-pointer border-none shadow-lg"
      >
        {/* IMAGE */}
        <img
          src={image_url || "/placeholder.svg"}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* DARK GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* CONTENT */}
        <div className="relative z-10 h-full flex flex-col justify-end p-4 text-white">
          <motion.div
            animate={{ y: active ? -10 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-bold leading-tight">{name}</h3>
            <p className="text-xs opacity-80 line-clamp-2">
              {description}
            </p>

            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-bold">
                {price.toFixed(2)} د.ت
              </span>
            </div>
          </motion.div>

          {/* ACTION PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: active ? 1 : 0,
              y: active ? 0 : 20,
            }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-white/20 backdrop-blur rounded-xl px-3 py-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus />
              </button>
              <span className="font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>
                <Plus />
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
        </div>
      </Card>
    </motion.div>
  )
}
