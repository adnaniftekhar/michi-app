'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { DemoUserId, DemoUser } from '@/types'
import { DEMO_USERS, getDemoUser } from '@/lib/demo-users'

interface DemoUserContextType {
  currentUserId: DemoUserId
  currentUser: DemoUser
  setCurrentUserId: (id: DemoUserId) => void
}

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined)

export function DemoUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState<DemoUserId>('alice')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_demo_user')
      if (saved && getDemoUser(saved as DemoUserId)) {
        setCurrentUserIdState(saved as DemoUserId)
      }
    }
  }, [])

  const setCurrentUserId = (id: DemoUserId) => {
    setCurrentUserIdState(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_demo_user', id)
    }
  }

  const currentUser = getDemoUser(currentUserId) || DEMO_USERS[0]

  // Always provide context, even during SSR
  return (
    <DemoUserContext.Provider value={{ currentUserId, currentUser, setCurrentUserId }}>
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

