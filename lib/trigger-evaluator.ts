import { db } from './db'
import { sendEmail } from '@/lib/resend'
import { getCriticalRunwayTemplate, getLowRunwayTemplate } from '@/lib/email-templates'

interface TriggerEvaluationResult {
  triggered: boolean
  value?: number
  previousValue?: number
  message?: string
}

interface CashRunwayData {
  organizationId: string
  organizationName: string
  currentCashBalance: number
  monthlyBurnRate: number
  runwayDays: number
  monthlyRevenue?: number
}

export class TriggerEvaluator {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  async evaluateAllTriggers() {
    // Check if trigger settings table exists, if not, create default settings
    const enabledTriggers = await this.getOrCreateTriggerSettings()

    const results: Array<{
      triggerId: string
      triggered: boolean
      data?: any
    }> = []

    for (const trigger of enabledTriggers) {
      try {
        const evaluation = await this.evaluateTrigger(trigger.triggerId)
        if (evaluation.triggered) {
          await this.sendNotification(trigger.triggerId, evaluation)
          results.push({
            triggerId: trigger.triggerId,
            triggered: true,
            data: evaluation
          })
        }
      } catch (error) {
        console.error(`Error evaluating trigger ${trigger.triggerId}:`, error)
      }
    }

    return results
  }

  private async getOrCreateTriggerSettings() {
    try {
      // Try to get existing trigger settings
      let triggerSettings = await db.triggerSetting.findMany({
        where: {
          organizationId: this.organizationId,
          isEnabled: true
        }
      })

      // If no settings exist, create default ones
      if (triggerSettings.length === 0) {
        const defaultTriggers = [
          { triggerId: 'critical-cash-runway', isEnabled: true, threshold: 15 },
          { triggerId: 'low-cash-runway', isEnabled: true, threshold: 30 },
          { triggerId: 'negative-mrr-growth', isEnabled: true },
          { triggerId: 'high-churn-rate', isEnabled: true, threshold: 5 },
          { triggerId: 'failed-payments', isEnabled: true, threshold: 10 },
          { triggerId: 'subscription-cancellations', isEnabled: true, threshold: 50 },
          { triggerId: 'revenue-milestone', isEnabled: true },
          { triggerId: 'customer-milestone', isEnabled: true },
          { triggerId: 'integration-failures', isEnabled: true, threshold: 2 },
          { triggerId: 'data-sync-delays', isEnabled: true, threshold: 24 }
        ]

        for (const trigger of defaultTriggers) {
          await db.triggerSetting.create({
            data: {
              organizationId: this.organizationId,
              ...trigger
            }
          })
        }

        // Fetch the newly created settings
        triggerSettings = await db.triggerSetting.findMany({
          where: {
            organizationId: this.organizationId,
            isEnabled: true
          }
        })
      }

      return triggerSettings
    } catch (error) {
      console.error('Error with trigger settings:', error)
      // Return empty array if database doesn't have trigger tables yet
      return []
    }
  }

  private async evaluateTrigger(triggerId: string): Promise<TriggerEvaluationResult> {
    switch (triggerId) {
      case 'critical-cash-runway':
        return await this.evaluateCashRunway(15) // Changed from 7 to 15 days
      
      case 'low-cash-runway':
        return await this.evaluateCashRunway(30)
      
      case 'negative-mrr-growth':
        return await this.evaluateMRRGrowth()
      
      case 'high-churn-rate':
        return await this.evaluateChurnRate()
      
      case 'failed-payments':
        return await this.evaluateFailedPayments()
      
      case 'subscription-cancellations':
        return await this.evaluateSubscriptionCancellations()
      
      case 'revenue-milestone':
        return await this.evaluateRevenueMilestone()
      
      case 'customer-milestone':
        return await this.evaluateCustomerMilestone()
      
      case 'integration-failures':
        return await this.evaluateIntegrationFailures()
      
      case 'data-sync-delays':
        return await this.evaluateDataSyncDelays()
      
      default:
        return { triggered: false }
    }
  }

  private async evaluateCashRunway(threshold: number): Promise<TriggerEvaluationResult> {
    // This is a simplified example - you'll need to implement actual cash runway calculation
    // based on your financial data structure
    const currentBalance = await this.getCurrentCashBalance()
    const monthlyBurnRate = await this.getMonthlyBurnRate()
    
    if (monthlyBurnRate <= 0) return { triggered: false }
    
    const runwayDays = (currentBalance / monthlyBurnRate) * 30
    
    return {
      triggered: runwayDays <= threshold,
      value: Math.round(runwayDays)
    }
  }

  private async evaluateMRRGrowth(): Promise<TriggerEvaluationResult> {
    const currentMRR = await this.getCurrentMRR()
    const previousMRR = await this.getPreviousMRR()
    
    if (!previousMRR || previousMRR === 0) return { triggered: false }
    
    const growthRate = ((currentMRR - previousMRR) / previousMRR) * 100
    
    return {
      triggered: growthRate < 0,
      value: growthRate,
      previousValue: previousMRR
    }
  }

  private async evaluateChurnRate(): Promise<TriggerEvaluationResult> {
    const churnRate = await this.calculateChurnRate()
    
    return {
      triggered: churnRate > 5,
      value: churnRate
    }
  }

  private async evaluateFailedPayments(): Promise<TriggerEvaluationResult> {
    const failureRate = await this.calculatePaymentFailureRate()
    
    return {
      triggered: failureRate > 10,
      value: failureRate
    }
  }

  private async evaluateSubscriptionCancellations(): Promise<TriggerEvaluationResult> {
    const weekOverWeekIncrease = await this.calculateCancellationIncrease()
    
    return {
      triggered: weekOverWeekIncrease > 50,
      value: weekOverWeekIncrease
    }
  }

  private async evaluateRevenueMilestone(): Promise<TriggerEvaluationResult> {
    const currentRevenue = await this.getCurrentMonthlyRevenue()
    const lastMilestone = await this.getLastRevenueMilestone()
    
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
    const nextMilestone = milestones.find(m => m > lastMilestone)
    
    if (nextMilestone && currentRevenue >= nextMilestone) {
      await this.updateLastRevenueMilestone(nextMilestone)
      return {
        triggered: true,
        value: nextMilestone
      }
    }
    
    return { triggered: false }
  }

  private async evaluateCustomerMilestone(): Promise<TriggerEvaluationResult> {
    const currentCustomers = await this.getCurrentCustomerCount()
    const lastMilestone = await this.getLastCustomerMilestone()
    
    const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000]
    const nextMilestone = milestones.find(m => m > lastMilestone)
    
    if (nextMilestone && currentCustomers >= nextMilestone) {
      await this.updateLastCustomerMilestone(nextMilestone)
      return {
        triggered: true,
        value: nextMilestone
      }
    }
    
    return { triggered: false }
  }

  private async evaluateIntegrationFailures(): Promise<TriggerEvaluationResult> {
    // Check if any integrations have failed recently
    const lastSync = await this.getLastSuccessfulSync()
    const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
    
    return {
      triggered: hoursAgo > 2, // No successful sync in 2+ hours
      value: hoursAgo
    }
  }

  private async evaluateDataSyncDelays(): Promise<TriggerEvaluationResult> {
    const lastUpdate = await this.getLastDataUpdate()
    const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
    
    return {
      triggered: hoursAgo > 24,
      value: hoursAgo
    }
  }

  private async sendNotification(triggerId: string, evaluationData: TriggerEvaluationResult) {
    // Get organization and user details
    const organization = await db.organization.findUnique({
      where: { id: this.organizationId },
      include: {
        members: {
          include: {
            user: true
          },
          where: {
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    })

    if (!organization) return

    // Send email to all owners and admins
    for (const member of organization.members) {
      try {
        // Use existing sendEmail function instead of undefined sendTriggerNotification
        const subject = this.getEmailSubject(triggerId, evaluationData.value || 0)
        const html = this.getEmailTemplate(triggerId, {
          organizationName: organization.name,
          userName: (member.user.firstName && member.user.lastName
            ? `${member.user.firstName} ${member.user.lastName}`
            : member.user.firstName || member.user.lastName || member.user.email),
          value: evaluationData.value || 0,
          previousValue: evaluationData.previousValue
        })

        await sendEmail({
          to: [member.user.email],
          subject,
          html
        })
      } catch (error) {
        console.error(`Failed to send notification to ${member.user.email}:`, error)
      }
    }
  }

  private getEmailSubject(triggerId: string, value: number): string {
    switch (triggerId) {
      case 'critical-cash-runway':
        return `🚨 Critical: ${Math.floor(value)} days of cash remaining`
      case 'low-cash-runway':
        return `⚠️ Warning: ${Math.floor(value)} days of cash remaining`
      case 'negative-mrr-growth':
        return `📉 MRR Growth Alert: Negative growth detected`
      case 'high-churn-rate':
        return `🚪 High Churn Alert: ${value.toFixed(1)}% churn rate`
      default:
        return `📊 Financial Alert: ${triggerId}`
    }
  }

  private getEmailTemplate(triggerId: string, data: any): string {
    // Use existing email templates or create simple ones
    switch (triggerId) {
      case 'critical-cash-runway':
        return getCriticalRunwayTemplate({
          organizationName: data.organizationName,
          currentRunwayDays: Math.floor(data.value),
          currentCashBalance: 0, // You'll need to pass this data
          burnRate: 0 // You'll need to pass this data
        })
      case 'low-cash-runway':
        return getLowRunwayTemplate({
          organizationName: data.organizationName,
          currentRunwayDays: Math.floor(data.value),
          currentCashBalance: 0, // You'll need to pass this data
          burnRate: 0 // You'll need to pass this data
        })
      default:
        return `
          <h2>Financial Alert for ${data.organizationName}</h2>
          <p>Hello ${data.userName},</p>
          <p>This is an automated alert regarding your financial metrics.</p>
          <p>Trigger: ${triggerId}</p>
          <p>Value: ${data.value}</p>
        `
    }
  }

  // Updated sendAlertsForMatchingConditions method
  async sendAlertsForMatchingConditions() {
    const results: Array<{
      triggerId: string
      triggered: boolean
      emailSent?: boolean
      recipients?: number
      error?: string
      reason?: string
    }> = []

    try {
      // Get current financial data
      const currentCashBalance = await this.getCurrentCashBalance()
      const monthlyBurnRate = await this.getMonthlyBurnRate()
      
      if (monthlyBurnRate <= 0) {
        return { success: false, error: 'Invalid burn rate data', results: [] }
      }
      
      const runwayDays = (currentCashBalance / monthlyBurnRate) * 30

      // Get organization details
      const organization = await db.organization.findUnique({
        where: { id: this.organizationId }
      })

      if (!organization) {
        return { success: false, error: 'Organization not found', results: [] }
      }

      const cashRunwayData = {
        organizationId: this.organizationId,
        organizationName: organization.name,
        currentCashBalance,
        monthlyBurnRate,
        runwayDays
      }

      // Check critical cash runway (15 days threshold)
      if (runwayDays <= 15) {
        const criticalResult = await this.evaluateCriticalCashRunway(cashRunwayData)
        results.push({
          triggerId: 'critical-cash-runway',
          ...criticalResult
        })
      }

      // Check low cash runway (30 days threshold but > 15 days)
      if (runwayDays <= 30 && runwayDays > 15) {
        const lowResult = await this.evaluateLowCashRunway(cashRunwayData)
        results.push({
          triggerId: 'low-cash-runway',
          ...lowResult
        })
      }

      // Check other conditions with proper error handling
      try {
        const enabledTriggers = await this.getOrCreateTriggerSettings()
        const otherTriggers = enabledTriggers.filter(t => 
          !['critical-cash-runway', 'low-cash-runway'].includes(t.triggerId)
        )

        for (const trigger of otherTriggers) {
          try {
            const evaluation = await this.evaluateTrigger(trigger.triggerId)
            if (evaluation.triggered) {
              await this.sendNotification(trigger.triggerId, evaluation)
              results.push({
                triggerId: trigger.triggerId,
                triggered: true,
                emailSent: true
              })
            } else {
              results.push({
                triggerId: trigger.triggerId,
                triggered: false,
                reason: 'Condition not met'
              })
            }
          } catch (error) {
            console.error(`Error evaluating trigger ${trigger.triggerId}:`, error)
            results.push({
              triggerId: trigger.triggerId,
              triggered: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      } catch (error) {
        console.error('Error getting trigger settings:', error)
      }

      const triggeredCount = results.filter(r => r.triggered && r.emailSent).length
      const totalChecked = results.length

      return {
        success: true,
        message: `Checked ${totalChecked} conditions, sent ${triggeredCount} alerts`,
        results
      }
    } catch (error) {
      console.error('Error in sendAlertsForMatchingConditions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results
      }
    }
  }

  // Updated evaluateCriticalCashRunway method
  async evaluateCriticalCashRunway(data: CashRunwayData) {
    const { organizationId, organizationName, currentCashBalance, monthlyBurnRate, runwayDays } = data

    try {
      // Check if critical cash runway trigger is enabled
      const trigger = await db.triggerSetting.findFirst({
        where: {
          organizationId,
          triggerId: 'critical-cash-runway',
          isEnabled: true
        }
      })

      if (!trigger) {
        console.log('Critical cash runway trigger is disabled for organization:', organizationId)
        return { triggered: false, reason: 'Trigger disabled' }
      }

      // Check if condition is met (runway <= 15 days)
      if (runwayDays > 15) {
        console.log('Cash runway condition not met:', runwayDays, 'days remaining')
        return { triggered: false, reason: 'Condition not met' }
      }

      // Get organization members to send email to
      const members = await db.organizationMember.findMany({
        where: {
          organizationId
        },
        include: {
          user: true
        }
      })

      const emailAddresses = members
        .map(member => member.user.email)
        .filter(email => email) as string[]

      if (emailAddresses.length === 0) {
        console.log('No email addresses found for organization:', organizationId)
        return { triggered: false, reason: 'No recipients' }
      }

      // Generate email template
      const emailHtml = getCriticalRunwayTemplate({
        organizationName,
        currentRunwayDays: Math.floor(runwayDays),
        currentCashBalance,
        burnRate: monthlyBurnRate
      })

      // Send email
      const emailResult = await sendEmail({
        to: emailAddresses,
        subject: `🚨 Critical: ${organizationName} has ${Math.floor(runwayDays)} days of cash remaining`,
        html: emailHtml
      })

      if (emailResult.success) {
        // Log the trigger event
        try {
          await db.triggerEventLog.create({
            data: {
              organizationId,
              triggerId: 'critical-cash-runway',
              triggerData: {
                runwayDays: Math.floor(runwayDays),
                cashBalance: currentCashBalance,
                burnRate: monthlyBurnRate
              },
              emailSent: true,
              recipients: emailAddresses
            }
          })
        } catch (logError) {
          console.error('Failed to log trigger event:', logError)
        }

        console.log('Critical cash runway alert sent successfully')
        return { triggered: true, emailSent: true, recipients: emailAddresses.length }
      } else {
        console.error('Failed to send critical cash runway alert:', emailResult.error)
        return { triggered: true, emailSent: false, error: emailResult.error }
      }
    } catch (error) {
      console.error('Error in evaluateCriticalCashRunway:', error)
      return { triggered: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Updated evaluateLowCashRunway method with similar error handling
  async evaluateLowCashRunway(data: CashRunwayData) {
    const { organizationId, organizationName, currentCashBalance, monthlyBurnRate, runwayDays } = data

    try {
      // Check if low cash runway trigger is enabled
      const trigger = await db.triggerSetting.findFirst({
        where: {
          organizationId,
          triggerId: 'low-cash-runway',
          isEnabled: true
        }
      })

      if (!trigger) {
        console.log('Low cash runway trigger is disabled for organization:', organizationId)
        return { triggered: false, reason: 'Trigger disabled' }
      }

      // Check if condition is met (runway <= 30 days but > 15 days to avoid duplicate with critical)
      if (runwayDays > 30 || runwayDays <= 15) {
        console.log('Low cash runway condition not met:', runwayDays, 'days remaining')
        return { triggered: false, reason: 'Condition not met' }
      }

      // Get organization members to send email to
      const members = await db.organizationMember.findMany({
        where: {
          organizationId
        },
        include: {
          user: true
        }
      })

      const emailAddresses = members
        .map(member => member.user.email)
        .filter(email => email) as string[]

      if (emailAddresses.length === 0) {
        console.log('No email addresses found for organization:', organizationId)
        return { triggered: false, reason: 'No recipients' }
      }

      // Generate email template
      const emailHtml = getLowRunwayTemplate({
        organizationName,
        currentRunwayDays: Math.floor(runwayDays),
        currentCashBalance,
        burnRate: monthlyBurnRate
      })

      // Send email
      const emailResult = await sendEmail({
        to: emailAddresses,
        subject: `⚠️ Warning: ${organizationName} has ${Math.floor(runwayDays)} days of cash remaining`,
        html: emailHtml
      })

      if (emailResult.success) {
        // Log the trigger event
        try {
          await db.triggerEventLog.create({
            data: {
              organizationId,
              triggerId: 'low-cash-runway',
              triggerData: {
                runwayDays: Math.floor(runwayDays),
                cashBalance: currentCashBalance,
                burnRate: monthlyBurnRate
              },
              emailSent: true,
              recipients: emailAddresses
            }
          })
        } catch (logError) {
          console.error('Failed to log trigger event:', logError)
        }

        console.log('Low cash runway alert sent successfully')
        return { triggered: true, emailSent: true, recipients: emailAddresses.length }
      } else {
        console.error('Failed to send low cash runway alert:', emailResult.error)
        return { triggered: true, emailSent: false, error: emailResult.error }
      }
    } catch (error) {
      console.error('Error in evaluateLowCashRunway:', error)
      return { triggered: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Helper methods - Updated to use database instead of mock data
  private async getCurrentCashBalance(): Promise<number> {
    // Get the latest financial metrics for this organization's active product profile
    const orgMembers = await db.organizationMember.findMany({
      where: { organizationId: this.organizationId },
      include: {
        user: {
          include: {
            activeProductProfile: {
              include: {
                financialMetrics: {
                  orderBy: { calculatedAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    for (const member of orgMembers) {
      if (member.user.activeProductProfile?.financialMetrics[0]) {
        return member.user.activeProductProfile.financialMetrics[0].currentCash
      }
    }

    return 0 // Default if no data found
  }

  private async getMonthlyBurnRate(): Promise<number> {
    const orgMembers = await db.organizationMember.findMany({
      where: { organizationId: this.organizationId },
      include: {
        user: {
          include: {
            activeProductProfile: {
              include: {
                financialMetrics: {
                  orderBy: { calculatedAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    for (const member of orgMembers) {
      if (member.user.activeProductProfile?.financialMetrics[0]) {
        return member.user.activeProductProfile.financialMetrics[0].monthlyBurnRate
      }
    }

    return 0
  }

  private async getCurrentMRR(): Promise<number> {
    const orgMembers = await db.organizationMember.findMany({
      where: { organizationId: this.organizationId },
      include: {
        user: {
          include: {
            activeProductProfile: {
              include: {
                financialMetrics: {
                  orderBy: { calculatedAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    for (const member of orgMembers) {
      if (member.user.activeProductProfile?.financialMetrics[0]) {
        return member.user.activeProductProfile.financialMetrics[0].monthlyRecurringRevenue
      }
    }

    return 0
  }

  private async getPreviousMRR(): Promise<number> {
    const orgMembers = await db.organizationMember.findMany({
      where: { organizationId: this.organizationId },
      include: {
        user: {
          include: {
            activeProductProfile: {
              include: {
                financialMetrics: {
                  orderBy: { calculatedAt: 'desc' },
                  take: 2
                }
              }
            }
          }
        }
      }
    })

    for (const member of orgMembers) {
      const metrics = member.user.activeProductProfile?.financialMetrics
      if (metrics && metrics.length >= 2) {
        return metrics[1].monthlyRecurringRevenue
      }
    }

    return 0
  }

  private async calculateChurnRate(): Promise<number> {
    // Implement churn rate calculation
    return 3.5 // Example value
  }

  private async calculatePaymentFailureRate(): Promise<number> {
    // Implement payment failure rate calculation
    return 8 // Example value
  }

  private async calculateCancellationIncrease(): Promise<number> {
    // Implement week-over-week cancellation increase calculation
    return 25 // Example value
  }

  private async getCurrentMonthlyRevenue(): Promise<number> {
    // Implement current month revenue calculation
    return 45000 // Example value
  }

  private async getCurrentCustomerCount(): Promise<number> {
    // Implement customer count
    return 150 // Example value
  }

  private async getLastRevenueMilestone(): Promise<number> {
    // Get from database or default to 0
    return 25000 // Example value
  }

  private async getLastCustomerMilestone(): Promise<number> {
    // Get from database or default to 0
    return 100 // Example value
  }

  private async updateLastRevenueMilestone(milestone: number): Promise<void> {
    // Update in database
  }

  private async updateLastCustomerMilestone(milestone: number): Promise<void> {
    // Update in database
  }

  private async getLastSuccessfulSync(): Promise<Date> {
    // Get last successful integration sync
    return new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago example
  }

  private async getLastDataUpdate(): Promise<Date> {
    // Get last data update timestamp
    return new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago example
  }
}
