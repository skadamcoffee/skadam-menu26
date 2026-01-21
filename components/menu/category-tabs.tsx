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
      <Button
        size="sm"
        data-category-id="all"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "whitespace-nowrap rounded-xl px-6 py-3 flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl",
          selectedCategory === null
            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold border-2 border-yellow-300"
            : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 border border-gray-600"
        )}
      >
        All Items
      </Button>

      {categories.map((category, index) => {
        const isActive = selectedCategory === category.id

        return (
          <Button
            key={category.id}
            size="sm"
            data-category-id={category.id}
            data-category-index={index}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "whitespace-nowrap rounded-xl px-6 py-3 flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl",
              isActive
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold border-2 border-yellow-300"
                : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 border border-gray-600"
            )}
          >
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className={cn(
                  "w-6 h-6 object-contain shrink-0 transition-all duration-300",
                  isActive && "scale-125 rotate-6 animate-bounce"
                )}
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <span className="text-sm font-medium">{category.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
