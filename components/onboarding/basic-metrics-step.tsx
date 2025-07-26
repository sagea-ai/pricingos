'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, Calculator } from 'lucide-react'

interface BasicMetricsStepProps {
  onComplete: (data: {
    monthlyRevenue?: number
    totalUsers?: number
    averagePrice?: number
    businessStage: string
    isEstimate: boolean
  }) => void
  onSkip: () => void
  isSubmitting?: boolean
}

export function BasicMetricsStep({ onComplete, onSkip, isSubmitting }: BasicMetricsStepProps) {
  const [formData, setFormData] = useState({
    monthlyRevenue: '',
    totalUsers: '',
    averagePrice: '',
    businessStage: '',
    isEstimate: true
  })

  const businessStages = [
    { id: 'idea', name: 'Idea Stage', desc: 'Still working on the concept' },
    { id: 'building', name: 'Building', desc: 'Developing the product' },
    { id: 'launched', name: 'Recently Launched', desc: 'Live but early stage' },
    { id: 'growing', name: 'Growing', desc: 'Have customers and revenue' },
    { id: 'established', name: 'Established', desc: 'Stable business with good traction' }
  ]

  const handleComplete = () => {
    const data = {
      monthlyRevenue: formData.monthlyRevenue ? parseFloat(formData.monthlyRevenue) : undefined,
      totalUsers: formData.totalUsers ? parseInt(formData.totalUsers) : undefined,
      averagePrice: formData.averagePrice ? parseFloat(formData.averagePrice) : undefined,
      businessStage: formData.businessStage,
      isEstimate: formData.isEstimate
    }
    onComplete(data)
  }

  const hasMinimumData = formData.businessStage && (
    formData.monthlyRevenue || formData.totalUsers || formData.averagePrice
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-xl flex items-center justify-center">
          <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-extralight text-gray-900 dark:text-white mb-2 tracking-tight">
          Business Metrics (Optional)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          Help us show you meaningful insights by sharing some basic numbers.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Stage */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            What stage is your business in? *
          </Label>
          <Select value={formData.businessStage} onValueChange={(value) => setFormData({ ...formData, businessStage: value })}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select your business stage" />
            </SelectTrigger>
            <SelectContent>
              {businessStages.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div>
                    <div className="font-medium">{stage.name}</div>
                    <div className="text-xs text-gray-500">{stage.desc}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.businessStage && ['launched', 'growing', 'established'].includes(formData.businessStage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Tip:</strong> Even rough estimates help us show you better insights!
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Monthly Revenue */}
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRevenue" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Monthly Revenue
                    </Label>
                    <Input
                      id="monthlyRevenue"
                      type="number"
                      placeholder="5000"
                      value={formData.monthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-xs text-gray-500">Rough monthly revenue ($)</p>
                  </div>

                  {/* Total Users */}
                  <div className="space-y-2">
                    <Label htmlFor="totalUsers" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Total Users
                    </Label>
                    <Input
                      id="totalUsers"
                      type="number"
                      placeholder="150"
                      value={formData.totalUsers}
                      onChange={(e) => setFormData({ ...formData, totalUsers: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-xs text-gray-500">Active customers/users</p>
                  </div>

                  {/* Average Price */}
                  <div className="space-y-2">
                    <Label htmlFor="averagePrice" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      Average Price
                    </Label>
                    <Input
                      id="averagePrice"
                      type="number"
                      placeholder="29"
                      value={formData.averagePrice}
                      onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                      className="h-9"
                    />
                    <p className="text-xs text-gray-500">Per customer/month ($)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSubmitting}
          className="px-6"
        >
          Skip for Now
        </Button>

        <Button
          onClick={handleComplete}
          disabled={!formData.businessStage || isSubmitting}
          className="px-6 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? 'Saving...' : hasMinimumData ? 'Save Metrics' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
