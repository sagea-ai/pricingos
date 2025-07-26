'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Ship, 
  Plus, 
  X, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Target,
  Zap,
  Blocks
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { BasicMetricsStep } from '@/components/onboarding/basic-metrics-step'

// Market options for the product
const marketOptions = [
  { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-blue-100 text-blue-700' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'bg-green-100 text-green-700' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: 'bg-red-100 text-red-700' },
  { id: 'education', name: 'Education', icon: '📚', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'retail', name: 'Retail/E-commerce', icon: '🛍️', color: 'bg-purple-100 text-purple-700' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', color: 'bg-gray-100 text-gray-700' },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', color: 'bg-orange-100 text-orange-700' },
  { id: 'marketing', name: 'Marketing', icon: '📈', color: 'bg-pink-100 text-pink-700' },
  { id: 'consulting', name: 'Consulting', icon: '💼', color: 'bg-teal-100 text-teal-700' },
  { id: 'media', name: 'Media/Entertainment', icon: '🎬', color: 'bg-violet-100 text-violet-700' },
  { id: 'other', name: 'Other', icon: '🌐', color: 'bg-slate-100 text-slate-700' },
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

function ProductProfileContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    productName: '',
    coreValue: '',
    features: [] as string[],
    market: '',
    currentPricingModel: '',
    currentPrice: '',
    currentFeature: '',
    // Add metrics data
    monthlyRevenue: undefined as number | undefined,
    totalUsers: undefined as number | undefined,
    averagePrice: undefined as number | undefined,
    businessStage: '',
    isEstimate: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps = [
    'Product Name',
    'Core Value', 
    'Special Abilities',
    'Market',
    'Current Pricing',
    'Business Metrics' // Add new step
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push('/sign-in')
      return
    }
  }, [isLoaded, user, router])

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



  const nextStep = () => {
    let canProceed = true
    
    if (currentStep === 0) {
      canProceed = validateField('productName', formData.productName)
    } else if (currentStep === 1) {
      canProceed = validateField('coreValue', formData.coreValue)
    }
    
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    const isProductNameValid = validateField('productName', formData.productName)
    const isCoreValueValid = validateField('coreValue', formData.coreValue)
    
    if (!isProductNameValid || !isCoreValueValid) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.features.length === 0) {
      toast.error('Please add at least one special ability')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = {
        productName: formData.productName,
        coreValue: formData.coreValue,
        features: formData.features,
        market: formData.market,
        currentPricingModel: formData.currentPricingModel,
        currentPrice: formData.currentPrice,
        // Add metrics
        monthlyRevenue: formData.monthlyRevenue,
        totalUsers: formData.totalUsers,
        averagePrice: formData.averagePrice,
        businessStage: formData.businessStage,
        isEstimate: formData.isEstimate
      }

      console.log('Completing product profile with data:', payload)
      
      const response = await fetch('/api/product-profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Vessel defined successfully!')
        router.push('/dashboard') // Go to dashboard after product profile is complete
      } else {
        console.error('Product profile setup failed:', result)
        setError(result.error || result.details || 'Failed to save product profile')
      }
    } catch (error) {
      console.error('Failed to complete product profile:', error)
      setError('Failed to save product profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: return formData.productName.trim().length >= 2
      case 1: return formData.coreValue.trim().length >= 10
      case 2: return formData.features.length > 0
      case 3: return true // Market selection is optional
      case 4: return true // Current pricing is optional
      case 5: return true // Metrics step is handled in the component
      default: return false
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-2xl flex items-center justify-center">
                <Ship className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h1 className="text-3xl font-extralight text-gray-900 dark:text-white mb-3 tracking-tight">
              Define Your Vessel
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed mb-6">
              The interface looks like a digital blueprint or spec sheet being filled out.
            </p>
            <div className="max-w-md mx-auto mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {steps.map((step, index) => (
                  <span key={step} className={index <= currentStep ? 'text-amber-600 font-medium' : ''}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Main Form Card */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Product Name */}
                {currentStep === 0 && (
                  <motion.div
                    key="product-name"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                        <Ship className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 italic mb-4">
                        "First, let's get to know your amazing product. Think of this as the blueprint for our vessel."
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="productName" className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                          What is your product's name?
                        </Label>
                        <Input
                          id="productName"
                          placeholder="Enter your product name..."
                          value={formData.productName}
                          onChange={(e) => handleInputChange('productName', e.target.value)}
                          autoFocus
                          disabled={isSubmitting}
                          className="h-14 text-lg border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                        />
                        {errors.productName && (
                          <p className="text-sm text-red-500 mt-2">{errors.productName}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Core Value */}
                {currentStep === 1 && (
                  <motion.div
                    key="core-value"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                        <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="coreValue" className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                          The North Star (Core Value)
                        </Label>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          In one simple sentence, what incredible problem does your product solve for your customers?
                        </p>
                        <Input
                          id="coreValue"
                          placeholder="e.g., It helps freelance writers invoice clients in 30 seconds."
                          value={formData.coreValue}
                          onChange={(e) => handleInputChange('coreValue', e.target.value)}
                          autoFocus
                          disabled={isSubmitting}
                          className="h-14 text-lg border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                        />
                        {errors.coreValue && (
                          <p className="text-sm text-red-500 mt-2">{errors.coreValue}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Features */}
                {currentStep === 2 && (
                  <motion.div
                    key="features"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                        <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                          Special Abilities (Features)
                        </Label>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Now for the fun part! What are the top 3-5 'special abilities' or features of your product? Just list them below.
                        </p>
                        
                        <div className="flex gap-3 mb-4">
                          <Input
                            placeholder="Enter a special ability..."
                            value={formData.currentFeature}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentFeature: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                            disabled={isSubmitting}
                            className="h-12 border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                          />
                          <Button
                            type="button"
                            onClick={addFeature}
                            disabled={!formData.currentFeature.trim() || isSubmitting}
                            className="h-12 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {formData.features.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Special Abilities ({formData.features.length})
                            </Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {formData.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{feature}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFeature(index)}
                                    disabled={isSubmitting}
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Market */}
                {currentStep === 3 && (
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                        <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                          What market does your product operate in?
                        </Label>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Select the industry or market that best describes where your product is used.
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {marketOptions.map((market) => (
                            <button
                              key={market.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, market: market.id }))}
                              disabled={isSubmitting}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                formData.market === market.id
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="text-2xl mb-2">{market.icon}</div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                                {market.name}
                              </span>
                              {formData.market === market.id && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Current Pricing */}
                {currentStep === 4 && (
                  <motion.div
                    key="current-pricing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                          How do you currently price your product?
                        </Label>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Select your current pricing model (optional).
                        </p>
                        
                        <div className="grid gap-3">
                          {pricingModelOptions.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, currentPricingModel: model.id }))}
                              disabled={isSubmitting}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                formData.currentPricingModel === model.id
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                                    {model.name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {model.description}
                                  </span>
                                </div>
                                {formData.currentPricingModel === model.id && (
                                  <CheckCircle className="h-5 w-5 text-amber-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.currentPricingModel && formData.currentPricingModel !== 'free' && (
                        <div>
                          <Label htmlFor="currentPrice" className="text-lg font-medium text-gray-900 dark:text-white mb-3 block">
                            What's your current price? (optional)
                          </Label>
                          <Input
                            id="currentPrice"
                            placeholder="e.g., $29/month, $199 one-time, $0.10 per API call"
                            value={formData.currentPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                            disabled={isSubmitting}
                            className="h-12 text-lg border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Business Metrics */}
                {currentStep === 5 && (
                  <motion.div
                    key="business-metrics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BasicMetricsStep
                      onComplete={(data) => {
                        setFormData(prev => ({ ...prev, ...data }))
                        setCurrentStep(currentStep + 1)
                      }}
                      onSkip={() => setCurrentStep(currentStep + 1)}
                      isSubmitting={isSubmitting}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isSubmitting}
                  className="px-6 py-3 border-gray-200 dark:border-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep) || isSubmitting}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!isStepValid(currentStep) || isSubmitting}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Defining Vessel...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Complete Blueprint
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
              Define your vessel to set sail on your pricing journey
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductProfileFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading product profile...</p>
      </div>
    </div>
  )
}

export default function ProductProfilePage() {
  return (
    <Suspense fallback={<ProductProfileFallback />}>
      <ProductProfileContent />
    </Suspense>
  )
}
