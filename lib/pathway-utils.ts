/**
 * Utility functions for converting between pathway formats
 * Handles conversion between FinalPathwayPlan and ScheduleBlock[]
 */
import type { FinalPathwayPlan, ScheduleBlock } from '@/types'
import { detectActivityType, getActivityIconUrl, getActivityImageAlt } from './activity-images'

/**
 * Convert a FinalPathwayPlan to ScheduleBlock[]
 * This is used when loading saved pathways from the API
 */
export function pathwayPlanToScheduleBlocks(
  pathway: FinalPathwayPlan,
  tripId: string,
  tripLocation?: string
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = []
  const now = new Date().toISOString()
  let blockIndex = 0
  const usedImageIds = new Set<string>()

  for (const day of pathway.days) {
    for (const block of day.scheduleBlocks) {
      const activityType = detectActivityType(block.title, block.description, day.fieldExperience)
      const activityLocation = day.fieldExperience ? tripLocation : undefined
      
      // Generate unique image key
      const uniqueImageKey = `${block.title}-day${day.day}-block${blockIndex}-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const imageUrl = getActivityIconUrl(activityType, uniqueImageKey, usedImageIds)
      const imageAlt = getActivityImageAlt(activityType, block.title, activityLocation)

      const scheduleBlock: ScheduleBlock = {
        id: `pathway-${tripId}-day${day.day}-${blockIndex}-${Date.now()}`,
        date: day.date,
        startTime: block.startTime,
        duration: block.duration,
        title: block.title,
        description: block.description,
        location: activityLocation,
        notes: day.fieldExperience 
          ? `${day.fieldExperience}\n\n${day.inquiryTask}\n\nArtifact: ${day.artifact}` 
          : undefined,
        isGenerated: true,
        createdAt: now,
        drivingQuestion: day.drivingQuestion,
        fieldExperience: day.fieldExperience,
        inquiryTask: day.inquiryTask,
        artifact: day.artifact,
        reflectionPrompt: day.reflectionPrompt,
        critiqueStep: day.critiqueStep,
        localOptions: block.localOptions,
        imageUrl,
        imageAlt,
        imageMode: 'off',
      }

      blocks.push(scheduleBlock)
      blockIndex++
    }
  }

  return blocks
}
