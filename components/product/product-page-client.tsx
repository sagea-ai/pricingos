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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
          <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-2 border-amber-200 dark:border-amber-800"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-amber-500 absolute top-0 left-0"></div>
                </div>
                <h3 className="text-xl font-light text-gray-900 dark:text-white mb-2">Loading your products</h3>
                <p className="text-gray-500 dark:text-gray-400 font-light">Please wait a moment...</p>
              </div>
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
        
        {/* Hero Background */}
        <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-12">
            
            {/* Header Section */}
            <motion.div 
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/50">
                  <Package className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-5xl font-ultralight text-gray-900 dark:text-white tracking-tight mb-4">
                  Product <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent font-light">Builder</span>
                </h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                  Design, iterate, and perfect your product portfolio with elegant simplicity
                </p>
              </div>

              {/* Quick Stats */}
              <Card variant="elevated" className="border-amber-100 dark:border-amber-900/30 bg-gradient-to-br rounded-3xl from-amber-400 via-orange-400 to-orange-500 mb-8">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">{products.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-light">Products</div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">{products.filter(p => p.currentPricingModel && p.currentPricingModel !== 'free').length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-light">Monetized</div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">{new Set(products.map(p => p.market).filter(Boolean)).size}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-light">Markets</div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-light text-gray-900 dark:text-white mb-1">{products.reduce((acc, p) => acc + p.features.length, 0)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-light">Features</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Bar */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={startCreating}
                  disabled={showCreateForm}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <span className="font-medium">Create Product</span>
                </Button>
              </div>
            </motion.div>

            {/* Create/Edit Form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="mb-16"
                >
                  <Card variant="elevated" className="border-amber-200/50 dark:border-amber-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-amber-100/50 dark:shadow-amber-900/20">
                    <CardHeader className="pb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-t-2xl border-b border-amber-100 dark:border-amber-800/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                            {editingProduct ? <Edit3 className="h-7 w-7 text-white" /> : <Rocket className="h-7 w-7 text-white" />}
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-light text-gray-900 dark:text-white">
                              {editingProduct ? 'Refine Your Product' : 'Craft New Product'}
                            </CardTitle>
                            <p className="text-gray-500 dark:text-gray-400 font-light mt-1">
                              {editingProduct ? 'Perfect every detail of your existing product' : 'Bring your vision to life with thoughtful design'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={cancelForm}
                          disabled={isSubmitting}
                          className="h-10 w-10 p-0 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50"
                        >
                          <X className="h-5 w-5 text-gray-400" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 space-y-8">
                      {/* Identity Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="productName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Product Name *
                            </Label>
                            <Input
                              id="productName"
                              placeholder="Enter a memorable name..."
                              value={formData.productName}
                              onChange={(e) => handleInputChange('productName', e.target.value)}
                              disabled={isSubmitting}
                              className="h-14 text-lg border-gray-200 dark:border-gray-700 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-200"
                            />
                            {errors.productName && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-500 flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                {errors.productName}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="market" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Target Market
                            </Label>
                            <Select 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, market: value }))}
                              value={formData.market}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="h-14 border-gray-200 dark:border-gray-700 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <SelectValue placeholder="Choose your market..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                                {marketOptions.map((market) => (
                                  <SelectItem key={market.id} value={market.id} className="rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{market.icon}</span>
                                      <span className="font-medium">{market.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="coreValue" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Core Value Proposition *
                          </Label>
                          <Textarea
                            id="coreValue"
                            placeholder="Describe the transformative value your product delivers..."
                            value={formData.coreValue}
                            onChange={(e) => handleInputChange('coreValue', e.target.value)}
                            disabled={isSubmitting}
                            rows={4}
                            className="border-gray-200 dark:border-gray-700 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none transition-all duration-200"
                          />
                          {errors.coreValue && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-500 flex items-center gap-2"
                            >
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              {errors.coreValue}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      {/* Features Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Key Features *</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <Input
                              placeholder="Add a compelling feature..."
                              value={formData.currentFeature}
                              onChange={(e) => setFormData(prev => ({ ...prev, currentFeature: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                              disabled={isSubmitting}
                              className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                            />
                            <Button
                              type="button"
                              onClick={addFeature}
                              disabled={!formData.currentFeature.trim() || isSubmitting}
                              className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {formData.features.length > 0 && (
                            <motion.div 
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {formData.features.map((feature, index) => (
                                <motion.div
                                  key={index}
                                  variants={itemVariants}
                                  className="group"
                                >
                                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200">
                                    <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">{feature}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeFeature(index)}
                                      disabled={isSubmitting}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-400 hover:text-red-500 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pricing Strategy</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="pricingModel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Pricing Model
                            </Label>
                            <Select 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, currentPricingModel: value }))}
                              value={formData.currentPricingModel}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="h-14 border-gray-200 dark:border-gray-700 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <SelectValue placeholder="Select pricing approach..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                                {pricingModelOptions.map((model) => (
                                  <SelectItem key={model.id} value={model.id} className="rounded-lg">
                                    <div className="py-2">
                                      <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{model.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <AnimatePresence>
                            {formData.currentPricingModel && formData.currentPricingModel !== 'free' && (
                              <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3"
                              >
                                <Label htmlFor="currentPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Current Price
                                </Label>
                                <Input
                                  id="currentPrice"
                                  placeholder="e.g., $29/month, $199 one-time, Custom"
                                  value={formData.currentPrice}
                                  onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                                  disabled={isSubmitting}
                                  className="h-14 border-gray-200 dark:border-gray-700 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelForm}
                          disabled={isSubmitting}
                          className="px-8 py-3 h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isSubmitting || !formData.productName || !formData.coreValue || formData.features.length === 0}
                          className="px-8 py-3 h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              {editingProduct ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
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

            {/* Products Section */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {products.length === 0 && !showCreateForm ? (
                <Card variant="elevated" className="border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                  <CardContent className="py-20 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-3xl flex items-center justify-center shadow-xl">
                        <Package className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
                        Your canvas awaits
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 font-light mb-8 leading-relaxed">
                        Begin your journey by creating your first product. Each creation is a step towards building something extraordinary.
                      </p>
                      <Button
                        onClick={startCreating}
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900/50 transition-all duration-300 hover:shadow-xl hover:scale-105"
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Create First Product
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                        Your Products
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 font-light mt-1">
                        {products.length} {products.length === 1 ? 'product' : 'products'} in your portfolio
                      </p>
                    </div>
                  </div>

                  <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <Card variant="elevated" className="border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-2xl hover:shadow-amber-100/20 dark:hover:shadow-amber-900/10 transition-all duration-500 hover:scale-[1.02] overflow-hidden">
                          <CardHeader className="pb-4 relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(product)}
                                  className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-amber-50 hover:text-amber-600 border border-gray-200 dark:border-gray-700"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(product.id, product.productName)}
                                  className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-red-50 hover:text-red-600 border border-gray-200 dark:border-gray-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Ship className="h-7 w-7 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-white text-lg mb-2 truncate">
                                  {product.productName}
                                </h3>
                                {product.market && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">
                                      <span className="mr-2">{getMarketInfo(product.market)?.icon}</span>
                                      {getMarketInfo(product.market)?.name}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-6">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light line-clamp-3">
                              {product.coreValue}
                            </p>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Features ({product.features.length})
                                </Label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {product.features.slice(0, 4).map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30 rounded-lg font-medium"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                                {product.features.length > 4 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg"
                                  >
                                    +{product.features.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {product.currentPricingModel && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-emerald-500" />
                                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Pricing
                                  </Label>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30 rounded-lg px-3 py-1">
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

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
                                  {new Date(product.updatedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(product)}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2 h-auto rounded-xl transition-all duration-200"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </TrialProvider>
    </AppLayout>
  )
}