'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaStripe } from "react-icons/fa";
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  Activity,
  Upload,
  AlertTriangle,
  TrendingDown as TrendingDownIcon,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Clock,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// CSV Data Structure Types
interface TransactionData {
  date: string;
  amount: number;
  type: 'revenue' | 'expense';
  description: string;
  category?: string;
  gateway?: 'stripe' | 'khalti';
}

interface CashRunwayData {
  currentCash: number;
  monthlyBurnRate: number;
  monthlyRevenue: number;
  dailyBurnRate?: number;
  dailyRevenue?: number;
  netDailyBurn?: number;
  runwayMonths: number;
  runwayDays?: number;
  projectedCashDepletion: string;
}

interface StoredFinancialMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  oneTimePayments: number;
  averageRevenuePerUser: number;
  activeSubscriptions: number;
  revenueGrowthRate: number;
  mrrGrowthRate: number;
  subscriptionGrowthRate: number;
  totalExpenses: number;
  monthlyExpenses: number;
  currentCash: number;
  monthlyBurnRate: number;
  dailyBurnRate: number;
  dailyRevenue: number;
  netDailyBurn: number;
  runwayMonths: number;
  runwayDays: number;
  projectedCashDepletion: string | null;
  calculatedAt: string;
  transactionCount: number;
}

interface ProductProfile {
  productName: string;
  currentPricingModel: string | null;
  currentPrice: string | null;
  market: string | null;
}

interface FinancesContentProps {
  organizationName: string;
  organizationId: string;
  productProfile: ProductProfile | null;
}

export function FinancesContent({ organizationName, organizationId, productProfile }: FinancesContentProps) {
  const [stripeIntegration, setStripeIntegration] = useState({
    isConnected: false,
    accountId: null as string | null,
    lastSync: null as string | null
  })
  const [khaltiIntegration, setKhaltiIntegration] = useState({
    isConnected: false,
    accountId: null as string | null,
    lastSync: null as string | null
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [storedMetrics, setStoredMetrics] = useState<StoredFinancialMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'stripe' | 'khalti' | 'expenses'>('stripe')
  const [uploadedData, setUploadedData] = useState<TransactionData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  // Mock data for charts and UI
  const mockFinancialData = {
    revenueChart: [
      { month: 'Jan 2024', revenue: 8500, stripe: 5800, khalti: 2700 },
      { month: 'Feb 2024', revenue: 9200, stripe: 6300, khalti: 2900 },
      { month: 'Mar 2024', revenue: 10800, stripe: 7200, khalti: 3600 },
      { month: 'Apr 2024', revenue: 12500, stripe: 8500, khalti: 4000 },
      { month: 'May 2024', revenue: 11900, stripe: 8100, khalti: 3800 },
      { month: 'Jun 2024', revenue: 13200, stripe: 8900, khalti: 4300 }
    ],
    cashRunway: {
      recommendations: [
        { action: 'Reduce burn rate', impact: '+2 months runway' },
        { action: 'Increase pricing', impact: '+15% revenue' },
        { action: 'Cut non-essential costs', impact: 'Save $2K/month' }
      ]
    }
  }

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStripeConnect = async () => {
    setIsConnecting(true)
    try {
      // Stripe connection logic would go here
      setTimeout(() => {
        setStripeIntegration({
          isConnected: true,
          accountId: 'acct_stripe_demo',
          lastSync: new Date().toISOString()
        })
        setIsConnecting(false)
      }, 2000)
    } catch (error) {
      console.error('Stripe connection failed:', error)
      setIsConnecting(false)
    }
  }

  const handleKhaltiConnect = async () => {
    setIsConnecting(true)
    try {
      // Khalti connection logic would go here
      setTimeout(() => {
        setKhaltiIntegration({
          isConnected: true,
          accountId: 'khalti_demo_account',
          lastSync: new Date().toISOString()
        })
        setIsConnecting(false)
      }, 2000)
    } catch (error) {
      console.error('Khalti connection failed:', error)
      setIsConnecting(false)
    }
  }

  // Fetch stored financial metrics on component mount
  useEffect(() => {
    fetchFinancialMetrics()
  }, [])

  const fetchFinancialMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/finances/metrics')
      const data = await response.json()
      
      if (data.metrics) {
        setStoredMetrics(data.metrics)
        
        // Update integration status
        if (data.integrations) {
          data.integrations.forEach((integration: any) => {
            if (integration.gateway === 'STRIPE') {
              setStripeIntegration({
                isConnected: integration.isConnected,
                accountId: integration.accountId,
                lastSync: integration.lastSync
              })
            } else if (integration.gateway === 'KHALTI') {
              setKhaltiIntegration({
                isConnected: integration.isConnected,
                accountId: integration.accountId,
                lastSync: integration.lastSync
              })
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch financial metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCSVUpload = async (file: File, type: 'stripe' | 'khalti' | 'expenses') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/finances/upload-csv', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh metrics after successful upload
        await fetchFinancialMetrics()
        setShowUploadModal(false)
        alert(`Successfully calculated financial metrics from ${result.message}`)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Failed to upload CSV:', error)
      alert(`Failed to upload CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Use stored metrics if available, otherwise show setup screen
  const hasData = storedMetrics !== null
  const financialMetrics = storedMetrics ? {
    totalRevenue: storedMetrics.totalRevenue,
    monthlyRevenue: storedMetrics.monthlyRecurringRevenue + storedMetrics.oneTimePayments,
    monthlyRecurring: storedMetrics.monthlyRecurringRevenue,
    oneTimePayments: storedMetrics.oneTimePayments,
    activeSubscriptions: storedMetrics.activeSubscriptions,
    averageRevenuePerUser: storedMetrics.averageRevenuePerUser,
    revenueGrowthRate: storedMetrics.revenueGrowthRate,
    mrrGrowthRate: storedMetrics.mrrGrowthRate,
    subscriptionGrowthRate: storedMetrics.subscriptionGrowthRate,
    totalExpenses: storedMetrics.totalExpenses,
    monthlyExpenses: storedMetrics.monthlyExpenses,
    netProfit: (storedMetrics.monthlyRecurringRevenue + storedMetrics.oneTimePayments) - storedMetrics.monthlyExpenses
  } : {
    totalRevenue: 0,
    monthlyRevenue: 0,
    monthlyRecurring: 0,
    oneTimePayments: 0,
    activeSubscriptions: 0,
    averageRevenuePerUser: 0,
    revenueGrowthRate: 0,
    mrrGrowthRate: 0,
    subscriptionGrowthRate: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
    netProfit: 0
  }

  const cashRunwayData: CashRunwayData = storedMetrics ? {
    currentCash: storedMetrics.currentCash,
    monthlyBurnRate: storedMetrics.monthlyBurnRate,
    monthlyRevenue: storedMetrics.monthlyRecurringRevenue + storedMetrics.oneTimePayments,
    dailyBurnRate: storedMetrics.dailyBurnRate,
    dailyRevenue: storedMetrics.dailyRevenue,
    netDailyBurn: storedMetrics.netDailyBurn,
    runwayMonths: storedMetrics.runwayMonths,
    runwayDays: storedMetrics.runwayDays,
    projectedCashDepletion: storedMetrics.projectedCashDepletion || new Date().toISOString().split('T')[0]
  } : {
    currentCash: 0,
    monthlyBurnRate: 0,
    monthlyRevenue: 0,
    runwayMonths: 0,
    projectedCashDepletion: new Date().toISOString().split('T')[0]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
              Financial Overview
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl">
              {productProfile?.productName 
                ? `Monitor ${productProfile.productName}'s revenue performance and financial health with real-time insights.`
                : 'Monitor your product\'s revenue performance and financial health with real-time insights.'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="h-11 px-6 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 font-medium dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
        </div>

        {/* Critical Alert - Redesigned */}
        {hasData && 
         (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 || cashRunwayData.runwayMonths < 1) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className={`relative overflow-hidden rounded-2xl ${
              (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' 
                : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
            } dark:from-red-950/20 dark:to-orange-950/20 dark:border-red-800/30`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                      ? 'bg-red-100 dark:bg-red-900/40' 
                      : 'bg-amber-100 dark:bg-amber-900/40'
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${
                      (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Cash Runway Alert
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 ? (
                        <>Your current runway is <span className="font-semibold text-red-600">{cashRunwayData.runwayDays} days</span>. Immediate action recommended.</>
                      ) : (
                        <>Your runway is <span className="font-semibold">{Math.floor(cashRunwayData.runwayMonths)} months</span>. Consider optimization strategies.</>
                      )}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {mockFinancialData.cashRunway.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/40 dark:border-gray-700/40 backdrop-blur-sm">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {rec.action}
                          </div>
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                            {rec.impact}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-500" />
                        <span>Cash: {formatCurrency(cashRunwayData.currentCash)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                        <span>Burn: {formatCurrency(cashRunwayData.monthlyBurnRate)}/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Revenue: {formatCurrency(cashRunwayData.monthlyRevenue)}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Data Summary */}
        {uploadedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Data Overview
                </CardTitle>
                <CardDescription className="text-base">
                  {uploadedData.length} transactions imported from your financial data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenue Records', value: uploadedData.filter(d => d.type === 'revenue').length, color: 'green' },
                    { label: 'Expense Records', value: uploadedData.filter(d => d.type === 'expense').length, color: 'red' },
                    { label: 'Stripe Transactions', value: uploadedData.filter(d => d.gateway === 'stripe').length, color: 'blue' },
                    { label: 'Khalti Transactions', value: uploadedData.filter(d => d.gateway === 'khalti').length, color: 'purple' }
                  ].map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{item.label}</div>
                      <div className={`text-2xl font-bold ${
                        item.color === 'green' ? 'text-green-600' :
                        item.color === 'red' ? 'text-red-600' :
                        item.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!hasData ? (
          /* Setup Section - Redesigned */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center py-16">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                
                <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
                  Connect Your Financial Data
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 font-light">
                  Integrate with payment providers or upload CSV files to unlock comprehensive financial insights and cash runway analysis.
                </p>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                    { icon: Clock, title: 'Cash Runway', desc: 'Real-time burn rate monitoring' },
                    { icon: TrendingUp, title: 'Revenue Analytics', desc: 'MRR and growth tracking' },
                    { icon: Activity, title: 'Multi-Gateway', desc: 'Unified payment insights' }
                  ].map((feature, index) => (
                    <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <feature.icon className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
                
                {/* Connection Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  {[
                    { name: 'Stripe', icon: FaStripe, color: 'blue', action: handleStripeConnect },
                    { name: 'Khalti', icon: Wallet, color: 'purple', action: handleKhaltiConnect },
                    { name: 'Upload CSV', icon: Upload, color: 'amber', action: () => setShowUploadModal(true) }
                  ].map((option, index) => (
                    <div key={index} className="group">
                      <Button
                        onClick={option.action}
                        disabled={isConnecting}
                        className={`w-full h-28 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/20 text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition-all duration-200 rounded-xl group-hover:scale-[1.02]`}
                      >
                        <option.icon className={option.name === 'Stripe' ? "h-10 w-10" : "h-6 w-6"} />
                        <span className="font-medium">{isConnecting ? 'Connecting...' : option.name}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Dashboard Section - Redesigned */
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  title: 'Total Revenue',
                  value: formatCurrency(financialMetrics.totalRevenue),
                  change: financialMetrics.revenueGrowthRate,
                  icon: DollarSign,
                  color: 'amber'
                },
                {
                  title: 'Monthly Recurring',
                  value: formatCurrency(financialMetrics.monthlyRecurring),
                  change: financialMetrics.mrrGrowthRate,
                  icon: TrendingUp,
                  color: 'green'
                },
                {
                  title: 'Active Subscriptions',
                  value: financialMetrics.activeSubscriptions.toString(),
                  change: financialMetrics.subscriptionGrowthRate,
                  icon: Users,
                  color: 'blue'
                },
                {
                  title: 'Revenue per User',
                  value: formatCurrency(financialMetrics.averageRevenuePerUser),
                  change: 0,
                  icon: Target,
                  color: 'purple'
                },
                {
                  title: 'Cash Runway',
                  value: cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 
                    ? `${cashRunwayData.runwayDays} days` 
                    : `${Math.floor(cashRunwayData.runwayMonths)} months`,
                  change: null,
                  icon: Calendar,
                  color: cashRunwayData.runwayMonths < 1 ? 'red' : cashRunwayData.runwayMonths < 6 ? 'yellow' : 'green',
                  isRunway: true
                }
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={`border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 ${
                    metric.isRunway && metric.color === 'red' ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          metric.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                          metric.color === 'green' ? 'bg-green-100 dark:bg-green-900/40' :
                          metric.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                          metric.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                          metric.color === 'red' ? 'bg-red-100 dark:bg-red-900/40' :
                          'bg-yellow-100 dark:bg-yellow-900/40'
                        }`}>
                          <metric.icon className={`h-5 w-5 ${
                            metric.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            metric.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            metric.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            metric.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            metric.color === 'red' ? 'text-red-600 dark:text-red-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                        {metric.change !== null && metric.change !== 0 && (
                          <div className={`flex items-center gap-1 text-sm ${
                            metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change >= 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            {Math.abs(metric.change).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {metric.title}
                        </p>
                        <p className={`text-2xl font-bold ${
                          metric.isRunway && metric.color === 'red' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {metric.value}
                        </p>
                        {metric.change !== null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            vs. last month
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Revenue Trend
                    </CardTitle>
                    <CardDescription>
                      Monthly performance across payment gateways
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 p-4">
                      <div className="h-full flex items-end justify-between gap-3">
                        {mockFinancialData.revenueChart.map((data, index) => {
                          const maxRevenue = Math.max(...mockFinancialData.revenueChart.map(d => d.revenue))
                          const isCurrentMonth = index === mockFinancialData.revenueChart.length - 1
                          
                          return (
                            <div key={data.month} className="flex-1 flex flex-col items-center group">
                              <div className="w-full flex flex-col items-center gap-0.5 mb-3">
                                <div 
                                  className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-80 ${
                                    isCurrentMonth ? 'bg-blue-500 shadow-lg' : 'bg-blue-400'
                                  }`}
                                  style={{ height: `${(data.stripe / maxRevenue) * 160}px`, minHeight: '8px' }}
                                />
                                <div 
                                  className={`w-full rounded-b-lg transition-all duration-500 hover:opacity-80 ${
                                    isCurrentMonth ? 'bg-purple-500 shadow-lg' : 'bg-purple-400'
                                  }`}
                                  style={{ height: `${(data.khalti / maxRevenue) * 160}px`, minHeight: '8px' }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(data.revenue)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {data.month.split(' ')[0]}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Stripe</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Khalti</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Cash Runway Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Cash Runway
                    </CardTitle>
                    <CardDescription>
                      Projected cash depletion timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 p-4">
                      <div className="h-48 relative">
                        <svg className="w-full h-full" viewBox="0 0 300 180">
                          <defs>
                            <linearGradient id="runwayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{stopColor:'#F59E0B', stopOpacity:0.8}} />
                              <stop offset="70%" style={{stopColor:'#EF4444', stopOpacity:0.9}} />
                              <stop offset="100%" style={{stopColor:'#DC2626', stopOpacity:1}} />
                            </linearGradient>
                            <linearGradient id="runwayFill" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style={{stopColor:'#F59E0B', stopOpacity:0.1}} />
                              <stop offset="100%" style={{stopColor:'#EF4444', stopOpacity:0.05}} />
                            </linearGradient>
                          </defs>
                          
                          <path
                            d="M 0,40 Q 50,45 100,80 Q 150,120 200,140 Q 250,165 300,175"
                            stroke="url(#runwayGradient)"
                            strokeWidth="3"
                            fill="none"
                          />
                          
                          <path
                            d="M 0,40 Q 50,45 100,80 Q 150,120 200,140 Q 250,165 300,175 L 300,180 L 0,180 Z"
                            fill="url(#runwayFill)"
                          />
                          
                          <circle cx="290" cy="170" r="5" fill="#DC2626" className="animate-pulse" />
                          <circle cx="20" cy="45" r="4" fill="#F59E0B" />
                        </svg>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(cashRunwayData.currentCash)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Current Cash</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            ${(cashRunwayData.netDailyBurn || 0).toFixed(0)}/day
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Net Burn</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {cashRunwayData.runwayDays} days
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest transactions and payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-500' : 
                              transaction.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {transaction.customer}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {transaction.plan}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">Connect your payment providers to see activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              >
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Payment Distribution
                    </CardTitle>
                    <CardDescription>
                      Revenue breakdown by payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      {paymentMethods.length > 0 ? (
                        <div className="h-full flex items-end justify-center gap-12">
                          {paymentMethods.map((method, index) => {
                            const maxValue = Math.max(...paymentMethods.map(m => m.value))
                            const height = (method.value / maxValue) * 120
                            
                            return (
                              <div key={index} className="flex flex-col items-center group">
                                <div className="mb-3">
                                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {method.value}%
                                  </div>
                                </div>
                                <div 
                                  className="w-16 rounded-t-xl transition-all duration-300 group-hover:opacity-80 shadow-sm"
                                  style={{ 
                                    height: `${height}px`,
                                    backgroundColor: method.color,
                                    minHeight: '24px'
                                  }}
                                />
                                <div className="mt-3 text-center">
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {method.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {method.name === 'Stripe' ? '$8.5K' : '$4.0K'}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-end justify-center gap-12">
                          <div className="flex flex-col items-center">
                            <div className="mb-3">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">68%</div>
                            </div>
                            <div className="w-16 h-32 bg-blue-500 rounded-t-xl shadow-sm" />
                            <div className="mt-3 text-center">
                              <div className="font-semibold text-gray-900 dark:text-white">Stripe</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">$8.5K</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="mb-3">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">32%</div>
                            </div>
                            <div className="w-16 h-20 bg-purple-500 rounded-t-xl shadow-sm" />
                            <div className="mt-3 text-center">
                              <div className="font-semibold text-gray-900 dark:text-white">Khalti</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">$4.0K</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
        
        {/* Upload Modal - Redesigned */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      Import Financial Data
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Upload CSV files to analyze your financial performance
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                        Data Type
                      </label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value as 'stripe' | 'khalti' | 'expenses')}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="stripe">Stripe Revenue Data</option>
                        <option value="khalti">Khalti Revenue Data</option>
                        <option value="expenses">Expense Records</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                        CSV File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleCSVUpload(file, uploadType)
                            }
                          }}
                          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:border-amber-400 dark:hover:border-amber-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                      <h4 className="text-sm font-semibold mb-2 text-amber-900 dark:text-amber-200">
                        Expected Format:
                      </h4>
                      <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                        {uploadType === 'stripe' && (
                          <p><strong>Headers:</strong> date, amount, description, customer_email</p>
                        )}
                        {uploadType === 'khalti' && (
                          <p><strong>Headers:</strong> date, amount, description, customer_email</p>
                        )}
                        {uploadType === 'expenses' && (
                          <p><strong>Headers:</strong> date, amount, description, category</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadModal(false)}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}