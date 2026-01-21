"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Category {
  id: string | null
  name: string
  image_url: string | null
}

interface CategoryTabsProps {
  categories: Array<{ id: string; name: string; image_url: string }>
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPage, setCurrentPage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const ITEMS_PER_PAGE = 4
  const ITEM_WIDTH = 80 // w-20
  const GAP = 16 // gap-4
  const PAGE_WIDTH =
    ITEMS_PER_PAGE * ITEM_WIDTH + (ITEMS_PER_PAGE - 1) * GAP

  // Include "All Items"
  const allCategories: Category[] = useMemo(
    () => [{ id: null, name: "All Items", image_url: null }, ...categories],
    [categories]
  )

  const totalPages = Math.ceil(allCategories.length / ITEMS_PER_PAGE)

  // Auto-scroll to selected category
  useEffect(() => {
    const index = allCategories.findIndex(
      (cat) => cat.id === selectedCategory
    )
    if (index !== -1) {
      setCurrentPage(Math.floor(index / ITEMS_PER_PAGE))
    }
  }, [selectedCategory, allCategories])

  return (
    <div className="relative w-full overflow-hidden px-4 py-3">
      <motion.div
        ref={containerRef}
        className="flex gap-4 cursor-grab active:cursor-grabbing select-none"
        drag="x"
        dragDirectionLock
        dragElastic={0.18}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false)

          const swipePower = Math.abs(info.offset.x) * info.velocity.x

          if (swipePower > 500) {
            setCurrentPage((p) => Math.max(0, p - 1))
          } else if (swipePower < -500) {
            setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
          }
        }}
        animate={!isDragging ? { x: -currentPage * PAGE_WIDTH } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {allCategories.map((category) => {
          const isActive = selectedCategory === category.id

          return (
            <div
              key={category.id ?? "all"}
              className="flex w-20 flex-shrink-0 flex-col items-center gap-2"
            >
              <Button
                size="sm"
                onClick={(e) => {
                  if (isDragging) {
                    e.preventDefault()
                    return
                  }
                  onSelectCategory(category.id)
                }}
                className={cn(
                  "w-16 h-16 rounded-full border-2 shadow-lg transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-300 shadow-yellow-500/40"
                    : "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600 hover:from-gray-700 hover:to-gray-800"
                )}
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className={cn(
                      "w-8 h-8 object-contain transition-all duration-300",
                      isActive && "scale-125 rotate-6"
                    )}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <span className="text-2xl">
                    {category.id === null ? "🍽️" : "?"}
                  </span>
                )}
              </Button>

              <span
                className={cn(
                  "text-xs font-medium text-center transition-colors",
                  isActive ? "text-yellow-400" : "text-gray-500"
                )}
              >
                {category.name}
              </span>
            </div>
          )
        })}
      </motion.div>

      {/* Page indicators */}
      {totalPages > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === currentPage ? "bg-yellow-400" : "bg-gray-500"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
