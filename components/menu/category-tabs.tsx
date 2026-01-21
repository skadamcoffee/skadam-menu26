"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useTransform } from "framer-motion"

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const x = useMotionValue(0)
  const itemsPerPage = 4
  const itemWidth = 80 // w-20 = 80px
  const gap = 16 // gap-4 = 16px
  const pageWidth = itemsPerPage * itemWidth + (itemsPerPage - 1) * gap // 4*80 + 3*16 = 368px
  const totalPages = Math.ceil((categories.length + 1) / itemsPerPage) // +1 for "All Items"
  const totalWidth = totalPages * pageWidth

  // All categories including "All Items"
  const allCategories = [
    { id: null, name: "All Items", image_url: null },
    ...categories,
  ]

  // Transform x to animate smoothly
  const animatedX = useTransform(x, (value) => value)

  // Update x position when currentIndex changes
  useEffect(() => {
    x.set(-currentIndex * pageWidth)
  }, [currentIndex, x, pageWidth])

  // Scroll selected tab into view by updating currentIndex
  useEffect(() => {
    const selectedIndex = allCategories.findIndex(cat => cat.id === selectedCategory)
    if (selectedIndex !== -1) {
      const page = Math.floor(selectedIndex / itemsPerPage)
      setCurrentIndex(page)
    }
  }, [selectedCategory, allCategories, itemsPerPage])

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50
    const velocity = info.velocity.x
    const offset = info.offset.x

    // Determine direction based on offset and velocity
    if (offset > threshold || (offset > 0 && velocity > 500)) {
      // Swipe right: previous page
      setCurrentIndex((prev) => Math.max(0, prev - 1))
    } else if (offset < -threshold || (offset < 0 && velocity < -500)) {
      // Swipe left: next page
      setCurrentIndex((prev) => Math.min(totalPages - 1, prev + 1))
    } else {
      // Snap back to current page if not enough movement
      x.set(-currentIndex * pageWidth)
    }
  }

  return (
    <div className="relative w-full overflow-hidden px-4 py-3">
      <motion.div
        ref={containerRef}
        className="flex gap-4"
        drag="x"
        dragConstraints={{ left: -(totalWidth - pageWidth), right: 0 }}
        dragElastic={0.2} // Slight elastic for natural feel
        dragMomentum={true} // Allow momentum for smoother release
        onDragEnd={handleDragEnd}
        style={{ x: animatedX }}
        transition={{ type: "spring", stiffness: 300, damping: 40 }}
      >
        {allCategories.map((category, index) => {
          const isActive = selectedCategory === category.id

          return (
            <div key={category.id || "all"} className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0 w-20">
              <Button
                size="sm"
                data-category-id={category.id || "all"}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl border-2",
                  isActive
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-300"
                    : "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600 hover:from-gray-700 hover:to-gray-800"
                )}
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className={cn(
                      "w-8 h-8 object-contain shrink-0 transition-all duration-300",
                      isActive && "scale-125 rotate-6 animate-bounce"
                    )}
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <span className="text-2xl">{category.id === null ? "🍽️" : "?"}</span>
                )}
              </Button>
              <span className={cn(
                "text-xs font-medium text-center transition-colors",
                isActive ? "text-yellow-400" : "text-gray-500"
              )}>
                {category.name}
              </span>
            </div>
          )
        })}
      </motion.div>

      {/* Optional: Page Indicators */}
      <div className="flex justify-center gap-2 mt-2">
        {Array.from({ length: totalPages }).map((_, pageIndex) => (
          <button
            key={pageIndex}
            onClick={() => setCurrentIndex(pageIndex)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              pageIndex === currentIndex ? "bg-yellow-400" : "bg-gray-400"
            )}
          />
        ))}
      </div>
    </div>
  )
}
