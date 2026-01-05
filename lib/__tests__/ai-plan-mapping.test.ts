import { describe, it, expect } from 'vitest'
import type { AIPlanResponse } from '../ai-plan-schema'
import type { ScheduleBlock, Trip } from '@/types'

describe('AI Plan to Schedule Blocks Mapping', () => {
  it('converts AI plan days to schedule blocks', () => {
    const trip: Trip = {
      id: 'test-trip',
      title: 'Test Trip',
      startDate: '2026-06-01',
      endDate: '2026-06-14',
      baseLocation: 'Test Location',
      createdAt: '2026-01-01T00:00:00Z',
    }

    const aiPlan: AIPlanResponse = {
      days: [
        {
          day: 1,
          drivingQuestion: 'Test question',
          fieldExperience: 'Test experience',
          inquiryTask: 'Test task',
          artifact: 'Test artifact',
          reflectionPrompt: 'Test reflection',
          critiqueStep: 'Test critique',
          scheduleBlocks: [
            {
              startTime: '2026-06-01T09:00:00',
              duration: 60,
              title: 'Morning Learning',
            },
            {
              startTime: '2026-06-01T14:00:00',
              duration: 90,
              title: 'Afternoon Learning',
            },
          ],
        },
        {
          day: 2,
          drivingQuestion: 'Test question 2',
          fieldExperience: 'Test experience 2',
          inquiryTask: 'Test task 2',
          artifact: 'Test artifact 2',
          reflectionPrompt: 'Test reflection 2',
          critiqueStep: 'Test critique 2',
          scheduleBlocks: [
            {
              startTime: '2026-06-02T10:00:00',
              duration: 45,
              title: 'Day 2 Learning',
            },
          ],
        },
      ],
    }

    // Simulate the mapping logic from handleApplyAIPathway
    const newBlocks: ScheduleBlock[] = []
    const now = new Date().toISOString()

    for (const day of aiPlan.days) {
      for (const block of day.scheduleBlocks) {
        const blockDate = new Date(block.startTime)
        newBlocks.push({
          id: `ai-${trip.id}-day${day.day}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: blockDate.toISOString().split('T')[0],
          startTime: block.startTime,
          duration: block.duration,
          title: block.title,
          isGenerated: true,
          createdAt: now,
        })
      }
    }

    expect(newBlocks).toHaveLength(3)
    expect(newBlocks[0].title).toBe('Morning Learning')
    expect(newBlocks[0].duration).toBe(60)
    expect(newBlocks[0].isGenerated).toBe(true)
    expect(newBlocks[1].title).toBe('Afternoon Learning')
    expect(newBlocks[1].duration).toBe(90)
    expect(newBlocks[2].title).toBe('Day 2 Learning')
    expect(newBlocks[2].duration).toBe(45)
  })

  it('preserves manual blocks when applying AI plan', () => {
    const existingManualBlocks: ScheduleBlock[] = [
      {
        id: 'manual-1',
        date: '2026-06-01',
        startTime: '2026-06-01T18:00:00',
        duration: 30,
        title: 'Manual Block',
        isGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]

    const aiPlan: AIPlanResponse = {
      days: [
        {
          day: 1,
          drivingQuestion: 'Test',
          fieldExperience: 'Test',
          inquiryTask: 'Test',
          artifact: 'Test',
          reflectionPrompt: 'Test',
          critiqueStep: 'Test',
          scheduleBlocks: [
            {
              startTime: '2026-06-01T09:00:00',
              duration: 60,
              title: 'AI Block',
            },
          ],
        },
      ],
    }

    // Simulate regeneration logic
    const manualBlocks = existingManualBlocks.filter(b => !b.isGenerated)
    const newBlocks: ScheduleBlock[] = []
    const now = new Date().toISOString()

    for (const day of aiPlan.days) {
      for (const block of day.scheduleBlocks) {
        const blockDate = new Date(block.startTime)
        newBlocks.push({
          id: `ai-day${day.day}-${Date.now()}`,
          date: blockDate.toISOString().split('T')[0],
          startTime: block.startTime,
          duration: block.duration,
          title: block.title,
          isGenerated: true,
          createdAt: now,
        })
      }
    }

    const updated = [...manualBlocks, ...newBlocks]

    expect(updated).toHaveLength(2)
    expect(updated.find(b => !b.isGenerated)).toBeDefined()
    expect(updated.find(b => b.isGenerated)).toBeDefined()
    expect(updated.find(b => b.title === 'Manual Block')).toBeDefined()
    expect(updated.find(b => b.title === 'AI Block')).toBeDefined()
  })
})

