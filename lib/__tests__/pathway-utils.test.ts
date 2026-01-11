import { describe, it, expect } from 'vitest'
import { pathwayPlanToScheduleBlocks } from '../pathway-utils'
import type { FinalPathwayPlan, ScheduleBlock } from '@/types'

describe('pathway-utils', () => {
  describe('pathwayPlanToScheduleBlocks', () => {
    it('should convert a FinalPathwayPlan to ScheduleBlock[]', () => {
      const pathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'What makes a city sustainable?',
            fieldExperience: 'Visit a green building',
            inquiryTask: 'Research LEED certification',
            artifact: 'Create a sustainability report',
            reflectionPrompt: 'What did you learn?',
            critiqueStep: 'Get feedback from peers',
            scheduleBlocks: [
              {
                startTime: '2024-06-01T09:00:00',
                duration: 60,
                title: 'Morning Research',
                description: 'Research sustainable architecture',
              },
              {
                startTime: '2024-06-01T14:00:00',
                duration: 90,
                title: 'Site Visit',
                description: 'Visit green building',
              },
            ],
          },
        ],
        summary: 'A sustainability-focused learning pathway',
      }

      const blocks = pathwayPlanToScheduleBlocks(pathway, 'trip-123', 'San Francisco')

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toMatchObject({
        date: '2024-06-01',
        startTime: '2024-06-01T09:00:00',
        duration: 60,
        title: 'Morning Research',
        description: 'Research sustainable architecture',
        drivingQuestion: 'What makes a city sustainable?',
        fieldExperience: 'Visit a green building',
        inquiryTask: 'Research LEED certification',
        artifact: 'Create a sustainability report',
        reflectionPrompt: 'What did you learn?',
        critiqueStep: 'Get feedback from peers',
        isGenerated: true,
        location: 'San Francisco',
      })
      expect(blocks[0].id).toContain('pathway-trip-123')
      expect(blocks[0].imageUrl).toBeDefined()
      expect(blocks[0].imageAlt).toBeDefined()
    })

    it('should handle multiple days correctly', () => {
      const pathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Day 1 question',
            fieldExperience: 'Day 1 experience',
            inquiryTask: 'Day 1 task',
            artifact: 'Day 1 artifact',
            reflectionPrompt: 'Day 1 reflection',
            critiqueStep: 'Day 1 critique',
            scheduleBlocks: [
              {
                startTime: '2024-06-01T09:00:00',
                duration: 60,
                title: 'Day 1 Activity',
              },
            ],
          },
          {
            day: 2,
            date: '2024-06-02',
            drivingQuestion: 'Day 2 question',
            fieldExperience: 'Day 2 experience',
            inquiryTask: 'Day 2 task',
            artifact: 'Day 2 artifact',
            reflectionPrompt: 'Day 2 reflection',
            critiqueStep: 'Day 2 critique',
            scheduleBlocks: [
              {
                startTime: '2024-06-02T10:00:00',
                duration: 90,
                title: 'Day 2 Activity',
              },
            ],
          },
        ],
      }

      const blocks = pathwayPlanToScheduleBlocks(pathway, 'trip-456')

      expect(blocks).toHaveLength(2)
      expect(blocks[0].date).toBe('2024-06-01')
      expect(blocks[0].title).toBe('Day 1 Activity')
      expect(blocks[1].date).toBe('2024-06-02')
      expect(blocks[1].title).toBe('Day 2 Activity')
    })

    it('should preserve localOptions if present', () => {
      const pathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Question',
            fieldExperience: 'Experience',
            inquiryTask: 'Task',
            artifact: 'Artifact',
            reflectionPrompt: 'Reflection',
            critiqueStep: 'Critique',
            scheduleBlocks: [
              {
                startTime: '2024-06-01T09:00:00',
                duration: 60,
                title: 'Activity',
                localOptions: [
                  {
                    placeId: 'place-123',
                    displayName: 'Test Venue',
                    areaLabel: 'Downtown',
                    googleMapsUri: 'https://maps.google.com',
                  },
                ],
              },
            ],
          },
        ],
      }

      const blocks = pathwayPlanToScheduleBlocks(pathway, 'trip-789')

      expect(blocks[0].localOptions).toBeDefined()
      expect(blocks[0].localOptions).toHaveLength(1)
      expect(blocks[0].localOptions![0].placeId).toBe('place-123')
    })

    it('should generate unique IDs for each block', () => {
      const pathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Q',
            fieldExperience: 'E',
            inquiryTask: 'T',
            artifact: 'A',
            reflectionPrompt: 'R',
            critiqueStep: 'C',
            scheduleBlocks: [
              {
                startTime: '2024-06-01T09:00:00',
                duration: 60,
                title: 'Activity 1',
              },
              {
                startTime: '2024-06-01T10:00:00',
                duration: 60,
                title: 'Activity 2',
              },
            ],
          },
        ],
      }

      const blocks = pathwayPlanToScheduleBlocks(pathway, 'trip-999')

      expect(blocks[0].id).not.toBe(blocks[1].id)
      expect(blocks[0].id).toContain('pathway-trip-999')
      expect(blocks[1].id).toContain('pathway-trip-999')
    })
  })
})
