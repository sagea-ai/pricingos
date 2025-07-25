import { Resend } from 'resend'
import { TriggerSeverity } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplateData {
  organizationName: string
  userName: string
  value: number
  threshold?: number
  previousValue?: number
  [key: string]: any
}

const EMAIL_TEMPLATES = {
  'critical-runway': {
    subject: '🚨 CRITICAL: Cash Runway Alert',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #dc2626;">Critical Cash Runway Alert</h2>
      <p>Hello ${data.userName},</p>
      <p><strong>URGENT:</strong> Your organization "${data.organizationName}" has a critically low cash runway of only <strong>${data.value} days</strong>.</p>
      <p>Immediate action is required to secure additional funding or reduce expenses.</p>
      <p>This alert was triggered because your runway dropped below 7 days.</p>
    `
  },
  'low-runway': {
    subject: '⚠️ Low Cash Runway Warning',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #f59e0b;">Low Cash Runway Warning</h2>
      <p>Hello ${data.userName},</p>
      <p>Your organization "${data.organizationName}" has a low cash runway of <strong>${data.value} days</strong>.</p>
      <p>Consider reviewing your financial strategy and exploring funding options.</p>
    `
  },
  'negative-mrr': {
    subject: '📉 Negative MRR Growth Alert',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #dc2626;">Negative MRR Growth Detected</h2>
      <p>Hello ${data.userName},</p>
      <p>Your Monthly Recurring Revenue has declined by <strong>${Math.abs(data.value)}%</strong> for "${data.organizationName}".</p>
      <p>Previous period: $${data.previousValue?.toLocaleString()}</p>
      <p>Current period: $${((data.previousValue || 0) * (1 + data.value / 100)).toLocaleString()}</p>
    `
  },
  'high-churn': {
    subject: '👥 High Churn Rate Alert',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #f59e0b;">High Customer Churn Rate</h2>
      <p>Hello ${data.userName},</p>
      <p>Customer churn rate for "${data.organizationName}" has reached <strong>${data.value}%</strong>, exceeding the 5% threshold.</p>
    `
  },
  'failed-payments': {
    subject: '💳 Failed Payment Alert',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #dc2626;">High Payment Failure Rate</h2>
      <p>Hello ${data.userName},</p>
      <p>Payment failures for "${data.organizationName}" have reached <strong>${data.value}%</strong> of total transactions.</p>
    `
  },
  'subscription-cancellations': {
    subject: '📊 Subscription Cancellation Spike',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #f59e0b;">Subscription Cancellation Increase</h2>
      <p>Hello ${data.userName},</p>
      <p>Subscription cancellations for "${data.organizationName}" increased by <strong>${data.value}%</strong> week-over-week.</p>
    `
  },
  'revenue-milestone': {
    subject: '🎉 Revenue Milestone Achieved!',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #16a34a;">Congratulations! Revenue Milestone Reached</h2>
      <p>Hello ${data.userName},</p>
      <p>Great news! "${data.organizationName}" has reached a monthly revenue of <strong>$${data.value.toLocaleString()}</strong>!</p>
    `
  },
  'customer-milestone': {
    subject: '🎯 Customer Milestone Achieved!',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #16a34a;">Customer Milestone Reached</h2>
      <p>Hello ${data.userName},</p>
      <p>Fantastic! "${data.organizationName}" now has <strong>${data.value}</strong> customers!</p>
    `
  },
  'integration-failures': {
    subject: '🔧 Integration Failure Alert',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #dc2626;">Integration Failure Detected</h2>
      <p>Hello ${data.userName},</p>
      <p>There are issues with payment integrations for "${data.organizationName}". Please check your Stripe/Khalti connections.</p>
    `
  },
  'data-sync-delays': {
    subject: '⏰ Data Sync Delay Warning',
    html: (data: EmailTemplateData) => `
      <h2 style="color: #f59e0b;">Data Sync Delay</h2>
      <p>Hello ${data.userName},</p>
      <p>Financial data for "${data.organizationName}" hasn't been updated for more than 24 hours.</p>
    `
  }
}

export async function sendTriggerNotification(
  triggerId: string,
  recipientEmail: string,
  templateData: EmailTemplateData
) {
  const template = EMAIL_TEMPLATES[triggerId as keyof typeof EMAIL_TEMPLATES]
  
  if (!template) {
    throw new Error(`Email template not found for trigger: ${triggerId}`)
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com',
      to: recipientEmail,
      subject: template.subject,
      html: template.html(templateData)
    })

    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
