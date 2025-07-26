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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </TrialProvider>
      </AppLayout>
    )
  }

  return (
    <AppLayout organizations={organizations} currentOrganization={currentOrganization} onOrganizationChange={handleOrganizationChange}>
      <TrialProvider>
        <TrialBannerWrapper />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600">Manage your products and their pricing strategies</p>
              </div>
            </div>
            <Button onClick={startCreating} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Product Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{editingProduct ? 'Edit Product' : 'Create New Product'}</span>
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div>
                          <Label htmlFor="productName">Product Name *</Label>
                          <Input
                            id="productName"
                            value={formData.productName}
                            onChange={(e) => handleInputChange('productName', e.target.value)}
                            placeholder="Enter product name"
                            className={errors.productName ? 'border-red-500' : ''}
                          />
                          {errors.productName && (
                            <p className="text-sm text-red-500 mt-1">{errors.productName}</p>
                          )}
                        </div>

                        {/* Market */}
                        <div>
                          <Label htmlFor="market">Target Market</Label>
                          <Select value={formData.market} onValueChange={(value) => handleInputChange('market', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target market" />
                            </SelectTrigger>
                            <SelectContent>
                              {marketOptions.map((market) => (
                                <SelectItem key={market.id} value={market.id}>
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
                        <Label htmlFor="coreValue">Core Value Proposition *</Label>
                        <Textarea
                          id="coreValue"
                          value={formData.coreValue}
                          onChange={(e) => handleInputChange('coreValue', e.target.value)}
                          placeholder="Describe the core value your product provides to customers"
                          rows={3}
                          className={errors.coreValue ? 'border-red-500' : ''}
                        />
                        {errors.coreValue && (
                          <p className="text-sm text-red-500 mt-1">{errors.coreValue}</p>
                        )}
                      </div>

                      {/* Features */}
                      <div>
                        <Label>Features *</Label>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              value={formData.currentFeature}
                              onChange={(e) => setFormData(prev => ({ ...prev, currentFeature: e.target.value }))}
                              placeholder="Add a feature"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            />
                            <Button type="button" onClick={addFeature} variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {formData.features.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.features.map((feature, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                                  <span>{feature}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="ml-1 hover:text-red-500"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Pricing Model */}
                        <div>
                          <Label htmlFor="currentPricingModel">Current Pricing Model</Label>
                          <Select value={formData.currentPricingModel} onValueChange={(value) => handleInputChange('currentPricingModel', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pricing model" />
                            </SelectTrigger>
                            <SelectContent>
                              {pricingModelOptions.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div>
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-sm text-gray-500">{model.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Business Stage */}
                        <div>
                          <Label htmlFor="businessStage">Business Stage</Label>
                          <Select value={formData.businessStage} onValueChange={(value) => handleInputChange('businessStage', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessStageOptions.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  <div>
                                    <div className="font-medium">{stage.name}</div>
                                    <div className="text-sm text-gray-500">{stage.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Current Price */}
                        <div>
                          <Label htmlFor="currentPrice">Current Price</Label>
                          <Input
                            id="currentPrice"
                            value={formData.currentPrice}
                            onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                            placeholder="e.g., $29/month, $299, Free"
                          />
                        </div>

                        {/* Monthly Revenue */}
                        <div>
                          <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
                          <Input
                            id="monthlyRevenue"
                            type="number"
                            value={formData.monthlyRevenue}
                            onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        {/* Total Users */}
                        <div>
                          <Label htmlFor="totalUsers">Total Users</Label>
                          <Input
                            id="totalUsers"
                            type="number"
                            value={formData.totalUsers}
                            onChange={(e) => handleInputChange('totalUsers', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex space-x-3">
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {editingProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEditing}>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create your first product to start optimizing your pricing strategy
                </p>
                <Button onClick={startCreating} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Product
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
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.productName}</CardTitle>
                          {product.market && (
                            <Badge variant="outline" className="mt-2">
                              {marketOptions.find(m => m.id === product.market)?.icon} {marketOptions.find(m => m.id === product.market)?.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => startEditing(product)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-3">{product.coreValue}</p>
                      
                      {product.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Features</h4>
                          <div className="flex flex-wrap gap-1">
                            {product.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {product.features.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{product.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {product.currentPrice && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                            <span>{product.currentPrice}</span>
                          </div>
                        )}
                        {product.totalUsers && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-blue-600 mr-1" />
                            <span>{product.totalUsers.toLocaleString()}</span>
                          </div>
                        )}
                        {product.monthlyRevenue && (
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                            <span>${product.monthlyRevenue.toLocaleString()}/mo</span>
                          </div>
                        )}
                        {product.businessStage && (
                          <div className="flex items-center">
                            <Rocket className="h-4 w-4 text-orange-600 mr-1" />
                            <span className="capitalize">{businessStageOptions.find(s => s.id === product.businessStage)?.name}</span>
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