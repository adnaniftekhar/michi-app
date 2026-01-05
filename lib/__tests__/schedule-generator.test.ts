import { describe, it, expect } from 'vitest'
import { generateScheduleBlocks } from '../schedule-generator'
import type { Trip, ScheduleBlock, LearningTarget } from '@/types'

describe('schedule-generator', () => {
  const createTrip = (learningTarget?: LearningTarget): Trip => ({
    id: 'trip-1',
    title: 'Test Trip',
    startDate: '2024-01-01',
    endDate: '2024-01-03',
    baseLocation: 'Paris',
    learningTarget,
    createdAt: '2024-01-01T00:00:00Z',
  })

  it('should return empty array if no learning target', () => {
    const trip = createTrip()
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    expect(blocks).toEqual([])
  })

  it('should generate blocks for 15min track', () => {
    const trip = createTrip({ track: '15min' })
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    
    expect(blocks).toHaveLength(3) // 3 days
    expect(blocks[0].duration).toBe(15)
    expect(blocks[0].title).toBe('Learning Block')
    expect(blocks[0].isGenerated).toBe(true)
  })

  it('should generate blocks for 60min track', () => {
    const trip = createTrip({ track: '60min' })
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    
    expect(blocks).toHaveLength(3)
    expect(blocks[0].duration).toBe(60)
  })

  it('should generate blocks for 4hrs track', () => {
    const trip = createTrip({ track: '4hrs' })
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    
    expect(blocks).toHaveLength(3)
    expect(blocks[0].duration).toBe(240)
  })

  it('should generate blocks for weekly track with valid hours', () => {
    const trip = createTrip({ track: 'weekly', weeklyHours: 7 })
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    
    expect(blocks).toHaveLength(3)
    // 7 hours * 60 minutes / 7 days = 60 minutes per day
    expect(blocks[0].duration).toBe(60)
  })

  it('should throw error for weekly track with invalid hours', () => {
    const trip = createTrip({ track: 'weekly', weeklyHours: 0 })
    
    expect(() => {
      generateScheduleBlocks(trip, [], 'America/New_York')
    }).toThrow('Weekly hours must be greater than 0')
  })

  it('should generate one block per day at 10:00', () => {
    const trip = createTrip({ track: '60min' })
    const blocks = generateScheduleBlocks(trip, [], 'America/New_York')
    
    expect(blocks).toHaveLength(3)
    expect(blocks[0].date).toBe('2024-01-01')
    expect(blocks[1].date).toBe('2024-01-02')
    expect(blocks[2].date).toBe('2024-01-03')
    
    // Check that startTime contains 10:00
    blocks.forEach(block => {
      const time = new Date(block.startTime)
      expect(time.getHours()).toBe(10)
    })
  })

  it('should preserve manual blocks when regenerating', () => {
    const trip = createTrip({ track: '60min' })
    const manualBlock: ScheduleBlock = {
      id: 'manual-1',
      date: '2024-01-02',
      startTime: '2024-01-02T14:00:00Z',
      duration: 30,
      title: 'Manual Block',
      isGenerated: false,
      createdAt: '2024-01-01T00:00:00Z',
    }

    const blocks = generateScheduleBlocks(trip, [manualBlock], 'America/New_York')
    
    const manualBlocks = blocks.filter(b => !b.isGenerated)
    const generatedBlocks = blocks.filter(b => b.isGenerated)
    
    expect(manualBlocks).toHaveLength(1)
    expect(manualBlocks[0].id).toBe('manual-1')
    expect(generatedBlocks).toHaveLength(3)
  })

  it('should replace previously generated blocks', () => {
    const trip = createTrip({ track: '60min' })
    const oldGenerated: ScheduleBlock = {
      id: 'generated-trip-1-2024-01-01',
      date: '2024-01-01',
      startTime: '2024-01-01T10:00:00Z',
      duration: 15, // Old duration
      title: 'Learning Block',
      isGenerated: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    const blocks = generateScheduleBlocks(trip, [oldGenerated], 'America/New_York')
    
    const generatedBlocks = blocks.filter(b => b.isGenerated && b.date === '2024-01-01')
    expect(generatedBlocks).toHaveLength(1)
    expect(generatedBlocks[0].duration).toBe(60) // New duration
  })
})

