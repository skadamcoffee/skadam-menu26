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
          "whitespace-nowrap rounded-lg px-4 py-4 flex flex-col items-center gap-2 transition h-20 w-20",
          selectedCategory === null
            ? "bg-[#c9a96a] text-[#2d1f14] shadow-md hover:bg-[#d4b87a] border border-[#c9a96a]"
            : "bg-[#2d1f14]/80 text-[#faf6ef] hover:bg-[#3d2914]/90 border border-[#c9a96a]/30"
        )}
      >
        <span className="text-xs font-medium text-center">All Items</span>
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
              "whitespace-nowrap rounded-lg px-4 py-4 flex flex-col items-center gap-2 transition h-20 w-20",
              isActive
                ? "bg-[#c9a96a] text-[#2d1f14] shadow-md hover:bg-[#d4b87a] border border-[#c9a96a]"
                : "bg-[#2d1f14]/80 text-[#faf6ef] hover:bg-[#3d2914]/90 border border-[#c9a96a]/30"
            )}
          >
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className={cn(
                  "w-10 h-10 rounded-full object-cover shrink-0 transition-all duration-300",
                  isActive && "animate-bounce"
                )}
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
