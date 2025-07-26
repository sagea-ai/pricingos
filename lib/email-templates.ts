interface CriticalRunwayTemplateProps {
  organizationName: string
  currentRunwayDays: number
  currentCashBalance: number
  burnRate: number
}

export function getCriticalRunwayTemplate({
  organizationName,
  currentRunwayDays,
  currentCashBalance,
  burnRate
}: CriticalRunwayTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Critical Cash Runway Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Critical Cash Runway Alert</h1>
          </div>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-top: 0;">Immediate Action Required</h2>
            <p>Your organization <strong>${organizationName}</strong> has reached a critical cash runway threshold.</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Current Financial Status</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Cash Runway:</strong> ${currentRunwayDays} days</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Current Cash Balance:</strong> $${currentCashBalance.toLocaleString()}</li>
              <li style="padding: 8px 0;"><strong>Monthly Burn Rate:</strong> $${burnRate.toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #f59e0b; margin-top: 0;">Recommended Actions</h3>
            <ul>
              <li>Review and reduce immediate expenses</li>
              <li>Accelerate revenue collection</li>
              <li>Consider emergency funding options</li>
              <li>Update cash flow projections</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This alert was sent because your cash runway dropped below 7 days. 
            <br>To modify alert settings, please visit your dashboard.
          </p>
        </div>
      </body>
    </html>
  `
}

interface LowRunwayTemplateProps {
  organizationName: string
  currentRunwayDays: number
  currentCashBalance: number
  burnRate: number
}

export function getLowRunwayTemplate({
  organizationName,
  currentRunwayDays,
  currentCashBalance,
  burnRate
}: LowRunwayTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Low Cash Runway Warning</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Low Cash Runway Warning</h1>
          </div>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #f59e0b; margin-top: 0;">Attention Needed</h2>
            <p>Your organization <strong>${organizationName}</strong> has less than 30 days of cash runway remaining.</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Current Financial Status</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Cash Runway:</strong> ${currentRunwayDays} days</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Current Cash Balance:</strong> $${currentCashBalance.toLocaleString()}</li>
              <li style="padding: 8px 0;"><strong>Monthly Burn Rate:</strong> $${burnRate.toLocaleString()}</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This warning was sent because your cash runway dropped below 30 days.
          </p>
        </div>
      </body>
    </html>
  `
}
