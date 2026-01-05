import { z } from 'zod'

// AI Plan Response Schema - PBL Gold Standard aligned
export const AIPlanDaySchema = z.object({
  day: z.number().int().min(1),
  drivingQuestion: z.string().min(1),
  fieldExperience: z.string().min(1),
  inquiryTask: z.string().min(1),
  artifact: z.string().min(1),
  reflectionPrompt: z.string().min(1),
  critiqueStep: z.string().min(1),
  scheduleBlocks: z.array(z.object({
    startTime: z.string(), // ISO datetime
    duration: z.number().int().positive(), // minutes
    title: z.string().min(1),
    description: z.string().optional(),
  })),
})

// Helper function to create a schema with a specific number of days
export function createAIPlanResponseSchema(numDays: number) {
  return z.object({
    days: z.array(AIPlanDaySchema).length(numDays),
    summary: z.string().optional(),
    verifyLocally: z.string().optional(), // Notes for human verification
  })
}

// Default schema for backward compatibility (14 days)
export const AIPlanResponseSchema = createAIPlanResponseSchema(14)

export type AIPlanDay = z.infer<typeof AIPlanDaySchema>
export type AIPlanResponse = z.infer<ReturnType<typeof createAIPlanResponseSchema>>

