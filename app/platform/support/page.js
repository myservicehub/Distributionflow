import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LifeBuoy } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-500 mt-2">Manage support tickets and requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Support Center
          </CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LifeBuoy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Support ticket system will be available here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
