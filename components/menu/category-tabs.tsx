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
      className="flex gap-3 overflow-x-auto pb-2 px-4 md:px-0 scrollbar-hide"
    >
      {/* ALL ITEMS */}
      <Button
        size="sm"
        data-category-id="all"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "whitespace-nowrap rounded-full px-4 flex items-center gap-2 transition",
          selectedCategory === null
            ? "bg-yellow-400 text-black shadow-md hover:bg-yellow-400"
            : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
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
              "whitespace-nowrap rounded-full px-4 flex items-center gap-2 transition",
              isActive
                ? "bg-yellow-400 text-black shadow-md hover:bg-yellow-400"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            )}
          >
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className={cn(
                  "w-5 h-5 object-contain shrink-0 transition-all duration-300",
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
