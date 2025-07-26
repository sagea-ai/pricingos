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
        activeProductProfile: true
      }
    })

    if (!user?.activeProductProfile) {
      return NextResponse.json({ error: 'No active product profile found' }, { status: 404 })
    }

    const productProfile = user.activeProductProfile
    
    // Check if we have basic business metrics from onboarding
    if (productProfile.monthlyRevenue || productProfile.totalUsers || productProfile.averagePrice) {
      // Calculate realistic derived metrics based on business stage
      const stageMultipliers = {
        idea: { revenueGrowth: 0, userGrowth: 0 },
        building: { revenueGrowth: 0, userGrowth: 0 },
        launched: { revenueGrowth: 25, userGrowth: 30 },
        growing: { revenueGrowth: 15, userGrowth: 18 },
        established: { revenueGrowth: 8, userGrowth: 10 }
      }
      
      const multipliers = stageMultipliers[productProfile.businessStage as keyof typeof stageMultipliers] || stageMultipliers.launched
      
      const metrics = {
        monthlyRevenue: productProfile.monthlyRevenue || 0,
        totalUsers: productProfile.totalUsers || 0,
        averagePrice: productProfile.averagePrice || 0,
        businessStage: productProfile.businessStage,
        revenueGrowthRate: multipliers.revenueGrowth,
        userGrowthRate: multipliers.userGrowth,
        lastUpdated: productProfile.updatedAt,
        isEstimate: productProfile.isEstimate || true
      }
      
      return NextResponse.json({
        hasData: true,
        metrics,
        source: 'product_profile'
      })
    }
    
    return NextResponse.json({ 
      hasData: false,
      message: 'No business metrics found. Please add your basic metrics in the product profile.'
    })

  } catch (error) {
    console.error('Product metrics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product metrics' },
      { status: 500 }
    )
  }
}
