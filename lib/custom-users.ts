import type { DemoUser, LearnerProfile } from '@/types'

const CUSTOM_USERS_KEY = 'travel_learner_custom_users'
const CUSTOM_PROFILES_KEY = 'travel_learner_custom_profiles'

export function getCustomUsers(): DemoUser[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CUSTOM_USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCustomUser(user: DemoUser): void {
  if (typeof window === 'undefined') return
  
  const users = getCustomUsers()
  const existingIndex = users.findIndex(u => u.id === user.id)
  
  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }
  
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users))
}

export function deleteCustomUser(userId: string): void {
  if (typeof window === 'undefined') return
  
  const users = getCustomUsers().filter(u => u.id !== userId)
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users))
  
  // Also delete the profile and data
  localStorage.removeItem(`travel_learner_${userId}`)
  const profiles = getCustomProfiles()
  delete profiles[userId]
  saveCustomProfiles(profiles)
}

export function getCustomProfiles(): Record<string, LearnerProfile> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(CUSTOM_PROFILES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export async function saveCustomProfile(userId: string, profile: LearnerProfile): Promise<void> {
  if (typeof window === 'undefined') return
  
  // Check if this is a Clerk user ID (starts with 'user_')
  if (userId.startsWith('user_')) {
    // Save to API for authenticated users (syncs across devices)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('[saveCustomProfile] Failed to save profile to API:', error)
        // Fall back to localStorage if API fails
      } else {
        console.log('[saveCustomProfile] ✅ Profile saved to API for user:', userId)
        return // Successfully saved to API
      }
    } catch (error) {
      console.error('[saveCustomProfile] Error saving profile to API:', error)
      // Fall back to localStorage if API fails
    }
  }
  
  // Fallback: Save to localStorage (for demo users or if API fails)
  const profiles = getCustomProfiles()
  profiles[userId] = profile
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(profiles))
}

export function getCustomProfile(userId: string): LearnerProfile | undefined {
  return getCustomProfiles()[userId]
}

function saveCustomProfiles(profiles: Record<string, LearnerProfile>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(profiles))
}

