import { describe, it, expect } from 'vitest'
import type { HuntDefinition, HuntConfig, PlaceCandidate } from '../../scavenger/types'
import { encodeHuntShareCode, decodeHuntShareCode } from '../../scavenger/share'
import { generateHunt } from '../../scavenger/generation'
import { validateAnswer } from '../../scavenger/session'

const mockPlace: PlaceCandidate = {
  id: 'place-1',
  name: 'Hidden Courtyard',
  areaLabel: 'Gothic Quarter',
  city: 'Barcelona',
  description: 'A quiet public courtyard tucked away from the main street.',
  approxLat: 41.0,
  approxLng: 2.0,
  categories: ['courtyard'],
  tags: ['safe', 'family', 'daytime'],
  isPublicAccess: true,
  safetyNotes: ['Well-lit during the day'],
  ageSuitability: ['family', 'teens', 'adults'],
  interestTags: ['history'],
  canonicalAnswer: 'hidden courtyard',
  answerKeywords: ['courtyard', 'hidden courtyard'],
}

const baseConfig: HuntConfig = {
  id: 'hunt-1',
  title: 'Test Hunt',
  city: 'Barcelona',
  areaLabel: 'Gothic Quarter',
  ageRange: 'family',
  durationMinutes: 45,
  interests: ['history'],
  walkingPace: 'normal',
}

function createSimpleHunt(): HuntDefinition {
  const hunt = generateHunt(baseConfig, {
    customPlaces: [mockPlace],
    minStops: 1,
    maxStops: 1,
  })
  return hunt
}

describe('scavenger share codes', () => {
  it('round-trips a hunt definition through a compact share code', () => {
    const hunt = createSimpleHunt()
    const code = encodeHuntShareCode(hunt)
    expect(typeof code).toBe('string')
    expect(code.length).toBeGreaterThan(10)

    const decoded = decodeHuntShareCode(code)
    expect(decoded.config.city).toBe(hunt.config.city)
    expect(decoded.stops.length).toBe(hunt.stops.length)
    expect(decoded.stops[0].place.name).toBe(hunt.stops[0].place.name)
  })
})

describe('scavenger answer validation', () => {
  it('accepts exact and keyword-based answers in a forgiving way', () => {
    const hunt = createSimpleHunt()
    const stop = hunt.stops[0]

    expect(
      validateAnswer(stop, 'Hidden Courtyard')
    ).toEqual({ isCorrect: true, normalizedAnswer: 'hidden courtyard' })

    // Extra whitespace and case differences should be tolerated
    expect(
      validateAnswer(stop, '   courtyard  ')
    ).toEqual({ isCorrect: true, normalizedAnswer: 'courtyard' })
  })

  it('rejects clearly unrelated answers', () => {
    const hunt = createSimpleHunt()
    const stop = hunt.stops[0]

    const result = validateAnswer(stop, 'shopping mall')
    expect(result.isCorrect).toBe(false)
  })
})

