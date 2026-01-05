import { describe, it, expect } from 'vitest'
import { generateSeedData, SEED_VERSION } from '../seed'
import type { DemoUserId } from '@/types'

describe('seed', () => {
  it('should export SEED_VERSION', () => {
    expect(SEED_VERSION).toBe('v1')
  })

  it('should generate seed data for all demo users', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      expect(seedData[userId]).toBeDefined()
    }
  })

  it('should generate 3 trips per user', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      expect(seedData[userId].trips).toHaveLength(3)
    }
  })

  it('should generate trips with correct structure', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        expect(trip.id).toBeTruthy()
        expect(trip.title).toBeTruthy()
        expect(trip.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(trip.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(trip.baseLocation).toBeTruthy()
        expect(trip.learningTarget).toBeDefined()
        expect(trip.createdAt).toBeTruthy()
      }
    }
  })

  it('should generate trips with 14-day duration', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const start = new Date(trip.startDate)
        const end = new Date(trip.endDate)
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        expect(days).toBe(13) // 14 days = 13 day difference (inclusive)
      }
    }
  })

  it('should generate different learning target types', () => {
    const seedData = generateSeedData()
    const aliceTrips = seedData.alice.trips
    
    const tracks = aliceTrips.map(t => t.learningTarget?.track)
    expect(tracks).toContain('15min')
    expect(tracks).toContain('60min')
    expect(tracks).toContain('weekly')
    
    // Find weekly trip
    const weeklyTrip = aliceTrips.find(t => t.learningTarget?.track === 'weekly')
    expect(weeklyTrip).toBeDefined()
    expect(weeklyTrip?.learningTarget?.weeklyHours).toBeGreaterThan(0)
  })

  it('should generate 28 itinerary items per trip (2 per day)', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const items = seedData[userId].itinerary[trip.id] || []
        expect(items).toHaveLength(28)
        
        // Verify all items have required fields
        for (const item of items) {
          expect(item.id).toBeTruthy()
          expect(item.dateTime).toBeTruthy()
          expect(item.title).toBeTruthy()
          expect(item.location).toBeTruthy()
          expect(item.notes).toBeTruthy()
          expect(item.createdAt).toBeTruthy()
        }
      }
    }
  })

  it('should generate itinerary items sorted by dateTime', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const items = seedData[userId].itinerary[trip.id] || []
        for (let i = 1; i < items.length; i++) {
          const prev = new Date(items[i - 1].dateTime).getTime()
          const curr = new Date(items[i].dateTime).getTime()
          expect(curr).toBeGreaterThanOrEqual(prev)
        }
      }
    }
  })

  it('should generate 17 schedule blocks per trip (14 generated + 3 manual)', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const blocks = seedData[userId].scheduleBlocks[trip.id] || []
        expect(blocks).toHaveLength(17)
        
        const generated = blocks.filter(b => b.isGenerated)
        const manual = blocks.filter(b => !b.isGenerated)
        
        expect(generated).toHaveLength(14)
        expect(manual).toHaveLength(3)
        
        // Verify all blocks have required fields
        for (const block of blocks) {
          expect(block.id).toBeTruthy()
          expect(block.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(block.startTime).toBeTruthy()
          expect(block.duration).toBeGreaterThan(0)
          expect(block.title).toBeTruthy()
          expect(typeof block.isGenerated).toBe('boolean')
          expect(block.createdAt).toBeTruthy()
        }
      }
    }
  })

  it('should generate 14 activity logs per trip (1 per day)', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const logs = seedData[userId].activityLogs[trip.id] || []
        expect(logs).toHaveLength(14)
        
        // Verify all logs have required fields
        for (const log of logs) {
          expect(log.id).toBeTruthy()
          expect(log.dateTime).toBeTruthy()
          expect(log.title).toBeTruthy()
          expect(log.notes).toBeTruthy()
          expect(Array.isArray(log.tags)).toBe(true)
          expect(log.tags.length).toBeGreaterThanOrEqual(2)
          expect(Array.isArray(log.artifacts)).toBe(true)
          expect(log.artifacts.length).toBe(2)
          expect(log.createdAt).toBeTruthy()
        }
      }
    }
  })

  it('should generate 2 artifacts per activity log (1 LINK + 1 NOTE)', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const logs = seedData[userId].activityLogs[trip.id] || []
        
        for (const log of logs) {
          expect(log.artifacts).toHaveLength(2)
          
          const linkArtifact = log.artifacts.find(a => a.type === 'LINK')
          const noteArtifact = log.artifacts.find(a => a.type === 'NOTE')
          
          expect(linkArtifact).toBeDefined()
          expect(noteArtifact).toBeDefined()
          
          expect(linkArtifact?.url).toBeTruthy()
          expect(noteArtifact?.text).toBeTruthy()
          expect(linkArtifact?.id).toBeTruthy()
          expect(noteArtifact?.id).toBeTruthy()
          expect(linkArtifact?.createdAt).toBeTruthy()
          expect(noteArtifact?.createdAt).toBeTruthy()
        }
      }
    }
  })

  it('should generate activity logs sorted by dateTime (newest first)', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      for (const trip of seedData[userId].trips) {
        const logs = seedData[userId].activityLogs[trip.id] || []
        for (let i = 1; i < logs.length; i++) {
          const prev = new Date(logs[i - 1].dateTime).getTime()
          const curr = new Date(logs[i].dateTime).getTime()
          expect(curr).toBeLessThanOrEqual(prev) // Newest first
        }
      }
    }
  })

  it('should generate deterministic data (same output on multiple calls)', () => {
    const seed1 = generateSeedData()
    const seed2 = generateSeedData()
    
    expect(JSON.stringify(seed1)).toBe(JSON.stringify(seed2))
  })

  it('should generate unique trip IDs per user', () => {
    const seedData = generateSeedData()
    const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
    
    for (const userId of allUserIds) {
      const tripIds = seedData[userId].trips.map(t => t.id)
      const uniqueIds = new Set(tripIds)
      expect(uniqueIds.size).toBe(3)
    }
  })
})

