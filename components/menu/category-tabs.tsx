"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

  // Scroll selected tab into view smoothly
  useEffect(() => {
    if (!containerRef.current) return

    const selectedButton = containerRef.current.querySelector<HTMLButtonElement>(
      selectedCategory
        ? `button[data-category-id="${selectedCategory}"]`
        : `button[data-category-id="all"]`
    )

    if (selectedButton) {
      requestAnimationFrame(() => {
        selectedButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      })
    }
  }, [selectedCategory])

  return (
    <div
      ref={containerRef}
      className="flex gap-4 overflow-x-auto pb-2 px-4 md:px-0"
      style={{
        scrollbarWidth: "none", // Firefox
      }}
    >
      <style jsx>{`
        /* Hide scrollbar for Chrome, Edge, Safari */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ALL ITEMS */}
      <div className="flex flex-col items-center gap-2 min-w-0">
        <Button
          size="sm"
          data-category-id="all"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl border-2",
            selectedCategory === null
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-300"
              : "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600 hover:from-gray-700 hover:to-gray-800"
          )}
        >
          {/* Placeholder icon for "All Items" - you can replace with an actual icon */}
          <span className="text-2xl">🍽️</span>
        </Button>
        <span className={cn(
          "text-xs font-medium text-center transition-colors",
          selectedCategory === null ? "text-yellow-400" : "text-gray-500"
        )}>
          All Items
        </span>
      </div>

      {categories.map((category, index) => {
        const isActive = selectedCategory === category.id

        return (
          <div key={category.id} className="flex flex-col items-center gap-2 min-w-0">
            <Button
              size="sm"
              data-category-id={category.id}
              data-category-index={index}
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
                <span className="text-2xl">?</span> {/* Fallback icon */}
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
    </div>
  )
}
