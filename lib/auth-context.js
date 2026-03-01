'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from './supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setBusiness(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUserId) => {
    try {
      // Get user profile first (without join to avoid circular policy)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (profileError) throw profileError

      // Then get business info separately
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single()

      if (businessError) throw businessError

      setUserProfile(profile)
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setBusiness(null)
  }

  const value = {
    user,
    userProfile,
    business,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
