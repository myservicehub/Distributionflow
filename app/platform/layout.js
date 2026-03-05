import PlatformNav from '@/components/platform/PlatformNav'

export const metadata = {
  title: 'Platform Admin - DistributionFlow',
  description: 'Super Admin Dashboard',
}

export default function PlatformLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PlatformNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
