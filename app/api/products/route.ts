import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

const productSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(100),
  coreValue: z.string().min(10, 'Core value description must be at least 10 characters').max(500),
  features: z.array(z.string()).min(1, 'At least one feature is required').max(10),
  market: z.string().optional(),
  currentPricingModel: z.string().optional(),
  currentPrice: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with their product profiles
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        productProfiles: {
          orderBy: { updatedAt: 'desc' }
        },
        activeProductProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      products: user.productProfiles.map(profile => ({
        id: profile.id,
        productName: profile.productName,
        coreValue: profile.coreValue,
        features: profile.features,
        market: profile.market,
        currentPricingModel: profile.currentPricingModel,
        currentPrice: profile.currentPrice,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        isActive: user.activeProductProfileId === profile.id
      })),
      activeProductId: user.activeProductProfileId
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch products', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = productSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { productName, coreValue, features, market, currentPricingModel, currentPrice } = validationResult.data
    const clerkUser = await currentUser()

    console.log('Creating product profile:', { productName, coreValue, features, market, currentPricingModel, currentPrice })

    const result = await prisma.$transaction(async (tx) => {
      // Ensure user exists
      const user = await tx.user.upsert({
        where: { clerkId: userId },
        update: { updatedAt: new Date() },
        create: {
          clerkId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          firstName: clerkUser?.firstName || null,
          lastName: clerkUser?.lastName || null,
          imageUrl: clerkUser?.imageUrl || null,
        }
      })

      // Create new product profile
      const productProfile = await tx.productProfile.create({
        data: {
          productName,
          coreValue,
          features,
          market,
          currentPricingModel,
          currentPrice,
          userId: user.id
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
          title: 'Product profile created',
          description: `Created product profile "${productName}" with ${features.length} features`,
          userId: user.id,
          metadata: {
            productProfileId: productProfile.id,
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

    console.log('Product profile created successfully:', { productProfileId: result.productProfile.id })

    return NextResponse.json({ 
      success: true,
      product: {
        id: result.productProfile.id,
        productName: result.productProfile.productName,
        coreValue: result.productProfile.coreValue,
        features: result.productProfile.features,
        market: result.productProfile.market,
        currentPricingModel: result.productProfile.currentPricingModel,
        currentPrice: result.productProfile.currentPrice,
        createdAt: result.productProfile.createdAt.toISOString(),
        updatedAt: result.productProfile.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Product profile creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create product profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}