"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface CustomizationOption {
  id: string
  type: "size" | "addon"
  label: string
  price: number
}

export function CustomizationManagement() {
  const [customizations, setCustomizations] = useState<CustomizationOption[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [newPrice, setNewPrice] = useState(0)
  const [optionType, setOptionType] = useState<"size" | "addon">("addon")
  const [editingId, setEditingId] = useState<string | null>(null)

  const addCustomization = () => {
    if (!newLabel.trim()) {
      toast.error("Please enter a label")
      return
    }

    const newOption: CustomizationOption = {
      id: `${Date.now()}-${Math.random()}`,
      type: optionType,
      label: newLabel,
      price: newPrice,
    }

    setCustomizations([...customizations, newOption])
    setNewLabel("")
    setNewPrice(0)
    toast.success(`${optionType === "size" ? "Size" : "Add-on"} added successfully`)
  }

  const deleteCustomization = (id: string) => {
    setCustomizations(customizations.filter((c) => c.id !== id))
    toast.success("Customization option removed")
  }

  const sizes = customizations.filter((c) => c.type === "size")
  const addOns = customizations.filter((c) => c.type === "addon")

  return (
    <div className="space-y-6">
      {/* Add New Section */}
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Add Customization Option</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={optionType === "size" ? "default" : "outline"}
              onClick={() => setOptionType("size")}
              className="flex-1"
            >
              Size
            </Button>
            <Button
              variant={optionType === "addon" ? "default" : "outline"}
              onClick={() => setOptionType("addon")}
              className="flex-1"
            >
              Add-on
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={`${optionType === "size" ? "Size name" : "Add-on name"}`}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Price (د.ت)"
              value={newPrice}
              onChange={(e) => setNewPrice(Number.parseFloat(e.target.value) || 0)}
            />
            <Button onClick={addCustomization} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Option
            </Button>
          </div>
        </div>
      </Card>

      {/* Sizes Section */}
      <div>
        <h2 className="font-bold text-lg mb-4">Sizes</h2>
        {sizes.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>No sizes defined yet</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sizes.map((size, idx) => (
              <motion.div key={size.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{size.label}</p>
                    <p className="text-sm text-muted-foreground">+{size.price.toFixed(2)} د.ت</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCustomization(size.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add-ons Section */}
      <div>
        <h2 className="font-bold text-lg mb-4">Add-ons</h2>
        {addOns.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>No add-ons defined yet</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {addOns.map((addon) => (
              <motion.div key={addon.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{addon.label}</p>
                    <p className="text-sm text-muted-foreground">+{addon.price.toFixed(2)} د.ت</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCustomization(addon.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> Customization options defined here will appear in
          the customer cart modal. Sizes and add-ons are applied per item and stored with each order for reference by
          baristas and kitchen staff.
        </p>
      </Card>
    </div>
  )
}
