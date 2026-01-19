"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input" // Assuming shadcn/ui Input; replace if not available
import { Textarea } from "@/components/ui/textarea" // Assuming shadcn/ui Textarea
import { Checkbox } from "@/components/ui/checkbox" // Assuming shadcn/ui Checkbox
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Assuming shadcn/ui Select
import { Plus, Edit2, Trash2, X, Folder, Package, Search, Loader2, ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

// ----------------------
// Modal Component (Enhanced for Mobile)
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative bg-background rounded-lg shadow-xl w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto z-10"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 md:p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
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
  const [searchQuery, setSearchQuery] = useState("")
  const [uploading, setUploading] = useState(false)

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
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const filePath = `products/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) throw error

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("UPLOAD ERROR:", error)
      // Add toast notification here if available
      return null
    } finally {
      setUploading(false)
    }
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
      // Add toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  // ----------------------
  // Filtered Data
  // ----------------------
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      // Add toast notification
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
      // Add toast notification
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
      // Add toast notification
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
      // Add toast notification
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
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
        {/* Skeleton for Tabs */}
        <div className="flex gap-2 border-b border-border mb-4">
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        {/* Skeleton for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-16 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories or products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-3 font-medium transition-colors rounded-t-md ${
            activeTab === "categories"
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Folder className="inline w-4 h-4 mr-2" />
          Categories ({filteredCategories.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-3 font-medium transition-colors rounded-t-md ${
            activeTab === "products"
              ? "border-b-2 border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Package className="inline w-4 h-4 mr-2" />
          Products ({filteredProducts.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold">Menu Categories</h2>
            <Button onClick={() => setShowCategoryForm(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No categories found</p>
              </Card>
            ) : (
              filteredCategories.map((category) => (
                <motion.div key={category.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <CardContent className="space-y-3">
                      {category.image_url && (
                        <img
                                                    src={category.image_url}
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Order: {category.display_order}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {products.filter((p) => p.category_id === category.id).length} products
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)} className="flex-1">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold">Menu Items</h2>
            <Button onClick={() => setShowProductForm(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </Card>
            ) : (
              filteredProducts.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <CardContent className="space-y-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{product.name}</h3>
                          {product.popular && <Badge variant="destructive">Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={product.available ? "default" : "secondary"}>
                            {product.available ? "Available" : "Unavailable"}
                          </Badge>
                          <Badge variant="outline">{getCategoryName(product.category_id)}</Badge>
                          <Badge variant="outline" className="font-bold">
                            {product.price.toFixed(2)} د.ت
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)} className="flex-1">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
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
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <Input
              type="text"
              placeholder="e.g., Appetizers"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              placeholder="Brief description..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files?.[0]) return
                const url = await uploadImage(e.target.files[0])
                if (url) setCategoryForm({ ...categoryForm, image_url: url })
              }}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            {categoryForm.image_url && (
              <div className="mt-2 relative">
                <img src={categoryForm.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={() => setCategoryForm({ ...categoryForm, image_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Order</label>
            <Input
              type="number"
              placeholder="0"
              value={categoryForm.display_order}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, display_order: Number.parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveCategory} className="flex-1" disabled={!categoryForm.name.trim()}>
              {editingCategory ? "Update" : "Create"} Category
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryForm(false)
                setEditingCategory(null)
                setCategoryForm({ name: "", description: "", display_order: 0, image_url: "" })
              }}
              className="flex-1"
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
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <Input
              type="text"
              placeholder="e.g., Espresso.."
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              placeholder="Brief description..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (د.ت)</label>
            <Input
              type="number"
              step="0.1"
              placeholder="0.00"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (!e.target.files?.[0]) return
                const url = await uploadImage(e.target.files[0])
                if (url) setProductForm({ ...productForm, image_url: url })
              }}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            {productForm.image_url && (
              <div className="mt-2 relative">
                <img src={productForm.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={() => setProductForm({ ...productForm, image_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={productForm.category_id}
              onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available"
              checked={productForm.available}
              onCheckedChange={(checked) => setProductForm({ ...productForm, available: !!checked })}
            />
            <label htmlFor="available" className="text-sm font-medium">
              Available for order
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="popular"
              checked={productForm.popular}
              onCheckedChange={(checked) => setProductForm({ ...productForm, popular: !!checked })}
            />
            <label htmlFor="popular" className="text-sm font-medium">
              Mark as popular
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveProduct} className="flex-1" disabled={!productForm.name.trim() || !productForm.category_id}>
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
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
