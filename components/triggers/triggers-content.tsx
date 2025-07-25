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
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-green-950 dark:to-gray-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading trigger settings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-green-950 dark:to-gray-950">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Triggers</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configure automated email notifications for {productProfile?.productName || 'your product'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {enabledTriggersCount} of {triggers.length} enabled
            </Badge>
            <Button 
              onClick={handleSendAlerts} 
              disabled={isSendingAlerts}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingAlerts ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send alerts'
              )}
            </Button>
            <Button 
              onClick={saveTriggerSettings}
              disabled={isSaving}
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Syncing...' : 'Force Sync'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-amber-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Critical Alerts</div>
                  <div className="text-lg font-bold text-red-600">
                    {triggers.filter(t => t.severity === 'CRITICAL' && t.isEnabled).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Financial</div>
                  <div className="text-lg font-bold text-amber-600">
                    {triggers.filter(t => t.category === 'FINANCIAL' && t.isEnabled).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Customer</div>
                  <div className="text-lg font-bold text-blue-600">
                    {triggers.filter(t => t.category === 'USER' && t.isEnabled).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Email Target</div>
                  <div className="text-sm font-bold text-gray-600 truncate">
                    {user.email || 'No email set'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
          >
            <CheckCircle className="h-4 w-4" />
            Settings saved at {lastSaved.toLocaleTimeString()}
          </motion.div>
        )}

        {/* Trigger Categories */}
        <div className="space-y-6">
          {Object.entries(groupedTriggers).map(([category, categoryTriggers]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    {getCategoryIcon(category)}
                    {categoryNames[category as keyof typeof categoryNames]}
                  </CardTitle>
                  <CardDescription>
                    Configure email notifications for {category} events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryTriggers.map((trigger) => (
                      <div 
                        key={trigger.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          trigger.isEnabled 
                            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' 
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {(trigger as TriggerWithIcon).icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {trigger.name}
                              </h3>
                              <Badge 
                                className={`text-xs ${getSeverityColor(trigger.severity)}`}
                                variant="outline"
                              >
                                {trigger.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {trigger.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {savingTriggerId === trigger.triggerId ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                              <span className="text-sm text-amber-600">Saving...</span>
                            </div>
                          ) : (
                            <Label 
                              htmlFor={trigger.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {trigger.isEnabled ? 'Enabled' : 'Disabled'}
                            </Label>
                          )}
                          <Switch
                            id={trigger.id}
                            checked={trigger.isEnabled}
                            disabled={savingTriggerId === trigger.triggerId}
                            onCheckedChange={() => toggleTrigger(trigger.triggerId)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Email Configuration Info */}
        <Card className="border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 text-amber-600" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              All notifications will be sent to your registered email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Primary Email</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email || 'No email address configured'}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
