'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook to check subscription status and feature access
 * @returns {Object} { isActive, isPremium, features, planName, limits, loading }
 */
export function useSubscription() {
  const [subscriptionData, setSubscriptionData] = useState({
    isActive: true, // Default to true during loading
    isPremium: false,
    features: {},
    planName: null,
    limits: {
      max_retailers: 999999,
      max_products: 999999,
      included_users: 999
    },
    loading: true
  })

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchSubscription() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setSubscriptionData(prev => ({ ...prev, loading: false, isActive: false }))
          return
        }

        // Get user profile to find business_id
        const { data: userProfile } = await supabase
          .from('users')
          .select('business_id')
          .eq('auth_user_id', user.id)
          .single()

        if (!userProfile?.business_id) {
          setSubscriptionData(prev => ({ ...prev, loading: false, isActive: false }))
          return
        }

        // Get business subscription details
        const { data: business, error } = await supabase
          .from('businesses')
          .select(`
            subscription_status,
            plan_id,
            plans (
              name,
              display_name,
              features
            )
          `)
          .eq('id', userProfile.business_id)
          .single()

        if (error) throw error

        const isActive = ['active', 'trial'].includes(business?.subscription_status)
        const features = business?.plans?.features || {}
        const planName = business?.plans?.display_name || 'Free'
        
        // Determine if premium based on features
        const isPremium = features.empty_lifecycle || features.fraud_detection || features.multi_warehouse

        setSubscriptionData({
          isActive,
          isPremium,
          features,
          planName,
          limits: {
            max_retailers: features.max_retailers || 999999,
            max_products: features.max_products || 999999,
            included_users: business?.plans?.included_users || 999
          },
          loading: false
        })
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscriptionData(prev => ({ ...prev, loading: false }))
      }
    }

    // Initial fetch
    fetchSubscription()
    
    // Subscribe to auth state changes to re-fetch on user change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription()
    })

    return () => subscription.unsubscribe()
  }, [])

  return subscriptionData
}

/**
 * Check if a specific feature is available
 * @param {string} featureName - Feature key (e.g., 'empty_lifecycle')
 * @returns {boolean}
 */
export function useFeature(featureName) {
  const { features, loading } = useSubscription()
  
  if (loading) return true // Don't block during loading
  
  return features[featureName] === true
}
