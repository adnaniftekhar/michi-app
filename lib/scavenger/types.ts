export type AgeRange = 'kids' | 'family' | 'teens' | 'adults'

export type WalkingPace = 'slow' | 'normal' | 'fast'

export interface HuntConfig {
  id: string
  title: string
  city: string
  /**
   * Human-readable area label like "Gothic Quarter" or "Shinjuku".
   */
  areaLabel: string
  ageRange: AgeRange
  /**
   * Target total play time (minutes) including walking between stops.
   */
  durationMinutes: number
  /**
   * Free-form interest tags such as "history", "street-art", "food".
   */
  interests: string[]
  walkingPace: WalkingPace
}

export interface PlaceCandidate {
  id: string
  name: string
  city: string
  areaLabel: string
  description: string
  approxLat: number
  approxLng: number
  /**
   * High-level categories used for filtering and hint generation.
   * Examples: "courtyard", "public-art", "market", "viewpoint".
   */
  categories: string[]
  /**
   * Simple tags to indicate safety and usage constraints.
   * Must always include "safe" for a place to be used in a hunt.
   */
  tags: string[]
  /**
   * True only if the place is publicly accessible without tickets
   * or private membership (e.g. plazas, public art, markets).
   */
  isPublicAccess: boolean
  /**
   * Optional free-form notes shown to admins during preview.
   */
  safetyNotes?: string[]
  /**
   * Age ranges for which this place is appropriate.
   */
  ageSuitability: AgeRange[]
  /**
   * Interest tags this place is relevant to.
   */
  interestTags: string[]
  /**
   * Canonical short answer used for validation.
   */
  canonicalAnswer: string
  /**
   * Accepted answer keywords (lowercase, trimmed).
   */
  answerKeywords: string[]
}

export interface HuntStop {
  id: string
  order: number
  place: PlaceCandidate
  /**
   * Main riddle-style clue text shown to the player.
   */
  clueText: string
  /**
   * Optional short description for admins, not shown to players.
   */
  adminSummary: string
  hints: string[]
  /**
   * Lowercase keywords that count as a correct answer for this stop.
   */
  answerKeywords: string[]
  /**
   * Estimated minutes spent at the stop (excluding walking time).
   */
  estimatedStopMinutes: number
}

export type HuntStatus = 'draft' | 'published' | 'archived'

export interface HuntDefinition {
  id: string
  config: HuntConfig
  status: HuntStatus
  createdAt: string
  updatedAt: string
  /**
   * Publicly shareable human-readable summary of the route.
   */
  summary: string
  /**
   * Ordered list of stops that make up the hunt.
   */
  stops: HuntStop[]
  /**
   * Internal notes to help admins review safety.
   */
  safetyChecklist: string[]
}

export interface PlayAnswer {
  stopId: string
  rawAnswer: string
  normalizedAnswer: string
  isCorrect: boolean
  answeredAt: string
}

export type PlayStatus = 'not-started' | 'in-progress' | 'completed'

export interface PlaySession {
  id: string
  huntId: string
  startedAt: string
  completedAt?: string
  status: PlayStatus
  currentStopIndex: number
  answers: PlayAnswer[]
}

