'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { DemoUserId, DemoUser } from '@/types'
import { DEMO_USERS, getDemoUser } from '@/lib/demo-users'

// Import Clerk hook directly
import { useUser } from '@clerk/nextjs'

interface DemoUserContextType {
  currentUserId: DemoUserId
  currentUser: DemoUser
  setCurrentUserId: (id: DemoUserId) => void
  isAdmin: boolean
}

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined)

// Admin email - replace with your actual admin email or allow a list
const ADMIN_EMAIL = 'adnan@iamacatalyst.com'

export function DemoUserProvider({ children }: { children: ReactNode }) {
  // Use Clerk hook - ClerkProvider wraps the app
  const { user, isLoaded } = useUser()
  
  const [currentUserId, setCurrentUserIdState] = useState<DemoUserId>('alice')
  const [mounted, setMounted] = useState(false)

  // Check if current user is admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL

  useEffect(() => {
    setMounted(true)
    
    // Wait for Clerk to load
    if (!isLoaded) return

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_demo_user')
      
      if (!user) {
        // User is NOT logged in: Set to 'alice' (guest mode - use demo user)
        setCurrentUserIdState('alice')
        if (saved && saved !== 'alice') {
          localStorage.setItem('current_demo_user', 'alice')
        }
      } else if (!isAdmin) {
        // User IS logged in (Regular): Force to user.id
        const clerkUserId = user.id as DemoUserId
        setCurrentUserIdState(clerkUserId)
        if (saved !== clerkUserId) {
          localStorage.setItem('current_demo_user', clerkUserId)
        }
      } else {
        // User IS logged in (Admin): Allow manual selection
        // Use saved value if it exists and is valid, otherwise default to 'alice'
        if (saved && getDemoUser(saved as DemoUserId)) {
          setCurrentUserIdState(saved as DemoUserId)
        } else {
          setCurrentUserIdState('alice')
        }
      }
    }
  }, [user, isLoaded, isAdmin])

  const setCurrentUserId = (id: DemoUserId) => {
    // Only allow manual changes if user is admin
    if (isAdmin || !user) {
      setCurrentUserIdState(id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_demo_user', id)
      }
    }
    // Regular users cannot change their ID - it's always their Clerk user.id
  }

  // Get current user, handling Clerk user IDs
  let currentUser = getDemoUser(currentUserId)
  if (!currentUser) {
    // If it's a Clerk user ID, create a temporary user
    if (currentUserId.startsWith('user_') && user) {
      currentUser = {
        id: user.id,
        name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Me',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isCustom: true,
      }
    } else {
      // Fallback to first demo user
      currentUser = DEMO_USERS[0]
    }
  }

  // Always provide context, even during SSR
  return (
    <DemoUserContext.Provider value={{ currentUserId, currentUser, setCurrentUserId, isAdmin }}>
      {children}
    </DemoUserContext.Provider>
  )
}

export function useDemoUser() {
  const context = useContext(DemoUserContext)
  if (!context) {
    throw new Error('useDemoUser must be used within DemoUserProvider')
  }
  return context
}
