import type { AppData, DemoUserId } from '@/types'
import { generateSeedData, SEED_VERSION } from './seed'

const STORAGE_PREFIX = 'travel_learner_'
const SEED_VERSION_KEY = 'travel_learner_seed_version'

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function shouldSeed(userId: string): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if user already has data - if so, don't seed (preserve their data)
  const key = getStorageKey(userId)
  const existingData = localStorage.getItem(key)
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData) as AppData
      // If user has trips or any data, don't overwrite it
      if (parsed.trips && parsed.trips.length > 0) {
        return false
      }
      // If user has schedule blocks, itinerary, or logs, don't overwrite
      if (
        Object.keys(parsed.scheduleBlocks || {}).length > 0 ||
        Object.keys(parsed.itinerary || {}).length > 0 ||
        Object.keys(parsed.activityLogs || {}).length > 0
      ) {
        return false
      }
    } catch {
      // If data is corrupted, we'll seed fresh
    }
  }
  
  // Only seed if no existing data AND version doesn't match
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY)
  return storedVersion !== SEED_VERSION
}

function initializeSeedData(): void {
  if (typeof window === 'undefined') return

  const seedData = generateSeedData()
  const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
  for (const userId of allUserIds) {
    const key = getStorageKey(userId)
    localStorage.setItem(key, JSON.stringify(seedData[userId]))
  }
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
}

export function getData(userId: string): AppData {
  if (typeof window === 'undefined') {
    // Server-side: return empty data
    return {
      trips: [],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }
  }

  // Initialize seed data if needed (only for this specific user, and only if they have no data)
  if (shouldSeed(userId)) {
    // Only seed for this specific user, don't overwrite other users' data
    const seedData = generateSeedData()
    const userSeedData = seedData[userId as DemoUserId]
    if (userSeedData) {
      const key = getStorageKey(userId)
      localStorage.setItem(key, JSON.stringify(userSeedData))
    }
    // Set seed version only if it's not already set (don't overwrite if other users have data)
    if (!localStorage.getItem(SEED_VERSION_KEY)) {
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
    }
  }

  const key = getStorageKey(userId)
  const stored = localStorage.getItem(key)
  
  if (!stored) {
    return {
      trips: [],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }
  }

  try {
    return JSON.parse(stored) as AppData
  } catch {
    return {
      trips: [],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return

  // Clear all demo user trip data
  const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
  for (const userId of allUserIds) {
    const key = getStorageKey(userId)
    localStorage.removeItem(key)
  }
  
  // Clear seed version to trigger re-seeding
  localStorage.removeItem(SEED_VERSION_KEY)
  
  // Clear custom users and profiles
  localStorage.removeItem('travel_learner_custom_users')
  localStorage.removeItem('travel_learner_custom_profiles')
  
  // Clear any custom user trip data (for users with string IDs)
  // Get all localStorage keys and remove any that match our pattern
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX) && !allUserIds.includes(key.replace(STORAGE_PREFIX, '') as DemoUserId)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

export function setData(userId: string, data: AppData): void {
  if (typeof window === 'undefined') {
    return
  }

  const key = getStorageKey(userId)
  localStorage.setItem(key, JSON.stringify(data))
}

export function clearData(userId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const key = getStorageKey(userId)
  localStorage.removeItem(key)
}

