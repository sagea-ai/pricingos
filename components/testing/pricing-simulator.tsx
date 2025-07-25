'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  DollarSign, 
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Loader2,
  Lightbulb,
  ArrowUpDown,
  Target
} from 'lucide-react'

interface ProductProfile {
  id: string;
  productName: string;
  coreValue: string;
  features: string[];
  market: string | null;
  currentPricingModel: string | null;
  currentPrice: string | null;
}

interface PricingVariant {
  id: string
  name: string
  model: string
  price: string
  description: string
  isBaseline?: boolean
}

interface SimulationResult {
  variant: PricingVariant
  metrics: {
    mrrChange: string
    churnImpact: string
    ltv: string
    arpu: string
    conversionRate: string
    riskLevel: 'Low' | 'Medium' | 'High'
  }
  verdict: string
  reasoning: string
  recommendation: 'recommended' | 'caution' | 'not-recommended'
}

interface PricingSimulatorProps {
  productProfile: ProductProfile
}

export function PricingSimulator({ productProfile }: PricingSimulatorProps) {
  const [variants, setVariants] = useState<PricingVariant[]>([
    {
      id: 'baseline',
      name: 'Current Strategy',
      model: productProfile.currentPricingModel || 'Flat Rate',
      price: productProfile.currentPrice || '$29/month',
      description: 'Your current pricing approach',
      isBaseline: true
    }
  ])
  
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVariant, setNewVariant] = useState({
    name: '',
    model: '',
    price: '',
    description: ''
  })

  const pricingModels = [
    'Flat Rate',
    'Tiered Pricing',
    'Usage-Based',
    'Freemium',
    'Per-User',
    'Value-Based',
    'Hybrid'
  ]

  const addVariant = () => {
    if (!newVariant.name || !newVariant.model || !newVariant.price) return

    const variant: PricingVariant = {
      id: `variant-${Date.now()}`,
      name: newVariant.name,
      model: newVariant.model,
      price: newVariant.price,
      description: newVariant.description
    }

    setVariants([...variants, variant])
    setNewVariant({ name: '', model: '', price: '', description: '' })
    setShowAddForm(false)
  }

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id))
    setSimulationResults(simulationResults.filter(r => r.variant.id !== id))
  }

  const runSimulation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/testing/pricing-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo: {
            name: productProfile.productName,
            coreValue: productProfile.coreValue,
            features: productProfile.features,
            market: productProfile.market
          },
          variants: variants.filter(v => !v.isBaseline)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSimulationResults(data.results)
      }
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'recommended': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'caution': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'not-recommended': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Pricing Strategy Simulator</h3>
        <p className="text-muted-foreground">
          Test different pricing approaches and see AI-predicted business impact
        </p>
      </div>

      {/* Current Performance Metrics */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Performance Baseline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These metrics represent your current pricing performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$4,800</div>
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$180</div>
              <div className="text-sm text-muted-foreground">Customer LTV</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">5.2%</div>
              <div className="text-sm text-muted-foreground">Monthly Churn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2.8%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Strategy Variants to Test
            </CardTitle>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Form */}
          {showAddForm && (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="pt-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="name">Variant Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Pro Tier, Higher Price"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Pricing Model</Label>
                    <Select value={newVariant.model} onValueChange={(value) => setNewVariant({ ...newVariant, model: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing model" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingModels.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price Point</Label>
                    <Input
                      id="price"
                      placeholder="e.g., $49/month, $0.10/use"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="What's different about this variant?"
                      value={newVariant.description}
                      onChange={(e) => setNewVariant({ ...newVariant, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addVariant}>
                    Add Variant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants List */}
          <div className="space-y-3">
            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{variant.name}</h4>
                    {variant.isBaseline && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span><strong>Model:</strong> {variant.model}</span>
                    <span><strong>Price:</strong> {variant.price}</span>
                    {variant.description && <span>{variant.description}</span>}
                  </div>
                </div>
                {!variant.isBaseline && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(variant.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {variants.length > 1 && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={runSimulation}
                disabled={loading}
                className="flex items-center gap-2"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                {loading ? 'Running AI Simulation...' : 'Simulate Pricing Impact'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {simulationResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Strategy Analysis
          </h3>
          
          {simulationResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${
              result.recommendation === 'recommended' ? 'border-l-green-500' :
              result.recommendation === 'caution' ? 'border-l-yellow-500' :
              'border-l-red-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{result.variant.name}</CardTitle>
                    {getRecommendationIcon(result.recommendation)}
                  </div>
                  <Badge className={getRiskColor(result.metrics.riskLevel)}>
                    {result.metrics.riskLevel} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{result.metrics.mrrChange}</div>
                    <div className="text-xs text-muted-foreground">MRR Change</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{result.metrics.ltv}</div>
                    <div className="text-xs text-muted-foreground">Customer LTV</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{result.metrics.churnImpact}</div>
                    <div className="text-xs text-muted-foreground">Churn Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{result.metrics.arpu}</div>
                    <div className="text-xs text-muted-foreground">ARPU</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">{result.metrics.conversionRate}</div>
                    <div className="text-xs text-muted-foreground">Conversion</div>
                  </div>
                </div>

                {/* AI Verdict */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">AI Verdict</span>
                  </div>
                  <p className="text-sm font-medium mb-2">{result.verdict}</p>
                  <p className="text-xs text-muted-foreground">{result.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {variants.length === 1 && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Ready to Test New Strategies?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add pricing variants to discover how different strategies might impact your revenue and growth.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Strategy Variant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
