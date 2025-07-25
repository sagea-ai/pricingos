import { NextRequest, NextResponse } from 'next/server'
import { TriggerEvaluator } from '@/lib/trigger-evaluator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const evaluator = new TriggerEvaluator(organizationId)
    const result = await evaluator.sendAlertsForMatchingConditions()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in send-alerts API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
