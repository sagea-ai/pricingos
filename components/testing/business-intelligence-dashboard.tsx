'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  BarChart3, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface BusinessIntelligenceData {
  analysisType: string
  data: any
  productInfo: {
    name: string
    coreValue: string
    features: string[]
    market: string
    currentPricing: {
      model: string
      price: string
    }
  }
}

interface BusinessIntelligenceDashboardProps {
  productName: string
}

export function BusinessIntelligenceDashboard({ productName }: BusinessIntelligenceDashboardProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<BusinessIntelligenceData | null>(null)
  const [loading, setLoading] = useState(false)

  const analysisTypes = [
    {
      id: 'competitor_analysis',
      name: 'Competitive Intelligence',
      description: 'Deep dive into your competitive pricing landscape',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      id: 'pricing_optimization',
      name: 'Pricing Optimization',
      description: 'Find your optimal pricing strategy and positioning',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: 'market_positioning',
      name: 'Market Positioning',
      description: 'Discover your ideal market position and messaging',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      id: 'growth_opportunities',
      name: 'Growth Strategy',
      description: 'Identify paths to scale and expand your business',
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ]

  const runAnalysis = async (analysisType: string) => {
    setLoading(true)
    setSelectedAnalysis(analysisType)
    
    try {
      const response = await fetch('/api/testing/business-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
      } else {
        console.error('Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderCompetitorAnalysis = (data: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Competitive Landscape</h3>
        <div className="grid gap-4">
          {data.competitors?.map((competitor: any, index: number) => (
            <Card key={index} className="border-l-4 border-l-chart-1">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{competitor.name}</h4>
                    <Badge variant="outline">{competitor.type}</Badge>
                  </div>
                  <Badge variant={competitor.threatLevel === 'High' ? 'destructive' : 
                                competitor.threatLevel === 'Medium' ? 'secondary' : 'default'}>
                    {competitor.threatLevel} Threat
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Pricing:</strong> {competitor.pricing?.model} - {competitor.pricing?.range}</p>
                    <p><strong>Market Share:</strong> {competitor.marketShare}</p>
                  </div>
                  <div>
                    <p><strong>Strengths:</strong> {competitor.strengths?.join(', ')}</p>
                    <p><strong>Weaknesses:</strong> {competitor.weaknesses?.join(', ')}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted rounded">
                  <p className="text-sm"><strong>Key Lesson:</strong> {competitor.lessons}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {data.marketGaps && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Market Opportunities</h3>
          <div className="grid gap-3">
            {data.marketGaps.map((gap: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-chart-2">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{gap.gap}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{gap.opportunity}</p>
                      <div className="flex gap-4 text-sm">
                        <span><strong>Difficulty:</strong> {gap.difficulty}</span>
                        <span><strong>Time to Market:</strong> {gap.timeToMarket}</span>
                        <span><strong>Revenue Potential:</strong> {gap.potentialRevenue}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderPricingAnalysis = (data: any) => (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-chart-2">
        <CardHeader>
          <CardTitle className="text-lg">Current Pricing Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Current Price:</strong> {data.currentAnalysis?.pricing}</p>
              <p><strong>Model:</strong> {data.currentAnalysis?.model}</p>
            </div>
            <div>
              <p><strong>Market Position:</strong> {data.currentAnalysis?.marketPosition}</p>
              <p><strong>Competitiveness:</strong> {data.currentAnalysis?.competitiveness}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Pricing Recommendations</h3>
        <div className="space-y-4">
          {data.recommendations?.map((rec: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{rec.strategy}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rec.confidence}% confidence</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p><strong>Recommended Price:</strong> {rec.price}</p>
                    <p><strong>Model:</strong> {rec.model}</p>
                    <p><strong>Timeline:</strong> {rec.timeline}</p>
                  </div>
                  <div>
                    <p><strong>Expected Impact:</strong> {rec.expectedImpact}</p>
                    <p><strong>Implementation:</strong> {rec.implementation}</p>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded mb-3">
                  <p className="text-sm">{rec.reasoning}</p>
                </div>
                {rec.risks && rec.risks.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Risks: {rec.risks.join(', ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {data.scenarios && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pricing Scenarios</h3>
          <div className="grid gap-4">
            {data.scenarios.map((scenario: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{scenario.scenario} Strategy</h4>
                    <Badge variant="outline">{scenario.price}</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Projected Revenue:</strong> {scenario.projectedRevenue}</p>
                      <p><strong>Market Share:</strong> {scenario.marketShare}</p>
                    </div>
                    <div>
                      <p><strong>Pros:</strong> {scenario.pros?.join(', ')}</p>
                      <p><strong>Cons:</strong> {scenario.cons?.join(', ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderMarketPositioning = (data: any) => (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-chart-3">
        <CardHeader>
          <CardTitle className="text-lg">Current Market Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Segment:</strong> {data.currentPosition?.segment}</p>
              <p><strong>Tier:</strong> {data.currentPosition?.tier}</p>
            </div>
            <div>
              <p><strong>Differentiation:</strong> {data.currentPosition?.differentiation}</p>
              <p><strong>Brand Perception:</strong> {data.currentPosition?.brandPerception}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Target Segments</h3>
        <div className="grid gap-4">
          {data.targetSegments?.map((segment: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{segment.segment}</h4>
                  <Badge variant={segment.accessibility === 'Easy' ? 'default' : 
                                segment.accessibility === 'Medium' ? 'secondary' : 'destructive'}>
                    {segment.accessibility} Access
                  </Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p><strong>Size:</strong> {segment.size}</p>
                    <p><strong>Growth:</strong> {segment.growth}</p>
                  </div>
                  <div>
                    <p><strong>Competition:</strong> {segment.competition}</p>
                    <p><strong>Opportunity:</strong> {segment.opportunity}</p>
                  </div>
                  <div>
                    <p><strong>Requirements:</strong> {segment.requirements?.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGrowthOpportunities = (data: any) => (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-chart-4">
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p><strong>Market Size:</strong> {data.currentMetrics?.estimatedMarketSize}</p>
            </div>
            <div>
              <p><strong>Growth Potential:</strong> {data.currentMetrics?.growthPotential}</p>
            </div>
            <div>
              <p><strong>Current Share:</strong> {data.currentMetrics?.currentShare}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Growth Opportunities</h3>
        <div className="space-y-4">
          {data.opportunities?.map((opp: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{opp.opportunity}</h4>
                    <Badge variant="outline">{opp.type}</Badge>
                  </div>
                  <div className="text-right">
                    <Badge variant={opp.difficulty === 'Low' ? 'default' : 
                                  opp.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                      {opp.difficulty} Difficulty
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p><strong>Revenue Potential:</strong> {opp.revenue}</p>
                    <p><strong>Timeframe:</strong> {opp.timeframe}</p>
                    <p><strong>Investment:</strong> {opp.investment}</p>
                  </div>
                  <div>
                    <p><strong>Market:</strong> {opp.market}</p>
                    <p><strong>Success Probability:</strong> {opp.probability}</p>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm font-medium mb-2">First Steps:</p>
                  <ul className="text-sm list-disc list-inside">
                    {opp.firstSteps?.map((step: string, stepIndex: number) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAnalysisData = () => {
    if (!analysisData) return null

    const { data } = analysisData

    switch (selectedAnalysis) {
      case 'competitor_analysis':
        return renderCompetitorAnalysis(data)
      case 'pricing_optimization':
        return renderPricingAnalysis(data)
      case 'market_positioning':
        return renderMarketPositioning(data)
      case 'growth_opportunities':
        return renderGrowthOpportunities(data)
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Market Intelligence Center</h2>
        <p className="text-muted-foreground">
          AI-powered strategic insights and competitive analysis for <strong>{productName}</strong>
        </p>
      </div>

      {!selectedAnalysis && (
        <div className="grid md:grid-cols-2 gap-4">
          {analysisTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <Card key={type.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => runAnalysis(type.id)}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    Generate Intelligence
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Analyzing Market Intelligence...</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gathering competitive insights and strategic recommendations
              </p>
              <Progress value={33} className="w-full max-w-md mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAnalysis && analysisData && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {analysisTypes.find(t => t.id === selectedAnalysis)?.name} Results
            </h3>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAnalysis(null)
                setAnalysisData(null)
              }}
            >
              Run Different Analysis
            </Button>
          </div>
          {renderAnalysisData()}
        </div>
      )}
    </div>
  )
}
