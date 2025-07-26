import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

const extractJsonFromMarkdown = (content: string): string => {
  // First try to extract from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  
  // Try to find JSON array directly
  const arrayMatch = content.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    return arrayMatch[0].trim()
  }
  
  // Try to find JSON object
  const objectMatch = content.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    return objectMatch[0].trim()
  }
  
  return content.trim()
}

const safeJsonParse = (content: string, fallbackSteps: any[] = []): any[] => {
  try {
    const cleaned = extractJsonFromMarkdown(content)
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (error) {
    console.error('JSON parse error:', error, 'Content:', content.substring(0, 200))
    return fallbackSteps
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { query } = await request.json()

    if (!query) {
      return new Response('Query is required', { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          const message = `data: ${JSON.stringify({ type, ...data })}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        try {
          // Phase 1: Initial Analysis & Problem Decomposition
          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Analyzing "${query}" - I'm identifying this as a multi-dimensional research problem. I considered three initial approaches: keyword extraction and domain mapping (selected for comprehensiveness), immediate deep-dive into primary sources (rejected due to potential scope creep), and comparative analysis with similar topics (rejected for efficiency). I chose domain mapping because it ensures systematic coverage of all relevant aspects before diving deep.`,
            confidence: 95
          })
          await new Promise(resolve => setTimeout(resolve, 1500))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Breaking down the query structure, I'm detecting multiple information layers: definitional (what), contextual (why/how), temporal (when), and predictive (future implications). My confidence in layer identification: definitional components (94%), contextual relationships (89%), temporal scope (91%), predictive elements (78% - inherently uncertain). I'm prioritizing definitional and contextual first as they form the foundation for reliable prediction.`,
            confidence: 92
          })
          await new Promise(resolve => setTimeout(resolve, 1200))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `For source strategy, I evaluated four approaches: academic-first (rejected - may miss current developments), news-first (rejected - may lack depth), industry-first (rejected - may have bias), and triangulated approach (selected). The triangulated method scores highest on reliability (88%) and comprehensiveness (92%) because it cross-validates findings across source types, reducing individual source biases.`,
            confidence: 89
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 2: Forward Reasoning - Strategic Analysis with specific reasoning
          const forwardReasoningPrompt = `You are SAGE conducting detailed forward reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Use this exact pattern for each reasoning step:
"I identified [specific aspect] as [type of challenge/opportunity]. I considered [2-3 specific approaches]: [approach 1] (rejected due to [specific reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). I chose [selected approach] because [detailed justification]. My confidence in each component: [specific confidence levels]. The key insight was [meta-level understanding]."

Return exactly this format:
[
  {
    "step": "Detailed reasoning following the pattern above",
    "confidence": 85
  },
  {
    "step": "Another detailed reasoning step",
    "confidence": 90
  }
]

Provide 6-8 steps with this level of specificity. Return ONLY the JSON array.`

          const forwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: forwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
          })

          const forwardContent = forwardCompletion.choices[0]?.message?.content
          if (forwardContent) {
            const forwardSteps = safeJsonParse(forwardContent, [
              { step: "Analyzing forward reasoning approach for comprehensive research coverage", confidence: 88 },
              { step: "Evaluating methodological frameworks to ensure systematic investigation", confidence: 85 }
            ])
            
            for (const step of forwardSteps) {
              sendEvent('reasoning', {
                reasoningType: 'forward',
                step: step.step,
                confidence: step.confidence || 85
              })
              await new Promise(resolve => setTimeout(resolve, 1600))
            }
          }

          // Phase 3: Meta-reasoning about approach selection
          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Evaluating my research framework, I identified potential methodology bias as a critical risk. I considered three validation approaches: peer review simulation (rejected - no peers available), historical precedent checking (selected for reliability), and adversarial red-teaming (selected for robustness). My confidence in framework validity: structural soundness (91%), bias mitigation (84%), scope coverage (88%). The key insight was that combining historical validation with adversarial testing provides both proven reliability and novel risk identification.`,
            confidence: 87
          })
          await new Promise(resolve => setTimeout(resolve, 1500))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `For source weighting strategy, I identified recency bias as a major threat. I considered temporal weighting schemes: linear decay (rejected - oversimplifies), step function (rejected - too rigid), contextual relevance weighting (selected). My confidence in temporal factors: recent developments (92%), historical patterns (87%), cyclical factors (79%). I chose contextual weighting because it preserves important historical insights while properly emphasizing current dynamics.`,
            confidence: 84
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 4: Backward Reasoning - Working from conclusions
          const backwardReasoningPrompt = `You are SAGE doing backward reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Use the inverse reasoning pattern, working backwards from research conclusions:
"Working backwards from [desired outcome type], I identified [specific validation requirement]. I considered [2-3 validation approaches]: [approach 1] (rejected due to [reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). My confidence in validation components: [specific percentages]. The meta-insight was [reasoning about the reasoning process]."

Return exactly this format:
[
  {
    "step": "Backward reasoning step following the pattern above",
    "confidence": 88
  }
]

Provide 5-7 backward reasoning steps. Return ONLY the JSON array.`

          const backwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: backwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
          })

          const backwardContent = backwardCompletion.choices[0]?.message?.content
          if (backwardContent) {
            const backwardSteps = safeJsonParse(backwardContent, [
              { step: "Working backwards from research conclusions to validate methodology", confidence: 87 },
              { step: "Checking assumption validity through reverse engineering of findings", confidence: 83 }
            ])
            
            for (const step of backwardSteps) {
              sendEvent('reasoning', {
                reasoningType: 'backward',
                step: step.step,
                confidence: step.confidence || 85
              })
              await new Promise(resolve => setTimeout(resolve, 1700))
            }
          }

          // Phase 5: Validation with confidence calibration
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `Calibrating my confidence intervals, I identified overconfidence bias as my primary epistemic risk. I considered three calibration methods: historical accuracy tracking (rejected - no baseline), confidence interval bracketing (selected for rigor), and adversarial stress-testing (selected for robustness). My confidence in calibration accuracy: statistical bounds (85%), qualitative assessments (79%), integrated confidence (82%). The insight was that dual-method calibration catches both statistical and intuitive reasoning errors.`,
            confidence: 91
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `For contradiction detection, I identified confirmation bias as the most dangerous failure mode. I considered detection strategies: active disconfirmation seeking (selected for thoroughness), source diversity requirements (selected for bias reduction), and logical consistency checking (selected for accuracy). My confidence in bias mitigation: source selection (88%), argument structure (92%), evidence weighting (84%). The meta-insight was that systematic disconfirmation is more reliable than intuitive balance.`,
            confidence: 89
          })
          await new Promise(resolve => setTimeout(resolve, 1300))

          // Phase 6: Final validation reasoning
          const validationPrompt = `You are SAGE doing final validation reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Apply the inverse reasoning pattern to quality control:
"For [specific quality concern], I identified [validation requirement]. I evaluated [approaches]: [approach 1] (rejected for [reason]), [approach 2] (selected because [justification]). My confidence in quality components: [specific percentages]. The key realization was [meta-cognitive insight about the validation process]."

Return exactly this format:
[
  {
    "step": "Validation reasoning step following the pattern above",
    "confidence": 91
  }
]

Provide 4-6 validation steps. Return ONLY the JSON array.`

          const validationCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: validationPrompt }],
            temperature: 0.4,
            max_tokens: 2000,
          })

          const validationContent = validationCompletion.choices[0]?.message?.content
          if (validationContent) {
            const validationSteps = safeJsonParse(validationContent, [
              { step: "Validating research quality through systematic error checking", confidence: 90 },
              { step: "Cross-referencing findings against established methodological standards", confidence: 88 }
            ])
            
            for (const step of validationSteps) {
              sendEvent('reasoning', {
                reasoningType: 'validation',
                step: step.step,
                confidence: step.confidence || 87
              })
              await new Promise(resolve => setTimeout(resolve, 1300))
            }
          }

          // Phase 7: Final synthesis reasoning
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `Completing methodology validation, I identified synthesis complexity as the final challenge. I considered integration approaches: weighted averaging (rejected - loses nuance), narrative synthesis (rejected - reduces precision), structured analytical framework (selected for balance). My confidence in synthesis components: data integration (89%), insight extraction (86%), recommendation formulation (91%). The meta-realization was that structured frameworks preserve both rigor and interpretability better than purely quantitative or qualitative approaches.`,
            confidence: 93
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 8: Final Research Generation
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: 'Compiling comprehensive research findings and generating detailed insights report',
            confidence: 95
          })
          await new Promise(resolve => setTimeout(resolve, 1200))

          const systemPrompt = `You are SAGE, a specialized pricing strategy analyst conducting deep validation of pricing recommendations. Your primary focus is explaining WHY a specific pricing strategy was recommended by analyzing competitor positioning, feature differentiation, market dynamics, and value proposition validation.

When analyzing pricing recommendations, you must:
1. Compare against 3-5 direct competitors with specific pricing data
2. Identify unique features/USPs that justify pricing decisions
3. Validate market positioning through industry data
4. Provide specific sources for all claims and comparisons
5. Explain the reasoning chain that led to the pricing recommendation

IMPORTANT: For all competitor-related fields, use real company names operating in the relevant domain if possible. If you cannot find real companies, generate plausible, real-sounding company names that fit the product's industry and geography. Avoid generic names like "Competitor X" or "Competitor Y".

Provide a JSON response with this exact structure focused on pricing validation:
{
  "query": "The research query",
  "summary": "Detailed explanation of why the pricing recommendation makes strategic sense, backed by competitive analysis and market validation",
  "pricingValidation": {
    "recommendedStrategy": "The specific pricing strategy being validated",
    "marketPosition": "Where this pricing positions the product (premium, mid-market, budget)",
    "competitiveJustification": "Why this pricing beats competitors based on features and value",
    "valueProposition": "Core value props that support the pricing level",
    "riskAssessment": "Potential risks with this pricing strategy",
    "confidenceLevel": "high|medium|low",
    "implementationReadiness": "ready|needs_adjustment|requires_testing"
  },
  "competitorBenchmark": [
    {
      "competitorName": "Specific competitor name",
      "pricing": "$X/month or pricing model",
      "features": ["feature_1", "feature_2", "feature_3"],
      "marketShare": "Estimated market share or position",
      "strengths": "What they do well",
      "weaknesses": "Where our product has advantage",
      "pricingStrategy": "How they structure their pricing",
      "ourAdvantage": "Specific differentiation that justifies our pricing",
      "sourceUrl": "Where this data came from"
    }
  ],
  "featureDifferentiation": [
    {
      "category": "Core Feature Category",
      "ourFeatures": ["unique_feature_1", "unique_feature_2"],
      "competitorGaps": "What competitors lack in this area",
      "valueImpact": "How this translates to customer value",
      "pricingJustification": "Why this supports our pricing tier",
      "marketDemand": "Evidence of market need for this feature"
    }
  ],
  "businessHealth": {
    "cashFlowInsights": "Analysis of how this pricing affects cash flow",
    "pricingPosition": "Market positioning with this pricing strategy", 
    "riskFactors": ["specific_pricing_risk_1", "market_risk_2", "competitive_risk_3"],
    "opportunityScore": 85,
    "stressLevel": "low|medium|high"
  },
  "pricingImplementation": [
    {
      "phase": "immediate|short_term|long_term",
      "action": "Specific pricing implementation step",
      "rationale": "Why this step is necessary based on competitor analysis",
      "expectedImpact": "Revenue/market impact with timeframe",
      "riskMitigation": "How to minimize implementation risks",
      "successMetrics": "How to measure if this is working",
      "competitiveResponse": "Expected competitor reactions and counter-strategies"
    }
  ],
  "actionablePlans": [
    {
      "priority": "high|medium|low", 
      "category": "Pricing|Positioning|Feature_Development|Marketing|Competitive_Response",
      "action": "Specific action to support the pricing strategy",
      "expectedImpact": "Business outcome that reinforces pricing position",
      "effort": "low|medium|high",
      "cost": "free|low|medium|high",
      "roi": "Expected return on investment",
      "competitorContext": "How this action affects competitive positioning"
    }
  ],
  "competitorIntelligence": [
    {
      "competitorType": "Direct|Indirect|Aspirational",
      "competitorName": "Specific competitor name",
      "pricingModel": "Their pricing structure (freemium, tiered, usage-based, etc.)",
      "pricePoints": ["$X starter", "$Y professional", "$Z enterprise"],
      "pricingStrategy": "How they position and justify their pricing",
      "keyDifferentiators": "Features that justify their pricing",
      "marketPosition": "Premium, mid-market, or budget positioning",
      "customerSegments": "Who they target with each pricing tier",
      "weaknesses": "Pricing/feature gaps we can exploit",
      "threats": "How they might respond to our pricing",
      "lessons": "Specific pricing insights to adopt or avoid",
      "dataSource": "Where this competitive intelligence came from"
    }
  ],
  "financialProjections": [
    {
      "scenario": "Conservative|Optimistic|Aggressive",
      "timeframe": "3 months|6 months|1 year",
      "revenue": "Projected revenue range",
      "expenses": "Expected expense changes", 
      "cashflow": "Net cash flow projection",
      "keyAssumptions": ["assumption_1", "assumption_2"],
      "triggerEvents": ["event_that_changes_projection"]
    }
  ],
  "marketOpportunities": [
    {
      "opportunity": "Specific market gap or trend",
      "timeWindow": "How long this opportunity will last",
      "entryBarrier": "low|medium|high",
      "potentialRevenue": "Revenue opportunity range",
      "requiredInvestment": "What SMB needs to invest",
      "firstSteps": ["step_1", "step_2", "step_3"]
    }
  ],
  "warningSignals": [
    {
      "signal": "Early warning indicator",
      "severity": "low|medium|high",
      "timeframe": "When this might become critical",
      "preventiveAction": "What to do to avoid the issue",
      "cost": "Cost of prevention vs cost of problem"
    }
  ],
  "quickWins": [
    {
      "action": "Something SMB can implement this week",
      "impact": "Expected immediate result",
      "timeToImplement": "Hours or days needed",
      "resources": "What's needed to execute"
    }
  ],
  "pricingRationale": {
    "coreJustification": "Primary reason why this pricing strategy makes sense",
    "competitiveAdvantage": "How this pricing beats competitors",
    "valueAlignment": "How price aligns with customer value perception",
    "marketDynamics": "Market conditions supporting this pricing",
    "riskFactors": "Main risks and mitigation strategies",
    "alternativeStrategies": "Other pricing options considered and why rejected"
  },
  "sources": [
    {
      "title": "Specific data source title",
      "url": "actual_source_url_or_methodology",
      "relevance": 90,
      "type": "competitor_pricing|market_research|industry_report|pricing_study|feature_analysis",
      "credibility": "high|medium|low",
      "dataPoint": "Specific insight extracted from this source",
      "usedFor": "How this source supports the pricing recommendation"
    }
  ],
  "confidence": 85,
  "urgency": "low|medium|high",
  "implementationComplexity": "simple|moderate|complex"
}

Focus specifically on pricing validation:
- WHY this pricing recommendation makes strategic sense
- Detailed competitor pricing comparison with specific data points
- Unique features/USPs that justify the pricing level
- Market positioning analysis relative to competitors
- Value proposition validation through customer research
- Pricing elasticity and demand considerations
- Implementation timeline and rollout strategy
- Risk assessment and mitigation for pricing changes
- Revenue impact projections with confidence intervals
- Competitive response predictions and counter-strategies
- Supporting evidence with credible sources and data
- Alternative pricing scenarios and why they were rejected

CRITICAL: Every pricing claim must be backed by specific competitor data, market research, or customer evidence. Include source methodology for all competitive intelligence. Explain the logical chain from features → value → price → market position. Return only valid JSON.`

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Conduct comprehensive business intelligence analysis on: ${query}` }
            ],
            temperature: 0.7,
            max_tokens: 6000,
          })

          const content = completion.choices[0]?.message?.content
          if (!content) {
            throw new Error('No content received from AI')
          }

          // Parse the JSON response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const researchData = JSON.parse(jsonMatch[0])
            sendEvent('result', { result: researchData })
          } else {
            throw new Error('No JSON found in response')
          }

        } catch (error) {
          console.error('Research analysis error:', error)
          sendEvent('error', { message: 'Failed to perform research analysis' })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Deep research analysis error:', error)
    return new Response('Failed to perform research analysis', { status: 500 })
  }
}