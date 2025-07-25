import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        productProfile: {
          include: {
            competitors: {
              include: {
                competitor: true
              }
            }
          }
        }
      }
    })

    if (!user?.productProfile) {
      return NextResponse.json({ error: 'No product profile found' }, { status: 404 })
    }

    const productProfile = user.productProfile
    
    // Prepare data for LLM analysis
    const analysisData = {
      product: {
        name: productProfile.productName,
        core_value: productProfile.coreValue,
        features: productProfile.features,
        current_pricing_model: productProfile.currentPricingModel || "Not set",
        current_price: productProfile.currentPrice || "Not set",
        market: productProfile.market || "General",
        user_type: productProfile.userType || "Self-serve",
        churn_rate: productProfile.churnRate ? `${productProfile.churnRate}%` : "Not available",
        monthly_revenue: productProfile.monthlyRevenue || 0,
        total_users: productProfile.totalUsers || 0
      },
      competitors: productProfile.competitors.map(pc => ({
        name: pc.competitor.name,
        price: pc.competitor.startingPrice || "Not available",
        features: pc.competitor.features,
        pricing_model: pc.competitor.pricingModel || "Unknown"
      }))
    }

    const systemPrompt = `You are a pricing strategy AI that analyzes SaaS products and provides strategic pricing recommendations. Analyze the provided product and competitive data to generate insights.`

    const analysisPrompt = `Analyze this product and competitive data:

${JSON.stringify(analysisData, null, 2)}

Output Format: Return only a well-structured JSON like the following:

{
  "feature_to_value_mapping": {
    "insight": "You offer X features, of which Y are charged as premium by competitors. [Competitor] charges $Z for [feature] alone.",
    "highlighted_features": ["feature1", "feature2", "feature3"],
    "value_gap": "$X–$Y underpriced/overpriced"
  },
  "pricing_model_fit": {
    "current_model": "Current model",
    "recommended_model": "Recommended model",
    "rationale": "Detailed reasoning for the recommendation"
  },
  "competitor_analysis": {
    "matrix": [
      { "name": "Your Product", "price": "$X", "features": ["f1", "f2"] },
      { "name": "Competitor 1", "price": "$Y", "features": ["f1", "f3"] }
    ],
    "insight": "Key competitive positioning insight"
  },
  "ab_test_scenarios": [
    {
      "scenario": "Test scenario description",
      "expected_impact": "Expected percentage or revenue impact",
      "assumptions": ["assumption 1", "assumption 2"]
    }
  ],
  "sage_recommendation": {
    "model": "Clear, actionable recommendation in 1-2 sentences explaining the best pricing approach for this product",
    "segments": ["Starter ($X/mo)", "Professional ($Y/mo)", "Enterprise ($Z/mo)"],
    "price_points": ["$19/month", "$49/month", "$99/month"],
    "reasoning_chain": [
      "Short reason for pricing model choice",
      "Key market positioning insight",
      "Expected revenue impact"
    ]
  }
}

Make the sage_recommendation.model field a clear, concise recommendation (max 2 sentences). The segments should include tier names with prices, and reasoning_chain should be 3 short, specific insights.

Only return valid JSON. Do not add commentary or explanation.`

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
      const analysisResult = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        data: analysisResult,
        productInfo: analysisData.product
      })
    } else {
      throw new Error('No JSON found in response')
    }

  } catch (error) {
    console.error('Pricing analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform pricing analysis' },
      { status: 500 }
    )
  }
}
