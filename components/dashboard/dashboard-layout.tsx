import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Calendar, AlertTriangle, TrendingDown, ArrowRight, MessageSquare, TrendingUp, DollarSign, Shield, Target, Activity, Zap, PieChart } from "lucide-react"
import Link from "next/link"
import { TrialProvider } from "../trial/trial-provider"
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"
import { Line } from "react-chartjs-2"
import { useState } from "react"
import { TimeRangeOption } from "@/types/types"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface WeeklyActivity {
  commits: number[];
  prs: number[];
  comments: number[];
  days: string[];
}

interface AnalyticsData {
  avgTimeToMerge: number;
  avgPrSize: number;
  commentsPerPr: number;
  weeklyActivity: WeeklyActivity;
  repositoriesCount: number;
  timeToMergeTrend: number;
}

interface DashboardLayoutProps {
  organizationName?: string;
  organizationId?: string;
  hasConnectedRepositories?: boolean;
  repositoriesCount?: number;
  isLoading?: boolean;
  analyticsData?: AnalyticsData;
  userName?: string;
}

// Time-based greeting function
function getTimeBasedGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : "";
  
  if (hour >= 5 && hour < 12) {
    return `Good Morning${name}`;
  } else if (hour >= 12 && hour < 17) {
    return `Good Afternoon${name}`;
  } else if (hour >= 17 && hour < 22) {
    return `Good Evening${name}`;
  } else {
    return `Good Night${name}`;
  }
}

export function DashboardLayout({ 
  organizationName, 
  organizationId,
  userName,
  isLoading = false,
}: DashboardLayoutProps) {
  const greeting = getTimeBasedGreeting(userName);

  // Mock financial data for demonstration
  const mockFinancialStats = {
    cashFlowScore: 72,
    riskLevel: "Medium",
    accountsMonitored: 5,
    alertsThisWeek: 3
  };

  // Mock pricing data for demonstration
  const mockPricingStats = {
    pricingScore: 85,
    priceOptimizations: 12,
    revenueIncrease: 8.5,
    competitorsTracked: 15
  };

  const mockRecentAlerts = [
    {
      id: 1,
      title: "Cash flow dip detected",
      severity: "medium",
      date: "2 days ago",
      status: "active",
      description: "Outgoing payments exceed incoming by 15% this week",
      type: "financial"
    },
    {
      id: 2,
      title: "Competitor price change detected",
      severity: "high",
      date: "1 day ago", 
      status: "active",
      description: "CompetitorX reduced pricing by 12% on similar products",
      type: "pricing"
    },
    {
      id: 3,
      title: "Price optimization opportunity",
      severity: "low",
      date: "3 days ago",
      status: "monitoring", 
      description: "AI suggests 6% price increase could boost revenue by $2.3K",
      type: "pricing"
    },
    {
      id: 4,
      title: "Payment delay pattern identified",
      severity: "high",
      date: "1 week ago", 
      status: "resolved",
      description: "3 clients showing consistent late payment behavior",
      type: "financial"
    }
  ];

  const mockCashFlowData = {
    labels: ['2 weeks ago', '1 week ago', 'Today'],
    datasets: [
      {
        label: 'Cash Flow Health Score',
        data: [65, 78, 72],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const mockRiskTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Financial Risk Level',
        data: [45, 52, 38, 41, 35, 28],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const mockPricingTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Average Price Point',
        data: [45, 48, 52, 49, 53, 56],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Market Average',
        data: [42, 44, 47, 46, 48, 50],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: false,
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-green-950 dark:to-gray-950">
      <TrialProvider>
        {/* Trial Banner (must keep) - full width ribbon style */}
        <div className="w-full">
          <TrialBannerWrapper />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {greeting}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Monitor your financial health and optimize your pricing strategy with AI-powered insights to prevent stress and maximize revenue.
            </p>
          </div>

          {/* Main Grid Layout (Quick Actions, Financial Health, Pricing Intelligence) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500 dark:text-green-400" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors group">
                  <Link href="/cash-flow-analysis">
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-500 group-hover:text-green-600 transition" /> Cash Flow Analysis
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Deep dive into your finances</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-500 group-hover:text-green-600 transition" />
                  </Link>
                </button>

                <button className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group">
                  <Link href="/price-optimization">
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition" /> Price Optimization
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">AI-powered pricing strategy</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition" />
                  </Link>
                </button>

                <button className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors group">
                  <Link href="/stress-detector">
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500 group-hover:text-green-600 transition" /> Stress Detector
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">AI-powered risk assessment</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-500 group-hover:text-green-600 transition" />
                  </Link>
                </button>

                <button className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group">
                  <Link href="/market-analysis">
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition" /> Market Analysis
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Competitor & market insights</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition" />
                  </Link>
                </button>
              </div>
            </div>

            {/* Combined Stats Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500 dark:text-green-400" /> Business Health
              </h2>
              <div className="space-y-4">
                {/* Financial Health */}
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Financial</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cash Flow Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{mockFinancialStats.cashFlowScore}</p>
                        <Badge variant={mockFinancialStats.cashFlowScore >= 70 ? "default" : "destructive"} className="text-xs">
                          {mockFinancialStats.cashFlowScore >= 70 ? "Healthy" : "At Risk"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Risk Level</p>
                      <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{mockFinancialStats.riskLevel}</p>
                    </div>
                  </div>
                </div>
                
                {/* Pricing Intelligence */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pricing</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pricing Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{mockPricingStats.pricingScore}</p>
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Optimized
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Revenue Increase</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">+{mockPricingStats.revenueIncrease}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Recent Alerts & Opportunities
              </h2>
              <div className="space-y-3">
                {mockRecentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' : 
                          alert.severity === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          alert.type === 'pricing' ? 'border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400' :
                          'border-green-200 text-green-600 dark:border-green-800 dark:text-green-400'
                        }`}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{alert.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          alert.status === 'active' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {alert.status}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Section (Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cash Flow Health Trend */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" /> Cash Flow Health Trend
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Line
                  data={mockCashFlowData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                      }
                    },
                    scales: {
                      x: { 
                        title: { display: true, text: 'Timeline' },
                        grid: { display: false }
                      },
                      y: { 
                        title: { display: true, text: 'Health Score' }, 
                        min: 0, 
                        max: 100,
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Track your financial health score over time.</p>
            </div>
            
            {/* Pricing Trends */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Pricing vs Market
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Line
                  data={mockPricingTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        display: true, 
                        position: 'top',
                        labels: { boxWidth: 12, padding: 15 }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                      }
                    },
                    scales: {
                      x: { 
                        title: { display: true, text: 'Month' },
                        grid: { display: false }
                      },
                      y: { 
                        title: { display: true, text: 'Price ($)' }, 
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Compare your pricing strategy against market averages.</p>
            </div>
          </div>

          {/* Bottom Row - Risk Analysis & Pricing Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Risk Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500 dark:text-red-400" /> Financial Risk Analysis
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-4 w-full">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Payment Delays</p>
                      <p className="text-lg font-semibold text-red-800 dark:text-red-200">High</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Cash Flow</p>
                      <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Medium</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Expense Control</p>
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200">Good</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Revenue Stability</p>
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">Stable</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">AI analysis of your financial risk factors across key areas.</p>
            </div>

            {/* Pricing Intelligence */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Pricing Intelligence
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-4 w-full">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Price Optimizations</p>
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{mockPricingStats.priceOptimizations}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Revenue Boost</p>
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200">+{mockPricingStats.revenueIncrease}%</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Competitors Tracked</p>
                      <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">{mockPricingStats.competitorsTracked}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Pricing Score</p>
                      <p className="text-lg font-semibold text-orange-800 dark:text-orange-200">{mockPricingStats.pricingScore}/100</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">AI-powered pricing insights and competitor monitoring results.</p>
            </div>
          </div>
        </div>
      </TrialProvider>
    </div>
  );
}