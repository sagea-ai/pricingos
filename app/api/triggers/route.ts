import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TriggerCategory, TriggerSeverity } from '@prisma/client'
import { z } from 'zod'

const DEFAULT_TRIGGERS = [
  {
    triggerId: 'critical-cash-runway',
    name: 'Critical Cash Runway Alert',
    description: 'Send urgent email when cash runway drops below 7 days',
    category: TriggerCategory.FINANCIAL,
    severity: TriggerSeverity.CRITICAL,
    isEnabled: true,
    emailTemplate: 'critical-runway'
  },
  {
    triggerId: 'low-cash-runway',
    name: 'Low Cash Runway Warning',
    description: 'Send warning email when cash runway drops below 30 days',
    category: TriggerCategory.FINANCIAL,
    severity: TriggerSeverity.HIGH,
    isEnabled: true,
    emailTemplate: 'low-runway'
  },
  {
    triggerId: 'negative-mrr-growth',
    name: 'Negative MRR Growth',
    description: 'Alert when Monthly Recurring Revenue growth turns negative',
    category: TriggerCategory.FINANCIAL,
    severity: TriggerSeverity.HIGH,
    isEnabled: true,
    emailTemplate: 'negative-mrr'
  },
  {
    triggerId: 'high-churn-rate',
    name: 'High Churn Rate Alert',
    description: 'Send notification when customer churn rate exceeds 5%',
    category: TriggerCategory.USER,
    severity: TriggerSeverity.MEDIUM,
    isEnabled: false,
    emailTemplate: 'high-churn'
  },
  {
    triggerId: 'failed-payments',
    name: 'Failed Payment Alerts',
    description: 'Notify when payment failures exceed 10% of total transactions',
    category: TriggerCategory.FINANCIAL,
    severity: TriggerSeverity.HIGH,
    isEnabled: false,
    emailTemplate: 'failed-payments'
  },
  {
    triggerId: 'subscription-cancellations',
    name: 'Subscription Cancellation Spike',
    description: 'Alert when cancellations increase by more than 50% week-over-week',
    category: TriggerCategory.USER,
    severity: TriggerSeverity.MEDIUM,
    isEnabled: false,
    emailTemplate: 'subscription-cancellations'
  },
  {
    triggerId: 'revenue-milestone',
    name: 'Revenue Milestone Achievement',
    description: 'Celebrate when reaching monthly revenue goals (positive notifications)',
    category: TriggerCategory.FINANCIAL,
    severity: TriggerSeverity.LOW,
    isEnabled: true,
    emailTemplate: 'revenue-milestone'
  },
  {
    triggerId: 'new-customer-milestone',
    name: 'Customer Milestone',
    description: 'Notify when reaching customer count milestones (50, 100, 500, etc.)',
    category: TriggerCategory.USER,
    severity: TriggerSeverity.LOW,
    isEnabled: true,
    emailTemplate: 'customer-milestone'
  },
  {
    triggerId: 'integration-failures',
    name: 'Integration Failures',
    description: 'Alert when Stripe/Khalti API connections fail or sync errors occur',
    category: TriggerCategory.SYSTEM,
    severity: TriggerSeverity.HIGH,
    isEnabled: true,
    emailTemplate: 'integration-failures'
  },
  {
    triggerId: 'data-sync-delays',
    name: 'Data Sync Delays',
    description: 'Notify when financial data hasn\'t been updated for more than 24 hours',
    category: TriggerCategory.SYSTEM,
    severity: TriggerSeverity.MEDIUM,
    isEnabled: false,
    emailTemplate: 'data-sync-delays'
  }
] as const

const updateTriggerSchema = z.object({
  triggers: z.array(z.object({
    triggerId: z.string(),
    isEnabled: z.boolean()
  }))
})

// GET - Fetch trigger settings for organization
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // First get the user from Clerk ID
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

    const existingTriggers = await db.triggerSetting.findMany({
      where: {
        organizationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (existingTriggers.length === 0) {
      const defaultTriggers = await db.$transaction(
        DEFAULT_TRIGGERS.map(trigger =>
          db.triggerSetting.create({
            data: {
              ...trigger,
              organizationId
            }
          })
        )
      )
      return NextResponse.json({ triggers: defaultTriggers })
    }

    return NextResponse.json({ triggers: existingTriggers })
  } catch (error) {
    console.error('Failed to fetch trigger settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update trigger settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // First get the user from Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is member of organization
    const membership = await db.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { triggers } = updateTriggerSchema.parse(body)

    // Update trigger settings
    const updatePromises = triggers.map(({ triggerId, isEnabled }) =>
      db.triggerSetting.updateMany({
        where: {
          triggerId,
          organizationId
        },
        data: {
          isEnabled
        }
      })
    )

    await db.$transaction(updatePromises)

    // Fetch updated settings
    const updatedTriggers = await db.triggerSetting.findMany({
      where: {
        organizationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ 
      triggers: updatedTriggers,
      message: 'Trigger settings updated successfully'
    })
  } catch (error) {
    console.error('Failed to update trigger settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
