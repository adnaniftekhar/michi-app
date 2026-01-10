import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import {
  getTripsByUserId,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} from '../trips-storage'
import type { Trip } from '@/types'

// Use a test-specific data file
const TEST_TRIPS_FILE = path.join(process.cwd(), 'data', 'trips-test.json')

// Temporarily override the TRIPS_FILE constant for testing
// This is a workaround since we can't easily mock module-level constants
const originalModule = require('../trips-storage')

// Save original implementation
const originalGetTripsByUserId = originalModule.getTripsByUserId
const originalGetTripById = originalModule.getTripById
const originalCreateTrip = originalModule.createTrip
const originalUpdateTrip = originalModule.updateTrip
const originalDeleteTrip = originalModule.deleteTrip

// Helper to ensure test data directory exists
async function ensureTestDataDir() {
  const dataDir = path.dirname(TEST_TRIPS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

beforeEach(async () => {
  await ensureTestDataDir()
  // Clean up test data before each test
  try {
    await fs.unlink(TEST_TRIPS_FILE)
  } catch {
    // File doesn't exist, that's fine
  }
})

afterEach(async () => {
  // Clean up after each test
  try {
    await fs.unlink(TEST_TRIPS_FILE)
  } catch {
    // Ignore errors
  }
})

describe('trips-storage', () => {
  const userId1 = 'user_123'
  const userId2 = 'user_456'

  describe('createTrip', () => {
    it('should create a new trip and associate it with the user', async () => {
      const tripData = {
        title: 'Test Trip',
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        baseLocation: 'Test Location',
      }

      const trip = await createTrip(tripData, userId1)

      expect(trip.id).toBeDefined()
      expect(trip.title).toBe(tripData.title)
      expect(trip.startDate).toBe(tripData.startDate)
      expect(trip.endDate).toBe(tripData.endDate)
      expect(trip.baseLocation).toBe(tripData.baseLocation)
      expect(trip.createdAt).toBeDefined()
    })
  })

  describe('getTripsByUserId', () => {
    it('should return only trips for the specified user', async () => {
      const trip1 = await createTrip(
        {
          title: 'Trip 1',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Location 1',
        },
        userId1
      )

      const trip2 = await createTrip(
        {
          title: 'Trip 2',
          startDate: '2026-01-08',
          endDate: '2026-01-14',
          baseLocation: 'Location 2',
        },
        userId1
      )

      const trip3 = await createTrip(
        {
          title: 'Trip 3',
          startDate: '2026-01-15',
          endDate: '2026-01-21',
          baseLocation: 'Location 3',
        },
        userId2
      )

      const user1Trips = await getTripsByUserId(userId1)
      expect(user1Trips).toHaveLength(2)
      expect(user1Trips.map((t) => t.id)).toContain(trip1.id)
      expect(user1Trips.map((t) => t.id)).toContain(trip2.id)
      expect(user1Trips.map((t) => t.id)).not.toContain(trip3.id)

      const user2Trips = await getTripsByUserId(userId2)
      expect(user2Trips).toHaveLength(1)
      expect(user2Trips[0].id).toBe(trip3.id)
    })
  })

  describe('getTripById', () => {
    it('should return trip if it belongs to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Test Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Test Location',
        },
        userId1
      )

      const found = await getTripById(trip.id, userId1)
      expect(found).toBeDefined()
      expect(found?.id).toBe(trip.id)
    })

    it('should return null if trip does not belong to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Test Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Test Location',
        },
        userId1
      )

      const found = await getTripById(trip.id, userId2)
      expect(found).toBeNull()
    })

    it('should return null if trip does not exist', async () => {
      const found = await getTripById('non-existent-id', userId1)
      expect(found).toBeNull()
    })
  })

  describe('updateTrip', () => {
    it('should update trip if it belongs to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Original Title',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Original Location',
        },
        userId1
      )

      const updated = await updateTrip(
        trip.id,
        { title: 'Updated Title' },
        userId1
      )

      expect(updated).toBeDefined()
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.baseLocation).toBe('Original Location')
    })

    it('should return null if trip does not belong to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Test Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Test Location',
        },
        userId1
      )

      const updated = await updateTrip(
        trip.id,
        { title: 'Updated Title' },
        userId2
      )

      expect(updated).toBeNull()
    })
  })

  describe('deleteTrip', () => {
    it('should delete trip if it belongs to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Test Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Test Location',
        },
        userId1
      )

      const deleted = await deleteTrip(trip.id, userId1)
      expect(deleted).toBe(true)

      const found = await getTripById(trip.id, userId1)
      expect(found).toBeNull()
    })

    it('should return false if trip does not belong to the user', async () => {
      const trip = await createTrip(
        {
          title: 'Test Trip',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          baseLocation: 'Test Location',
        },
        userId1
      )

      const deleted = await deleteTrip(trip.id, userId2)
      expect(deleted).toBe(false)

      const found = await getTripById(trip.id, userId1)
      expect(found).toBeDefined()
    })
  })
})
