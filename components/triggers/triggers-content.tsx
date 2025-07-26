'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  AlertTriangle, 
  Mail, 
  DollarSign, 
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  Bell,
  Settings,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Zap,
  Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface ProductProfile {
  productName: string;
  currentPricingModel: string | null;
  currentPrice: string | null;
  market: string | null;
}

interface TriggersContentProps {
  organizationName: string;
  organizationId: string;
  user: User;
  productProfile: ProductProfile | null;
}

interface TriggerSetting {
  id: string;
  triggerId: string;
  name: string;
  description: string;
  category: 'FINANCIAL' | 'USER' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isEnabled: boolean;
  emailTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TriggerWithIcon extends TriggerSetting {
  icon: React.ReactNode;
}

export function TriggersContent({ organizationName, organizationId, user, productProfile }: TriggersContentProps) {
  const [triggers, setTriggers] = useState<TriggerWithIcon[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [savingTriggerId, setSavingTriggerId] = useState<string | null>(null)
  const [isSendingAlerts, setIsSendingAlerts] = useState(false)

  // Icon mapping for triggers
  const getIconForTrigger = (triggerId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'critical-cash-runway': <AlertTriangle className="h-5 w-5 text-red-500" />,
      'low-cash-runway': <TrendingDown className="h-5 w-5 text-orange-500" />,
      'negative-mrr-growth': <DollarSign className="h-5 w-5 text-red-500" />,
      'high-churn-rate': <Users className="h-5 w-5 text-orange-500" />,
      'failed-payments': <CreditCard className="h-5 w-5 text-red-500" />,
      'subscription-cancellations': <XCircle className="h-5 w-5 text-orange-500" />,
      'revenue-milestone': <CheckCircle className="h-5 w-5 text-green-500" />,
      'new-customer-milestone': <Users className="h-5 w-5 text-green-500" />,
      'integration-failures': <Settings className="h-5 w-5 text-red-500" />,
      'data-sync-delays': <Calendar className="h-5 w-5 text-orange-500" />
    }
    return iconMap[triggerId] || <Bell className="h-5 w-5 text-gray-500" />
  }

  // Load triggers from API
  useEffect(() => {
    const loadTriggers = async () => {
      try {
        const response = await fetch(`/api/triggers?organizationId=${organizationId}`)
        if (response.ok) {
          const data = await response.json()
          const triggersWithIcons = data.triggers.map((trigger: TriggerSetting) => ({
            ...trigger,
            icon: getIconForTrigger(trigger.triggerId)
          }))
          setTriggers(triggersWithIcons)
        } else {
          toast.error('Failed to load trigger settings')
        }
      } catch (error) {
        console.error('Failed to load triggers:', error)
        toast.error('Failed to load trigger settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadTriggers()
  }, [organizationId])

  const toggleTrigger = async (triggerId: string) => {
    setSavingTriggerId(triggerId)
    
    // Optimistically update the UI
    const updatedTriggers = triggers.map(trigger => 
      trigger.triggerId === triggerId 
        ? { ...trigger, isEnabled: !trigger.isEnabled }
        : trigger
    )
    setTriggers(updatedTriggers)

    try {
      // Save to database immediately
      const response = await fetch(`/api/triggers?organizationId=${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggers: updatedTriggers.map(trigger => ({
            triggerId: trigger.triggerId,
            isEnabled: trigger.isEnabled
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Settings updated successfully')
        setLastSaved(new Date())
        
        // Update with server response to ensure consistency
        const triggersWithIcons = data.triggers.map((trigger: TriggerSetting) => ({
          ...trigger,
          icon: getIconForTrigger(trigger.triggerId)
        }))
        setTriggers(triggersWithIcons)
      } else {
        // Revert optimistic update on error
        setTriggers(prev => prev.map(trigger => 
          trigger.triggerId === triggerId 
            ? { ...trigger, isEnabled: !trigger.isEnabled }
            : trigger
        ))
        toast.error('Failed to update settings')
      }
    } catch (error) {
      // Revert optimistic update on error
      setTriggers(prev => prev.map(trigger => 
        trigger.triggerId === triggerId 
          ? { ...trigger, isEnabled: !trigger.isEnabled }
          : trigger
      ))
      console.error('Failed to update trigger:', error)
      toast.error('Failed to update settings')
    } finally {
      setSavingTriggerId(null)
    }
  }

  const saveTriggerSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/triggers?organizationId=${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggers: triggers.map(trigger => ({
            triggerId: trigger.triggerId,
            isEnabled: trigger.isEnabled
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLastSaved(new Date())
        toast.success('All settings saved successfully')
        
        // Update triggers with latest data from server
        const triggersWithIcons = data.triggers.map((trigger: TriggerSetting) => ({
          ...trigger,
          icon: getIconForTrigger(trigger.triggerId)
        }))
        setTriggers(triggersWithIcons)
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save trigger settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendAlerts = async () => {
    setIsSendingAlerts(true)
    try {
      const response = await fetch(`/api/triggers/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(result.message || 'Alerts sent successfully')
      } else {
        toast.error(result.error || 'Failed to send alerts')
      }
    } catch (error) {
      console.error('Error sending alerts:', error)
      toast.error('Error sending alerts')
    } finally {
      setIsSendingAlerts(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FINANCIAL': return <DollarSign className="h-4 w-4" />
      case 'USER': return <Users className="h-4 w-4" />
      case 'SYSTEM': return <Settings className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const groupedTriggers = triggers.reduce((groups, trigger) => {
    const category = trigger.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(trigger)
    return groups
  }, {} as Record<string, TriggerSetting[]>)

  const categoryNames = {
    FINANCIAL: 'Financial Alerts',
    USER: 'Customer & User Alerts', 
    SYSTEM: 'System & Technical Alerts'
  }

  const enabledTriggersCount = triggers.filter(t => t.isEnabled).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-lg"
          >
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Loading triggers...</span>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
                Email Triggers
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Smart notifications for {productProfile?.productName || 'your product'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge 
                  variant="outline" 
                  className="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                >
                  {enabledTriggersCount} of {triggers.length} active
                </Badge>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  onClick={handleSendAlerts} 
                  disabled={isSendingAlerts}
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-md border-0 rounded-xl px-4 py-2 h-auto font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {isSendingAlerts ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Test Alerts
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Status Indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Critical</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {triggers.filter(t => t.severity === 'CRITICAL' && t.isEnabled).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Financial</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {triggers.filter(t => t.category === 'FINANCIAL' && t.isEnabled).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Customer</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {triggers.filter(t => t.category === 'USER' && t.isEnabled).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Mail className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Target</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.email?.split('@')[0] || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Last Saved Status */}
          <AnimatePresence>
            {lastSaved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800"
              >
                <CheckCircle className="h-4 w-4" />
                Synced at {lastSaved.toLocaleTimeString()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trigger Categories */}
        <div className="space-y-6">
          {Object.entries(groupedTriggers).map(([category, categoryTriggers], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: categoryIndex * 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {categoryNames[category as keyof typeof categoryNames]}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                        {categoryTriggers.length} triggers available
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {categoryTriggers.map((trigger, triggerIndex) => (
                      <motion.div
                        key={trigger.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (categoryIndex * 0.1) + (triggerIndex * 0.05) }}
                        className={`group relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
                          trigger.isEnabled 
                            ? 'border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-800/50' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg transition-colors ${
                            trigger.isEnabled 
                              ? 'bg-amber-100 dark:bg-amber-900/30' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {(trigger as TriggerWithIcon).icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {trigger.name}
                              </h3>
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(trigger.severity)}`}
                                variant="outline"
                              >
                                {trigger.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {trigger.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <AnimatePresence>
                              {savingTriggerId === trigger.triggerId ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-2 text-amber-600 dark:text-amber-400"
                                >
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-xs font-medium">Syncing</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex items-center gap-3"
                                >
                                  <Label 
                                    htmlFor={trigger.id} 
                                    className={`text-xs font-medium cursor-pointer transition-colors ${
                                      trigger.isEnabled 
                                        ? 'text-amber-700 dark:text-amber-300' 
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  >
                                    {trigger.isEnabled ? 'Active' : 'Inactive'}
                                  </Label>
                                  <Switch
                                    id={trigger.id}
                                    checked={trigger.isEnabled}
                                    disabled={savingTriggerId === trigger.triggerId}
                                    onCheckedChange={() => toggleTrigger(trigger.triggerId)}
                                    className="data-[state=checked]:bg-amber-500"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        {trigger.isEnabled && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full shadow-lg"
                          >
                            <Zap className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Email Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notification Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Configure where alerts are delivered
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Primary Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email || 'No email configured'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
