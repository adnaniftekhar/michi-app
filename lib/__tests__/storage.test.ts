import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getData, setData, clearData, clearAllData } from '../storage'
import type { DemoUserId } from '@/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('storage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    // Clear seed version to prevent auto-seeding in tests
    localStorageMock.removeItem('travel_learner_seed_version')
  })

  it('should seed data when no data exists and seed version is not set', () => {
    // Ensure seed version is not set
    localStorageMock.removeItem('travel_learner_seed_version')
    localStorageMock.removeItem('travel_learner_alice')
    
    const data = getData('alice')
    // After first call, seed data will be initialized
    expect(data.trips.length).toBe(3)
    expect(localStorageMock.getItem('travel_learner_seed_version')).toBe('v1')
  })

  it('should store and retrieve data', () => {
    const userId: DemoUserId = 'alice'
    const testData = {
      trips: [
        {
          id: 'trip-1',
          title: 'Test Trip',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          baseLocation: 'Paris',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }

    // Set seed version to prevent auto-seeding
    localStorageMock.setItem('travel_learner_seed_version', 'v1')
    setData(userId, testData)
    const retrieved = getData(userId)

    expect(retrieved.trips).toHaveLength(1)
    expect(retrieved.trips[0].title).toBe('Test Trip')
  })

  it('should scope data by user id', () => {
    const aliceData = {
      trips: [{ id: 'trip-1', title: "Alice's Trip", startDate: '2024-01-01', endDate: '2024-01-05', baseLocation: 'Paris', createdAt: '2024-01-01T00:00:00Z' }],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }

    const bobData = {
      trips: [{ id: 'trip-2', title: "Bob's Trip", startDate: '2024-02-01', endDate: '2024-02-05', baseLocation: 'London', createdAt: '2024-02-01T00:00:00Z' }],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }

    // Set seed version to prevent auto-seeding
    localStorageMock.setItem('travel_learner_seed_version', 'v1')
    setData('alice', aliceData)
    setData('bob', bobData)

    const aliceRetrieved = getData('alice')
    const bobRetrieved = getData('bob')

    expect(aliceRetrieved.trips[0].title).toBe("Alice's Trip")
    expect(bobRetrieved.trips[0].title).toBe("Bob's Trip")
  })

  it('should clear data for a user', () => {
    const userId: DemoUserId = 'alice'
    const testData = {
      trips: [{ id: 'trip-1', title: 'Test', startDate: '2024-01-01', endDate: '2024-01-05', baseLocation: 'Paris', createdAt: '2024-01-01T00:00:00Z' }],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }

    // Set seed version to prevent auto re-seeding
    localStorageMock.setItem('travel_learner_seed_version', 'v1')
    setData(userId, testData)
    clearData(userId)
    
    // After clearing, getData won't re-seed because seed version matches
    const retrieved = getData(userId)
    expect(retrieved.trips).toHaveLength(0)
  })

  it('should clear all data including seed version', () => {
    const userId: DemoUserId = 'alice'
    const testData = {
      trips: [{ id: 'trip-1', title: 'Test', startDate: '2024-01-01', endDate: '2024-01-05', baseLocation: 'Paris', createdAt: '2024-01-01T00:00:00Z' }],
      itinerary: {},
      scheduleBlocks: {},
      activityLogs: {},
    }

    setData(userId, testData)
    localStorageMock.setItem('travel_learner_seed_version', 'v1')
    
    clearAllData()
    
    expect(localStorageMock.getItem('travel_learner_seed_version')).toBeNull()
    expect(localStorageMock.getItem('travel_learner_alice')).toBeNull()
  })

  it('should handle corrupted localStorage data gracefully', () => {
    const userId: DemoUserId = 'alice'
    // Set seed version to prevent re-seeding
    localStorageMock.setItem('travel_learner_seed_version', 'v1')
    localStorageMock.setItem(`travel_learner_${userId}`, 'invalid json')

    const data = getData(userId)
    // With corrupted data and seed version set, it should return empty structure
    // But if seed version doesn't match, it will re-seed
    expect(data).toBeDefined()
    expect(Array.isArray(data.trips)).toBe(true)
  })
})

