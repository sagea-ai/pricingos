import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmailSchema = z.object({
  triggerId: z.string(),
  organizationId: z.string(),
  recipientEmail: z.string().email(),
  data: z.record(z.any()).optional() 
})

const EMAIL_TEMPLATES = {
  'critical-runway': {
    subject: '🚨 URGENT: Critical Cash Runway Alert',
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 24px;">🚨 CRITICAL CASH RUNWAY ALERT</h1>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            <strong>Alert:</strong> Your cash runway has dropped to a critical level!
          </p>
          
          <div style="background: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">
              ⚠️ Current Runway: ${data?.daysRemaining || 'Unknown'} days remaining
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            This is an urgent notification that your business may run out of cash within the next week. 
            Immediate action is recommended:
          </p>
          
          <ul style="color: #374151; line-height: 1.6;">
            <li>Review and reduce non-essential expenses</li>
            <li>Accelerate revenue collection from outstanding invoices</li>
            <li>Consider emergency funding options</li>
            <li>Contact your financial advisor or accountant</li>
          </ul>
          
          <div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This alert was triggered automatically based on your financial data. 
              You can adjust your notification preferences in your dashboard.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/finances" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; 
                    border-radius: 6px; display: inline-block; font-weight: 500;">
            View Financial Dashboard
          </a>
        </div>
      </div>
    `
  },
  
  'low-runway': {
    subject: '⚠️ Low Cash Runway Warning',
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #d97706; margin: 0; font-size: 24px;">⚠️ Low Cash Runway Warning</h1>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            Your cash runway is running low and requires attention.
          </p>
          
          <div style="background: #fffbeb; padding: 16px; border-radius: 6px; border-left: 4px solid #d97706; margin: 16px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">
              📊 Current Runway: ${data?.daysRemaining || 'Unknown'} days remaining
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            While not immediately critical, it's important to start planning for cash flow improvements:
          </p>
          
          <ul style="color: #374151; line-height: 1.6;">
            <li>Review upcoming expenses and prioritize essential items</li>
            <li>Follow up on outstanding invoices</li>
            <li>Explore opportunities to increase revenue</li>
            <li>Consider discussing financing options with your bank</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/finances" 
             style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; 
                    border-radius: 6px; display: inline-block; font-weight: 500;">
            View Financial Dashboard
          </a>
        </div>
      </div>
    `
  },
  
  'negative-mrr': {
    subject: '📉 Negative MRR Growth Alert',
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 24px;">📉 Negative MRR Growth Alert</h1>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            Your Monthly Recurring Revenue (MRR) growth has turned negative.
          </p>
          
          <div style="background: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">
              📊 MRR Growth: ${data?.mrrGrowth || 'Unknown'}% this month
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            This indicates that you're losing more revenue than you're gaining. Consider these actions:
          </p>
          
          <ul style="color: #374151; line-height: 1.6;">
            <li>Analyze customer churn patterns</li>
            <li>Review and improve customer retention strategies</li>
            <li>Focus on upselling existing customers</li>
            <li>Evaluate your pricing strategy</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/finances" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; 
                    border-radius: 6px; display: inline-block; font-weight: 500;">
            View Financial Dashboard
          </a>
        </div>
      </div>
    `
  }
}

// POST - Send trigger email
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { triggerId, organizationId, recipientEmail, data } = sendEmailSchema.parse(body)

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

    // Check if trigger is enabled
    const triggerSetting = await db.triggerSetting.findUnique({
      where: {
        triggerId_organizationId: {
          triggerId,
          organizationId
        }
      }
    })

    if (!triggerSetting || !triggerSetting.isEnabled) {
      return NextResponse.json({ error: 'Trigger is not enabled' }, { status: 400 })
    }

    // Get email template
    const template = EMAIL_TEMPLATES[triggerId as keyof typeof EMAIL_TEMPLATES]
    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 400 })
    }

    try {
      // Send email with Resend
      const emailResult = await resend.emails.send({
        from: 'PricingOS <noreply@basabjha.com.np>',
        to: [recipientEmail],
        subject: template.subject,
        html: template.getHtml(data || {})
      })

      // Log the email
      await db.triggerEmailLog.create({
        data: {
          triggerSettingId: triggerSetting.id,
          recipientEmail,
          subject: template.subject,
          emailTemplate: triggerId,
          status: 'sent',
          resendId: emailResult.data?.id
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailId: emailResult.data?.id
      })

    } catch (emailError) {
      // Log failed email
      await db.triggerEmailLog.create({
        data: {
          triggerSettingId: triggerSetting.id,
          recipientEmail,
          subject: template.subject,
          emailTemplate: triggerId,
          status: 'failed',
          errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error'
        }
      })

      console.error('Failed to send email:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get email logs for a trigger
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const triggerId = searchParams.get('triggerId')

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

    const whereClause: any = {
      triggerSetting: {
        organizationId
      }
    }

    if (triggerId) {
      whereClause.triggerSetting.triggerId = triggerId
    }

    const emailLogs = await db.triggerEmailLog.findMany({
      where: whereClause,
      include: {
        triggerSetting: true
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 50 // Limit to last 50 emails
    })

    return NextResponse.json({ emailLogs })

  } catch (error) {
    console.error('Failed to fetch email logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
