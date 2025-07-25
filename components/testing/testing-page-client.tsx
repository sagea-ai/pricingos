'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { TrialProvider } from '@/components/trial/trial-provider'
import { TrialBannerWrapper } from '@/components/trial/trial-banner-wrapper'
import { PricingSimulator } from './pricing-simulator'
import { BusinessIntelligenceDashboard } from './business-intelligence-dashboard'
import { ABTestingSuite } from './ab-testing-suite'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Target, 
  TrendingUp,
  BarChart3,
  TestTube,
  Lightbulb,
  Zap
} from 'lucide-react'

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface ProductProfile {
  id: string;
  productName: string;
  coreValue: string;
  features: string[];
  market: string | null;
  currentPricingModel: string | null;
  currentPrice: string | null;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface TestingPageClientProps {
  user: User;
  productProfile: ProductProfile;
  organizations: Organization[];
  currentOrganization: Organization;
}

type ActiveTool = 'simulator' | 'intelligence' | 'testing' | null

export function TestingPageClient({ 
  user, 
  productProfile, 
  organizations, 
  currentOrganization 
}: TestingPageClientProps) {
  const [currentOrg, setCurrentOrg] = useState(currentOrganization)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrg(org)
    }
  }

  const tools = [
    {
      id: 'simulator' as const,
      title: 'Pricing Simulator',
      description: 'Test pricing strategies with AI-simulated outcomes',
      icon: Brain,
      color: 'bg-blue-500',
      features: ['Revenue Impact Prediction', 'Churn Analysis', 'Risk Assessment', 'Competitive Positioning']
    },
    {
      id: 'intelligence' as const,
      title: 'Market Intelligence',
      description: 'Deep competitive analysis and market insights',
      icon: Target,
      color: 'bg-purple-500',
      features: ['Competitor Analysis', 'Market Positioning', 'Growth Opportunities', 'Pricing Benchmarks']
    },
    {
      id: 'testing' as const,
      title: 'A/B Test Designer',
      description: 'Design and plan pricing experiments',
      icon: TestTube,
      color: 'bg-green-500',
      features: ['Test Scenarios', 'Statistical Planning', 'Implementation Guides', 'Success Metrics']
    }
  ]

  const stats = [
    {
      title: 'Product Features',
      value: productProfile.features.length,
      icon: Target,
      description: 'Core capabilities mapped'
    },
    {
      title: 'Market',
      value: productProfile.market || 'Not set',
      icon: TrendingUp,
      description: 'Target market segment'
    },
    {
      title: 'Pricing Model',
      value: productProfile.currentPricingModel || 'Not set',
      icon: BarChart3,
      description: 'Current pricing strategy'
    }
  ]

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'simulator':
        return <PricingSimulator productProfile={productProfile} />
      case 'intelligence':
        return <BusinessIntelligenceDashboard productName={productProfile.productName} />
      case 'testing':
        return <ABTestingSuite />
      default:
        return null
    }
  }

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrg}
      onOrganizationChange={handleOrganizationChange}
      user={{
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }}
    >
      <TrialProvider>
        <TrialBannerWrapper />
        <div className="max-w-7xl mx-auto py-6 px-4">
          {!activeTool ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      PricingOS Strategy Hub
                    </h1>
                    <p className="text-muted-foreground">
                      Your AI pricing strategist for <strong>{productProfile.productName}</strong>
                    </p>
                  </div>
                </div>

                {/* Product Context */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Product Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6 mb-4">
                      {stats.map((stat, index) => {
                        const IconComponent = stat.icon
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{stat.value}</div>
                              <div className="text-sm text-muted-foreground">{stat.description}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Core Value Proposition</h4>
                      <p className="text-sm text-muted-foreground">{productProfile.coreValue}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {productProfile.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tools Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {tools.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <Card key={tool.id} className="cursor-pointer hover:shadow-lg transition-all group">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center mb-6">
                          <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                          {tool.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        <Button 
                          onClick={() => setActiveTool(tool.id)}
                          className="w-full"
                          size="lg"
                        >
                          Launch {tool.title}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTool(null)}
                    size="sm"
                  >
                    ← Back to Hub
                  </Button>
                  <h2 className="text-2xl font-bold">
                    {tools.find(t => t.id === activeTool)?.title}
                  </h2>
                </div>
              </div>
              {renderActiveTool()}
            </div>
          )}
        </div>
      </TrialProvider>
    </AppLayout>
  )
}
