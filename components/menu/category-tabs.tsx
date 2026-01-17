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
        selectedButton.scrollIntoView({ behavior: "smooth", inline: "center" })
      })
    }
  }, [selectedCategory])

  return (
    <div
      ref={containerRef}
      className="flex gap-4 overflow-x-auto pb-2 px-4 md:px-0 scrollbar-hide"
    >
      {/* ALL ITEMS */}
      <Button
        size="sm"
        data-category-id="all"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "flex flex-col items-center gap-1 w-20 min-w-[80px] p-2 rounded-xl transition-all duration-300",
          selectedCategory === null
            ? "bg-yellow-400 text-black shadow-md scale-105"
            : "bg-gray-800 text-white hover:bg-gray-700"
        )}
      >
        <span className="text-xs font-semibold">All</span>
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
              "flex flex-col items-center gap-1 w-20 min-w-[80px] p-2 rounded-xl transition-all duration-300",
              isActive
                ? "bg-yellow-400 text-black shadow-lg scale-105"
                : "bg-gray-800 text-white hover:bg-gray-700"
            )}
          >
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className={cn(
                  "w-8 h-8 object-contain transition-all duration-300",
                  isActive && "scale-110 animate-bounce"
                )}
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <span className="text-xs font-medium text-center">{category.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
