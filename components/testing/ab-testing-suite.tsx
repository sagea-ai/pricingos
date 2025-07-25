'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TestTube, 
  Target, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3
} from 'lucide-react'

interface ABTestData {
  testType: string
  data: {
    testScenarios: Array<{
      name: string
      hypothesis: string
      variants: Array<{
        name: string
        description: string
        implementation: string
        expectedImpact: string
        metrics: string[]
      }>
      primaryMetric: string
      secondaryMetrics: string[]
      sampleSize: string
      duration: string
      successCriteria: string
      risks: string[]
      implementation: {
        difficulty: string
        resources: string
        timeline: string
        tools: string[]
      }
    }>
    recommendations: Array<{
      priority: string
      test: string
      reasoning: string
      expectedLift: string
    }>
  }
}

export function ABTestingSuite() {
  const [selectedTestType, setSelectedTestType] = useState('')
  const [duration, setDuration] = useState('30 days')
  const [confidence, setConfidence] = useState('95')
  const [testData, setTestData] = useState<ABTestData | null>(null)
  const [loading, setLoading] = useState(false)

  const testTypes = [
    { id: 'pricing', name: 'Pricing Strategy', description: 'Test different pricing models and price points' },
    { id: 'messaging', name: 'Value Proposition', description: 'Test different ways to communicate your value' },
    { id: 'features', name: 'Feature Positioning', description: 'Test which features to highlight' },
    { id: 'onboarding', name: 'User Onboarding', description: 'Test different onboarding flows' },
    { id: 'conversion', name: 'Conversion Funnel', description: 'Test different conversion strategies' },
    { id: 'retention', name: 'User Retention', description: 'Test strategies to keep users engaged' }
  ]

  const generateTestScenarios = async () => {
    if (!selectedTestType) return

    setLoading(true)
    try {
      const response = await fetch('/api/testing/ab-test-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: selectedTestType,
          duration,
          confidence: parseInt(confidence)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestData(data)
      }
    } catch (error) {
      console.error('Failed to generate test scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive'
      case 'Medium': return 'secondary'
      case 'Low': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Pricing Experiment Designer</h2>
        <p className="text-muted-foreground">
          Design and plan data-driven pricing experiments to optimize your strategy
        </p>
      </div>

      {!testData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Design Your Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testType">Test Type</Label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select what you want to test" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Test Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7 days">1 Week</SelectItem>
                    <SelectItem value="14 days">2 Weeks</SelectItem>
                    <SelectItem value="30 days">1 Month</SelectItem>
                    <SelectItem value="60 days">2 Months</SelectItem>
                    <SelectItem value="90 days">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="confidence">Confidence Level</Label>
                <Select value={confidence} onValueChange={setConfidence}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateTestScenarios}
              disabled={!selectedTestType || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Test Scenarios...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Generate Test Scenarios
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {testData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {testTypes.find(t => t.id === selectedTestType)?.name} Test Scenarios
            </h3>
            <Button 
              variant="outline" 
              onClick={() => setTestData(null)}
            >
              Create New Test
            </Button>
          </div>

          {/* Recommendations */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended Test Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testData.data.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(rec.priority)}>{rec.priority} Priority</Badge>
                        <span className="font-medium">{rec.test}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{rec.expectedLift}</div>
                      <div className="text-xs text-muted-foreground">Expected Lift</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Scenarios */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Test Scenarios</h4>
            {testData.data.testScenarios?.map((scenario, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge className={getDifficultyColor(scenario.implementation?.difficulty)}>
                      {scenario.implementation?.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <h5 className="font-medium mb-1">Hypothesis</h5>
                    <p className="text-sm">{scenario.hypothesis}</p>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Test Variants</h5>
                    <div className="grid gap-3">
                      {scenario.variants?.map((variant, vIndex) => (
                        <div key={vIndex} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{variant.name}</Badge>
                            <span className="font-medium text-sm">{variant.description}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p><strong>Implementation:</strong> {variant.implementation}</p>
                            <p><strong>Expected Impact:</strong> {variant.expectedImpact}</p>
                            <p><strong>Metrics:</strong> {variant.metrics?.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Metrics & Success
                      </h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Primary Metric:</strong> {scenario.primaryMetric}</p>
                        <p><strong>Secondary Metrics:</strong> {scenario.secondaryMetrics?.join(', ')}</p>
                        <p><strong>Success Criteria:</strong> {scenario.successCriteria}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Implementation
                      </h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Sample Size:</strong> {scenario.sampleSize}</p>
                        <p><strong>Duration:</strong> {scenario.duration}</p>
                        <p><strong>Setup Time:</strong> {scenario.implementation?.timeline}</p>
                        <p><strong>Tools:</strong> {scenario.implementation?.tools?.join(', ')}</p>
                      </div>
                    </div>
                  </div>

                  {scenario.risks && scenario.risks.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-200">Risks to Consider</span>
                      </div>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                        {scenario.risks.map((risk, rIndex) => (
                          <li key={rIndex}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Start This Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
