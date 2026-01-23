'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DrinkSize {
  id: string
  product_id: string
  name: string
  price_modifier: number
  is_available: boolean
  created_at: string
}

interface Topping {
  id: string
  product_id: string
  name: string
  price: number
  is_available: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
}

interface SizeFormData {
  name: string
  price_modifier: string
  is_available: boolean
  product_id: string
}

interface ToppingFormData {
  name: string
  price: string
  is_available: boolean
  product_id: string
}

export function NewCustomizationsManagement() {
  const supabase = createClient()

  // States
  const [products, setProducts] = useState<Product[]>([])
  const [drinkSizes, setDrinkSizes] = useState<DrinkSize[]>([])
  const [toppings, setToppings] = useState<Topping[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductFilter, setSelectedProductFilter] = useState('all')

  // Size form states
  const [showSizeForm, setShowSizeForm] = useState(false)
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null)
  const [isSavingSize, setIsSavingSize] = useState(false)
  const [sizeFormData, setSizeFormData] = useState<SizeFormData>({
    name: '',
    price_modifier: '0',
    is_available: true,
    product_id: '',
  })

  // Topping form states
  const [showToppingForm, setShowToppingForm] = useState(false)
  const [editingToppingId, setEditingToppingId] = useState<string | null>(null)
  const [isSavingTopping, setIsSavingTopping] = useState(false)
  const [toppingFormData, setToppingFormData] = useState<ToppingFormData>({
    name: '',
    price: '0',
    is_available: true,
    product_id: '',
  })

  // Fetch data on mount
  useEffect(() => {
    fetchProducts()
    fetchDrinkSizes()
    fetchToppings()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchDrinkSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('drink_sizes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDrinkSizes(data || [])
    } catch (error) {
      console.error('Error fetching drink sizes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchToppings = async () => {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setToppings(data || [])
    } catch (error) {
      console.error('Error fetching toppings:', error)
    }
  }

  // Size handlers
  const resetSizeForm = () => {
    setSizeFormData({
      name: '',
      price_modifier: '0',
      is_available: true,
      product_id: '',
    })
    setEditingSizeId(null)
    setShowSizeForm(false)
  }

  const handleEditSize = (size: DrinkSize) => {
    setSizeFormData({
      name: size.name,
      price_modifier: size.price_modifier.toString(),
      is_available: size.is_available,
      product_id: size.product_id,
    })
    setEditingSizeId(size.id)
    setShowSizeForm(true)
  }

  const handleDeleteSize = async (id: string) => {
    if (!confirm('Are you sure you want to delete this drink size?')) return
    try {
      const { error } = await supabase.from('drink_sizes').delete().eq('id', id)
      if (error) throw error
      await fetchDrinkSizes()
    } catch (error) {
      console.error('Error deleting size:', error)
    }
  }

  const handleSubmitSize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sizeFormData.name || !sizeFormData.product_id) return

    setIsSavingSize(true)
    try {
      const payload = {
        name: sizeFormData.name,
        price_modifier: parseFloat(sizeFormData.price_modifier),
        is_available: sizeFormData.is_available,
        product_id: sizeFormData.product_id,
      }

      if (editingSizeId) {
        const { error } = await supabase
          .from('drink_sizes')
          .update(payload)
          .eq('id', editingSizeId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('drink_sizes').insert(payload)
        if (error) throw error
      }

      await fetchDrinkSizes()
      resetSizeForm()
    } catch (error) {
      console.error('Error saving size:', error)
    } finally {
      setIsSavingSize(false)
    }
  }

  // Topping handlers
  const resetToppingForm = () => {
    setToppingFormData({
      name: '',
      price: '0',
      is_available: true,
      product_id: '',
    })
    setEditingToppingId(null)
    setShowToppingForm(false)
  }

  const handleEditTopping = (topping: Topping) => {
    setToppingFormData({
      name: topping.name,
      price: topping.price.toString(),
      is_available: topping.is_available,
      product_id: topping.product_id,
    })
    setEditingToppingId(topping.id)
    setShowToppingForm(true)
  }

  const handleDeleteTopping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topping?')) return
    try {
      const { error } = await supabase.from('toppings').delete().eq('id', id)
      if (error) throw error
      await fetchToppings()
    } catch (error) {
      console.error('Error deleting topping:', error)
    }
  }

  const handleSubmitTopping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toppingFormData.name || !toppingFormData.product_id) return

    setIsSavingTopping(true)
    try {
      const payload = {
        name: toppingFormData.name,
        price: parseFloat(toppingFormData.price),
        is_available: toppingFormData.is_available,
        product_id: toppingFormData.product_id,
      }

      if (editingToppingId) {
        const { error } = await supabase
          .from('toppings')
          .update(payload)
          .eq('id', editingToppingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('toppings').insert(payload)
        if (error) throw error
      }

      await fetchToppings()
      resetToppingForm()
    } catch (error) {
      console.error('Error saving topping:', error)
    } finally {
      setIsSavingTopping(false)
    }
  }

  // Filter functions
  const getFilteredSizes = () => {
    return drinkSizes.filter((size) => {
      const matchesSearch = size.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProduct = selectedProductFilter === 'all' || size.product_id === selectedProductFilter
      return matchesSearch && matchesProduct
    })
  }

  const getFilteredToppings = () => {
    return toppings.filter((topping) => {
      const matchesSearch = topping.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProduct = selectedProductFilter === 'all' || topping.product_id === selectedProductFilter
      return matchesSearch && matchesProduct
    })
  }

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || 'Unknown Product'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-400 animate-spin mx-auto mb-6" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Loading customizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Customize Products</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage drink sizes and toppings for your products</p>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 space-y-4 md:flex md:gap-4 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sizes and toppings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
          >
            <option value="all">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedProductFilter('all')
            }}
            className="whitespace-nowrap py-3 px-4 rounded-xl"
          >
            Clear Filters
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="sizes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sizes">Drink Sizes ({drinkSizes.length})</TabsTrigger>
            <TabsTrigger value="toppings">Toppings ({toppings.length})</TabsTrigger>
          </TabsList>

          {/* SIZES TAB */}
          <TabsContent value="sizes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Manage Drink Sizes</h3>
              <Button
                onClick={() => setShowSizeForm(true)}
                className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Size
              </Button>
            </div>

            {/* Size Form Modal */}
            <AnimatePresence>
              {showSizeForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={resetSizeForm}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingSizeId ? 'Edit Drink Size' : 'Add New Drink Size'}
                      </h3>
                      <button
                        onClick={resetSizeForm}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitSize} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Product *
                        </label>
                        <select
                          value={sizeFormData.product_id}
                          onChange={(e) => setSizeFormData({ ...sizeFormData, product_id: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        >
                          <option value="" disabled>
                            Select a product
                          </option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Size Name * (e.g., Small, Medium, Large)
                        </label>
                        <input
                          type="text"
                          value={sizeFormData.name}
                          onChange={(e) => setSizeFormData({ ...sizeFormData, name: e.target.value })}
                          placeholder="e.g., Medium"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Price Modifier (د.ت) * (can be negative)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={sizeFormData.price_modifier}
                          onChange={(e) => setSizeFormData({ ...sizeFormData, price_modifier: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="size_available"
                          checked={sizeFormData.is_available}
                          onChange={(e) => setSizeFormData({ ...sizeFormData, is_available: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 cursor-pointer focus:ring-2 focus:ring-slate-500"
                        />
                        <label htmlFor="size_available" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Available for selection
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" onClick={resetSizeForm} variant="outline" className="flex-1 py-3 rounded-xl bg-transparent">
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSavingSize || !sizeFormData.name || !sizeFormData.product_id}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 transition-all shadow-md"
                        >
                          {isSavingSize ? 'Saving...' : editingSizeId ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sizes List */}
            {getFilteredSizes().length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <p className="text-slate-600 dark:text-slate-400 mb-6">No drink sizes found</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredSizes().map((size) => (
                  <motion.div
                    key={size.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{size.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{getProductName(size.product_id)}</p>
                      </div>
                      <Badge variant={size.is_available ? 'default' : 'secondary'} className="whitespace-nowrap">
                        {size.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Price Modifier</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {size.price_modifier > 0 ? '+' : ''}{size.price_modifier.toFixed(2)} د.ت
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditSize(size)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 py-2 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteSize(size.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 py-2 rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TOPPINGS TAB */}
          <TabsContent value="toppings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Manage Toppings</h3>
              <Button
                onClick={() => setShowToppingForm(true)}
                className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Topping
              </Button>
            </div>

            {/* Topping Form Modal */}
            <AnimatePresence>
              {showToppingForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={resetToppingForm}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingToppingId ? 'Edit Topping' : 'Add New Topping'}
                      </h3>
                      <button
                        onClick={resetToppingForm}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitTopping} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Product *
                        </label>
                        <select
                          value={toppingFormData.product_id}
                          onChange={(e) => setToppingFormData({ ...toppingFormData, product_id: e.target.value })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        >
                          <option value="" disabled>
                            Select a product
                          </option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Topping Name * (e.g., Boba, Almond, Cheese)
                        </label>
                        <input
                          type="text"
                          value={toppingFormData.name}
                          onChange={(e) => setToppingFormData({ ...toppingFormData, name: e.target.value })}
                          placeholder="e.g., Boba"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Price (د.ت) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={toppingFormData.price}
                          onChange={(e) => setToppingFormData({ ...toppingFormData, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="topping_available"
                          checked={toppingFormData.is_available}
                          onChange={(e) => setToppingFormData({ ...toppingFormData, is_available: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 cursor-pointer focus:ring-2 focus:ring-slate-500"
                        />
                        <label htmlFor="topping_available" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Available for selection
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" onClick={resetToppingForm} variant="outline" className="flex-1 py-3 rounded-xl bg-transparent">
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSavingTopping || !toppingFormData.name || !toppingFormData.product_id}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 transition-all shadow-md"
                        >
                          {isSavingTopping ? 'Saving...' : editingToppingId ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toppings List */}
            {getFilteredToppings().length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <p className="text-slate-600 dark:text-slate-400 mb-6">No toppings found</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredToppings().map((topping) => (
                  <motion.div
                    key={topping.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{topping.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{getProductName(topping.product_id)}</p>
                      </div>
                      <Badge variant={topping.is_available ? 'default' : 'secondary'} className="whitespace-nowrap">
                        {topping.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Price</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{topping.price.toFixed(2)} د.ت</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditTopping(topping)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 py-2 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteTopping(topping.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 py-2 rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
