import { useState, useEffect } from 'react'

/**
 * Hook to check if current business has access to a specific feature
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

/**
 * Hook to get current subscription details
 * @returns {Object} - { subscription, loading, error }
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions?route=subscription')
        const data = await response.json()

        if (response.ok) {
          setSubscription(data)
        } else {
          setError(data.error || 'Failed to fetch subscription')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  return { subscription, loading, error }
}
