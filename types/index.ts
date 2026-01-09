export type DemoUserId = 'alice' | 'bob' | 'sam' | 'dana' | 'eve' | 'frank' | 'grace' | 'henry' | string

export interface DemoUser {
  id: string
  name: string
  timezone: string
  isCustom?: boolean // true if user-created, false/undefined if built-in demo user
}

export type { LearnerProfile } from './learner-profile'

export type LearningTrack = '15min' | '60min' | '4hrs' | 'weekly'

export interface LearningTarget {
  track: LearningTrack
  weeklyHours?: number // Required if track is 'weekly'
}

export interface Trip {
  id: string
  title: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  baseLocation: string
  learningTarget?: LearningTarget
  createdAt: string
}

export interface ItineraryItem {
  id: string
  dateTime: string // ISO datetime string (local time)
  title: string
  location: string
  notes: string
  createdAt: string
}

export type ImageMode = 'google' | 'ai' | 'off'

export interface PhotoAttribution {
  displayName: string
  uri: string
}

export interface ScheduleBlock {
  id: string
  date: string // ISO date string
  startTime: string // ISO datetime string (local time)
  duration: number // minutes
  title: string
  description?: string // Optional description
  location?: string // Location for field experience (incorporated from itinerary)
  notes?: string // Additional notes (incorporated from itinerary)
  isGenerated: boolean // true if generated, false if manual
  createdAt: string
  // Visual elements
  imageUrl?: string // URL to activity image or icon (legacy/fallback)
  imageAlt?: string // Alt text for accessibility
  // Google Places integration
  placeId?: string // Google Places placeId
  placeName?: string // Display name from Places API
  approxLat?: number // City-level approximate latitude
  approxLng?: number // City-level approximate longitude
  imageMode?: ImageMode // 'google' | 'ai' | 'off'
  photoName?: string // Google Places photo name (if imageMode=google)
  photoAttribution?: PhotoAttribution // Photo attribution (if imageMode=google)
  aiImageAssetId?: string // AI-generated image asset ID (if imageMode=ai)
  aiImageUrl?: string // AI-generated image URL (if imageMode=ai)
  // Coordinates for maps (city-level only for privacy)
  coordinates?: { lat: number; lng: number } // Approximate coordinates for map
  // PBL fields (from AI pathway)
  drivingQuestion?: string
  fieldExperience?: string
  inquiryTask?: string
  artifact?: string
  reflectionPrompt?: string
  critiqueStep?: string
  // Local venue suggestions
  localOptions?: LocalVenueSuggestion[]
}

export interface LocalVenueSuggestion {
  placeId: string
  displayName: string
  areaLabel: string // Neighborhood/city (privacy-safe)
  googleMapsUri: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  openNow?: boolean
  location?: { lat: number; lng: number } // Optional coordinates for map preview
}

export type ArtifactType = 'LINK' | 'NOTE'

export interface Artifact {
  id: string
  type: ArtifactType
  url?: string // For LINK type
  text?: string // For NOTE type
  createdAt: string
}

export interface ActivityLog {
  id: string
  dateTime: string // ISO datetime string (local time)
  title: string
  notes: string
  tags: string[]
  artifacts: Artifact[]
  createdAt: string
}

export interface AppData {
  trips: Trip[]
  itinerary: Record<string, ItineraryItem[]> // tripId -> items
  scheduleBlocks: Record<string, ScheduleBlock[]> // tripId -> blocks
  activityLogs: Record<string, ActivityLog[]> // tripId -> logs
}

// Pathway Draft Types (2-stage generation)
export type PathwayDraftType = 'continuous' | 'themes' | 'hybrid'

export interface PathwayDraftDay {
  day: number
  date: string // ISO date string
  headline: string // Brief headline for this day
  summary?: string // Optional detailed summary for this day
}

export interface PathwayDraft {
  id: string
  type: PathwayDraftType
  title: string
  overview: string // Brief description of this pathway approach
  whyItFits: string // Why this pathway fits the learner
  rationale?: string // Optional rationale for this pathway approach
  days: PathwayDraftDay[] // Day-by-day headlines for selected days
}

export interface PathwayDraftsResponse {
  drafts: [PathwayDraft, PathwayDraft, PathwayDraft] // Exactly 3 drafts
}

export interface FinalizePathwayRequest {
  tripId: string
  learnerId: string
  chosenDraftId: string
  selectedDates: string[] // ISO date strings
  effortMode: LearningTrack
  editedDraft?: PathwayDraft // Optional edited draft to use instead of original
}

export interface FinalPathwayPlan {
  days: Array<{
    day: number
    date: string // ISO date string
    drivingQuestion: string
    fieldExperience: string
    inquiryTask: string
    artifact: string
    reflectionPrompt: string
    critiqueStep: string
    scheduleBlocks: Array<{
      startTime: string // ISO datetime
      duration: number // minutes
      title: string
      description?: string
      localOptions?: LocalVenueSuggestion[]
    }>
  }>
  summary?: string
}
