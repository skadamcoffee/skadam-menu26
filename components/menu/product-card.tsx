'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Minus, Check, Package, CupSoda, Palette, Zap } from 'lucide-react'

export interface ProductCustomization {
  id: string
  name: string
  price: number
}

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  popular: boolean | number | null
  onAddToCart: (productId: string, quantity: number, customizations?: ProductCustomization[]) => void
}

interface CustomizationOption {
  id: string
  name: string
  description: string | null
  price: number
  group_key: string
  group_label: string
  required: boolean
  min_select: number
  max_select: number
  sort_order: number
}

function getGroupIcon(groupKey: string) {
  switch (groupKey.toLowerCase()) {
    case 'size': return <CupSoda className="w-4 h-4" />
    case 'color': return <Palette className="w-4 h-4" />
    case 'addon': return <Zap className="w-4 h-4" />
    default: return <Package className="w-4 h-4" />
  }
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  popular,
  onAddToCart,
}: ProductCardProps) {
  const isPopular = !!popular
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOption[]>([])
  const [customizationLoading, setCustomizationLoading] = useState(false)
  const [selectedCustomizationIds, setSelectedCustomizationIds] = useState<Set<string>>(new Set())
  const [customizationErrors, setCustomizationErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  // Fetch customizations
  useEffect(() => {
    if (!isModalOpen || !id) return
    setCustomizationLoading(true)
    setSelectedCustomizationIds(new Set())
    setCustomizationErrors({})
    supabase
      .from('customizations')
      .select('id, name, description, price, group_key, group_label, required, min_select, max_select, sort_order')
      .eq('product_id', id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading customizations:', error)
          setCustomizationOptions([])
        } else {
          setCustomizationOptions(
            (data || []).map((c: any) => ({
              ...c,
              price: Number(c.price),
              min_select: Number(c.min_select),
              max_select: Number(c.max_select),
              sort_order: Number(c.sort_order),
            }))
          )
        }
      })
      .finally(() => setCustomizationLoading(false))
  }, [isModalOpen, id])

  const groupedCustomizations = useMemo(() => {
    return customizationOptions.reduce((acc, item) => {
      if (!acc[item.group_key]) acc[item.group_key] = []
      acc[item.group_key].push(item)
      return acc
    }, {} as Record<string, CustomizationOption[]>)
  }, [customizationOptions])

  const validateCustomizations = (selected: Set<string>): Record<string, string> => {
    const errors: Record<string, string> = {}
    Object.entries(groupedCustomizations).forEach(([groupKey, items]) => {
      const count = items.filter(i => selected.has(i.id)).length
      const first = items[0]
      if (first.required && count === 0) errors[groupKey] = `${first.group_label} is required.`
      else if (count < first.min_select) errors[groupKey] = `Select at least ${first.min_select} for ${first.group_label}.`
      else if (count > first.max_select) errors[groupKey] = `Select at most ${first.max_select} for ${first.group_label}.`
    })
    return errors
  }

  const toggleCustomization = (optId: string) => {
    setSelectedCustomizationIds(prev => {
      const next = new Set(prev)
      if (next.has(optId)) next.delete(optId)
      else next.add(optId)
      setCustomizationErrors(validateCustomizations(next))
      return next
    })
  }

  const selectedCustomizationsForCart = useMemo((): ProductCustomization[] => {
    return customizationOptions
      .filter(c => selectedCustomizationIds.has(c.id))
      .map(c => ({ id: c.id, name: c.name, price: c.price }))
  }, [customizationOptions, selectedCustomizationIds])

  const hasCustomizations = customizationOptions.length > 0
  const canAddToCart = !hasCustomizations || Object.keys(validateCustomizations(selectedCustomizationIds)).length === 0
  const totalPrice = (price + selectedCustomizationsForCart.reduce((sum, c) => sum + c.price, 0)) * quantity

  return (
    <>
      {/* PRODUCT CARD */}
      <Card className='relative w-full min-h-[280px] sm:min-h-[320px] rounded-3xl shadow-xl overflow-hidden border-none bg-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer' onClick={() => setIsModalOpen(true)}>
        <img src={image_url || '/placeholder.svg'} alt={name} className='w-full h-full object-cover absolute inset-0 aspect-[4/3] sm:aspect-[3/2]' />
        <div className='absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg'>
          <h3 className='text-sm sm:text-base font-bold text-white drop-shadow-lg leading-tight'>{name}</h3>
        </div>
        {isPopular && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className='absolute top-4 right-4 z-30 flex items-center gap-1 bg-gradient-to-r from-[#c9a96a] to-[#a68b5b] text-[#2d1f14] font-semibold text-sm px-4 py-2 rounded-full shadow-lg drop-shadow-lg border border-[#faf6ef]/30'>
            <span className='text-xs'>⭐</span> Popular
          </motion.div>
        )}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); onAddToCart(id, 1, []) }} className='absolute bottom-4 right-4 z-20 p-3 bg-gradient-to-r from-[#5c4033] to-[#c9a96a] hover:from-[#6b5040] hover:to-[#d4b87a] rounded-full shadow-lg transition-all duration-200 border border-[#c9a96a]/40'>
          <Plus size={20} className='text-white' />
        </motion.button>
      </Card>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md' onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: 'easeOut' }} className='relative bg-[#faf6ef] rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-[#e0d5c4]' onClick={(e) => e.stopPropagation()}>
              
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setIsModalOpen(false)} className='absolute top-4 right-4 z-20 p-2 bg-[#e8dfd0] hover:bg-[#e0d5c4] rounded-full transition-colors'>
                <X size={24} className='text-[#5c4033]' />
              </motion.button>

              <div className='flex justify-center pt-6 pb-4'>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className='w-24 h-24 rounded-full overflow-hidden border-4 border-[#e0d5c4] shadow-lg'>
                  <img src={image_url || '/placeholder.svg'} alt={name} className='w-full h-full object-cover' />
                </motion.div>
              </div>

              <div className='px-6 pb-6'>
                <h3 className='text-xl font-bold text-[#2d1f14] mb-2 text-center'>{name}</h3>
                <p className='text-sm text-[#5c4033] mb-4 text-center'>{description}</p>

                {/* CUSTOMIZATIONS */}
                {hasCustomizations && (
                  <div className='mb-4 rounded-xl border border-[#e0d5c4] bg-[#f5f0e6]/50 p-3 max-h-60 overflow-y-auto'>
                    {customizationLoading ? (
                      <div className='flex items-center justify-center text-[#5c4033] text-xs py-4'>Loading options…</div>
                    ) : (
                      Object.entries(groupedCustomizations).map(([groupKey, items]) => {
                        const first = items[0]

                        return (
                          <div key={groupKey} className='mb-3'>
                            <div className='flex items-center gap-2 text-[#5c4033] font-medium text-xs mb-1'>
                              {getGroupIcon(groupKey)}
                              <span>{first.group_label}</span>
                              {customizationErrors[groupKey] && <span className='text-red-600 ml-2 text-[10px]'>{customizationErrors[groupKey]}</span>}
                            </div>

                            {groupKey.toLowerCase() === 'size' ? (
                              <div className='flex justify-center gap-3 flex-wrap'>
                                {items.map(opt => {
                                  const isSelected = selectedCustomizationIds.has(opt.id)
                                  return (
                                    <motion.button key={opt.id} onClick={() => toggleCustomization(opt.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`relative w-20 h-20 rounded-full border flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 ${isSelected ? 'border-[#c9a96a] bg-[#e8dfd0] text-[#2d1f14] shadow-md' : 'border-[#e0d5c4] bg-white text-[#5c4033] hover:border-[#c9a96a]/70 hover:bg-[#f5f0e6]'}`}>
                                      <CupSoda className={`w-5 h-5 mb-1 ${isSelected ? 'text-[#c9a96a]' : 'text-[#5c4033]'}`} />
                                      <span className='text-[10px] leading-tight text-center'>{opt.name}</span>
                                      {opt.price > 0 && <span className='text-[8px] text-[#5c4033] mt-1'>+{opt.price.toFixed(2)} د.ت</span>}
                                      {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className='absolute top-1 right-1 w-4 h-4 bg-[#c9a96a] rounded-full flex items-center justify-center'><Check size={10} className='text-white' /></motion.div>}
                                    </motion.button>
                                  )
                                })}
                              </div>
                            ) : groupKey.toLowerCase() === 'add-ons' || groupKey.toLowerCase() === 'addon' ? (
                              <select value={items.find(opt => selectedCustomizationIds.has(opt.id))?.id || ''} onChange={(e) => {
                                const selectedId = e.target.value
                                setSelectedCustomizationIds(prev => {
                                  const next = new Set(prev)
                                  items.forEach(i => next.delete(i.id))
                                  if (selectedId) next.add(selectedId)
                                  setCustomizationErrors(validateCustomizations(next))
                                  return next
                                })
                              }} className='w-full bg-white border border-[#e0d5c4] rounded-lg px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:ring-1 focus:ring-[#c9a96a]'>
                                <option value="">Optional</option>
                                {items.map(opt => (
                                  <option key={opt.id} value={opt.id}>{opt.name} {opt.price > 0 ? `(+${opt.price.toFixed(2)} د.ت)` : ''}</option>
                                ))}
                              </select>
                            ) : (
                              <div className='flex flex-wrap gap-2'>
                                {items.map(opt => {
                                  const isSelected = selectedCustomizationIds.has(opt.id)
                                  return (
                                    <button key={opt.id} onClick={() => toggleCustomization(opt.id)} className={`px-3 py-2 rounded-lg border text-sm transition-all ${isSelected ? 'bg-[#5c4033] text-white border-[#5c4033]' : 'bg-white text-[#5c4033] border-[#e0d5c4] hover:bg-[#f5efe6]'}`}>
                                      {opt.name} {opt.price > 0 ? `(+${opt.price.toFixed(2)} د.ت)` : ''}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* PRICE & QUANTITY */}
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-lg font-bold text-[#2d1f14]'>{totalPrice.toFixed(2)} د.ت</span>
                  <div className='flex items-center gap-2'>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(Math.max(1, quantity - 1))} className='p-1.5 bg-[#e8dfd0] hover:bg-[#e0d5c4] rounded-full transition-colors'>
                      <Minus size={14} className='text-[#5c4033]' />
                    </motion.button>
                    <span className='text-sm font-semibold text-[#2d1f14] min-w-[1.5rem] text-center'>{quantity}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(quantity + 1)} className='p-1.5 bg-[#e8dfd0] hover:bg-[#e0d5c4] rounded-full transition-colors'>
                      <Plus size={14} className='text-[#5c4033]' />
                    </motion.button>
                  </div>
                </div>

                {/* ADD TO CART */}
                <Button onClick={() => { if (!canAddToCart) return; onAddToCart(id, quantity, selectedCustomizationsForCart); setIsModalOpen(false); setQuantity(1); setSelectedCustomizationIds(new Set()) }}
                  disabled={!canAddToCart}
                  className='w-full bg-gradient-to-r from-[#5c4033] to-[#c9a96a] hover:from-[#6b5040] hover:to-[#d4b87a] text-[#faf6ef] py-2.5 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 border border-[#c9a96a]/30 disabled:opacity-60 disabled:pointer-events-none'>
                  <Plus size={18} className='mr-2' /> Add {quantity} to Cart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
