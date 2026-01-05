import type { Trip, ScheduleBlock, LearningTrack } from '@/types'

function getDurationMinutes(track: LearningTrack, weeklyHours?: number): number {
  switch (track) {
    case '15min':
      return 15
    case '60min':
      return 60
    case '4hrs':
      return 240
    case 'weekly':
      if (!weeklyHours || weeklyHours <= 0) {
        throw new Error('Weekly hours must be greater than 0')
      }
      // Distribute weekly hours across 7 days
      return Math.round((weeklyHours * 60) / 7)
    default:
      return 60
  }
}

function getDaysBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days: string[] = []
  
  const current = new Date(start)
  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

export function generateScheduleBlocks(
  trip: Trip,
  existingBlocks: ScheduleBlock[],
  timezone: string
): ScheduleBlock[] {
  if (!trip.learningTarget) {
    return []
  }

  const { track, weeklyHours } = trip.learningTarget
  const duration = getDurationMinutes(track, weeklyHours)
  
  const days = getDaysBetween(trip.startDate, trip.endDate)
  const generatedBlocks: ScheduleBlock[] = []
  const now = new Date().toISOString()

  for (const day of days) {
    // Create a date at 10:00 local time for this day
    const dateStr = `${day}T10:00:00`
    const localDate = new Date(dateStr)
    
    // Convert to ISO string (this will be in local time context)
    const startTime = localDate.toISOString()

    generatedBlocks.push({
      id: `generated-${trip.id}-${day}`,
      date: day,
      startTime,
      duration,
      title: 'Learning Block',
      isGenerated: true,
      createdAt: now,
    })
  }

  // Replace only previously generated blocks, keep manual ones
  const manualBlocks = existingBlocks.filter(b => !b.isGenerated)
  return [...manualBlocks, ...generatedBlocks]
}

