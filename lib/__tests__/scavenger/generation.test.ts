import { describe, it, expect } from 'vitest'
import {
  generateHunt,
  getCandidatePlacesForCity,
} from '../../scavenger/generation'
import type {
  HuntConfig,
  HuntDefinition,
  PlaceCandidate,
} from '../../scavenger/types'

describe('scavenger hunt generation', () => {
  const baseConfig: HuntConfig = {
    id: 'test-hunt',
    title: 'Test Hunt',
    city: 'Barcelona',
    areaLabel: 'Gothic Quarter',
    ageRange: 'family',
    durationMinutes: 60,
    interests: ['history', 'street-art'],
    walkingPace: 'normal',
  }

  it('returns curated candidates for a known city', () => {
    const candidates = getCandidatePlacesForCity('Barcelona')
    expect(candidates.length).toBeGreaterThan(0)
    candidates.forEach((place: PlaceCandidate) => {
      expect(place.isPublicAccess).toBe(true)
      expect(place.tags.includes('safe')).toBe(true)
      expect(place.categories.length).toBeGreaterThan(0)
    })
  })

  it('generates a hunt with at least 3 safe stops', () => {
    const hunt: HuntDefinition = generateHunt(baseConfig)
    expect(hunt.stops.length).toBeGreaterThanOrEqual(3)

    hunt.stops.forEach((stop) => {
      expect(stop.place.isPublicAccess).toBe(true)
      expect(stop.clueText.length).toBeGreaterThan(10)
      expect(stop.answerKeywords.length).toBeGreaterThan(0)
      expect(stop.hints.length).toBeGreaterThan(0)
    })
  })

  it('roughly respects desired duration using walking pace', () => {
    const slowConfig: HuntConfig = { ...baseConfig, walkingPace: 'slow' }
    const fastConfig: HuntConfig = { ...baseConfig, walkingPace: 'fast' }

    const slowHunt = generateHunt(slowConfig)
    const fastHunt = generateHunt(fastConfig)

    // Slow pace should result in fewer stops than fast pace
    expect(slowHunt.stops.length).toBeLessThanOrEqual(fastHunt.stops.length)
  })

  it('produces different variants for replay while staying in same area', () => {
    const first = generateHunt(baseConfig, { variantSeed: 1 })
    const second = generateHunt(baseConfig, { variantSeed: 2 })

    expect(first.stops.length).toBeGreaterThan(0)
    expect(second.stops.length).toBeGreaterThan(0)

    const firstIds = first.stops.map((s) => s.place.id).join(',')
    const secondIds = second.stops.map((s) => s.place.id).join(',')

    // Same underlying pool, but ordering / subset should change
    expect(firstIds).not.toEqual(secondIds)
  })
})

