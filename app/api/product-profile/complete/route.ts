import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const prisma = new PrismaClient()

const productProfileSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100),
  coreValue: z.string().min(10, 'Core value description must be at least 10 characters').max(500),
  features: z.array(z.string()).min(1, 'At least one feature is required').max(10),
  market: z.string().optional(),
  currentPricingModel: z.string().optional(),
  currentPrice: z.string().optional(),
  monthlyRevenue: z.number().optional(),
  totalUsers: z.number().optional(),
  averagePrice: z.number().optional(),
  businessStage: z.enum(['idea', 'building', 'launched', 'growing', 'established']).optional(),
  isEstimate: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = productProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { 
      productName, 
      coreValue, 
      features, 
      market, 
      currentPricingModel, 
      currentPrice,
      monthlyRevenue,
      totalUsers,
      averagePrice,
      businessStage,
      isEstimate
    } = validationResult.data
    const clerkUser = await currentUser()

    console.log('Product profile data received:', { productName, coreValue, features, market, currentPricingModel, currentPrice })

    const result = await prisma.$transaction(async (tx) => {
      // Upsert user to ensure they exist
      const user = await tx.user.upsert({
        where: { clerkId: userId },
        update: {
          updatedAt: new Date()
        },
        create: {
          clerkId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          firstName: clerkUser?.firstName || null,
          lastName: clerkUser?.lastName || null,
          imageUrl: clerkUser?.imageUrl || null,
        }
      })

      // Create new product profile (allow multiple)
      const productProfile = await tx.productProfile.create({
        data: {
          userId: user.id,
          productName,
          coreValue,
          features,
          market,
          currentPricingModel,
          currentPrice,
          monthlyRevenue,
          totalUsers,
          averagePrice,
          businessStage,
          isEstimate
        }
      })

      // If we have basic metrics, create calculated financial metrics
      if (monthlyRevenue || totalUsers || averagePrice) {
        await createEstimatedFinancialMetrics(productProfile.id, user.id, {
          monthlyRevenue,
          totalUsers,
          averagePrice,
          businessStage
        })
      }

      // Set as active product if user doesn't have one
      if (!user.activeProductProfileId) {
        await tx.user.update({
          where: { id: user.id },
          data: { activeProductProfileId: productProfile.id }
        })
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'PRODUCT_PROFILE_CREATED',
          title: 'Product profile defined',
          description: `Defined vessel "${productName}" with ${features.length} special abilities`,
          userId: user.id,
          metadata: {
            productName,
            coreValue,
            featuresCount: features.length,
            market,
            currentPricingModel,
            currentPrice
          }
        }
      })

      return { user, productProfile }
    }, {
      timeout: 10000
    })

    console.log('Product profile completed successfully:', { productProfileId: result.productProfile.id })

    return NextResponse.json({ 
      success: true,
      productProfile: {
        id: result.productProfile.id,
        productName: result.productProfile.productName
      }
    })
  } catch (error) {
    console.error('Product profile completion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete product profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function createEstimatedFinancialMetrics(
  productProfileId: string, 
  userId: string, 
  data: any
) {
  const { monthlyRevenue, totalUsers, averagePrice, businessStage } = data
  
  // Calculate realistic metrics based on provided data
  const calculatedRevenue = monthlyRevenue || (totalUsers && averagePrice ? totalUsers * averagePrice : 0)
  const calculatedUsers = totalUsers || (monthlyRevenue && averagePrice ? Math.floor(monthlyRevenue / averagePrice) : 0)
  const calculatedARPU = averagePrice || (monthlyRevenue && calculatedUsers ? monthlyRevenue / calculatedUsers : 0)
  
  // Estimate other metrics based on business stage
  const stageMultipliers = {
    idea: { churnRate: 0, conversionRate: 0, growthRate: 0 },
    building: { churnRate: 0, conversionRate: 0, growthRate: 0 },
    launched: { churnRate: 15, conversionRate: 1.5, growthRate: 25 },
    growing: { churnRate: 8, conversionRate: 3.2, growthRate: 15 },
    established: { churnRate: 5, conversionRate: 4.5, growthRate: 8 }
  }
  
  const multipliers = stageMultipliers[businessStage as keyof typeof stageMultipliers] || stageMultipliers.launched
  
  // Create estimated financial metrics
  await db.financialMetrics.create({
    data: {
      productProfileId,
      userId,
      totalRevenue: calculatedRevenue * 6, // Assume 6 months of data
      monthlyRecurringRevenue: calculatedRevenue * 0.8, // 80% recurring
      oneTimePayments: calculatedRevenue * 0.2, // 20% one-time
      averageRevenuePerUser: calculatedARPU,
      activeSubscriptions: calculatedUsers,
      revenueGrowthRate: multipliers.growthRate,
      mrrGrowthRate: multipliers.growthRate * 0.8,
      subscriptionGrowthRate: multipliers.growthRate * 1.2,
      totalExpenses: calculatedRevenue * 4, // Assume 4 months of expenses
      monthlyExpenses: calculatedRevenue * 0.7, // 70% of revenue as expenses
      currentCash: calculatedRevenue * 3, // 3 months of revenue as cash
      monthlyBurnRate: calculatedRevenue * 0.7,
      dailyBurnRate: (calculatedRevenue * 0.7) / 30,
      dailyRevenue: calculatedRevenue / 30,
      netDailyBurn: ((calculatedRevenue * 0.7) - calculatedRevenue) / 30,
      runwayMonths: calculatedRevenue > 0 ? (calculatedRevenue * 3) / (calculatedRevenue * 0.3) : 0,
      runwayDays: calculatedRevenue > 0 ? Math.floor(((calculatedRevenue * 3) / (calculatedRevenue * 0.3)) * 30) : 0,
      transactionCount: calculatedUsers * 3 // Assume 3 transactions per user
    }
  })
}