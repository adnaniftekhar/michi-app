/**
 * Onboarding utilities for first-time user detection
 */

import { getCustomProfile, getCustomProfiles } from './custom-users'

// localStorage key for onboarding completion flag
const ONBOARDING_COMPLETE_KEY = 'michi_onboarding_complete'

/**
 * Check if a user is a first-time user (no custom profile and no trips)
 * @param userId - The user ID (Clerk user ID or demo user ID)
 * @returns Promise<boolean> - true if first-time user, false otherwise
 */
export async function isFirstTimeUser(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side: assume not first-time to avoid blocking
    return false
  }

  // Check if onboarding was already marked as complete
  const onboardingComplete = localStorage.getItem(`${ONBOARDING_COMPLETE_KEY}_${userId}`)
  if (onboardingComplete === 'true') {
    return false
  }

  // Check if user has a custom profile (not just default demo profile)
  let hasCustomProfile = false
  
  if (userId.startsWith('user_')) {
    // Clerk user: Check API for custom profile
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        hasCustomProfile = !!data.profile
      }
    } catch (error) {
      console.error('[isFirstTimeUser] Error checking profile from API:', error)
      // Fall through to check localStorage as backup
    }
    
    // Also check localStorage as backup
    if (!hasCustomProfile) {
      const profiles = getCustomProfiles()
      hasCustomProfile = !!profiles[userId]
    }
  } else {
    // Demo user: Check localStorage for custom profile
    const customProfile = getCustomProfile(userId)
    hasCustomProfile = !!customProfile
  }

  // Check if user has any trips
  let hasTrips = false
  try {
    const TRIPS_STORAGE_KEY = 'michi_user_trips'
    const stored = localStorage.getItem(`${TRIPS_STORAGE_KEY}_${userId}`)
    if (stored) {
      const trips = JSON.parse(stored)
      hasTrips = Array.isArray(trips) && trips.length > 0
    }
  } catch (error) {
    console.error('[isFirstTimeUser] Error checking trips:', error)
  }

  // User is first-time if they have no custom profile AND no trips
  return !hasCustomProfile && !hasTrips
}

/**
 * Mark onboarding as complete for a user
 * @param userId - The user ID
 */
export function markOnboardingComplete(userId: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(`${ONBOARDING_COMPLETE_KEY}_${userId}`, 'true')
}

/**
 * Reset onboarding status (useful for testing or re-onboarding)
 * @param userId - The user ID
 */
export function resetOnboarding(userId: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(`${ONBOARDING_COMPLETE_KEY}_${userId}`)
}
