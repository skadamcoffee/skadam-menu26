"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface Customization {
  id: string
  name: string
  description: string | null
  price: number
}

interface SelectedCustomization {
  id: string
  name: string
  price: number
}

interface CustomizationSelectorProps {
  isOpen: boolean
  productId: string
  productName: string
  currentCustomizations: SelectedCustomization[]
  onSave: (customizations: SelectedCustomization[]) => void
  onClose: () => void
}

export function CustomizationSelector({
  isOpen,
  productId,
  productName,
  currentCustomizations,
  onSave,
  onClose,
}: CustomizationSelectorProps) {
  const supabase = createClient()

  const [customizations, setCustomizations] = useState<Customization[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Prevent infinite re-fetch
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!isOpen || !productId || fetchedRef.current) return

    fetchedRef.current = true
    setLoading(true)

    // Preselect existing customizations
    setSelectedIds(new Set(currentCustomizations.map(c => c.id)))

    supabase
      .from("customizations")
      .select("id, name, description, price")
      .eq("product_id", productId)
      .eq("is_available", true)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading customizations:", error)
          return
        }

        setCustomizations(
          (data || []).map(item => ({
            ...item,
            price: Number(item.price),
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [isOpen, productId])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false
      setCustomizations([])
      setSelectedIds(new Set())
    }
  }, [isOpen])

  const toggleCustomization = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = () => {
    const selected = customizations
      .filter(c => selectedIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
      }))

    onSave(selected)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Customize {productName}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-slate-500">
              Loading customizations…
            </p>
          ) : customizations.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No customizations available
            </p>
          ) : (
            customizations.map(item => (
              <button
                key={item.id}
                onClick={() => toggleCustomization(item.id)}
                className={`w-full p-4 rounded-lg border flex justify-between items-center transition ${
                  selectedIds.has(item.id)
                    ? "border-slate-900 bg-slate-100 dark:bg-slate-900"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    +{item.price.toFixed(2)} د.ت
                  </span>
                  {selectedIds.has(item.id) && <Check />}
                </div>
              </button>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
