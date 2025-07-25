'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { LuSend } from "react-icons/lu";
import { useUser } from '@clerk/nextjs'
import { 
  IoSearchOutline, 
  IoAnalyticsOutline, 
  IoTimeOutline,
  IoDocumentTextOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoFlashOutline
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'
import { DeepResearchSearchBar } from './deepresearch-search-bar'

interface Source {
  title: string
  url: string
  relevance: number
  type: 'research' | 'news' | 'academic' | 'government' | 'industry'
}

interface ResearchInsight {
  id: string
  category: string
  finding: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  sources: string[]
}

interface TrendAnalysis {
  trend: string
  direction: 'up' | 'down' | 'stable'
  magnitude: number
  timeframe: string
  description: string
}

interface BusinessHealth {
  cashFlowInsights: string
  pricingPosition: string
  riskFactors: string[]
  opportunityScore: number
  stressLevel: 'low' | 'medium' | 'high'
}

interface ActionablePlan {
  priority: 'high' | 'medium' | 'low'
  category: string
  action: string
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
  cost: 'free' | 'low' | 'medium' | 'high'
  roi: string
}

interface CompetitorIntel {
  competitorType: 'Direct' | 'Indirect' | 'Aspirational'
  pricingStrategy: string
  differentiator: string
  weakness: string
  lessons: string
}

interface FinancialProjection {
  scenario: 'Conservative' | 'Optimistic' | 'Aggressive'
  timeframe: string
  revenue: string
  expenses: string
  cashflow: string
  keyAssumptions: string[]
  triggerEvents: string[]
}

interface MarketOpportunity {
  opportunity: string
  timeWindow: string
  entryBarrier: 'low' | 'medium' | 'high'
  potentialRevenue: string
  requiredInvestment: string
  firstSteps: string[]
}

interface WarningSignal {
  signal: string
  severity: 'low' | 'medium' | 'high'
  timeframe: string
  preventiveAction: string
  cost: string
}

interface QuickWin {
  action: string
  impact: string
  timeToImplement: string
  resources: string
}

interface ResearchResult {
  query: string
  summary: string
  businessHealth: BusinessHealth
  actionablePlans: ActionablePlan[]
  competitorIntelligence: CompetitorIntel[]
  financialProjections: FinancialProjection[]
  marketOpportunities: MarketOpportunity[]
  warningSignals: WarningSignal[]
  quickWins: QuickWin[]
  sources: Source[]
  confidence: number
  researchDepth: number
  urgency: 'low' | 'medium' | 'high'
  implementationComplexity: 'simple' | 'moderate' | 'complex'
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface DeepResearchPageClientProps {
  organizations: Organization[]
  currentOrganization: Organization
}

interface ReasoningStep {
  type: 'forward' | 'backward' | 'validation'
  step: string
  confidence: number
  timestamp: number
}

interface ReasoningProcess {
  userPrompt: string
  forwardReasoning: ReasoningStep[]
  backwardReasoning: ReasoningStep[]
  validation: ReasoningStep[]
}

const TypewriterText = ({ 
  text, 
  speed = 30, 
  onComplete,
  shouldStart = true 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
  shouldStart?: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!shouldStart) {
      setDisplayedText('')
      setIsComplete(false)
      return
    }

    let timeoutId: NodeJS.Timeout
    let currentIndex = 0
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
        timeoutId = setTimeout(typeNextChar, speed)
      } else if (!isComplete) {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Reset and start typing
    setDisplayedText('')
    setIsComplete(false)
    currentIndex = 0
    timeoutId = setTimeout(typeNextChar, speed)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [text, speed, onComplete, shouldStart])

  return <span>{displayedText}</span>
}

export function DeepResearchPageClient({ organizations, currentOrganization }: DeepResearchPageClientProps) {
  const { user } = useUser()
  const [query, setQuery] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [researchHistory, setResearchHistory] = useState<string[]>([])
  const [reasoning, setReasoning] = useState<ReasoningProcess | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [currentReasoningStep, setCurrentReasoningStep] = useState<string>('')
  const [reasoningPhase, setReasoningPhase] = useState<'forward' | 'backward' | 'validation' | 'synthesis'>('forward')
  const carouselRef = useRef<HTMLDivElement>(null)

  const suggestionPrompts = [
    "Pricing strategy for freelance web design services in 2024",
    "Cash flow optimization for seasonal retail businesses",
    "Customer acquisition cost reduction for local service businesses", 
    "Competitor pricing analysis for boutique consulting firms",
    "Financial stress indicators for e-commerce SMBs during Q4",
    "Revenue diversification strategies for creative agencies",
    "Subscription model transition for service-based businesses",
    "Invoice collection best practices for freelancers",
    "Market positioning for premium vs budget service providers",
    "Business model pivot strategies during economic uncertainty",
    "Cost structure optimization for remote consulting businesses",
    "Client retention strategies for subscription-based SMBs",
    "Pricing psychology for high-value service businesses",
    "Financial runway extension tactics for cash-strapped startups",
    "Market demand analysis for digital marketing services",
    "Competitive differentiation for crowded service markets",
    "Operational efficiency improvements for solo entrepreneurs",
    "Growth funding alternatives for bootstrapped SMBs"
  ]

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const scrollWidth = carousel.scrollWidth
    const clientWidth = carousel.clientWidth
    
    let animationId: number
    let startTime: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      
      const elapsed = currentTime - startTime
      const progress = (elapsed / 180000) % 1 
      
      const scrollPosition = progress * (scrollWidth - clientWidth)
      carousel.scrollLeft = scrollPosition
      
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  const handleResearch = async () => {
    if (!query.trim()) return

    setIsResearching(true)
    setResult(null)
    setReasoning({
      userPrompt: query,
      forwardReasoning: [],
      backwardReasoning: [],
      validation: []
    })
    setCurrentReasoningStep('Initializing research process...')
    setReasoningPhase('forward')

    try {
      const response = await fetch('/api/deepresearch/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform research')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'reasoning') {
                  setCurrentReasoningStep(data.step)
                  setReasoningPhase(data.reasoningType)
                  setReasoning(prev => {
                    if (!prev) return prev
                    const newStep: ReasoningStep = {
                      type: data.reasoningType,
                      step: data.step,
                      confidence: data.confidence || 0,
                      timestamp: Date.now()
                    }
                    
                    const updated = { ...prev }
                    if (data.reasoningType === 'forward') {
                      updated.forwardReasoning = [...prev.forwardReasoning, newStep]
                    } else if (data.reasoningType === 'backward') {
                      updated.backwardReasoning = [...prev.backwardReasoning, newStep]
                    } else if (data.reasoningType === 'validation') {
                      updated.validation = [...prev.validation, newStep]
                    }
                    
                    return updated
                  })
                } else if (data.type === 'result') {
                  setResult(data.result)
                  setCurrentReasoningStep('')
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e)
              }
            }
          }
        }
      }

      setResearchHistory(prev => [query, ...prev.slice(0, 9)])
      toast.success('Research completed')
    } catch (error) {
      console.error('Research failed:', error)
      toast.error('Failed to perform research. Please try again.')
    } finally {
      setIsResearching(false)
    }
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'forward': return 'Analyzing forward reasoning'
      case 'backward': return 'Validating backward reasoning'
      case 'validation': return 'Performing validation checks'
      case 'synthesis': return 'Synthesizing findings'
      default: return 'Processing'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <IoWarningOutline className="w-4 h-4 text-red-500" />
      case 'medium': return <IoInformationCircleOutline className="w-4 h-4 text-yellow-500" />
      case 'low': return <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500" />
      default: return <IoInformationCircleOutline className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '→'
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const firstName = user?.firstName || 'there'
    
    if (hour >= 5 && hour < 10) {
      return `Ready to optimize your business, ${firstName}?`
    } else if (hour >= 10 && hour < 12) {
      return `Let's dive into market insights, ${firstName}!`
    } else if (hour >= 12 && hour < 17) {
      return `Time for some competitive intelligence, ${firstName}!`
    } else if (hour >= 17 && hour < 20) {
      return `Evening strategy session, ${firstName}?`
    } else if (hour >= 20 && hour < 23) {
      return `Late night business planning, ${firstName}?`
    } else {
      return `Midnight business insights, ${firstName}?`
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganization}
      />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="max-w-6xl mx-auto px-8 py-16 pb-32">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2 tracking-tight">
            {getGreeting()}
          </h1>
        </div>

        {!result && !isResearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 mb-16"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Research your market
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Get deep insights on pricing, competitors, market trends, and financial patterns
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleResearch()
                    }
                  }}
                  placeholder="Research pricing strategies, market trends, competitor analysis..."
                  className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-transparent shadow-sm"
                />
                <button
                  onClick={handleResearch}
                  disabled={!query.trim() || isResearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-amber-600 hover:text-amber-800 disabled:text-gray-400 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                  <LuSend  className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Suggestion Pills Carousel */}
            <div className="relative max-w-4xl mx-auto">
              <div 
                ref={carouselRef}
                className="flex gap-3 overflow-x-hidden scrollbar-hide py-2"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}
              >
                {[...suggestionPrompts, ...suggestionPrompts].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(prompt)
                      // Optional: automatically focus the search input after setting query
                      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
                      if (searchInput) {
                        searchInput.focus()
                      }
                    }}
                    className="flex-shrink-0 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {researchHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent searches</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {researchHistory.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* User Query Display */}
        {reasoning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-medium">Q</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Research Query</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {reasoning.userPrompt}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reasoning Process */}
        {reasoning && (isResearching || reasoning.forwardReasoning.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isResearching ? 'Thinking...' : 'Reasoning'}
                </h3>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showReasoning ? (
                    <IoChevronUpOutline className="w-4 h-4" />
                  ) : (
                    <IoChevronDownOutline className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Current step when processing */}
              {isResearching && currentReasoningStep && (
                <motion.div
                  key={currentReasoningStep}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {currentReasoningStep}
                  </p>
                </motion.div>
              )}

              {showReasoning && (
                <div className="space-y-4">
                  {/* Forward Reasoning */}
                  {reasoning.forwardReasoning.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Forward Reasoning
                      </h4>
                      {reasoning.forwardReasoning.map((step, index) => (
                        <motion.div
                          key={`forward-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light pl-4 border-l-2 border-amber-200 dark:border-amber-800"
                        >
                          {step.step}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Backward Reasoning */}
                  {reasoning.backwardReasoning.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Backward Reasoning
                      </h4>
                      {reasoning.backwardReasoning.map((step, index) => (
                        <motion.div
                          key={`backward-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light pl-4 border-l-2 border-green-200 dark:border-green-800"
                        >
                          {step.step}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Validation */}
                  {reasoning.validation.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Validation
                      </h4>
                      {reasoning.validation.map((step, index) => (
                        <motion.div
                          key={`validation-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light pl-4 border-l-2 border-yellow-200 dark:border-yellow-800"
                        >
                          {step.step}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isResearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-3xl mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <IoSearchOutline className="w-12 h-12 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Analyzing market data
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Gathering competitive intelligence and financial insights
              </p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Summary */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                    Market Intelligence Summary
                  </h2>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getConfidenceColor(result.confidence)} border`}>
                      {result.confidence}% confidence
                    </Badge>
                    <Badge variant="outline">
                      Depth: {result.researchDepth}/10
                    </Badge>
                  </div>
                </div>
                <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                  <CardContent className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.summary}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Business Health Dashboard */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoAnalyticsOutline className="w-6 h-6" />
                  Business Health Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">Opportunity Score</h3>
                        <div className={`text-2xl font-bold ${
                          result.businessHealth.opportunityScore >= 80 ? 'text-green-600' :
                          result.businessHealth.opportunityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {result.businessHealth.opportunityScore}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            result.businessHealth.opportunityScore >= 80 ? 'bg-green-600' :
                            result.businessHealth.opportunityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${result.businessHealth.opportunityScore}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Stress Level</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          result.businessHealth.stressLevel === 'low' ? 'bg-green-500' :
                          result.businessHealth.stressLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="capitalize text-gray-700 dark:text-gray-300">
                          {result.businessHealth.stressLevel}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.businessHealth.cashFlowInsights}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Risk Factors</h3>
                      <div className="space-y-2">
                        {result.businessHealth.riskFactors.slice(0, 3).map((risk, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <IoWarningOutline className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Wins */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoFlashOutline className="w-6 h-6" />
                  Quick Wins (Implement This Week)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.quickWins.map((win, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-green-50/50 dark:bg-green-950/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              {win.action}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {win.impact}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>⏱️ {win.timeToImplement}</span>
                              <span>📋 {win.resources}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actionable Plans */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoDocumentTextOutline className="w-6 h-6" />
                  Strategic Action Plans
                </h2>
                <div className="space-y-4">
                  {result.actionablePlans.map((plan, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              plan.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                              plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }>
                              {plan.priority} priority
                            </Badge>
                            <Badge variant="outline">{plan.category}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ROI: {plan.roi}
                            </div>
                            <div className="text-xs text-gray-500">
                              {plan.effort} effort • {plan.cost} cost
                            </div>
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {plan.action}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {plan.expectedImpact}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Financial Projections */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoTrendingUpOutline className="w-6 h-6" />
                  Financial Scenarios
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {result.financialProjections.map((projection, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {projection.scenario}
                          </h3>
                          <Badge variant="outline">{projection.timeframe}</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Revenue</div>
                            <div className="text-sm font-medium text-green-600">{projection.revenue}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Cash Flow</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {projection.cashflow}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Key Assumptions</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {projection.keyAssumptions.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Warning Signals */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoWarningOutline className="w-6 h-6" />
                  Early Warning System
                </h2>
                <div className="space-y-3">
                  {result.warningSignals.map((warning, index) => (
                    <Card key={index} className={`border-0 shadow-sm ${
                      warning.severity === 'high' ? 'bg-red-50/50 dark:bg-red-950/20' :
                      warning.severity === 'medium' ? 'bg-yellow-50/50 dark:bg-yellow-950/20' :
                      'bg-gray-50/50 dark:bg-gray-950/50'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            warning.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                            warning.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-gray-100 dark:bg-gray-900/30'
                          }`}>
                            <IoWarningOutline className={`w-4 h-4 ${
                              warning.severity === 'high' ? 'text-red-600' :
                              warning.severity === 'medium' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {warning.signal}
                              </h3>
                              <Badge className={
                                warning.severity === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }>
                                {warning.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {warning.preventiveAction}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Timeline: {warning.timeframe}</span>
                              <span>Prevention cost: {warning.cost}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Competitor Intelligence */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                  Competitive Intelligence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.competitorIntelligence.map((intel, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {intel.competitorType} Competitor
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">PRICING STRATEGY</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {intel.pricingStrategy}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">DIFFERENTIATOR</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {intel.differentiator}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">OPPORTUNITY</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {intel.weakness}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-medium text-amber-600 mb-1">KEY TAKEAWAY</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {intel.lessons}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Market Opportunities */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                  Market Opportunities
                </h2>
                <div className="space-y-4">
                  {result.marketOpportunities.map((opportunity, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {opportunity.opportunity}
                          </h3>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-600">
                              {opportunity.potentialRevenue}
                            </div>
                            <div className="text-xs text-gray-500">
                              {opportunity.entryBarrier} barrier
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">FIRST STEPS</div>
                            <ul className="space-y-1">
                              {opportunity.firstSteps.map((step, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></div>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">INVESTMENT NEEDED</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {opportunity.requiredInvestment}
                            </p>
                            <div className="text-xs text-gray-500">
                              Window: {opportunity.timeWindow}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Search Bar for when results are shown */}
      {(result || isResearching) && (
        <DeepResearchSearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleResearch}
          isLoading={isResearching}
        />
      )}
    </div>
  )
}