"use client"  
  
import { useEffect, useRef, useState } from "react"  
import { createClient } from "@/lib/supabase/client"  
import { Button } from "@/components/ui/button"  
import { X, Check, Loader2 } from "lucide-react"  
  
interface Customization {  
  id: string  
  name: string  
  description: string | null  
  price: number  
  category: string // NEW  
  image_url: string | null // NEW  
  size_option: string | null // NEW  
}  
  
interface SelectedCustomization {  
  id: string  
  name: string  
  price: number  
  category: string // NEW  
  image_url: string | null // NEW  
  size_option: string | null // NEW  
}  
  
interface CustomizationSelectorProps {  
  isOpen: boolean  
  productId: string  
  productName: string  
  currentCustomizations: SelectedCustomization[]  
  onSave: (customizations: SelectedCustomization[]) => void  
  onClose: () => void  
  currencyCode?: string  
  currencySymbol?: string  
}  
  
export function CustomizationSelector({  
  isOpen,  
  productId,  
  productName,  
  currentCustomizations,  
  onSave,  
  onClose,  
  currencyCode = "د.ت",  
  currencySymbol = "+",  
}: CustomizationSelectorProps) {  
  const supabase = createClient()  
  
  const [customizations, setCustomizations] = useState<Customization[]>([])  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())  
  const [loading, setLoading] = useState(false)  
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)  
  
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
      .select("id, name, description, price, category, image_url, size_option") // Add new fields  
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
        category: c.category, // NEW  
        image_url: c.image_url, // NEW  
        size_option: c.size_option, // NEW  
      }))  
  
    onSave(selected)  
    onClose()  
  }  
  
  // Calculate total price of selected items  
  const totalPrice = customizations  
    .filter(c => selectedIds.has(c.id))  
    .reduce((sum, c) => sum + c.price, 0)  
  
  // Group customizations by category  
  const groupedCustomizations = customizations.reduce((groups, item) => {  
    const category = item.category || 'Other';  
    if (!groups[category]) groups[category] = [];  
    groups[category].push(item);  
    return groups;  
  }, {} as Record<string, Customization[]>)  
  
  if (!isOpen) return null  
  
  return (  
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">  
      <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-lg shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">  
  
        {/* HEADER */}  
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">  
          <div>  
            <h2 className="text-xl font-semibold text-foreground">  
              Customize {productName}  
            </h2>  
            <p className="text-xs text-muted-foreground mt-1">  
              {selectedIds.size} {selectedIds.size === 1 ? "option" : "options"} selected  
            </p>  
          </div>  
          <button  
            onClick={onClose}  
            aria-label="Close customization dialog"  
            className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"  
          >  
            <X className="w-5 h-5" />  
          </button>  
        </div>  
  
        {/* CONTENT */}  
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">  
          {loading ? (  
            <div className="space-y-3">  
              {[...Array(3)].map((_, i) => (  
                <div  
                  key={i}  
                  className="h-16 bg-muted rounded-lg animate-pulse"  
                />  
              ))}  
            </div>  
          ) : customizations.length === 0 ? (  
            <div className="py-12 text-center">  
              <p className="text-sm text-muted-foreground">  
                No customizations available for this product  
              </p>  
            </div>  
          ) : (  
            Object.entries(groupedCustomizations).map(([category, items]) => (  
              <div key={category} className="mb-6">  
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">  
                  {category}  
                </h3>  
                <div className="space-y-3">  
                  {items.map((item, index) => (  
                    <button  
                      key={item.id}  
                      onClick={() => toggleCustomization(item.id)}  
                      onFocus={() => setFocusedIndex(index)}  
                      onBlur={() => setFocusedIndex(-1)}  
                      aria-pressed={selectedIds.has(item.id)}  
                      className={`w-full p-4 rounded-lg border-2 flex justify-between items-start gap-4 transition-all duration-150 ${  
                        selectedIds.has(item.id)  
                          ? "border-primary bg-primary/5 dark:bg-primary/10"  
                          : "border-border hover:border-muted-foreground/50 bg-card"  
                      } ${focusedIndex === index ? "ring-2 ring-ring" : ""}`}  
                    >  
                      <div className="flex items-start gap-3 flex-1">  
                        {/* Image */}  
                        {item.image_url && (  
                          <img  
                            src={item.image_url}  
                            alt={item.name}  
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"  
                            onError={(e) => { e.currentTarget.style.display = "none" }}  
                          />  
                        )}  
                        <div className="text-left flex-1 min-w-0">  
                          <div className="flex items-center gap-2">  
                            <p className="font-semibold text-foreground leading-tight">  
                              {item.name}  
                            </p>  
                            {item.size_option && item.size_option !== 'none' && (  
                              <span className="text-xs bg-muted px-2 py-1 rounded">  
                                {item.size_option}  
                              </span>  
                            )}  
                          </div>  
                          {item.description && (  
                            <p className="text-xs text-muted-foreground mt-1">  
                              {item.description}  
                            </p>  
                          )}  
                        </div>  
                      </div>  
                      <div className="flex items-center gap-3 flex-shrink-0">  
                        <span className="text-sm font-semibold text-foreground whitespace-nowrap">  
                          {currencySymbol}{item.price.toFixed(2)} {currencyCode}  
                        </span>  
                        <div  
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${  
                            selectedIds.has(item.id)  
                              ? "border-primary bg-primary"  
                              : "border-muted-foreground/30 bg-transparent"  
                          }`}  
                        >  
                          {selectedIds.has(item.id) && (  
                            <Check className="w-3 h-3 text-primary-foreground" />  
                          )}  
                        </div>  
                      </div>  
                    </button>  
                  ))}  
                </div>  
              </div>  
            ))  
          )}  
        </div>  
  
        {/* SUMMARY & FOOTER */}  
        <div className="px-6 py-4 border-t border-border space-y-4 bg-muted/30">  
          {selectedIds.size > 0 && (  
            <div className="flex justify-between items-center py-2 px-2 bg-card rounded-lg">  
              <span className="text-sm font-medium text-foreground">  
                Total add-ons:  
              </span>  
              <span className="text-lg font-bold text-primary">  
                {currencySymbol}{totalPrice.toFixed(2)} {currencyCode}  
              </span>  
            </div>  
          )}  
          <div className="flex justify-end gap-3">  
            <Button  
              variant="outline"  
              onClick={onClose}  
              className="px-6 bg-transparent"  
            >  
              Cancel  
            </Button>  
            <Button  
              onClick={handleSave}  
              disabled={loading}  
              className="px-6"  
            >  
              {loading ? (  
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />  
              ) : null}  
              Save Changes  
            </Button>  
          </div>  
        </div>  
      </div>  
    </div>  
  )  
}
