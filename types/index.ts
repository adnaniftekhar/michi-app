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
  imageUrl?: string // URL to activity image or icon
  imageAlt?: string // Alt text for accessibility
  // PBL fields (from AI pathway)
  drivingQuestion?: string
  fieldExperience?: string
  inquiryTask?: string
  artifact?: string
  reflectionPrompt?: string
  critiqueStep?: string
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

