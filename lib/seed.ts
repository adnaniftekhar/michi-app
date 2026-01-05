import type { AppData, DemoUserId, Trip, ItineraryItem, ScheduleBlock, ActivityLog, LearningTarget } from '@/types'
import { DEMO_USERS } from './demo-users'

export const SEED_VERSION = 'v2'

// Fixed trip definitions
const TRIP_DEFINITIONS = [
  {
    id: 'trip-frankfurt',
    title: 'Frankfurt Foundations',
    baseLocation: 'Frankfurt, Germany',
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    learningTrack: '15min' as const,
  },
  {
    id: 'trip-kyoto',
    title: 'Kyoto Culture Sprint',
    baseLocation: 'Kyoto, Japan',
    startDate: '2026-09-05',
    endDate: '2026-09-18',
    learningTrack: '60min' as const,
  },
  {
    id: 'trip-costa-rica',
    title: 'Costa Rica Nature Lab',
    baseLocation: 'La Fortuna, Costa Rica',
    startDate: '2027-01-10',
    endDate: '2027-01-23',
    learningTrack: 'weekly' as const,
    weeklyHours: 7,
  },
]

// Fixed itinerary item templates (2 per day, 14 days = 28 items)
const ITINERARY_TEMPLATES = [
  { title: 'Morning Museum Visit', location: 'Historical Museum', notes: 'Explore local history and culture' },
  { title: 'City Walking Tour', location: 'City Center', notes: 'Guided tour of main attractions' },
  { title: 'Language Exchange Meetup', location: 'Community Center', notes: 'Practice local language with natives' },
  { title: 'Local Market Exploration', location: 'Central Market', notes: 'Discover local foods and crafts' },
  { title: 'Evening Cultural Performance', location: 'Theater District', notes: 'Traditional music and dance' },
  { title: 'Nature Hike', location: 'Mountain Trail', notes: 'Scenic hike with local guide' },
  { title: 'Cooking Class', location: 'Culinary School', notes: 'Learn traditional recipes' },
  { title: 'Art Gallery Visit', location: 'Modern Art Gallery', notes: 'Contemporary local artists' },
  { title: 'Beach Relaxation', location: 'Coastal Area', notes: 'Sunset viewing and relaxation' },
  { title: 'Historical Site Visit', location: 'Ancient Ruins', notes: 'Guided archaeological tour' },
  { title: 'Local Festival', location: 'Town Square', notes: 'Cultural celebration event' },
  { title: 'Photography Walk', location: 'Scenic District', notes: 'Capture local architecture' },
  { title: 'Evening Stroll', location: 'Riverside Park', notes: 'Peaceful evening walk' },
  { title: 'Coffee Shop Study Session', location: 'Local Cafe', notes: 'Language practice with locals' },
  { title: 'Temple Visit', location: 'Historic Temple', notes: 'Spiritual and cultural experience' },
  { title: 'Street Food Tour', location: 'Food District', notes: 'Taste authentic local cuisine' },
  { title: 'Botanical Garden', location: 'City Gardens', notes: 'Explore native plant species' },
  { title: 'Sunrise Viewing', location: 'Mountain Peak', notes: 'Early morning scenic view' },
  { title: 'Local Library Visit', location: 'Public Library', notes: 'Research local history' },
  { title: 'Craft Workshop', location: 'Artisan Studio', notes: 'Learn traditional crafts' },
  { title: 'Evening Concert', location: 'Concert Hall', notes: 'Local music performance' },
  { title: 'Riverside Picnic', location: 'River Park', notes: 'Outdoor meal with view' },
  { title: 'Shopping District', location: 'Main Shopping Street', notes: 'Browse local shops' },
  { title: 'Sunset Cruise', location: 'Harbor', notes: 'Evening boat tour' },
  { title: 'Yoga Session', location: 'Beach', notes: 'Morning yoga practice' },
  { title: 'Local Brewery Tour', location: 'Craft Brewery', notes: 'Learn brewing traditions' },
  { title: 'Night Market', location: 'Evening Market', notes: 'Explore night market vendors' },
  { title: 'Final Day Reflection', location: 'Hotel', notes: 'Review trip experiences' },
]

// Fixed activity log templates
const ACTIVITY_LOG_TEMPLATES = [
  { title: 'Completed Chapter 1', notes: 'Learned about local history and culture', tags: ['history', 'language'] },
  { title: 'Grammar Practice Session', notes: 'Focused on verb conjugations', tags: ['language', 'grammar'] },
  { title: 'Vocabulary Building', notes: 'Added 50 new words to my dictionary', tags: ['language', 'vocabulary'] },
  { title: 'Cultural Reading', notes: 'Read about local traditions', tags: ['culture', 'reading'] },
  { title: 'Listening Practice', notes: 'Podcast about local history', tags: ['language', 'listening'] },
  { title: 'Writing Exercise', notes: 'Journal entry in local language', tags: ['language', 'writing'] },
  { title: 'Conversation Practice', notes: 'Spoke with locals at market', tags: ['language', 'speaking'] },
  { title: 'Research Project', notes: 'Investigated local architecture', tags: ['history', 'research'] },
  { title: 'Documentation Review', notes: 'Reviewed travel notes', tags: ['organization', 'review'] },
  { title: 'Language Exchange', notes: 'Met with language partner', tags: ['language', 'exchange'] },
  { title: 'Cultural Immersion', notes: 'Attended local event', tags: ['culture', 'immersion'] },
  { title: 'Study Session', notes: 'Focused study on difficult topics', tags: ['study', 'focus'] },
  { title: 'Progress Review', notes: 'Assessed learning progress', tags: ['review', 'progress'] },
  { title: 'Final Reflection', notes: 'Summarized entire trip learning', tags: ['reflection', 'summary'] },
]

// Fixed artifact URLs and notes
const ARTIFACT_LINKS = [
  'https://example.com/history-resource-1',
  'https://example.com/language-guide-1',
  'https://example.com/culture-article-1',
  'https://example.com/grammar-reference-1',
  'https://example.com/vocabulary-list-1',
  'https://example.com/listening-practice-1',
  'https://example.com/writing-tips-1',
  'https://example.com/conversation-guide-1',
  'https://example.com/research-source-1',
  'https://example.com/documentation-tool-1',
  'https://example.com/exchange-platform-1',
  'https://example.com/immersion-resource-1',
  'https://example.com/study-method-1',
  'https://example.com/progress-tracker-1',
]

const ARTIFACT_NOTES = [
  'Key insight: Local customs are deeply connected to historical events.',
  'Important phrase: "Thank you" variations in different contexts.',
  'Cultural note: Traditional festivals have specific meanings.',
  'Grammar tip: Verb placement changes in questions.',
  'Vocabulary highlight: Market-related terms are essential.',
  'Listening observation: Native speakers use contractions frequently.',
  'Writing reflection: Journaling helps reinforce learning.',
  'Conversation insight: Body language is as important as words.',
  'Research finding: Architecture reflects cultural values.',
  'Organization tip: Daily notes improve retention.',
  'Exchange benefit: Real conversations accelerate learning.',
  'Immersion value: Context makes language memorable.',
  'Study method: Spaced repetition works well.',
  'Progress note: Consistent practice shows results.',
]

function createDateAtTime(dateStr: string, hour: number, minute: number, timezone: string): string {
  // Create date string in format: YYYY-MM-DDTHH:mm
  const dateTimeStr = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  // Return as ISO string (browser will interpret in local timezone context)
  return new Date(dateTimeStr).toISOString()
}

function generateTripData(tripDef: typeof TRIP_DEFINITIONS[0], userId: DemoUserId): {
  trip: Trip
  itinerary: ItineraryItem[]
  scheduleBlocks: ScheduleBlock[]
  activityLogs: ActivityLog[]
} {
  const user = DEMO_USERS.find(u => u.id === userId)!
  const createdAt = '2026-01-01T00:00:00.000Z'

  // Create trip
  const learningTarget: LearningTarget = {
    track: tripDef.learningTrack,
    ...(tripDef.learningTrack === 'weekly' && tripDef.weeklyHours ? { weeklyHours: tripDef.weeklyHours } : {}),
  }

  const trip: Trip = {
    id: `${tripDef.id}-${userId}`,
    title: tripDef.title,
    startDate: tripDef.startDate,
    endDate: tripDef.endDate,
    baseLocation: tripDef.baseLocation,
    learningTarget,
    createdAt,
  }

  // No itinerary items - they are now incorporated into schedule blocks
  const itinerary: ItineraryItem[] = []

  // No generated schedule blocks - only AI-generated blocks will exist
  const scheduleBlocks: ScheduleBlock[] = []

  // Generate activity logs (1 per day, 14 days = 14 logs)
  const activityLogs: ActivityLog[] = []
  const startDate = new Date(tripDef.startDate + 'T00:00:00Z')
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(startDate)
    currentDate.setUTCDate(startDate.getUTCDate() + day)
    const dateStr = currentDate.toISOString().split('T')[0]
    const template = ACTIVITY_LOG_TEMPLATES[day % ACTIVITY_LOG_TEMPLATES.length]

    activityLogs.push({
      id: `log-${trip.id}-day${day}`,
      dateTime: createDateAtTime(dateStr, 20, 0, user.timezone),
      title: template.title,
      notes: template.notes,
      tags: template.tags,
      artifacts: [
        {
          id: `artifact-${trip.id}-day${day}-link`,
          type: 'LINK',
          url: ARTIFACT_LINKS[day % ARTIFACT_LINKS.length],
          createdAt,
        },
        {
          id: `artifact-${trip.id}-day${day}-note`,
          type: 'NOTE',
          text: ARTIFACT_NOTES[day % ARTIFACT_NOTES.length],
          createdAt,
        },
      ],
      createdAt,
    })
  }

  // Sort activity logs by dateTime
  activityLogs.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())

  return { trip, itinerary, scheduleBlocks, activityLogs }
}

export function generateSeedData(): Record<DemoUserId, AppData> {
  const allUserIds: DemoUserId[] = ['alice', 'bob', 'sam', 'dana', 'eve', 'frank', 'grace', 'henry']
  const result: Record<DemoUserId, AppData> = {} as Record<DemoUserId, AppData>

  // Initialize all users
  for (const userId of allUserIds) {
    result[userId] = { trips: [], itinerary: {}, scheduleBlocks: {}, activityLogs: {} }
  }

  // Generate trips for all users
  for (const userId of allUserIds) {
    const userData = result[userId]

    for (const tripDef of TRIP_DEFINITIONS) {
      const { trip, itinerary, scheduleBlocks, activityLogs } = generateTripData(tripDef, userId)

      userData.trips.push(trip)
      userData.itinerary[trip.id] = itinerary
      userData.scheduleBlocks[trip.id] = scheduleBlocks
      userData.activityLogs[trip.id] = activityLogs
    }
  }

  return result
}

