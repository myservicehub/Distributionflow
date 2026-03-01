'use client'

import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}
