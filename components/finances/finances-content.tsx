'use client'

import { useState } from 'react'
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

// Realistic financial data with proper month-over-month growth patterns
const mockFinancialData = {
  overview: {
    totalRevenue: 87450.00,
    monthlyRecurringCurrent: 12500.00, // July 2025
    monthlyRecurringPrevious: 11200.00, // June 2025  
    oneTimePayments: 8750.00,
    activeSubscriptions: 42,
    activeSubscriptionsPrevious: 38,
    churnRate: 3.1,
    averageRevenuePerUser: 297.62
  },
  cashRunway: {
    currentCash: 1200.00, // Very low cash to show 4 days runway
    monthlyBurnRate: 8500.00, // High burn rate
    monthlyRevenue: 12500.00,
    dailyBurnRate: 283.33, // 8500/30 days
    dailyRevenue: 416.67, // 12500/30 days
    netDailyBurn: -133.34, // negative means burning cash
    runwayMonths: 0.13, // 4 days = 0.13 months
    runwayDays: 4, // 1200 / 300 net daily burn
    projectedCashDepletion: '2025-07-29',
    recommendations: [
      { type: 'pricing', action: 'Increase prices by 25%', impact: '+12 days runway' },
      { type: 'cac', action: 'Reduce marketing spend by 40%', impact: '+18 days runway' },
      { type: 'funding', action: 'Raise $50K bridge funding', impact: '+167 days runway' }
    ]
  },
  revenueChart: [
    { month: 'Jan 2025', revenue: 8200, stripe: 5400, khalti: 2800, expenses: 7100 },
    { month: 'Feb 2025', revenue: 9100, stripe: 6200, khalti: 2900, expenses: 7350 },
    { month: 'Mar 2025', revenue: 9800, stripe: 6800, khalti: 3000, expenses: 7500 },
    { month: 'Apr 2025', revenue: 10500, stripe: 7200, khalti: 3300, expenses: 7800 },
    { month: 'May 2025', revenue: 11200, stripe: 7800, khalti: 3400, expenses: 8200 },
    { month: 'Jun 2025', revenue: 11200, stripe: 7600, khalti: 3600, expenses: 8350 },
    { month: 'Jul 2025', revenue: 12500, stripe: 8500, khalti: 4000, expenses: 8500 }
  ],
  recentTransactions: [
    {
      id: 'txn_001',
      customer: 'John Doe',
      amount: 99.00,
      type: 'subscription',
      status: 'completed',
      date: '2025-01-24',
      plan: 'Pro Monthly'
    },
    {
      id: 'txn_002',
      customer: 'Sarah Johnson',
      amount: 299.00,
      type: 'one-time',
      status: 'completed',
      date: '2025-01-24',
      plan: 'Lifetime Deal'
    },
    {
      id: 'txn_003',
      customer: 'Mike Chen',
      amount: 49.00,
      type: 'subscription',
      status: 'completed',
      date: '2025-01-23',
      plan: 'Basic Monthly'
    },
    {
      id: 'txn_004',
      customer: 'Emma Wilson',
      amount: 99.00,
      type: 'subscription',
      status: 'failed',
      date: '2025-01-23',
      plan: 'Pro Monthly'
    },
    {
      id: 'txn_005',
      customer: 'David Brown',
      amount: 199.00,
      type: 'one-time',
      status: 'completed',
      date: '2025-01-22',
      plan: 'Premium Package'
    }
  ],
  paymentMethods: [
    { name: 'Credit Cards', value: 65, color: '#8884d8' },
    { name: 'PayPal', value: 25, color: '#82ca9d' },
    { name: 'Bank Transfer', value: 10, color: '#ffc658' }
  ]
}

interface StripeIntegration {
  isConnected: boolean
  accountId?: string
  lastSync?: string
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
  const [uploadedData, setUploadedData] = useState<TransactionData[]>([])
  const [cashRunwayData, setCashRunwayData] = useState<CashRunwayData>(mockFinancialData.cashRunway)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'stripe' | 'khalti' | 'expenses'>('stripe')

  // Dynamic calculation functions with realistic data
  const calculateFinancialMetrics = (transactions: TransactionData[]) => {
    // If no uploaded data, use realistic mock data with proper growth patterns
    if (transactions.length === 0) {
      return {
        totalRevenue: mockFinancialData.overview.totalRevenue,
        monthlyRevenue: mockFinancialData.overview.monthlyRecurringCurrent,
        monthlyRecurring: mockFinancialData.overview.monthlyRecurringCurrent,
        oneTimePayments: mockFinancialData.overview.oneTimePayments,
        activeSubscriptions: mockFinancialData.overview.activeSubscriptions,
        averageRevenuePerUser: mockFinancialData.overview.averageRevenuePerUser,
        // Realistic growth rates based on current vs previous month
        revenueGrowthRate: ((mockFinancialData.overview.monthlyRecurringCurrent - mockFinancialData.overview.monthlyRecurringPrevious) / mockFinancialData.overview.monthlyRecurringPrevious) * 100, // 11.6%
        mrrGrowthRate: ((mockFinancialData.overview.monthlyRecurringCurrent - mockFinancialData.overview.monthlyRecurringPrevious) / mockFinancialData.overview.monthlyRecurringPrevious) * 100, // 11.6%
        subscriptionGrowthRate: ((mockFinancialData.overview.activeSubscriptions - mockFinancialData.overview.activeSubscriptionsPrevious) / mockFinancialData.overview.activeSubscriptionsPrevious) * 100, // 10.5%
        totalExpenses: 59500.00, // 7 months * 8500 average
        monthlyExpenses: 8500.00,
        netProfit: mockFinancialData.overview.monthlyRecurringCurrent - 8500.00 // $4000 profit
      }
    }

    // Calculate from actual uploaded data
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    
    // Current month data
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= oneMonthAgo
    })

    // Last 3 months data
    const threeMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= threeMonthsAgo
    })

    const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyRevenue = currentMonthTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    
    // Calculate MRR (Monthly Recurring Revenue) from subscription transactions
    const subscriptionRevenue = currentMonthTransactions
      .filter(t => t.type === 'revenue' && (t.category?.toLowerCase().includes('subscription') || t.category?.toLowerCase().includes('monthly')))
      .reduce((sum, t) => sum + t.amount, 0)
    
    const oneTimePayments = currentMonthTransactions
      .filter(t => t.type === 'revenue' && !t.category?.toLowerCase().includes('subscription') && !t.category?.toLowerCase().includes('monthly'))
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Count active subscriptions (unique monthly subscription transactions)
    const activeSubscriptions = currentMonthTransactions
      .filter(t => t.type === 'revenue' && (t.category?.toLowerCase().includes('subscription') || t.category?.toLowerCase().includes('monthly')))
      .length
    
    // Calculate average revenue per user
    const uniqueCustomers = new Set(currentMonthTransactions.filter(t => t.type === 'revenue').map(t => t.description)).size
    const averageRevenuePerUser = uniqueCustomers > 0 ? monthlyRevenue / uniqueCustomers : 0
    
    // Calculate growth rates (compare current month vs previous month)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= twoMonthsAgo && transactionDate < oneMonthAgo
    })
    
    const previousMonthRevenue = previousMonthTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0)
    const revenueGrowthRate = previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0
    
    const previousMonthMRR = previousMonthTransactions
      .filter(t => t.type === 'revenue' && (t.category?.toLowerCase().includes('subscription') || t.category?.toLowerCase().includes('monthly')))
      .reduce((sum, t) => sum + t.amount, 0)
    const mrrGrowthRate = previousMonthMRR > 0 ? ((subscriptionRevenue - previousMonthMRR) / previousMonthMRR) * 100 : 0
    
    const previousMonthSubscriptions = previousMonthTransactions
      .filter(t => t.type === 'revenue' && (t.category?.toLowerCase().includes('subscription') || t.category?.toLowerCase().includes('monthly')))
      .length
    const subscriptionGrowthRate = previousMonthSubscriptions > 0 ? ((activeSubscriptions - previousMonthSubscriptions) / previousMonthSubscriptions) * 100 : 0
    
    return {
      totalRevenue,
      monthlyRevenue,
      monthlyRecurring: subscriptionRevenue,
      oneTimePayments,
      activeSubscriptions,
      averageRevenuePerUser,
      revenueGrowthRate,
      mrrGrowthRate,
      subscriptionGrowthRate,
      totalExpenses,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses
    }
  }

  const getRecentTransactions = (transactions: TransactionData[], limit: number = 5) => {
    // If no uploaded data, return realistic mock transactions
    if (transactions.length === 0) {
      return [
        {
          id: 'txn_001',
          customer: 'Sarah Tech Co.',
          amount: 299.00,
          type: 'subscription' as const,
          status: 'completed' as const,
          date: '2025-07-24',
          plan: 'Pro Annual'
        },
        {
          id: 'txn_002',
          customer: 'DevStudio Inc.',
          amount: 99.00,
          type: 'subscription' as const,
          status: 'completed' as const,
          date: '2025-07-24',
          plan: 'Basic Monthly'
        },
        {
          id: 'txn_003',
          customer: 'StartupXYZ',
          amount: 499.00,
          type: 'subscription' as const,
          status: 'completed' as const,
          date: '2025-07-23',
          plan: 'Enterprise'
        },
        {
          id: 'txn_004',
          customer: 'Design Agency',
          amount: 149.00,
          type: 'subscription' as const,
          status: 'failed' as const,
          date: '2025-07-23',
          plan: 'Pro Monthly'
        },
        {
          id: 'txn_005',
          customer: 'Mobile App Co.',
          amount: 199.00,
          type: 'subscription' as const,
          status: 'completed' as const,
          date: '2025-07-22',
          plan: 'Team Plan'
        }
      ]
    }

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map(t => ({
        id: `txn_${Math.random().toString(36).substr(2, 9)}`,
        customer: t.description.split(' ')[0] + ' Customer',
        amount: t.amount,
        type: t.type === 'revenue' ? 'subscription' : 'expense',
        status: 'completed' as const,
        date: t.date,
        plan: t.category || 'Standard'
      }))
  }

  const getPaymentMethodDistribution = (transactions: TransactionData[]) => {
    const revenueTransactions = transactions.filter(t => t.type === 'revenue')
    const total = revenueTransactions.length
    
    // If no uploaded data, return realistic default distribution
    if (total === 0) {
      return [
        { name: 'Stripe', value: 68, color: '#635BFF' },
        { name: 'Khalti', value: 32, color: '#5C2E91' }
      ]
    }
    
    const stripeCount = revenueTransactions.filter(t => t.gateway === 'stripe').length
    const khaltiCount = revenueTransactions.filter(t => t.gateway === 'khalti').length
    const otherCount = total - stripeCount - khaltiCount
    
    return [
      { name: 'Stripe', value: Math.round((stripeCount / total) * 100), color: '#635BFF' },
      { name: 'Khalti', value: Math.round((khaltiCount / total) * 100), color: '#5C2E91' },
      { name: 'Other', value: Math.round((otherCount / total) * 100), color: '#00A86B' }
    ].filter(item => item.value > 0)
  }

  // Calculate dynamic financial metrics
  const financialMetrics = calculateFinancialMetrics(uploadedData)
  const recentTransactions = getRecentTransactions(uploadedData)
  const paymentMethods = getPaymentMethodDistribution(uploadedData)

  // Generate product-specific dummy data
  const generateProductSpecificData = (): TransactionData[] => {
    const productName = productProfile?.productName || 'Your Product'
    const currentPrice = productProfile?.currentPrice ? parseFloat(productProfile.currentPrice) : 99.00
    const pricingModel = productProfile?.currentPricingModel || 'subscription'
    
    const baseRevenue: TransactionData[] = [
      {
        date: '2024-12-15',
        amount: currentPrice,
        type: 'revenue',
        description: `${pricingModel === 'subscription' ? 'Monthly subscription' : 'One-time purchase'} - ${productName}`,
        category: pricingModel,
        gateway: 'stripe'
      },
      {
        date: '2024-12-14',
        amount: currentPrice * (pricingModel === 'subscription' ? 12 : 1.5), // Annual or premium pricing
        type: 'revenue',
        description: `${pricingModel === 'subscription' ? 'Annual subscription' : 'Premium package'} - ${productName}`,
        category: pricingModel,
        gateway: 'stripe'
      },
      {
        date: '2024-12-13',
        amount: currentPrice * 0.5, // Basic tier
        type: 'revenue',
        description: `Basic plan - ${productName}`,
        category: 'basic',
        gateway: 'stripe'
      },
      {
        date: '2024-12-10',
        amount: currentPrice,
        type: 'revenue',
        description: `${pricingModel === 'subscription' ? 'Monthly subscription' : 'Standard purchase'} - ${productName}`,
        category: pricingModel,
        gateway: 'stripe'
      },
      {
        date: '2024-12-08',
        amount: currentPrice * 1.5, // Premium tier
        type: 'revenue',
        description: `Premium plan - ${productName}`,
        category: 'premium',
        gateway: 'stripe'
      },
      {
        date: '2024-11-28',
        amount: currentPrice,
        type: 'revenue',
        description: `${pricingModel === 'subscription' ? 'Monthly subscription' : 'Purchase'} - ${productName}`,
        category: pricingModel,
        gateway: 'stripe'
      },
      {
        date: '2024-11-25',
        amount: currentPrice * 0.7, // Discounted price
        type: 'revenue',
        description: `Black Friday discount - ${productName}`,
        category: 'promotion',
        gateway: 'stripe'
      }
    ]

    const baseExpenses: TransactionData[] = [
      {
        date: '2024-12-01',
        amount: 2500.00,
        type: 'expense',
        description: 'Server hosting and infrastructure',
        category: 'infrastructure',
        gateway: undefined
      },
      {
        date: '2024-12-01',
        amount: 1200.00,
        type: 'expense',
        description: 'Marketing and advertising',
        category: 'marketing',
        gateway: undefined
      },
      {
        date: '2024-12-01',
        amount: 800.00,
        type: 'expense',
        description: 'Software subscriptions and tools',
        category: 'software',
        gateway: undefined
      },
      {
        date: '2024-11-01',
        amount: 2500.00,
        type: 'expense',
        description: 'Server hosting and infrastructure',
        category: 'infrastructure',
        gateway: undefined
      },
      {
        date: '2024-11-01',
        amount: 1500.00,
        type: 'expense',
        description: 'Marketing and advertising',
        category: 'marketing',
        gateway: undefined
      },
      {
        date: '2024-11-01',
        amount: 900.00,
        type: 'expense',
        description: 'Software subscriptions and tools',
        category: 'software',
        gateway: undefined
      }
    ]

    return [...baseRevenue, ...baseExpenses]
  }

  const handleStripeConnect = async () => {
    setIsConnecting(true)
    
    try {
      // In production, this would redirect to Stripe Connect OAuth flow
      // For now, we'll simulate the connection and populate with dummy data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate product-specific dummy Stripe data
      const dummyStripeData = generateProductSpecificData()
      
      // Add the dummy data to uploaded data
      const newData = [...uploadedData, ...dummyStripeData]
      setUploadedData(newData)
      updateCashRunwayCalculations(newData)
      
      setStripeIntegration({
        isConnected: true,
        accountId: 'acct_1234567890',
        lastSync: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to connect Stripe:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleKhaltiConnect = async () => {
    setIsConnecting(true)
    
    try {
      // In production, this would redirect to Khalti OAuth flow
      // For now, we'll simulate the connection and populate with dummy data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate dummy Khalti CSV data (typically for Nepali market)
      const dummyKhaltiData: TransactionData[] = [
        {
          date: '2024-12-16',
          amount: 1500.00, // NPR amounts
          type: 'revenue',
          description: 'Digital wallet payment - Premium Service',
          category: 'service',
          gateway: 'khalti'
        },
        {
          date: '2024-12-12',
          amount: 800.00,
          type: 'revenue',
          description: 'Mobile payment - Basic Plan',
          category: 'subscription',
          gateway: 'khalti'
        },
        {
          date: '2024-12-09',
          amount: 2200.00,
          type: 'revenue',
          description: 'Digital payment - Enterprise Package',
          category: 'enterprise',
          gateway: 'khalti'
        },
        {
          date: '2024-12-06',
          amount: 1200.00,
          type: 'revenue',
          description: 'QR payment - Standard Service',
          category: 'service',
          gateway: 'khalti'
        },
        {
          date: '2024-11-30',
          amount: 950.00,
          type: 'revenue',
          description: 'Mobile banking - Monthly subscription',
          category: 'subscription',
          gateway: 'khalti'
        }
      ]
      
      // Add the dummy data to uploaded data
      const newData = [...uploadedData, ...dummyKhaltiData]
      setUploadedData(newData)
      updateCashRunwayCalculations(newData)
      
      setKhaltiIntegration({
        isConnected: true,
        accountId: 'khalti_1234567890',
        lastSync: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to connect Khalti:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCSVUpload = async (file: File, type: 'stripe' | 'khalti' | 'expenses') => {
    try {
      console.log('Uploading file:', file.name, 'Type:', type, 'Size:', file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/finances/upload-csv', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload CSV');
      }

      // Show success message
      alert(`${result.message}${result.errors ? `\n\nWarnings:\n${result.errors.join('\n')}` : ''}`);
      
      // Mark the appropriate integration as connected
      if (type === 'stripe') {
        setStripeIntegration(prev => ({ ...prev, isConnected: true, lastSync: new Date().toISOString() }))
      } else if (type === 'khalti') {
        setKhaltiIntegration(prev => ({ ...prev, isConnected: true, lastSync: new Date().toISOString() }))
      }
      
      setShowUploadModal(false)
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to upload CSV:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to upload CSV file: ${errorMessage}`)
    }
  }

  const updateCashRunwayCalculations = (newTransactions: TransactionData[]) => {
    const allTransactions = [...uploadedData, ...newTransactions]
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    
    const recentTransactions = allTransactions.filter(t => new Date(t.date) >= threeMonthsAgo)
    
    const totalRevenue = recentTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyRevenue = totalRevenue / 3 // Average over 3 months
    const monthlyExpenses = totalExpenses / 3 // Average over 3 months
    const netBurn = monthlyExpenses - monthlyRevenue
    
    // Simulate critical cash situation - very low cash to show urgency
    const simulatedCurrentCash = 1200.00 // Critical level
    const dailyBurnRate = monthlyExpenses / 30
    const dailyRevenue = monthlyRevenue / 30
    const netDailyBurn = dailyBurnRate - dailyRevenue
    
    // Calculate runway in days for more precision when low
    let runwayDays = 0
    let runwayMonths = 0
    
    if (netDailyBurn > 0) {
      runwayDays = Math.floor(simulatedCurrentCash / netDailyBurn)
      runwayMonths = runwayDays / 30
    } else {
      runwayDays = 365 * 10 // 10 years if profitable
      runwayMonths = 120
    }
    
    // Calculate projected depletion date
    let projectedDepletionDate: string
    if (runwayDays > 3650) { // More than 10 years
      const farFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
      projectedDepletionDate = farFuture.toISOString().split('T')[0]
    } else {
      const projectedDepletion = new Date(now.getTime() + (runwayDays * 24 * 60 * 60 * 1000))
      projectedDepletionDate = projectedDepletion.toISOString().split('T')[0]
    }
    
    setCashRunwayData({
      currentCash: simulatedCurrentCash,
      monthlyBurnRate: monthlyExpenses,
      monthlyRevenue,
      dailyBurnRate,
      dailyRevenue,
      netDailyBurn,
      runwayMonths: runwayMonths > 120 ? 120 : runwayMonths,
      runwayDays: runwayDays > 3650 ? 3650 : runwayDays,
      projectedCashDepletion: projectedDepletionDate
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
        {(stripeIntegration.isConnected || khaltiIntegration.isConnected || uploadedData.length > 0) && 
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

        {!stripeIntegration.isConnected && !khaltiIntegration.isConnected && uploadedData.length === 0 ? (
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