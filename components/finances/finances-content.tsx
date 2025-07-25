'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  FileSpreadsheet
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
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row')
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Validate required headers
      const requiredHeaders = ['date', 'amount', 'description']
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
      }
      
      const transactions: TransactionData[] = lines.slice(1).map((line, index) => {
        try {
          const values = line.split(',').map(v => v.trim())
          const transactionData: any = {}
          
          headers.forEach((header, headerIndex) => {
            transactionData[header] = values[headerIndex] || ''
          })
          
          // Validate and parse date
          const dateStr = transactionData.date || transactionData.created_at
          if (!dateStr) {
            throw new Error(`Missing date in row ${index + 2}`)
          }
          
          const parsedDate = new Date(dateStr)
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format in row ${index + 2}: ${dateStr}`)
          }
          
          // Validate and parse amount
          const amountStr = transactionData.amount || transactionData.gross || '0'
          const amount = parseFloat(amountStr)
          if (isNaN(amount)) {
            throw new Error(`Invalid amount in row ${index + 2}: ${amountStr}`)
          }
          
          return {
            date: parsedDate.toISOString().split('T')[0], // Normalize to YYYY-MM-DD format
            amount: amount,
            type: (transactionData.type || (type === 'expenses' ? 'expense' : 'revenue')) as 'revenue' | 'expense',
            description: transactionData.description || transactionData.customer_email || 'Transaction',
            category: transactionData.category || type,
            gateway: (transactionData.gateway && transactionData.gateway.trim() !== '' ? transactionData.gateway : (type === 'expenses' ? undefined : type)) as 'stripe' | 'khalti' | undefined
          }
        } catch (rowError) {
          console.error(`Error parsing row ${index + 2}:`, rowError)
          throw rowError
        }
      }).filter(t => t.amount > 0) // Only include positive amounts
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in the CSV file')
      }
      
      const newData = [...uploadedData, ...transactions]
      setUploadedData(newData)
      updateCashRunwayCalculations(newData)
      
      // Mark the appropriate integration as connected
      if (type === 'stripe') {
        setStripeIntegration(prev => ({ ...prev, isConnected: true, lastSync: new Date().toISOString() }))
      } else if (type === 'khalti') {
        setKhaltiIntegration(prev => ({ ...prev, isConnected: true, lastSync: new Date().toISOString() }))
      }
      
      setShowUploadModal(false)
      
      // Show success message
      alert(`Successfully imported ${transactions.length} transactions from CSV file`)
      
    } catch (error) {
      console.error('Failed to parse CSV:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to parse CSV file: ${errorMessage}`)
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-green-950 dark:to-gray-950">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finances</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {productProfile?.productName 
                ? `Track ${productProfile.productName}'s financial performance, revenue streams, and cash runway`
                : 'Track your product\'s financial performance, revenue streams, and cash runway'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Upload Data Button */}
            <Button 
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV Data
            </Button>
          </div>
        </div>

        {/* Critical Cash Runway Warning - Only show when data is loaded */}
        {(stripeIntegration.isConnected || khaltiIntegration.isConnected || uploadedData.length > 0) && 
         (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 || cashRunwayData.runwayMonths < 1) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`border-2 ${
              (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                ? 'border-red-500 bg-red-50 dark:border-red-800 dark:bg-red-950/30 shadow-lg' 
                : 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-6 w-6 mt-0.5 ${
                    (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25 
                      ? 'text-red-600 dark:text-red-400 animate-pulse' 
                      : 'text-red-500 dark:text-red-400'
                  }`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${
                      (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25 
                        ? 'text-red-900 dark:text-red-100' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      🚨 Critical Cash Runway Alert
                    </h3>
                    <p className={`text-sm mb-3 ${
                      (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25 
                        ? 'text-red-800 dark:text-red-200 font-medium' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 ? (
                        <>You have only <strong className="text-red-900 dark:text-red-100">{cashRunwayData.runwayDays} days</strong> of runway remaining!</>
                      ) : (
                        <>You have <strong>{Math.floor(cashRunwayData.runwayMonths)} months</strong> of runway remaining</>
                      )}
                      {' '}(projected cash depletion: <strong>{formatDate(cashRunwayData.projectedCashDepletion)}</strong>).
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      {mockFinancialData.cashRunway.recommendations.map((rec, index) => (
                        <div key={index} className={`p-2 rounded-lg border text-xs ${
                          cashRunwayData.runwayMonths < 3 
                            ? 'border-red-200 bg-red-100 dark:border-red-700 dark:bg-red-900/30' 
                            : 'border-yellow-200 bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/30'
                        }`}>
                          <div className={`font-medium ${
                            cashRunwayData.runwayMonths < 3 ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'
                          }`}>
                            {rec.action}
                          </div>
                          <div className={`${
                            cashRunwayData.runwayMonths < 3 ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {rec.impact}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Current Cash: {formatCurrency(cashRunwayData.currentCash)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDownIcon className="h-3 w-3" />
                        <span>Monthly Burn: {formatCurrency(cashRunwayData.monthlyBurnRate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Monthly Revenue: {formatCurrency(cashRunwayData.monthlyRevenue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Data Upload Summary */}
        {uploadedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Uploaded Data Summary
                </CardTitle>
                <CardDescription>
                  {uploadedData.length} transactions loaded from CSV files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">Revenue Records</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {uploadedData.filter(d => d.type === 'revenue').length}
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200">Expense Records</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {uploadedData.filter(d => d.type === 'expense').length}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Stripe Transactions</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {uploadedData.filter(d => d.gateway === 'stripe').length}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Khalti Transactions</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {uploadedData.filter(d => d.gateway === 'khalti').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!stripeIntegration.isConnected && !khaltiIntegration.isConnected && uploadedData.length === 0 ? (
          /* Integration Setup */
          <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                Connect Your Payment Providers
              </CardTitle>
              <CardDescription className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
                Connect Stripe & Khalti for automatic data sync, or upload CSV files to get comprehensive financial insights and cash runway analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg border-amber-200 dark:border-gray-700 bg-amber-50 dark:bg-gray-800">
                  <Activity className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <h3 className="font-medium mb-1 text-gray-900 dark:text-white">Cash Runway</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monitor burn rate & runway</p>
                </div>
                <div className="p-4 border rounded-lg border-amber-200 dark:border-gray-700 bg-amber-50 dark:bg-gray-800">
                  <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <h3 className="font-medium mb-1 text-gray-900 dark:text-white">MRR Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly recurring revenue</p>
                </div>
                <div className="p-4 border rounded-lg border-amber-200 dark:border-gray-700 bg-amber-50 dark:bg-gray-800">
                  <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <h3 className="font-medium mb-1 text-gray-900 dark:text-white">Revenue Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Multi-gateway insights</p>
                </div>
              </div>
              
              {/* Connection Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Stripe */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Stripe</h3>
                  <Button 
                    onClick={handleStripeConnect} 
                    disabled={isConnecting}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
                
                {/* Khalti */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Khalti</h3>
                  <Button 
                    onClick={handleKhaltiConnect} 
                    disabled={isConnecting}
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
                
                {/* CSV Upload */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Upload CSV</h3>
                  <Button 
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                    variant="outline"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                  >
                    Upload Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Financial Dashboard */
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`flex items-center ${financialMetrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialMetrics.revenueGrowthRate >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {financialMetrics.revenueGrowthRate >= 0 ? '+' : ''}{financialMetrics.revenueGrowthRate.toFixed(1)}% from last month
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Monthly Recurring</CardTitle>
                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialMetrics.monthlyRecurring)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`flex items-center ${financialMetrics.mrrGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialMetrics.mrrGrowthRate >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {financialMetrics.mrrGrowthRate >= 0 ? '+' : ''}{financialMetrics.mrrGrowthRate.toFixed(1)}% from last month
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Active Subscriptions</CardTitle>
                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{financialMetrics.activeSubscriptions}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`flex items-center ${financialMetrics.subscriptionGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialMetrics.subscriptionGrowthRate >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {financialMetrics.subscriptionGrowthRate >= 0 ? '+' : ''}{financialMetrics.subscriptionGrowthRate.toFixed(1)}% from last month
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Avg Revenue/User</CardTitle>
                    <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialMetrics.averageRevenuePerUser)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-gray-500 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Based on current data
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card className={`border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm ${
                  (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                    ? 'ring-2 ring-red-400 dark:ring-red-600 border-red-200 dark:border-red-800' 
                    : cashRunwayData.runwayMonths < 1 
                      ? 'ring-2 ring-red-300 dark:ring-red-700 border-red-200 dark:border-red-800'
                      : cashRunwayData.runwayMonths < 6 
                        ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' 
                        : ''
                }`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Cash Runway</CardTitle>
                    <Calendar className={`h-4 w-4 ${
                      (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                        ? 'text-red-600 dark:text-red-400 animate-pulse' 
                        : cashRunwayData.runwayMonths < 1 
                          ? 'text-red-500 dark:text-red-400' 
                          : cashRunwayData.runwayMonths < 6 
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                        ? 'text-red-600 dark:text-red-400' 
                        : cashRunwayData.runwayMonths < 1 
                          ? 'text-red-500 dark:text-red-400' 
                          : cashRunwayData.runwayMonths < 6 
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}>
                      {cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 
                        ? `${cashRunwayData.runwayDays} days` 
                        : `${Math.floor(cashRunwayData.runwayMonths)} months`
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`flex items-center ${
                        (cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25
                          ? 'text-red-600 font-medium' 
                          : cashRunwayData.runwayMonths < 6 
                            ? 'text-yellow-600' 
                            : 'text-gray-500'
                      }`}>
                        {(cashRunwayData.runwayDays && cashRunwayData.runwayDays < 7) || cashRunwayData.runwayMonths < 0.25 ? (
                          <AlertTriangle className="h-3 w-3 mr-1 animate-pulse" />
                        ) : cashRunwayData.runwayMonths < 6 ? (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        )}
                        {cashRunwayData.runwayDays && cashRunwayData.runwayDays < 30 
                          ? 'Critical - immediate action needed'
                          : 'Current burn rate'
                        }
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue from Stripe & Khalti</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] p-4">
                      {/* Simple Revenue Chart using CSS bars */}
                      <div className="h-full flex items-end justify-between gap-2">
                        {mockFinancialData.revenueChart.map((data, index) => {
                          const maxRevenue = Math.max(...mockFinancialData.revenueChart.map(d => d.revenue))
                          const height = (data.revenue / maxRevenue) * 100
                          const isCurrentMonth = index === mockFinancialData.revenueChart.length - 1
                          
                          return (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                              <div className="w-full flex flex-col items-center gap-1 mb-2">
                                {/* Stripe Bar */}
                                <div 
                                  className={`w-full ${isCurrentMonth ? 'bg-blue-500' : 'bg-blue-400'} rounded-t-sm transition-all duration-300 hover:bg-blue-600`}
                                  style={{ height: `${(data.stripe / maxRevenue) * 180}px` }}
                                  title={`Stripe: ${formatCurrency(data.stripe)}`}
                                />
                                {/* Khalti Bar */}
                                <div 
                                  className={`w-full ${isCurrentMonth ? 'bg-purple-500' : 'bg-purple-400'} transition-all duration-300 hover:bg-purple-600`}
                                  style={{ height: `${(data.khalti / maxRevenue) * 180}px` }}
                                  title={`Khalti: ${formatCurrency(data.khalti)}`}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(data.revenue)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{data.month.split(' ')[0]}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex justify-center gap-4 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Stripe</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Khalti</span>
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
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Cash Runway Projection</CardTitle>
                    <CardDescription>Current runway: {Math.floor(cashRunwayData.runwayMonths)} months remaining</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] p-4">
                      {/* Cash Runway Projection Chart */}
                      <div className="h-full">
                        {/* Chart Area */}
                        <div className="h-[180px] relative border-l-2 border-b-2 border-gray-300 dark:border-gray-600">
                          {/* Y-axis labels */}
                          <div className="absolute -left-12 top-0 text-xs text-gray-500 dark:text-gray-400">$1.2K</div>
                          <div className="absolute -left-8 top-1/2 text-xs text-gray-500 dark:text-gray-400">$600</div>
                          <div className="absolute -left-6 bottom-0 text-xs text-gray-500 dark:text-gray-400">$0</div>
                          
                          {/* Projection line */}
                          <svg className="w-full h-full" viewBox="0 0 300 180">
                            <defs>
                              <linearGradient id="cashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor:'#22C55E', stopOpacity:0.8}} />
                                <stop offset="70%" style={{stopColor:'#EF4444', stopOpacity:0.8}} />
                                <stop offset="100%" style={{stopColor:'#DC2626', stopOpacity:1}} />
                              </linearGradient>
                            </defs>
                            
                            {/* Cash depletion line */}
                            <path
                              d="M 0,40 Q 50,45 100,80 Q 150,120 200,140 Q 250,165 300,175"
                              stroke="url(#cashGradient)"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="0"
                            />
                            
                            {/* Current position marker */}
                            <circle cx="280" cy="165" r="4" fill="#DC2626" />
                            <text x="270" y="155" fontSize="10" fill="#DC2626" className="font-medium">Today</text>
                            
                            {/* Depletion point */}
                            <circle cx="300" cy="175" r="4" fill="#991B1B" stroke="#FFF" strokeWidth="2" />
                            <text x="240" y="190" fontSize="9" fill="#991B1B" className="font-medium">Depletion: {formatDate(cashRunwayData.projectedCashDepletion)}</text>
                          </svg>
                          
                          {/* Warning zone overlay */}
                          <div className="absolute right-0 top-0 w-1/4 h-full bg-red-100 dark:bg-red-950/20 opacity-50 rounded-r" />
                        </div>
                        
                        {/* Time axis */}
                        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Today</span>
                          <span>Day 2</span>
                          <span>Day 3</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">Day 4 (Empty)</span>
                        </div>
                        
                        {/* Key metrics */}
                        <div className="flex justify-between mt-4 text-xs">
                          <div className="text-center">
                            <div className="text-green-600 dark:text-green-400 font-medium">${cashRunwayData.currentCash.toFixed(0)}</div>
                            <div className="text-gray-500 dark:text-gray-400">Current Cash</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 dark:text-red-400 font-medium">${(cashRunwayData.netDailyBurn || 0).toFixed(0)}/day</div>
                            <div className="text-gray-500 dark:text-gray-400">Net Burn</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-700 dark:text-red-300 font-bold">{cashRunwayData.runwayDays} days</div>
                            <div className="text-gray-500 dark:text-gray-400">Remaining</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Recent Transactions</CardTitle>
                    <CardDescription>Latest customer payments and subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg border-amber-200 dark:border-gray-700 bg-amber-50 dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-500' : 
                              transaction.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{transaction.customer}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.plan}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No transactions available yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">Upload CSV data or connect payment gateways</p>
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
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Payment Methods</CardTitle>
                    <CardDescription>Distribution of payment methods used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] p-4">
                      {/* Payment Methods Bar Chart */}
                      {paymentMethods.length > 0 ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex items-end justify-center gap-8">
                            {paymentMethods.map((method, index) => {
                              const maxValue = Math.max(...paymentMethods.map(m => m.value))
                              const height = (method.value / maxValue) * 120
                              
                              return (
                                <div key={index} className="flex flex-col items-center">
                                  <div className="mb-2">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {method.value}%
                                    </div>
                                  </div>
                                  <div 
                                    className="w-16 rounded-t transition-all duration-300 hover:opacity-80"
                                    style={{ 
                                      height: `${height}px`,
                                      backgroundColor: method.color,
                                      minHeight: '20px'
                                    }}
                                  />
                                  <div className="mt-2 text-center">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {method.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {method.name === 'Stripe' ? '$8.5K' : method.name === 'Khalti' ? '$4.0K' : '$0.5K'}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        // Default realistic payment split when no data
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex items-end justify-center gap-8">
                            <div className="flex flex-col items-center">
                              <div className="mb-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">68%</div>
                              </div>
                              <div 
                                className="w-16 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                                style={{ height: '120px' }}
                              />
                              <div className="mt-2 text-center">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Stripe</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">$8.5K</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="mb-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">32%</div>
                              </div>
                              <div 
                                className="w-16 bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                                style={{ height: '56px' }}
                              />
                              <div className="mt-2 text-center">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Khalti</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">$4.0K</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {paymentMethods.length > 0 ? paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: method.color }}
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{method.name} ({method.value}%)</span>
                        </div>
                      )) : (
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                            <span className="text-sm text-gray-900 dark:text-white">Stripe (68%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                            <span className="text-sm text-gray-900 dark:text-white">Khalti (32%)</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {paymentMethods.length === 0 && (
                      <div className="text-center mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          No payment method data available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
        
        {/* CSV Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Financial Data</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Select Data Type
                      </label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value as 'stripe' | 'khalti' | 'expenses')}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="stripe">Stripe Revenue Data</option>
                        <option value="khalti">Khalti Revenue Data</option>
                        <option value="expenses">Expense Data</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        CSV File
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleCSVUpload(file, uploadType)
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                      />
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Expected CSV Format:</h4>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {uploadType === 'stripe' && (
                          <div>
                            <p><strong>Stripe:</strong> date, amount, description, customer_email</p>
                            <p>or: created_at, gross, description, customer_email</p>
                          </div>
                        )}
                        {uploadType === 'khalti' && (
                          <div>
                            <p><strong>Khalti:</strong> date, amount, description, customer_email</p>
                            <p>or: created_at, gross, description, customer_email</p>
                          </div>
                        )}
                        {uploadType === 'expenses' && (
                          <div>
                            <p><strong>Expenses:</strong> date, amount, description, category</p>
                            <p>Examples: office rent, marketing, software subscriptions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadModal(false)}
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
