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
  ChevronRight
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
  currentFeature: string
}

const emptyForm: ProductFormData = {
  productName: '',
  coreValue: '',
  features: [],
  market: '',
  currentPricingModel: '',
  currentPrice: '',
  currentFeature: ''
}

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
      currentFeature: ''
    })
    setErrors({})
    setEditingProduct(product.id)
    setShowCreateForm(true)
  }

  const cancelForm = () => {
    setShowCreateForm(false)
    setEditingProduct(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleSave = async () => {
    const isProductNameValid = validateField('productName', formData.productName)
    const isCoreValueValid = validateField('coreValue', formData.coreValue)
    
    if (!isProductNameValid || !isCoreValueValid) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.features.length === 0) {
      toast.error('Please add at least one feature')
      return
    }

    setIsSubmitting(true)
    
    try {
      const payload = {
        productName: formData.productName,
        coreValue: formData.coreValue,
        features: formData.features,
        market: formData.market,
        currentPricingModel: formData.currentPricingModel,
        currentPrice: formData.currentPrice
      }

      const url = editingProduct ? `/api/products/${editingProduct}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
        setShowCreateForm(false)
        setEditingProduct(null)
        setFormData(emptyForm)
        fetchProducts()
      } else {
        console.error('Product save failed:', result)
        toast.error(result.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      toast.error('Failed to save product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Product deleted successfully!')
        fetchProducts()
      } else {
        console.error('Product deletion failed:', result)
        toast.error(result.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product. Please try again.')
    }
  }

  const getMarketInfo = (marketId: string) => {
    return marketOptions.find(m => m.id === marketId)
  }

  const getPricingModelInfo = (modelId: string) => {
    return pricingModelOptions.find(m => m.id === modelId)
  }

  if (isLoading) {
    return (
      <AppLayout
        organizations={organizations}
        currentOrganization={currentOrganization}
        onOrganizationChange={handleOrganizationChange}
        user={{
          fullName: user?.fullName || undefined,
          firstName: user?.firstName || undefined,
          lastName: user?.lastName || undefined,
        }}
      >
        <TrialProvider>
          <TrialBannerWrapper />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
            </div>
          </div>
        </TrialProvider>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={{
        fullName: user?.fullName || undefined,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      }}
    >
      <TrialProvider>
        <TrialBannerWrapper />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    Product Builder
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 font-light">
                    Create and manage your product portfolio
                  </p>
                </div>
              </div>
              <Button
                onClick={startCreating}
                disabled={showCreateForm}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Create/Edit Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <Card className="border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-950 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Ship className="h-5 w-5 text-amber-600" />
                      {editingProduct ? 'Edit Product' : 'Create New Product'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Ship className="h-4 w-4 text-amber-500" />
                          Product name *
                        </Label>
                        <Input
                          id="productName"
                          placeholder="Enter product name..."
                          value={formData.productName}
                          onChange={(e) => handleInputChange('productName', e.target.value)}
                          disabled={isSubmitting}
                          className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                        />
                        {errors.productName && (
                          <p className="text-sm text-red-500">{errors.productName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="market" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-500" />
                          Market
                        </Label>
                        <Select 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, market: value }))}
                          value={formData.market}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg">
                            <SelectValue placeholder="Select market" />
                          </SelectTrigger>
                          <SelectContent>
                            {marketOptions.map((market) => (
                              <SelectItem key={market.id} value={market.id}>
                                <div className="flex items-center gap-2">
                                  <span>{market.icon}</span>
                                  <span>{market.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Core Value */}
                    <div className="space-y-2">
                      <Label htmlFor="coreValue" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        Core value proposition *
                      </Label>
                      <Input
                        id="coreValue"
                        placeholder="What problem does your product solve?"
                        value={formData.coreValue}
                        onChange={(e) => handleInputChange('coreValue', e.target.value)}
                        disabled={isSubmitting}
                        className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                      />
                      {errors.coreValue && (
                        <p className="text-sm text-red-500">{errors.coreValue}</p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Key features *
                      </Label>
                      
                      <div className="flex gap-3">
                        <Input
                          placeholder="Enter a feature..."
                          value={formData.currentFeature}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentFeature: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                          disabled={isSubmitting}
                          className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={addFeature}
                          disabled={!formData.currentFeature.trim() || isSubmitting}
                          className="h-12 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {formData.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 flex items-center gap-2"
                            >
                              {feature}
                              <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                disabled={isSubmitting}
                                className="hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pricing Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pricingModel" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          Pricing model
                        </Label>
                        <Select 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, currentPricingModel: value }))}
                          value={formData.currentPricingModel}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg">
                            <SelectValue placeholder="Select pricing model" />
                          </SelectTrigger>
                          <SelectContent>
                            {pricingModelOptions.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div>
                                  <div className="font-medium">{model.name}</div>
                                  <div className="text-xs text-gray-500">{model.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.currentPricingModel && formData.currentPricingModel !== 'free' && (
                        <div className="space-y-2">
                          <Label htmlFor="currentPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current price
                          </Label>
                          <Input
                            id="currentPrice"
                            placeholder="e.g., $29/month, $199 one-time"
                            value={formData.currentPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                            disabled={isSubmitting}
                            className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 border-gray-200 dark:border-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSubmitting || !formData.productName || !formData.coreValue || formData.features.length === 0}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            {editingProduct ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {editingProduct ? 'Update Product' : 'Create Product'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Products ({products.length})
              </h2>
            </div>

            {products.length === 0 && !showCreateForm ? (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-2xl flex items-center justify-center">
                    <Package className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No products yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Create your first product to start building your portfolio
                  </p>
                  <Button
                    onClick={startCreating}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-lg flex items-center justify-center">
                              <Ship className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                {product.productName}
                              </h3>
                              {product.market && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>{getMarketInfo(product.market)?.icon}</span>
                                  <span>{getMarketInfo(product.market)?.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(product)}
                              className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id, product.productName)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {product.coreValue}
                        </p>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Features ({product.features.length})
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {product.features.slice(0, 3).map((feature, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                {feature}
                              </Badge>
                            ))}
                            {product.features.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                +{product.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {product.currentPricingModel && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Pricing
                            </Label>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                {getPricingModelInfo(product.currentPricingModel)?.name}
                              </Badge>
                              {product.currentPrice && (
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.currentPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Updated {new Date(product.updatedAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(product)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-1 h-auto"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TrialProvider>
    </AppLayout>
  )
}
