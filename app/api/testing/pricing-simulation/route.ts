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

    const { productInfo, variants } = await request.json()

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const systemPrompt = `You are a pricing strategy expert specializing in SaaS and SMB products. You analyze pricing variants and predict their business impact using market research, behavioral economics, and pricing psychology.

Product Context:
- Name: ${productInfo.name}
- Value Proposition: ${productInfo.coreValue}
- Features: ${productInfo.features.join(', ')}
- Market: ${productInfo.market || 'General'}

Current baseline metrics (for comparison):
- Monthly Revenue: $4,800
- Customer LTV: $180
- Monthly Churn: 5.2%
- Conversion Rate: 2.8%
- ARPU: $29

For each pricing variant, provide realistic impact predictions based on:
1. Price elasticity of demand
2. Market positioning effects
3. Customer psychology and willingness to pay
4. Competitive dynamics
5. Value perception changes`

    const variantPrompts = variants.map((variant: any, index: number) => 
      `Variant ${index + 1}: "${variant.name}"
Model: ${variant.model}
Price: ${variant.price}
Description: ${variant.description}`
    ).join('\n\n')

    const analysisPrompt = `Analyze these pricing variants and provide detailed impact predictions:

${variantPrompts}

Provide response in this exact JSON structure:
{
  "results": [
    {
      "variant": {
        "id": "variant-id",
        "name": "variant name",
        "model": "pricing model",
        "price": "price point",
        "description": "description"
      },
      "metrics": {
        "mrrChange": "+12.5%" or "-8.2%",
        "churnImpact": "-2.3%" or "+1.1%",
        "ltv": "$230",
        "arpu": "$45",
        "conversionRate": "3.4%",
        "riskLevel": "Low|Medium|High"
      },
      "verdict": "One sentence summary of this variant's potential",
      "reasoning": "2-3 sentence explanation of why this would work or not",
      "recommendation": "recommended|caution|not-recommended"
    }
  ]
}

Be realistic with predictions. Consider:
- Higher prices generally reduce conversion but increase ARPU
- Value-based pricing works if value perception is strong
- Freemium can increase acquisition but may cannibalize paid plans
- Usage-based pricing aligns with value but can be unpredictable
- Market context matters (competitive pressure, customer segments)`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const simulationData = JSON.parse(jsonMatch[0])
      
      // Log the simulation for analytics
      await db.activity.create({
        data: {
          type: 'PRODUCT_PROFILE_CREATED', // Reusing existing enum
          title: 'Pricing Simulation',
          description: `Ran pricing simulation for ${productInfo.name} with ${variants.length} variants`,
          userId: user.id,
          metadata: {
            productName: productInfo.name,
            variantCount: variants.length,
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        success: true,
        results: simulationData.results
      })
    } else {
      throw new Error('No JSON found in response')
    }

  } catch (error) {
    console.error('Pricing simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to run pricing simulation' },
      { status: 500 }
    )
  }
}
