"use client"

import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  image_url: string | null
}

interface CategoryTabsProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-0">
      {/* All items */}
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="whitespace-nowrap"
      >
        All Items
      </Button>

      {categories.map((category) => {
        const imageSrc = category.image_url?.trim() || "/placeholder.svg"

        return (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(category.id)}
            className="whitespace-nowrap flex items-center gap-2"
          >
            {/* Category Icon */}
            <img
              src={imageSrc}
              alt={category.name}
              className="w-5 h-5 rounded object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />

            {/* Category Name */}
            <span>{category.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
