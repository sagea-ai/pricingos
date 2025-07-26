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
    const productProfile = user.activeProductProfile
    
    if (metrics.length === 0) {
      // If no financial metrics but we have basic data, create estimates
      if (productProfile.monthlyRevenue || productProfile.totalUsers || productProfile.averagePrice) {
        const monthlyRevenue = productProfile.monthlyRevenue || 0
        const totalUsers = productProfile.totalUsers || 0
        const averagePrice = productProfile.averagePrice || 0
        
        // Calculate realistic derived metrics based on business stage
        const stageMultipliers = {
          idea: { conversionRate: 0, churnRate: 0, revenueGrowth: 0, userGrowth: 0 },
          building: { conversionRate: 0, churnRate: 0, revenueGrowth: 0, userGrowth: 0 },
          launched: { conversionRate: 1.5, churnRate: 15, revenueGrowth: 25, userGrowth: 30 },
          growing: { conversionRate: 3.2, churnRate: 8, revenueGrowth: 15, userGrowth: 18 },
          established: { conversionRate: 4.5, churnRate: 5, revenueGrowth: 8, userGrowth: 10 }
        }
        
        const multipliers = stageMultipliers[productProfile.businessStage as keyof typeof stageMultipliers] || stageMultipliers.launched
        
        const estimatedMetrics = {
          monthlyRevenue: monthlyRevenue,
          totalUsers: totalUsers,
          conversionRate: multipliers.conversionRate,
          churnRate: multipliers.churnRate,
          revenueGrowthRate: multipliers.revenueGrowth,
          userGrowthRate: multipliers.userGrowth,
          conversionGrowthRate: 5,
          churnGrowthRate: -2,
          lastUpdated: new Date(),
          // Additional context
          averagePrice: averagePrice,
          businessStage: productProfile.businessStage
        }
        
        return NextResponse.json({
          hasData: true,
          metrics: estimatedMetrics,
          isEstimate: true,
          source: 'product_profile'
        })
      }
      
      return NextResponse.json({ 
        hasData: false,
        message: 'No financial data found. Please add your business metrics or upload CSV data.'
      })
    }

    // If we have CSV-based financial metrics, use those
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
      lastUpdated: currentMetrics.calculatedAt,
      source: 'csv_upload'
    })

  } catch (error) {
    console.error('Financial metrics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    )
  }
}
