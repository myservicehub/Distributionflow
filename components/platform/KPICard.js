import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-green-600" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-xs ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
          }`}>
            {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
            {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
