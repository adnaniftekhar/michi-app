import { describe, it, expect } from 'vitest'
import { AIPlanResponseSchema, AIPlanDaySchema } from '../ai-plan-schema'

describe('AI Plan Schema', () => {
  describe('AIPlanDaySchema', () => {
    it('validates a valid day', () => {
      const validDay = {
        day: 1,
        drivingQuestion: 'What makes this culture unique?',
        fieldExperience: 'Visit local museum',
        inquiryTask: 'Document artifacts and their significance',
        artifact: 'Photo essay with captions',
        reflectionPrompt: 'How did this experience change your perspective?',
        critiqueStep: 'Share with peer and get feedback',
        scheduleBlocks: [
          {
            startTime: '2026-06-01T09:00:00',
            duration: 60,
            title: 'Morning Learning Block',
            description: 'Optional description',
          },
        ],
      }

      const result = AIPlanDaySchema.safeParse(validDay)
      expect(result.success).toBe(true)
    })

    it('rejects day outside 1-14 range', () => {
      const invalidDay = {
        day: 15,
        drivingQuestion: 'Test',
        fieldExperience: 'Test',
        inquiryTask: 'Test',
        artifact: 'Test',
        reflectionPrompt: 'Test',
        critiqueStep: 'Test',
        scheduleBlocks: [],
      }

      const result = AIPlanDaySchema.safeParse(invalidDay)
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const invalidDay = {
        day: 1,
        drivingQuestion: 'Test',
        // Missing other required fields
      }

      const result = AIPlanDaySchema.safeParse(invalidDay)
      expect(result.success).toBe(false)
    })
  })

  describe('AIPlanResponseSchema', () => {
    it('validates a complete 14-day plan', () => {
      const validPlan = {
        days: Array.from({ length: 14 }, (_, i) => ({
          day: i + 1,
          drivingQuestion: `Question ${i + 1}`,
          fieldExperience: `Experience ${i + 1}`,
          inquiryTask: `Task ${i + 1}`,
          artifact: `Artifact ${i + 1}`,
          reflectionPrompt: `Reflect ${i + 1}`,
          critiqueStep: `Critique ${i + 1}`,
          scheduleBlocks: [
            {
              startTime: `2026-06-${String(i + 1).padStart(2, '0')}T09:00:00`,
              duration: 60,
              title: `Block ${i + 1}`,
            },
          ],
        })),
        summary: 'Test summary',
        verifyLocally: 'Test verification notes',
      }

      const result = AIPlanResponseSchema.safeParse(validPlan)
      expect(result.success).toBe(true)
    })

    it('rejects plan with wrong number of days', () => {
      const invalidPlan = {
        days: Array.from({ length: 13 }, (_, i) => ({
          day: i + 1,
          drivingQuestion: `Question ${i + 1}`,
          fieldExperience: `Experience ${i + 1}`,
          inquiryTask: `Task ${i + 1}`,
          artifact: `Artifact ${i + 1}`,
          reflectionPrompt: `Reflect ${i + 1}`,
          critiqueStep: `Critique ${i + 1}`,
          scheduleBlocks: [],
        })),
      }

      const result = AIPlanResponseSchema.safeParse(invalidPlan)
      expect(result.success).toBe(false)
    })

    it('accepts plan without optional fields', () => {
      const minimalPlan = {
        days: Array.from({ length: 14 }, (_, i) => ({
          day: i + 1,
          drivingQuestion: `Question ${i + 1}`,
          fieldExperience: `Experience ${i + 1}`,
          inquiryTask: `Task ${i + 1}`,
          artifact: `Artifact ${i + 1}`,
          reflectionPrompt: `Reflect ${i + 1}`,
          critiqueStep: `Critique ${i + 1}`,
          scheduleBlocks: [],
        })),
      }

      const result = AIPlanResponseSchema.safeParse(minimalPlan)
      expect(result.success).toBe(true)
    })
  })
})

