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

    const { analysisType, productId } = await request.json()

    // Get user's product profile
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        productProfile: true
      }
    })

    if (!user?.productProfile) {
      return NextResponse.json({ error: 'No product profile found' }, { status: 404 })
    }

    const { productName, coreValue, features, market, currentPricingModel, currentPrice } = user.productProfile

    const systemPrompt = `You are a strategic business intelligence analyst specializing in SMB market analysis, competitive positioning, and pricing optimization. 

Analyze the following product and provide detailed business intelligence in JSON format:

Product: ${productName}
Core Value: ${coreValue}
Features: ${features.join(', ')}
Market: ${market || 'Not specified'}
Current Pricing: ${currentPricingModel} - ${currentPrice || 'Not specified'}

Based on the analysis type "${analysisType}", provide comprehensive insights.`

    let analysisPrompt = ''
    
    switch (analysisType) {
      case 'competitor_analysis':
        analysisPrompt = `Provide detailed competitor analysis in this exact JSON structure:
{
  "competitors": [
    {
      "name": "Competitor name",
      "type": "Direct|Indirect|Aspirational",
      "marketShare": "percentage",
      "pricing": {
        "model": "pricing model",
        "range": "price range",
        "value": "actual price if known"
      },
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketPosition": "description",
      "differentiators": ["diff1", "diff2"],
      "threatLevel": "Low|Medium|High",
      "lessons": "What can be learned from this competitor"
    }
  ],
  "marketGaps": [
    {
      "gap": "description of gap",
      "opportunity": "how to exploit this gap",
      "difficulty": "Low|Medium|High",
      "timeToMarket": "estimate",
      "potentialRevenue": "revenue estimate"
    }
  ],
  "competitiveAdvantages": [
    "advantage1", "advantage2"
  ],
  "recommendations": [
    {
      "action": "specific recommendation",
      "priority": "High|Medium|Low",
      "timeframe": "when to implement",
      "expectedImpact": "expected outcome"
    }
  ]
}`
        break

      case 'pricing_optimization':
        analysisPrompt = `Provide detailed pricing optimization analysis in this exact JSON structure:
{
  "currentAnalysis": {
    "pricing": "${currentPrice || 'Not set'}",
    "model": "${currentPricingModel || 'Not set'}",
    "marketPosition": "Below|At|Above market rate",
    "competitiveness": "assessment of current pricing"
  },
  "recommendations": [
    {
      "strategy": "pricing strategy name",
      "price": "recommended price",
      "model": "recommended model",
      "reasoning": "why this strategy works",
      "expectedImpact": "revenue/adoption impact",
      "implementation": "how to implement",
      "timeline": "implementation timeline",
      "confidence": "percentage confidence",
      "risks": ["risk1", "risk2"]
    }
  ],
  "marketBenchmarks": [
    {
      "competitor": "competitor name",
      "price": "their price",
      "model": "their model",
      "positioning": "how they position it"
    }
  ],
  "priceElasticity": {
    "demand": "elastic|inelastic",
    "reasoning": "why",
    "optimalRange": "price range for maximum revenue"
  },
  "scenarios": [
    {
      "scenario": "Conservative|Aggressive|Premium",
      "price": "price point",
      "projectedRevenue": "revenue estimate",
      "marketShare": "share estimate",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"]
    }
  ]
}`
        break

      case 'market_positioning':
        analysisPrompt = `Provide detailed market positioning analysis in this exact JSON structure:
{
  "currentPosition": {
    "segment": "market segment",
    "tier": "Budget|Mid-tier|Premium|Luxury",
    "differentiation": "current differentiation",
    "brandPerception": "how market sees the product"
  },
  "targetSegments": [
    {
      "segment": "segment name",
      "size": "market size",
      "growth": "growth rate",
      "accessibility": "Easy|Medium|Hard",
      "competition": "level of competition",
      "opportunity": "revenue opportunity",
      "requirements": ["requirement1", "requirement2"]
    }
  ],
  "positioningOptions": [
    {
      "positioning": "positioning strategy",
      "messaging": "key messaging",
      "audience": "target audience",
      "advantages": ["advantage1", "advantage2"],
      "challenges": ["challenge1", "challenge2"],
      "implementation": "how to implement"
    }
  ],
  "brandingRecommendations": [
    {
      "aspect": "aspect to improve",
      "current": "current state",
      "recommended": "recommended change",
      "impact": "expected impact"
    }
  ]
}`
        break

      case 'growth_opportunities':
        analysisPrompt = `Provide detailed growth opportunities analysis in this exact JSON structure:
{
  "currentMetrics": {
    "estimatedMarketSize": "market size estimate",
    "growthPotential": "High|Medium|Low",
    "currentShare": "estimated current share"
  },
  "opportunities": [
    {
      "type": "Product|Market|Channel|Partnership",
      "opportunity": "specific opportunity",
      "description": "detailed description",
      "market": "target market",
      "revenue": "potential revenue",
      "timeframe": "time to realize",
      "investment": "required investment",
      "difficulty": "Low|Medium|High",
      "probability": "success probability",
      "firstSteps": ["step1", "step2", "step3"]
    }
  ],
  "marketTrends": [
    {
      "trend": "trend description",
      "impact": "how it affects your product",
      "opportunity": "how to capitalize",
      "urgency": "Low|Medium|High"
    }
  ],
  "scalingStrategies": [
    {
      "strategy": "scaling approach",
      "description": "how it works",
      "requirements": ["req1", "req2"],
      "timeline": "implementation time",
      "investment": "required investment",
      "expectedReturn": "expected ROI"
    }
  ]
}`
        break

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0])
      
      // Log the analysis for future reference
      await db.activity.create({
        data: {
          type: 'PRODUCT_PROFILE_CREATED', // Reusing existing enum
          title: `Business Intelligence: ${analysisType}`,
          description: `Generated ${analysisType} analysis for ${productName}`,
          userId: user.id,
          metadata: {
            analysisType,
            productName,
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({ 
        success: true,
        analysisType,
        data: analysisData,
        productInfo: {
          name: productName,
          coreValue,
          features,
          market,
          currentPricing: { model: currentPricingModel, price: currentPrice }
        }
      })
    } else {
      throw new Error('No JSON found in response')
    }

  } catch (error) {
    console.error('Business intelligence analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform business intelligence analysis' },
      { status: 500 }
    )
  }
}
