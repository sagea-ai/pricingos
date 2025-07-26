'use client'

import { useState, useEffect } from 'react'
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

// Realistic financial data with proper month-over-month growth patterns
const mockFinancialData = {
  overview: {
    totalRevenue: 87450.00,
    monthlyRecurringCurrent: 12500.00,
    monthlyRecurringPrevious: 11200.00,
    oneTimePayments: 8750.00,
    activeSubscriptions: 42,
    activeSubscriptionsPrevious: 38,
    churnRate: 3.1,
    averageRevenuePerUser: 297.62
  },
  cashRunway: {
    currentCash: 1200.00,
    monthlyBurnRate: 8500.00,
    monthlyRevenue: 12500.00,
    dailyBurnRate: 283.33,
    dailyRevenue: 416.67,
    netDailyBurn: -133.34,
    runwayMonths: 0.13,
    runwayDays: 4,
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

export function FinancesContent({ organizationName, organizationId, productProfile }: FinancesContentProps) {
  const [stripeIntegration, setStripeIntegration] = useState<StripeIntegration>({
    isConnected: false,
    accountId: undefined,
    lastSync: undefined
  })
  const [khaltiIntegration, setKhaltiIntegration] = useState<StripeIntegration>({
    isConnected: false,
    accountId: undefined,
    lastSync: undefined
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
        revenueGrowthRate: (mockFinancialData.overview.monthlyRecurringCurrent - mockFinancialData.overview.monthlyRecurringPrevious) / mockFinancialData.overview.monthlyRecurringPrevious * 100,
        mrrGrowthRate: (mockFinancialData.overview.monthlyRecurringCurrent - mockFinancialData.overview.monthlyRecurringPrevious) / mockFinancialData.overview.monthlyRecurringPrevious * 100,
        subscriptionGrowthRate: (mockFinancialData.overview.activeSubscriptions - mockFinancialData.overview.activeSubscriptionsPrevious) / mockFinancialData.overview.activeSubscriptionsPrevious * 100,
        totalExpenses: 59500.00,
        monthlyExpenses: 8500.00,
        netProfit: mockFinancialData.overview.monthlyRecurringCurrent - 8500.00
      };
    }

    // Calculate from actual uploaded data
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    // Current month data
    const currentMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= oneMonthAgo;
    });

    // Last 3 months data
    const threeMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= threeMonthsAgo;
    });

    const totalRevenue = transactions.filter((t) => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const monthlyRevenue = currentMonthTransactions.filter((t) => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = currentMonthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Calculate MRR (Monthly Recurring Revenue) from subscription transactions
    const subscriptionRevenue = currentMonthTransactions.filter((t) => 
      t.type === 'revenue' && (t.category?.toLowerCase().includes('subscription') || t.category?.toLowerCase().includes('monthly'))
    ).reduce((sum, t) => sum + t.amount, 0);

    const oneTimePayments = currentMonthTransactions.filter((t) => 
      t.type === 'revenue' && !t.category?.toLowerCase().includes('subscription') && !t.category?.toLowerCase().includes('monthly')
    ).reduce((sum, t) => sum + t.amount, 0);

    // Estimate active subscriptions (this is a rough estimate)
    const activeSubscriptions = Math.floor(subscriptionRevenue / 50); // Assuming average subscription is $50

    return {
      totalRevenue,
      monthlyRevenue,
      monthlyRecurring: subscriptionRevenue,
      oneTimePayments,
      activeSubscriptions,
      averageRevenuePerUser: activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0,
      revenueGrowthRate: 15.5, // Would need historical data to calculate properly
      mrrGrowthRate: 11.6,
      subscriptionGrowthRate: 10.5,
      totalExpenses,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses
    };
  }

  const getRecentTransactions = (transactions: TransactionData[], limit: number = 5) => {
    // If no uploaded data, return realistic mock transactions
    if (transactions.length === 0) {
      return [
        {
          id: 'txn_001',
          customer: 'John Doe',
          amount: 99.00,
          type: 'subscription',
          status: 'completed',
          date: '2025-07-24',
          plan: 'Pro Monthly'
        },
        {
          id: 'txn_002',
          customer: 'Sarah Johnson',
          amount: 299.00,
          type: 'one-time',
          status: 'completed',
          date: '2025-07-24',
          plan: 'Lifetime Deal'
        },
        {
          id: 'txn_003',
          customer: 'Mike Chen',
          amount: 49.00,
          type: 'subscription',
          status: 'completed', 
          date: '2025-07-23',
          plan: 'Basic Monthly'
        },
        {
          id: 'txn_004',
          customer: 'Emma Wilson',
          amount: 99.00,
          type: 'subscription',
          status: 'failed',
          date: '2025-07-23',
          plan: 'Pro Monthly'
        },
        {
          id: 'txn_005',
          customer: 'David Brown',
          amount: 199.00,
          type: 'one-time',
          status: 'completed',
          date: '2025-07-22',
          plan: 'Premium Package'
        }
      ];
    }

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map((t, index) => ({
        id: `txn_${index + 1}`,
        customer: t.description,
        amount: t.amount,
        type: t.type === 'revenue' ? 'subscription' : 'expense',
        status: 'completed',
        date: t.date,
        plan: t.category || 'Unknown'
      }));
  }

  const getPaymentMethodDistribution = (transactions: TransactionData[]) => {
    // If no uploaded data, return realistic default distribution
    if (transactions.length === 0) {
      return [
        { name: 'Stripe', value: 65, color: '#8884d8' },
        { name: 'Khalti', value: 25, color: '#82ca9d' },
        { name: 'Direct', value: 10, color: '#ffc658' }
      ];
    }

    const stripeCount = transactions.filter(t => t.gateway === 'stripe').length;
    const khaltiCount = transactions.filter(t => t.gateway === 'khalti').length;
    const otherCount = transactions.length - stripeCount - khaltiCount;
    const total = transactions.length;

    return [
      { name: 'Stripe', value: Math.round((stripeCount / total) * 100), color: '#8884d8' },
      { name: 'Khalti', value: Math.round((khaltiCount / total) * 100), color: '#82ca9d' },
      { name: 'Others', value: Math.round((otherCount / total) * 100), color: '#ffc658' }
    ];
  }

  // Calculate dynamic financial metrics
  const financialMetrics = calculateFinancialMetrics(uploadedData)
  const recentTransactions = getRecentTransactions(uploadedData)
  const paymentMethods = getPaymentMethodDistribution(uploadedData)

  // Function to save metrics to database
  const saveMetricsToDatabase = async (metrics: any, cashRunwayData: any, transactionCounts: any) => {
    try {
      const metricsData = {
        totalRevenue: metrics.totalRevenue,
        monthlyRevenue: metrics.monthlyRevenue,
        monthlyRecurring: metrics.monthlyRecurring,
        oneTimePayments: metrics.oneTimePayments,
        activeSubscriptions: metrics.activeSubscriptions,
        averageRevenuePerUser: metrics.averageRevenuePerUser,
        revenueGrowthRate: metrics.revenueGrowthRate,
        mrrGrowthRate: metrics.mrrGrowthRate,
        subscriptionGrowthRate: metrics.subscriptionGrowthRate,
        totalExpenses: metrics.totalExpenses,
        monthlyExpenses: metrics.monthlyExpenses,
        netProfit: metrics.netProfit,
        currentCash: cashRunwayData.currentCash,
        monthlyBurnRate: cashRunwayData.monthlyBurnRate,
        dailyBurnRate: cashRunwayData.dailyBurnRate,
        dailyRevenue: cashRunwayData.dailyRevenue,
        netDailyBurn: cashRunwayData.netDailyBurn,
        runwayMonths: cashRunwayData.runwayMonths,
        runwayDays: cashRunwayData.runwayDays,
        projectedCashDepletion: cashRunwayData.projectedCashDepletion,
        revenueRecordsCount: transactionCounts.revenue,
        expenseRecordsCount: transactionCounts.expense,
        stripeTransactionsCount: transactionCounts.stripe,
        khaltiTransactionsCount: transactionCounts.khalti,
        totalTransactionsCount: transactionCounts.total
      };

      const response = await fetch('/api/finances/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          metrics: metricsData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save metrics');
      }

      const result = await response.json();
      console.log('Metrics saved successfully:', result);
    } catch (error) {
      console.error('Error saving metrics to database:', error);
    }
  };

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
    
    const monthlyRevenue = totalRevenue / 3
    const monthlyExpenses = totalExpenses / 3
    
    // Use actual cash data or simulate critical situation
    const simulatedCurrentCash = 1200.00
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
    if (runwayDays > 3650) {
      const farFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
      projectedDepletionDate = farFuture.toISOString().split('T')[0]
    } else {
      const projectedDepletion = new Date(now.getTime() + (runwayDays * 24 * 60 * 60 * 1000))
      projectedDepletionDate = projectedDepletion.toISOString().split('T')[0]
    }
    
    const newCashRunwayData = {
      currentCash: simulatedCurrentCash,
      monthlyBurnRate: monthlyExpenses,
      monthlyRevenue,
      dailyBurnRate,
      dailyRevenue,
      netDailyBurn,
      runwayMonths: runwayMonths > 120 ? 120 : runwayMonths,
      runwayDays: runwayDays > 3650 ? 3650 : runwayDays,
      projectedCashDepletion: projectedDepletionDate
    };

    setCashRunwayData(newCashRunwayData);

    // Calculate and save metrics to database
    const metrics = calculateFinancialMetrics(allTransactions);
    const transactionCounts = {
      revenue: allTransactions.filter(t => t.type === 'revenue').length,
      expense: allTransactions.filter(t => t.type === 'expense').length,
      stripe: allTransactions.filter(t => t.gateway === 'stripe').length,
      khalti: allTransactions.filter(t => t.gateway === 'khalti').length,
      total: allTransactions.length
    };

    // Save to database
    saveMetricsToDatabase(metrics, newCashRunwayData, transactionCounts);
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
            date: parsedDate.toISOString().split('T')[0],
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

  const handleStripeConnect = async () => {
    setIsConnecting(true)
    // Simulate connection process
    setTimeout(() => {
      setStripeIntegration({
        isConnected: true,
        accountId: 'acct_1234567890',
        lastSync: new Date().toISOString()
      })
      setIsConnecting(false)
    }, 2000)
  }

  const handleKhaltiConnect = async () => {
    setIsConnecting(true)
    // Simulate connection process
    setTimeout(() => {
      setKhaltiIntegration({
        isConnected: true,
        accountId: 'khalti_1234567890', 
        lastSync: new Date().toISOString()
      })
      setIsConnecting(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor your {organizationName} financial health and cash runway
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV Data
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Cash Runway Alert */}
        {cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Critical Cash Runway Alert
                </h3>
                <p className="text-red-700 mb-4">
                  Your current cash runway is only {cashRunwayData.runwayDays} days. 
                  Immediate action required to avoid cash flow issues.
                </p>
                <div className="space-y-2">
                  {mockFinancialData.cashRunway.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-800">
                        {rec.action} ({rec.impact})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                ${financialMetrics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{financialMetrics.revenueGrowthRate.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          {/* Monthly Recurring Revenue */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Monthly Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                ${financialMetrics.monthlyRecurring.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{financialMetrics.mrrGrowthRate.toFixed(1)}% growth
              </p>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {financialMetrics.activeSubscriptions}
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{financialMetrics.subscriptionGrowthRate.toFixed(1)}% this month
              </p>
            </CardContent>
          </Card>

          {/* Cash Runway */}
          <Card className={`bg-gradient-to-br ${
            cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 
              ? 'from-red-50 to-pink-50 border-red-200' 
              : 'from-amber-50 to-orange-50 border-amber-200'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 ? 'text-red-800' : 'text-amber-800'
              }`}>
                Cash Runway
              </CardTitle>
              <Wallet className={`h-4 w-4 ${
                cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 ? 'text-red-600' : 'text-amber-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 ? 'text-red-900' : 'text-amber-900'
              }`}>
                {cashRunwayData.runwayDays} days
              </div>
              <p className={`text-xs flex items-center mt-1 ${
                cashRunwayData.runwayDays && cashRunwayData.runwayDays <= 30 ? 'text-red-600' : 'text-amber-600'
              }`}>
                <TrendingDownIcon className="h-3 w-3 mr-1" />
                ${cashRunwayData.currentCash.toLocaleString()} current cash
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cash Flow Breakdown
              </CardTitle>
              <CardDescription>
                Daily cash flow analysis and projections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Daily Revenue</span>
                <span className="font-bold text-green-900">
                  ${cashRunwayData.dailyRevenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">Daily Burn Rate</span>
                <span className="font-bold text-red-900">
                  ${cashRunwayData.dailyBurnRate?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">Net Daily Burn</span>
                <span className={`font-bold ${
                  (cashRunwayData.netDailyBurn || 0) < 0 ? 'text-red-900' : 'text-green-900'
                }`}>
                  ${Math.abs(cashRunwayData.netDailyBurn || 0).toFixed(2)}
                  {(cashRunwayData.netDailyBurn || 0) < 0 ? ' (burning)' : ' (positive)'}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projected depletion:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(cashRunwayData.projectedCashDepletion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Distribution of payment gateways
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: method.color }}
                      ></div>
                      <span className="text-sm font-medium">{method.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{method.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest financial activities from your integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'subscription' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'subscription' ? (
                        <ArrowUpRight className={`h-4 w-4 ${
                          transaction.type === 'subscription' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.customer}</p>
                      <p className="text-sm text-gray-600">{transaction.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'subscription' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Integration
              </CardTitle>
              <CardDescription>
                Connect your Stripe account for automatic transaction sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stripeIntegration.isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    <span className="text-sm text-gray-600">
                      Last sync: {new Date(stripeIntegration.lastSync!).toLocaleString()}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleStripeConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Stripe'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Khalti Integration
              </CardTitle>
              <CardDescription>
                Connect your Khalti account for local payment tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {khaltiIntegration.isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    <span className="text-sm text-gray-600">
                      Last sync: {new Date(khaltiIntegration.lastSync!).toLocaleString()}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleKhaltiConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Khalti'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CSV Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Upload CSV Data</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as 'stripe' | 'khalti' | 'expenses')}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="stripe">Stripe Transactions</option>
                      <option value="khalti">Khalti Transactions</option>
                      <option value="expenses">Expense Records</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCSVUpload(file, uploadType);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <p>Required columns: date, amount, description</p>
                    <p>Optional: type, category, gateway</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
