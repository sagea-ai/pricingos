import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testType, duration = '30 days', confidence = 95 } = await request.json()

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { productProfile: true }
    })

    if (!user?.productProfile) {
      return NextResponse.json({ error: 'No product profile found' }, { status: 404 })
    }

    const { productName, coreValue, features, market, currentPricingModel, currentPrice } = user.productProfile

    const systemPrompt = `You are an expert in A/B testing and conversion rate optimization for SMBs. Design realistic A/B test scenarios.`

    const testPrompt = `Design A/B test scenarios for "${testType}" for this product:

Product: ${productName}
Value Proposition: ${coreValue}
Features: ${features.join(', ')}
Market: ${market || 'General'}
Current Pricing: ${currentPricingModel} - ${currentPrice || 'TBD'}

Provide response in this exact JSON structure:
{
  "testScenarios": [
    {
      "name": "Test scenario name",
      "hypothesis": "What we're testing and expected outcome",
      "variants": [
        {
          "name": "Control|Variant A|Variant B",
          "description": "What this variant does",
          "implementation": "How to implement",
          "expectedImpact": "predicted impact",
          "metrics": ["metric1", "metric2"]
        }
      ],
      "primaryMetric": "main metric to track",
      "secondaryMetrics": ["secondary metric 1", "secondary metric 2"],
      "sampleSize": "estimated sample size needed",
      "duration": "recommended test duration",
      "successCriteria": "what defines success",
      "risks": ["potential risk 1", "potential risk 2"],
      "implementation": {
        "difficulty": "Easy|Medium|Hard",
        "resources": "resources needed",
        "timeline": "setup timeline",
        "tools": ["tool1", "tool2"]
      }
    }
  ],
  "recommendations": [
    {
      "priority": "High|Medium|Low",
      "test": "which test to run first",
      "reasoning": "why this test first",
      "expectedLift": "expected improvement"
    }
  ],
  "considerations": [
    {
      "factor": "important factor",
      "impact": "how it affects testing",
      "mitigation": "how to handle it"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testPrompt }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const testData = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        testType,
        duration,
        confidence,
        data: testData
      })
    } else {
      throw new Error('No JSON found in response')
    }

  } catch (error) {
    console.error('A/B test scenarios error:', error)
    return NextResponse.json(
      { error: 'Failed to generate A/B test scenarios' },
      { status: 500 }
    )
  }
}
