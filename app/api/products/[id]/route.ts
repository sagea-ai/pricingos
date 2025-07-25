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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get product profile
    const productProfile = await prisma.productProfile.findFirst({
      where: { 
        id: productId,
        userId: user.id
      }
    })

    if (!productProfile) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      product: {
        id: productProfile.id,
        productName: productProfile.productName,
        coreValue: productProfile.coreValue,
        features: productProfile.features,
        market: productProfile.market,
        currentPricingModel: productProfile.currentPricingModel,
        currentPrice: productProfile.currentPrice,
        createdAt: productProfile.createdAt.toISOString(),
        updatedAt: productProfile.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch product', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id
    const body = await request.json()
    const validationResult = productSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { productName, coreValue, features, market, currentPricingModel, currentPrice } = validationResult.data

    console.log('Updating product profile:', { productId, productName, coreValue, features, market, currentPricingModel, currentPrice })

    const result = await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { clerkId: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if product profile exists and belongs to user
      const existingProductProfile = await tx.productProfile.findFirst({
        where: { 
          id: productId,
          userId: user.id
        }
      })

      if (!existingProductProfile) {
        throw new Error('Product profile not found')
      }

      // Update product profile
      const productProfile = await tx.productProfile.update({
        where: { id: productId },
        data: {
          productName,
          coreValue,
          features,
          market,
          currentPricingModel,
          currentPrice,
          updatedAt: new Date()
        }
      })

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'PRODUCT_PROFILE_CREATED',
          title: 'Product profile updated',
          description: `Updated product profile "${productName}"`,
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

    console.log('Product profile updated successfully:', { productProfileId: result.productProfile.id })

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
    console.error('Product profile update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update product profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id

    console.log('Deleting product profile:', { productId })

    const result = await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { clerkId: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if product profile exists and belongs to user
      const existingProductProfile = await tx.productProfile.findFirst({
        where: { 
          id: productId,
          userId: user.id
        }
      })

      if (!existingProductProfile) {
        throw new Error('Product profile not found')
      }

      // Delete product profile
      await tx.productProfile.delete({
        where: { id: productId }
      })

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'PRODUCT_PROFILE_CREATED',
          title: 'Product profile deleted',
          description: `Deleted product profile "${existingProductProfile.productName}"`,
          userId: user.id,
          metadata: {
            productProfileId: existingProductProfile.id,
            productName: existingProductProfile.productName
          }
        }
      })

      return { user, productProfile: existingProductProfile }
    }, {
      timeout: 10000
    })

    console.log('Product profile deleted successfully:', { productId })

    return NextResponse.json({ 
      success: true,
      message: 'Product profile deleted successfully'
    })
  } catch (error) {
    console.error('Product profile deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete product profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}