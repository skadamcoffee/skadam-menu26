"use client"

import { Button } from "@/components/ui/button"

interface CategoryTabsProps {
  categories: Array<{ id: string; name: string; image_url: string }> // added image_url to interface
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryTabs({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-0">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="whitespace-nowrap"
      >
        All Items
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="whitespace-nowrap flex gap-2 items-center" // added flex layout to accommodate image
        >
          {category.image_url && (
            <img
              src={category.image_url || "/placeholder.svg"}
              alt={category.name}
              className="w-5 h-5 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          )}
          {category.name}
        </Button>
      ))}
    </div>
  )
}
