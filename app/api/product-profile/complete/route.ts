import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

const productProfileSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100),
  coreValue: z.string().min(10, 'Core value description must be at least 10 characters').max(500),
  features: z.array(z.string()).min(1, 'At least one feature is required').max(10),
  market: z.string().optional(),
  currentPricingModel: z.string().optional(),
  currentPrice: z.string().optional()
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

    const { productName, coreValue, features, market, currentPricingModel, currentPrice } = validationResult.data
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
          currentPrice
        }
      })

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