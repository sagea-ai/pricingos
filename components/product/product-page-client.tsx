'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { TrialProvider } from '@/components/trial/trial-provider'
import { TrialBannerWrapper } from '@/components/trial/trial-banner-wrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Ship, 
  Plus, 
  X, 
  Edit3, 
  Trash2,
  Save,
  Target,
  Zap,
  Sparkles,
  Package,
  ChevronRight,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Star,
  Eye,
  Activity,
  BarChart3,
  Lightbulb,
  Rocket,
  Globe,
  Heart
} from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
}

interface ProductPageClientProps {
  organizations: Organization[]
  currentOrganization: Organization
}

// Market options for products
const marketOptions = [
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'retail', name: 'Retail/E-commerce', icon: '🛍️' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { id: 'marketing', name: 'Marketing', icon: '📈' },
  { id: 'consulting', name: 'Consulting', icon: '💼' },
  { id: 'media', name: 'Media/Entertainment', icon: '🎬' },
  { id: 'other', name: 'Other', icon: '🌐' },
]

// Pricing model options
const pricingModelOptions = [
  { id: 'free', name: 'Free', description: 'Completely free product' },
  { id: 'freemium', name: 'Freemium', description: 'Free with paid premium features' },
  { id: 'subscription', name: 'Subscription', description: 'Monthly/yearly recurring payments' },
  { id: 'one-time', name: 'One-time Purchase', description: 'Single payment for lifetime access' },
  { id: 'usage-based', name: 'Usage-based', description: 'Pay per use/consumption' },
  { id: 'tiered', name: 'Tiered Pricing', description: 'Multiple pricing tiers' },
  { id: 'custom', name: 'Custom/Enterprise', description: 'Custom pricing for enterprises' },
  { id: 'other', name: 'Other', description: 'Different pricing model' },
]

interface Product {
  id: string
  productName: string
  coreValue: string
  features: string[]
  market?: string
  currentPricingModel?: string
  currentPrice?: string
  monthlyRevenue?: number
  totalUsers?: number
  businessStage?: string
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  productName: string
  coreValue: string
  features: string[]
  market: string
  currentPricingModel: string
  currentPrice: string
  monthlyRevenue: string
  totalUsers: string
  businessStage: string
  currentFeature: string
}

const emptyForm: ProductFormData = {
  productName: '',
  coreValue: '',
  features: [],
  market: '',
  currentPricingModel: '',
  currentPrice: '',
  monthlyRevenue: '',
  totalUsers: '',
  businessStage: '',
  currentFeature: ''
}

// Business stage options
const businessStageOptions = [
  { id: 'idea', name: 'Idea Stage', description: 'Concept validation phase' },
  { id: 'mvp', name: 'MVP/Prototype', description: 'Building initial version' },
  { id: 'early', name: 'Early Stage', description: 'First customers, testing product-market fit' },
  { id: 'growth', name: 'Growth Stage', description: 'Scaling and expanding market reach' },
  { id: 'mature', name: 'Mature', description: 'Established market position' },
  { id: 'enterprise', name: 'Enterprise', description: 'Large-scale operations' },
]

export function ProductPageClient({ organizations, currentOrganization: initialOrganization }: ProductPageClientProps) {
  const { user } = useUser()
  const router = useRouter()
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    fetchProducts()
  }, [user, router])

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const { products } = await response.json()
        setProducts(products)
      } else {
        toast.error('Failed to load products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const validateField = (key: string, value: string) => {
    const newErrors = { ...errors }
    
    if (key === 'productName') {
      if (!value.trim()) {
        newErrors.productName = 'Product name is required'
      } else if (value.trim().length < 2) {
        newErrors.productName = 'Product name must be at least 2 characters'
      } else {
        delete newErrors.productName
      }
    }
    
    if (key === 'coreValue') {
      if (!value.trim()) {
        newErrors.coreValue = 'Core value description is required'
      } else if (value.trim().length < 10) {
        newErrors.coreValue = 'Please provide a more detailed description (at least 10 characters)'
      } else {
        delete newErrors.coreValue
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    validateField(key, value)
  }

  const addFeature = () => {
    if (formData.currentFeature.trim() && !formData.features.includes(formData.currentFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, prev.currentFeature.trim()],
        currentFeature: ''
      }))
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const startCreating = () => {
    setFormData(emptyForm)
    setErrors({})
    setEditingProduct(null)
    setShowCreateForm(true)
  }

  const startEditing = (product: Product) => {
    setFormData({
      productName: product.productName,
      coreValue: product.coreValue,
      features: [...product.features],
      market: product.market || '',
      currentPricingModel: product.currentPricingModel || '',
      currentPrice: product.currentPrice || '',
      monthlyRevenue: product.monthlyRevenue?.toString() || '',
      totalUsers: product.totalUsers?.toString() || '',
      businessStage: product.businessStage || '',
      currentFeature: ''
    })
    setErrors({})
    setEditingProduct(product.id)
    setShowCreateForm(true)
  }

  const cancelEditing = () => {
    setShowCreateForm(false)
    setEditingProduct(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFieldValid = validateField('productName', formData.productName) && 
                              validateField('coreValue', formData.coreValue)
    
    if (!requiredFieldValid || formData.features.length === 0) {
      if (formData.features.length === 0) {
        toast.error('Please add at least one feature')
      }
      return
    }

    setIsSubmitting(true)

    try {
      const productData = {
        productName: formData.productName.trim(),
        coreValue: formData.coreValue.trim(),
        features: formData.features,
        market: formData.market || undefined,
        currentPricingModel: formData.currentPricingModel || undefined,
        currentPrice: formData.currentPrice || undefined,
        monthlyRevenue: formData.monthlyRevenue ? parseFloat(formData.monthlyRevenue) : undefined,
        totalUsers: formData.totalUsers ? parseInt(formData.totalUsers) : undefined,
        businessStage: formData.businessStage || undefined,
      }

      const url = editingProduct ? `/api/products/${editingProduct}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        await fetchProducts()
        cancelEditing()
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully')
      } else {
        const error = await response.text()
        toast.error(error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProducts()
        toast.success('Product deleted successfully')
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  if (isLoading) {
    return (
      <AppLayout organizations={organizations} currentOrganization={currentOrganization} onOrganizationChange={handleOrganizationChange}>
        <TrialProvider>
          <TrialBannerWrapper />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        </TrialProvider>
      </AppLayout>
    )
  }

  // Calculate stats
  const totalProducts = products.length
  const totalRevenue = products.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0)
  const totalUsers = products.reduce((sum, p) => sum + (p.totalUsers || 0), 0)
  const avgRevenue = totalProducts > 0 ? totalRevenue / totalProducts : 0

  return (
    <AppLayout organizations={organizations} currentOrganization={currentOrganization} onOrganizationChange={handleOrganizationChange}>
      <TrialProvider>
        <TrialBannerWrapper />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-43xl font-light text-gray-900 tracking-tight">Product Builder</h1>
                <p className="text-gray-500 text-sm mt-1">Design your pricing strategy</p>
              </div>
            </div>
            <Button 
              onClick={startCreating} 
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>

          {/* Stats Card */}
          {products.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600/50 border-amber-200/50 shadow-sm rounded-2xl">
              <CardContent className="p-16">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-light text-neutral-800">{totalProducts}</div>
                    <div className="text-sm text-neutral-600 mt-1">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-neutral-800">${totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-neutral-600 mt-1">Monthly Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-neutral-800">{totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-neutral-600 mt-1">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-neutral-800">${Math.round(avgRevenue).toLocaleString()}</div>
                    <div className="text-sm text-neutral-600 mt-1">Avg Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-xl font-light text-gray-900">
                      <span>{editingProduct ? 'Edit Product' : 'New Product'}</span>
                      <Button variant="ghost" size="sm" onClick={cancelEditing} className="rounded-full h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Name */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Product Name *</Label>
                          <Input
                            value={formData.productName}
                            onChange={(e) => handleInputChange('productName', e.target.value)}
                            placeholder="Enter product name"
                            className={`mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all ${errors.productName ? 'ring-2 ring-red-400' : ''}`}
                          />
                          {errors.productName && (
                            <p className="text-xs text-red-500 mt-1">{errors.productName}</p>
                          )}
                        </div>

                        {/* Market */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Target Market</Label>
                          <Select value={formData.market} onValueChange={(value) => handleInputChange('market', value)}>
                            <SelectTrigger className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500">
                              <SelectValue placeholder="Select market" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              {marketOptions.map((market) => (
                                <SelectItem key={market.id} value={market.id} className="rounded-lg">
                                  <span className="flex items-center">
                                    <span className="mr-2">{market.icon}</span>
                                    {market.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Core Value */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Core Value Proposition *</Label>
                        <Textarea
                          value={formData.coreValue}
                          onChange={(e) => handleInputChange('coreValue', e.target.value)}
                          placeholder="What unique value does your product provide?"
                          rows={3}
                          className={`mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none ${errors.coreValue ? 'ring-2 ring-red-400' : ''}`}
                        />
                        {errors.coreValue && (
                          <p className="text-xs text-red-500 mt-1">{errors.coreValue}</p>
                        )}
                      </div>

                      {/* Features */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Features *</Label>
                        <div className="space-y-3 mt-1">
                          <div className="flex space-x-2">
                            <Input
                              value={formData.currentFeature}
                              onChange={(e) => setFormData(prev => ({ ...prev, currentFeature: e.target.value }))}
                              placeholder="Add a feature"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                              className="border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                            />
                            <Button type="button" onClick={addFeature} className="bg-amber-500 hover:bg-amber-600 rounded-xl px-4 border-0">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {formData.features.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.features.map((feature, index) => (
                                <Badge key={index} className="bg-amber-100 text-amber-800 border-amber-200 rounded-full px-3 py-1 text-xs">
                                  <span>{feature}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="ml-2 hover:text-red-600 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Current Pricing Model */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Pricing Model</Label>
                          <Select value={formData.currentPricingModel} onValueChange={(value) => handleInputChange('currentPricingModel', value)}>
                            <SelectTrigger className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              {pricingModelOptions.map((model) => (
                                <SelectItem key={model.id} value={model.id} className="rounded-lg">
                                  <div>
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-xs text-gray-500">{model.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Business Stage */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Business Stage</Label>
                          <Select value={formData.businessStage} onValueChange={(value) => handleInputChange('businessStage', value)}>
                            <SelectTrigger className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500">
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              {businessStageOptions.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id} className="rounded-lg">
                                  <div>
                                    <div className="font-medium">{stage.name}</div>
                                    <div className="text-xs text-gray-500">{stage.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Current Price */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Current Price</Label>
                          <Input
                            value={formData.currentPrice}
                            onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                            placeholder="$29/month"
                            className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                          />
                        </div>

                        {/* Monthly Revenue */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Monthly Revenue ($)</Label>
                          <Input
                            type="number"
                            value={formData.monthlyRevenue}
                            onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                            placeholder="0"
                            className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                          />
                        </div>

                        {/* Total Users */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Total Users</Label>
                          <Input
                            type="number"
                            value={formData.totalUsers}
                            onChange={(e) => handleInputChange('totalUsers', e.target.value)}
                            placeholder="0"
                            className="mt-1 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6 py-2 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {editingProduct ? 'Update' : 'Create'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={cancelEditing}
                          className="border-gray-200 rounded-xl px-6 py-2 hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products List */}
          {products.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-3xl bg-white/60 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 text-center mb-8 max-w-md">
                  Create your first product to start designing your pricing strategy
                </p>
                <Button 
                  onClick={startCreating} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8 py-3 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group"
                >
                  <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl bg-white/80 backdrop-blur-sm group-hover:bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-medium text-gray-900 mb-2">{product.productName}</CardTitle>
                          {product.market && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 rounded-full text-xs px-2 py-1">
                              {marketOptions.find(m => m.id === product.market)?.icon} {marketOptions.find(m => m.id === product.market)?.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => startEditing(product)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-amber-50"
                          >
                            <Edit3 className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteProduct(product.id)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{product.coreValue}</p>
                      
                      {product.features.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {product.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1">
                                {feature}
                              </Badge>
                            ))}
                            {product.features.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                                +{product.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {product.currentPrice && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="text-gray-700 font-medium">{product.currentPrice}</span>
                          </div>
                        )}
                        {product.totalUsers && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-gray-700 font-medium">{product.totalUsers.toLocaleString()}</span>
                          </div>
                        )}
                        {product.monthlyRevenue && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-amber-600" />
                            <span className="text-gray-700 font-medium">${product.monthlyRevenue.toLocaleString()}/mo</span>
                          </div>
                        )}
                        {product.businessStage && (
                          <div className="flex items-center space-x-1">
                            <Rocket className="h-3 w-3 text-purple-600" />
                            <span className="text-gray-700 font-medium capitalize">{businessStageOptions.find(s => s.id === product.businessStage)?.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </TrialProvider>
    </AppLayout>
  )
}