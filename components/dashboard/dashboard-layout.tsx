import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Calendar, AlertTriangle, TrendingDown, ArrowRight, MessageSquare, TrendingUp, DollarSign, Shield, Target, Activity, Zap, PieChart, TestTube, Users, Clock, Lightbulb, ArrowUp, ArrowDown, Sparkles, Package, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { TrialProvider } from "../trial/trial-provider"
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PricingAnalysis {
  feature_to_value_mapping: {
    insight: string
    highlighted_features: string[]
    value_gap: string
  }
  pricing_model_fit: {
    current_model: string
    recommended_model: string
    rationale: string
  }
  competitor_analysis: {
    matrix: Array<{
      name: string
      price: string
      features: string[]
    }>
    insight: string
  }
  ab_test_scenarios: Array<{
    scenario: string
    expected_impact: string
    assumptions: string[]
  }>
  sage_recommendation: {
    model: string
    segments: string[]
    price_points: string[]
    reasoning_chain: string[]
  }
}

interface ProductInfo {
  id: string
  name: string
  core_value: string
  features: string[]
  current_pricing_model: string
  current_price: string
  market: string
  monthly_revenue: number
  total_users: number
}

interface DashboardLayoutProps {
  organizationName?: string
  organizationId?: string
  userName?: string
  isLoading?: boolean
}

// Time-based greeting function
function getTimeBasedGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : "";
  
  if (hour >= 5 && hour < 12) {
    return `Good Morning${name}`;
  } else if (hour >= 12 && hour < 17) {
    return `Good Afternoon${name}`;
  } else if (hour >= 17 && hour < 22) {
    return `Good Evening${name}`;
  } else {
    return `Good Night${name}`;
  }
}

export function DashboardLayout({ 
  organizationName, 
  organizationId,
  userName,
  isLoading = false,
}: DashboardLayoutProps) {
  const greeting = getTimeBasedGreeting(userName)
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis | null>(null)
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [activeProductId, setActiveProductId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const result = await response.json()
          setProducts(result.products || [])
          setActiveProductId(result.activeProductId)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchPricingAnalysis = async () => {
      try {
        const response = await fetch('/api/dashboard/pricing-analysis')
        if (response.ok) {
          const result = await response.json()
          setPricingAnalysis(result.data)
          setProductInfo(result.productInfo)
        }
      } catch (error) {
        console.error('Failed to fetch pricing analysis:', error)
      } finally {
        setAnalysisLoading(false)
      }
    }

    if (activeProductId) {
      fetchPricingAnalysis()
    } else {
      setAnalysisLoading(false)
    }
  }, [activeProductId])

  const handleProductChange = async (productId: string) => {
    try {
      const response = await fetch('/api/products/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        setActiveProductId(productId)
        setAnalysisLoading(true)
        // Refresh analysis for new product
        const analysisResponse = await fetch('/api/dashboard/pricing-analysis')
        if (analysisResponse.ok) {
          const result = await analysisResponse.json()
          setPricingAnalysis(result.data)
          setProductInfo(result.productInfo)
        }
      }
    } catch (error) {
      console.error('Failed to switch product:', error)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const mockStats = {
    monthlyRevenue: productInfo?.monthly_revenue || 12450,
    totalUsers: productInfo?.total_users || 1247,
    conversionRate: 3.2,
    churnRate: 2.1,
    analysisRuns: 23,
    testsCreated: 8
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TrialProvider>
        <div className="w-full">
          <TrialBannerWrapper />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2">
              {greeting}
            </h1>
            
            {/* Product Selector */}
            {products.length > 0 && (
              <div className="flex items-center gap-4 mt-4">
                <span className="text-lg text-gray-500 dark:text-gray-400">Analyzing:</span>
                <Select value={activeProductId || undefined} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 font-medium">{product.productName}</span>
                          {product.isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link href="/product">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
              </div>
            )}

            {productInfo && (
              <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                Here's how <span className="text-amber-600 font-medium">{productInfo.name}</span> is performing
              </p>
            )}
          </div>

          {/* Show message if no products */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Create Your First Product
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start by defining your product to unlock AI-powered pricing insights and analytics
              </p>
              <Link href="/product-profile">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Product
                </Button>
              </Link>
            </div>
          ) : analysisLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border-gray-100 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pricingAnalysis ? (
            <>
              {/* SAGE AI Recommendation - Hero Section */}
              <div className="mb-12">
                <Card className="bg-gradient-to-br rounded-3xl from-amber-400 via-orange-400 to-orange-500 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent animate-pulse"></div>
                  <CardContent className="pt-12 pb-12 relative">
                    <div className="flex items-start gap-6">
                      <Image 
                        src="/logo.png" 
                        alt="SAGE Logo" 
                        width={100} 
                        height={100}
                        className="w-22 h-22"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            SAGE AI Recommendation
                          </h2>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300">
                            Strategic
                          </Badge>
                        </div>
                        
                        {/* Main Recommendation */}
                        <div className="mb-6">
                          <p className="text-gray-700 dark:text-gray-200 text-lg mb-4 leading-relaxed font-medium">
                            {pricingAnalysis.sage_recommendation.model}
                          </p>
                        </div>

                        {/* Key Details Grid */}
                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                          {/* Recommended Segments */}
                          <div className="bg-white/20 dark:bg-gray-900/20 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Target Segments
                            </h4>
                            <div className="space-y-2">
                              {pricingAnalysis.sage_recommendation.segments.slice(0, 3).map((segment, index) => (
                                <div key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                                  {segment}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price Points */}
                          <div className="bg-white/20 dark:bg-gray-900/20 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Suggested Pricing
                            </h4>
                            <div className="space-y-2">
                              {pricingAnalysis.sage_recommendation.price_points.slice(0, 3).map((price, index) => (
                                <div key={index} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {price}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Key Reasoning */}
                          <div className="bg-white/20 dark:bg-gray-900/20 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Key Reasoning
                            </h4>
                            <div className="space-y-2">
                              {pricingAnalysis.sage_recommendation.reasoning_chain.slice(0, 2).map((reason, index) => (
                                <div key={index} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Link href="/testing">
                              <Button className="bg-black hover:bg-amber-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all">
                                <TestTube className="w-4 h-4 mr-2" />
                                Test Strategy
                              </Button>
                            </Link>
                            <Link href={`/deepresearch?type=pricing_recommendation&product=${encodeURIComponent(productInfo?.name || 'Product')}`}>
                              <Button variant="outline" className="border-white/20 text-gray-700 dark:text-gray-200 hover:bg-neutral-200 rounded-xl">
                                View Full Analysis
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                          
                          <div className="flex items-center gap-2 text-amber-900 bg-white/50 py-2 px-2 rounded-2xl dark:text-amber-300">
                            <Lightbulb className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Confidence: 94%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <Card className="border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Revenue</p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                          ${mockStats.monthlyRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <ArrowUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">+12.5%</span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Users</p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                          {mockStats.totalUsers.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <ArrowUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">+8.2%</span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Conversion Rate</p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                          {mockStats.conversionRate}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <ArrowDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">-0.3%</span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Churn Rate</p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                          {mockStats.churnRate}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <ArrowDown className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">-0.8%</span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/testing" className="group">
                      <Card className="border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                              <TestTube className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Strategy Hub</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Run pricing simulations</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/deepresearch" className="group">
                      <Card className="border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Deep Research</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Market intelligence</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/billing" className="group">
                      <Card className="border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Analytics</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Performance insights</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/triggers" className="group">
                      <Card className="border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Triggers</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Setup automation</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>

                {/* Usage Stats */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Usage This Month</h3>
                  <Card className="border-gray-100 dark:border-gray-800">
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Runs</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{mockStats.analysisRuns}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <TestTube className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tests Created</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{mockStats.testsCreated}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Calls</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">1.2K</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                <Card className="border-gray-100 dark:border-gray-800">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">SAGE analyzed your pricing strategy</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <TestTube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">A/B test scenario created</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Yesterday</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Revenue increased by 12.5%</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Complete Your Setup
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Finish your product profile to unlock AI-powered pricing insights and analytics
              </p>
              <Link href="/product-profile">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              </Link>
            </div>
          )}
        </div>
      </TrialProvider>
    </div>
  )
}