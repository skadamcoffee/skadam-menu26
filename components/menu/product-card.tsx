"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { motion } from "framer-motion"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  onAddToCart: (productId: string, quantity: number) => void
}

export function ProductCard({ id, name, description, price, image_url, onAddToCart }: ProductCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    onAddToCart(id, quantity)
    setQuantity(1)
  }

  return (
    <motion.div whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }} whileTap={{ scale: 0.98 }}>
      <Card
        className={`relative h-64 cursor-pointer overflow-hidden transition-all duration-300 group ${
          isFlipped ? "bg-primary text-primary-foreground" : ""
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-full h-full"
        >
          <div
            style={{
              backfaceVisibility: "hidden",
            }}
            className="h-full flex flex-col"
          >
            {image_url ? (
              <div className="relative h-40 w-full bg-muted overflow-hidden">
                <img
                  src={image_url || "/placeholder.svg"}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", image_url)
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            ) : (
              <div className="h-40 w-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="text-4xl"
                >
                  ☕
                </motion.div>
              </div>
            )}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm text-pretty">{name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">{price.toFixed(2)} د.ت</span>
                <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.div>
              </div>
            </div>
          </div>

          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 h-full p-4 flex flex-col justify-between bg-primary text-primary-foreground"
          >
            <div>
              <h3 className="font-bold text-base text-pretty mb-2">{name}</h3>
              <p className="text-sm leading-relaxed">{description}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-primary-foreground/20 rounded-lg p-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity(Math.max(1, quantity - 1))
                  }}
                  className="px-2 py-1 text-sm hover:bg-primary-foreground/30 rounded"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="font-semibold">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuantity(quantity + 1)
                  }}
                  className="px-2 py-1 text-sm hover:bg-primary-foreground/30 rounded"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart()
                    setIsFlipped(false)
                  }}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Add {(price * quantity).toFixed(2)} د.ت
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  )
}
