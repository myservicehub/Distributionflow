import { useState, useEffect } from 'react'

// Re-exports from canonical location for backward compatibility
export { useSubscription, useFeature } from '@/hooks/useSubscription'

/**
 * Hook to check if current business has access to a specific feature via API
 * This uses API-based check (different from useFeature which uses direct DB)
 * @param {string} featureName - Feature key (e.g., 'empty_lifecycle', 'multi_warehouse')
 * @returns {Object} - { hasAccess: boolean, loading: boolean, error: string }
 */
export function useFeatureAccess(featureName) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch(`/api/subscriptions?route=check-feature&feature=${featureName}`)
        const data = await response.json()

        if (response.ok) {
          setHasAccess(data.hasAccess)
        } else {
          setError(data.error || 'Failed to check feature access')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (featureName) {
      checkAccess()
    }
  }, [featureName])

  return { hasAccess, loading, error }
}
