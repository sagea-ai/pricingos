import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const prisma = new PrismaClient()

const setActiveSchema = z.object({
  productId: z.string().min(1, 'Product ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = setActiveSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { productId } = validationResult.data

    const result = await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { clerkId: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Verify product belongs to user
      const productProfile = await tx.productProfile.findFirst({
        where: { 
          id: productId,
          userId: user.id
        }
      })

      if (!productProfile) {
        throw new Error('Product profile not found')
      }

      // Set as active product
      await tx.user.update({
        where: { id: user.id },
        data: { activeProductProfileId: productId }
      })

      return { user, productProfile }
    })

    return NextResponse.json({ 
      success: true,
      activeProductId: productId,
      message: `Switched to ${result.productProfile.productName}`
    })
  } catch (error) {
    console.error('Set active product error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set active product', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
