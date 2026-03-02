'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  description,
  loading = false 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <div className="flex items-center text-xs mt-1">
                {trend === 'up' ? (
                  <ArrowUpIcon className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {trendValue}
                </span>
                {description && (
                  <span className="text-muted-foreground ml-1">{description}</span>
                )}
              </div>
            )}
            {description && !trend && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
