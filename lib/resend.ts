import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from = 'alerts@basabjha.com.np' }: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })
    
    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
