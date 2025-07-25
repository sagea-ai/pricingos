import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TriggerEvaluator } from '@/lib/trigger-evaluator'
import { z } from 'zod'

const evaluateSchema = z.object({
  organizationId: z.string(),
  triggerType: z.enum(['critical-cash-runway', 'low-cash-runway']),
  data: z.object({
    currentCashBalance: z.number(),
    monthlyBurnRate: z.number(),
    runwayDays: z.number()
  })
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, triggerType, data } = evaluateSchema.parse(body)

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const evaluator = new TriggerEvaluator(organizationId)
    let result

    const cashRunwayData = {
      organizationId,
      organizationName: organization.name,
      currentCashBalance: data.currentCashBalance,
      monthlyBurnRate: data.monthlyBurnRate,
      runwayDays: data.runwayDays
    }
    
    if (triggerType === 'critical-cash-runway') {
      result = await evaluator.evaluateCriticalCashRunway(cashRunwayData)
    } else if (triggerType === 'low-cash-runway') {
      result = await evaluator.evaluateLowCashRunway(cashRunwayData)
    }

    return NextResponse.json({
      success: true,
      triggerType,
      result
    })

  } catch (error) {
    console.error('Failed to evaluate trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
