"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"

// ----------------------
// Modal Component
// ----------------------
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.body
  )
}

// ----------------------
// MenuManagement Component
// ----------------------
interface Category {
  id: string
  name: string
  description: string
  display_order: number
  image_url: string
  created_at: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  available: boolean
  popular: boolean
  created_at: string
}

export function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<"categories" | "products">("categories")
  const [isLoading, setIsLoading] = useState(true)

  // Category form states
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", display_order: 0, image_url: "" })
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  // Product form states
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    category_id: "",
    available: true,
    popular: false,
  })
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [showProductForm, setShowProductForm] = useState(false)

  const supabase = createClient()

  // ----------------------
  // Controlled Upload Helper
  // ----------------------
  const uploadImage = async (file: File) => {
  if (!file) return null

  const ext = file.name.split(".").pop()
  const filePath = `products/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from("menu-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error("UPLOAD ERROR:", error)
    return null
  }

  const { data } = supabase.storage
    .from("menu-images")
    .getPublicUrl(filePath)

  return data.publicUrl
}

  // ----------------------
  // Fetch data on mount
  // ----------------------
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order", { ascending: true }),
        supabase.from("products").select("*").order("name", { ascending: true }),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (productsRes.data) setProducts(productsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ----------------------
  // Category Management
  // ----------------------
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return

    try {
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(categoryForm).eq("id", editingCategory)
        if (error) throw error
        setCategories(categories.map((c) => (c.id === editingCategory ? { ...c, ...categoryForm } : c)))
      } else {
        const { data, error } = await supabase.from("categories").insert([categoryForm]).select()
        if (error) throw error
        if (data) setCategories([...categories, data[0]])
      }

      setCategoryForm({ name: "", description: "", display_order: 0, image_url: "" })
      setEditingCategory(null)
      setShowCategoryForm(false)
    } catch (error) {
      console.error("Error saving category:", error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure? This will delete the category and all its products.")) return
    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId)
      if (error) throw error
      setCategories(categories.filter((c) => c.id !== categoryId))
      setProducts(products.filter((p) => p.category_id !== categoryId))
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
      display_order: category.display_order,
      image_url: category.image_url,
    })
    setEditingCategory(category.id)
    setShowCategoryForm(true)
  }

  // ----------------------
  // Product Management
  // ----------------------
  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.category_id) return
    try {
      if (editingProduct) {
        const { error } = await supabase.from("products").update(productForm).eq("id", editingProduct)
        if (error) throw error
        setProducts(products.map((p) => (p.id === editingProduct ? { ...p, ...productForm } : p)))
      } else {
        const { data, error } = await supabase.from("products").insert([productForm]).select()
        if (error) throw error
        if (data) setProducts([...products, data[0]])
      }

      setProductForm({ name: "", description: "", price: 0, image_url: "", category_id: "", available: true, popular: false })
      setEditingProduct(null)
      setShowProductForm(false)
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)
      if (error) throw error
      setProducts(products.filter((p) => p.id !== productId))
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category_id: product.category_id,
      available: product.available,
      popular: product.popular,
    })
    setEditingProduct(product.id)
    setShowProductForm(true)
  }

  const getCategoryName = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name || "Unknown"

  // ----------------------
  // Loading UI
  // ----------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">â˜•</div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    )
  }

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "categories"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "products"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Products ({products.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Menu Categories</h2>
            <Button onClick={() => setShowCategoryForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </div>

          <div className="grid gap-3">
            {categories.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No categories yet</Card>
            ) : (
              categories.map((category) => (
                <motion.div key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-4 hover:shadow-md transition-shadow relative">
                    <div className="flex items-start gap-4">
                      {category.image_url && (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Order: {category.display_order}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {products.filter((p) => p.category_id === category.id).length} products
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditCategory(category)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="relative z-20 text-destructive-foreground bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Menu Items</h2>
            <Button onClick={() => setShowProductForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>

          <div className="grid gap-3">
            {products.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No products yet</Card>
            ) : (
              products.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-4 hover:shadow-md transition-shadow relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{product.name}</h3>
                          {product.popular && <Badge variant="destructive">Popular</Badge>}
                          <Badge variant={product.available ? "default" : "secondary"}>
                            {product.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{getCategoryName(product.category_id)}</Badge>
                          <Badge variant="outline" className="font-bold">
                            {product.price.toFixed(2)} Ø¯.Øª
                          </Badge>
                        </div>
                        {product.image_url && (
                          <img src={product.image_url} className="w-24 h-24 object-cover rounded-md mt-2" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="relative z-20 text-destructive-foreground bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- Category Modal ---------------- */}
      <Modal
        isOpen={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false)
          setEditingCategory(null)
          setCategoryForm({ name: "", description: "", display_order: 0, image_url: "" })
        }}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Category name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <textarea
            placeholder="Category description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
            rows={3}
          />
          {/* Image upload */}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (!e.target.files?.[0]) return
              const url = await uploadImage(e.target.files[0])
              if (url) setCategoryForm({ ...categoryForm, image_url: url })
            }}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          {categoryForm.image_url && (
            <img src={categoryForm.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2" />
          )}
          <input
            type="number"
            placeholder="Display order"
            value={categoryForm.display_order}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, display_order: Number.parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveCategory} className="flex-1">
              {editingCategory ? "Update" : "Create"} Category
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryForm(false)
                setEditingCategory(null)
                setCategoryForm({ name: "", description: "", display_order: 0, image_url: "" })
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Product Modal ---------------- */}
      <Modal
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false)
          setEditingProduct(null)
          setProductForm({
            name: "",
            description: "",
            price: 0,
            image_url: "",
            category_id: "",
            available: true,
            popular: false,
          })
        }}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Product name"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          <textarea
            placeholder="Product description"
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
            rows={2}
          />
          <input
            type="number"
            step="0.1"
            placeholder="Price (TND)"
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: Number.parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />

          {/* Product Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (!e.target.files?.[0]) return
              const url = await uploadImage(e.target.files[0])
              if (url) setProductForm({ ...productForm, image_url: url })
            }}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
          {productForm.image_url && (
            <img src={productForm.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2" />
          )}

          <select
            value={productForm.category_id}
            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={productForm.available}
              onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="available" className="text-sm font-medium">
              Available for order
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popular"
              checked={productForm.popular}
              onChange={(e) => setProductForm({ ...productForm, popular: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="popular" className="text-sm font-medium">
              Popular
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveProduct} className="flex-1">
              {editingProduct ? "Update" : "Create"} Product
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowProductForm(false)
                setEditingProduct(null)
                setProductForm({
                  name: "",
                  description: "",
                  price: 0,
                  image_url: "",
                  category_id: "",
                  available: true,
                  popular: false,
                })
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
         
