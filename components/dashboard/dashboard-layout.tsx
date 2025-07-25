import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Calendar, AlertTriangle, TrendingDown, ArrowRight, MessageSquare, TrendingUp, DollarSign, Shield, Target, Activity, Zap, PieChart, Sparkles, TestTube } from "lucide-react"
import Link from "next/link"
import { TrialProvider } from "../trial/trial-provider"
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"
import { useState, useEffect } from "react"

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

    fetchPricingAnalysis()
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <TrialProvider>
        <div className="w-full">
          <TrialBannerWrapper />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
              {greeting}
            </h1>
            {productInfo && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-light">
                Strategic insights for <span className="font-medium text-gray-900 dark:text-white">{productInfo.name}</span>
              </p>
            )}
          </div>

          {analysisLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pricingAnalysis ? (
            <>
              {/* SAGE Recommendation - Hero Section */}
              <div className="mb-8">
                <Card className="bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 dark:from-amber-900/30 dark:via-amber-900/20 dark:to-orange-900/20 rounded-3xl shadow-lg border-2 border-amber-200 dark:border-amber-800/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-medium text-gray-900 dark:text-white flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-200 dark:bg-amber-900/60 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          SAGE AI Recommendation
                          <Badge className="bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700 text-sm font-medium">
                            Strategic
                          </Badge>
                        </div>
                        <p className="text-sm font-normal text-amber-700 dark:text-amber-300 mt-1">
                          AI-powered pricing strategy tailored for your product
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {pricingAnalysis.sage_recommendation.model}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {pricingAnalysis.sage_recommendation.segments.map((segment, index) => (
                            <div key={index} className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber-100 dark:border-amber-800 shadow-sm">
                              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">{segment}</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {pricingAnalysis.sage_recommendation.price_points[index]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
                        <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-4">
                          AI Reasoning
                        </h5>
                        <div className="space-y-3">
                          {pricingAnalysis.sage_recommendation.reasoning_chain.slice(0, 3).map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Business Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-medium mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Strategic Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/testing" className="group">
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 hover:shadow-md transition-all hover:scale-[1.02]">
                        <div>
                          <h3 className="font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-2">
                            <TestTube className="w-4 h-4" /> Strategy Hub
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-300">AI pricing simulations</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>

                    <Link href="/competitors" className="group">
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-100 dark:border-orange-800 hover:shadow-md transition-all hover:scale-[1.02]">
                        <div>
                          <h3 className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4" /> Competitor Intel
                          </h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">Market positioning</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Business Health */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-medium mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Business Metrics
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Revenue</p>
                      <p className="text-2xl font-light text-gray-900 dark:text-white">
                        ${productInfo?.monthly_revenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
                      <p className="text-2xl font-light text-gray-900 dark:text-white">
                        {productInfo?.total_users?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {productInfo?.current_price || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature-to-Value Mapping & Pricing Model Fit */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      Feature-to-Value Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {pricingAnalysis.feature_to_value_mapping.insight}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                        High-Value Features
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pricingAnalysis.feature_to_value_mapping.highlighted_features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Value Gap: {pricingAnalysis.feature_to_value_mapping.value_gap}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Model Fit */}
                <Card className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      Pricing Model Fit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2">
                          Current
                        </p>
                        <Badge variant="outline" className="text-sm">
                          {pricingAnalysis.pricing_model_fit.current_model}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2">
                          Recommended
                        </p>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-sm">
                          {pricingAnalysis.pricing_model_fit.recommended_model}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {pricingAnalysis.pricing_model_fit.rationale}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Competitor Analysis */}
              <div className="mb-8">
                <Card className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      Competitor Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {pricingAnalysis.competitor_analysis.insight}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium py-3">Product</th>
                            <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium py-3">Price</th>
                            <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium py-3">Features</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {pricingAnalysis.competitor_analysis.matrix.map((competitor, index) => (
                            <tr key={index} className={competitor.name === productInfo?.name ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {competitor.name}
                                  </span>
                                  {competitor.name === productInfo?.name && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">You</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4">
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {competitor.price}
                                </span>
                              </td>
                              <td className="py-4">
                                <div className="flex flex-wrap gap-1">
                                  {competitor.features.slice(0, 3).map((feature, featureIndex) => (
                                    <Badge key={featureIndex} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {competitor.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{competitor.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* A/B Test Scenarios */}
              <div className="mb-8">
                <Card className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <TestTube className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      A/B Testing Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pricingAnalysis.ab_test_scenarios.map((scenario, index) => (
                        <div key={index} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                            {scenario.scenario}
                          </h4>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-3">
                            {scenario.expected_impact}
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                              Key Assumptions
                            </p>
                            {scenario.assumptions.slice(0, 2).map((assumption, assumptionIndex) => (
                              <p key={assumptionIndex} className="text-xs text-gray-600 dark:text-gray-400">
                                • {assumption}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Product Profile Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your product profile to unlock pricing insights
              </p>
              <Link href="/product-profile">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  Complete Product Profile
                </Button>
              </Link>
            </div>
          )}
        </div>
      </TrialProvider>
    </div>
  )
}