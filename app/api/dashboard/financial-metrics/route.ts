import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        activeProductProfile: {
          include: {
            financialMetrics: {
              orderBy: { calculatedAt: 'desc' },
              take: 2 // Get current and previous for growth calculation
            }
          }
        }
      }
    })

    if (!user?.activeProductProfile) {
      return NextResponse.json({ error: 'No active product profile found' }, { status: 404 })
    }

    const metrics = user.activeProductProfile.financialMetrics
    
    if (metrics.length === 0) {
      return NextResponse.json({ 
        hasData: false,
        message: 'No financial data found. Please upload your transaction data first.'
      })
    }

    const currentMetrics = metrics[0]
    const previousMetrics = metrics[1] // May be undefined if only one record

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number | undefined) => {
      if (!previous || previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    // Extract total users from transactions (unique customers)
    const totalUsers = currentMetrics.activeSubscriptions || 0

    // Calculate conversion rate (simplified - could be enhanced with more data)
    const conversionRate = totalUsers > 0 ? (currentMetrics.activeSubscriptions / (totalUsers * 1.5)) * 100 : 0

    // Calculate churn rate (simplified - could be enhanced with historical data)
    const churnRate = currentMetrics.activeSubscriptions > 0 ? 
      Math.max(0, (1 - (currentMetrics.monthlyRecurringRevenue / (currentMetrics.averageRevenuePerUser * currentMetrics.activeSubscriptions))) * 100) : 
      0

    const financialMetrics = {
      monthlyRevenue: Math.round(currentMetrics.monthlyRecurringRevenue + currentMetrics.oneTimePayments),
      totalUsers: totalUsers,
      conversionRate: Math.min(conversionRate, 100), // Cap at 100%
      churnRate: Math.min(churnRate, 100), // Cap at 100%
      revenueGrowthRate: calculateGrowthRate(
        currentMetrics.monthlyRecurringRevenue + currentMetrics.oneTimePayments,
        previousMetrics ? previousMetrics.monthlyRecurringRevenue + previousMetrics.oneTimePayments : undefined
      ),
      userGrowthRate: calculateGrowthRate(
        totalUsers,
        previousMetrics?.activeSubscriptions
      ),
      conversionGrowthRate: calculateGrowthRate(
        conversionRate,
        previousMetrics ? (previousMetrics.activeSubscriptions / ((previousMetrics.activeSubscriptions || 1) * 1.5)) * 100 : undefined
      ),
      churnGrowthRate: calculateGrowthRate(
        churnRate,
        previousMetrics ? Math.max(0, (1 - (previousMetrics.monthlyRecurringRevenue / ((previousMetrics.averageRevenuePerUser || 1) * (previousMetrics.activeSubscriptions || 1)))) * 100) : undefined
      ),
      lastUpdated: currentMetrics.calculatedAt
    }

    return NextResponse.json({
      hasData: true,
      metrics: financialMetrics,
      lastUpdated: currentMetrics.calculatedAt
    })

  } catch (error) {
    console.error('Financial metrics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    )
  }
}
