import { getSeedForCity } from './city-seed'
import type {
  HuntConfig,
  HuntDefinition,
  HuntStop,
  PlaceCandidate,
} from './types'

export interface GenerateHuntOptions {
  /**
   * Optional explicit list of places to use instead of, or in addition to,
   * the curated city seed data. Primarily used in tests.
   */
  customPlaces?: PlaceCandidate[]
  /**
   * Minimum number of stops to include in the hunt (after filtering).
   * Defaults to 3.
   */
  minStops?: number
  /**
   * Maximum number of stops. Defaults to 6.
   */
  maxStops?: number
  /**
   * Optional numeric seed used to produce deterministic route variants
   * for replay. Different seeds will produce different orderings.
   */
  variantSeed?: number
}

const DEFAULT_MIN_STOPS = 3
const DEFAULT_MAX_STOPS = 6

export function getCandidatePlacesForCity(
  city: string,
  customPlaces?: PlaceCandidate[]
): PlaceCandidate[] {
  const seed = getSeedForCity(city)
  const base = seed ? seed.places : []
  const extras = customPlaces ?? []
  const combined = [...base, ...extras]

  // Apply conservative safety filters
  return combined.filter((place) => {
    if (!place.isPublicAccess) return false
    if (!place.tags.includes('safe')) return false
    // Explicitly avoid any private / school / hazardous tags
    const blockedTags = ['school', 'private', 'residence', 'hazardous']
    if (blockedTags.some((tag) => place.tags.includes(tag))) return false
    return true
  })
}

export function generateHunt(
  config: HuntConfig,
  options: GenerateHuntOptions = {}
): HuntDefinition {
  const {
    customPlaces,
    minStops = DEFAULT_MIN_STOPS,
    maxStops = DEFAULT_MAX_STOPS,
    variantSeed = Date.now(),
  } = options

  const candidates = getCandidatePlacesForCity(config.city, customPlaces)
    .filter((place) => place.ageSuitability.includes(config.ageRange))
    .map((place) => ({
      place,
      score: scorePlaceForConfig(place, config),
    }))
    .filter((scored) => scored.score > 0)

  if (candidates.length === 0) {
    throw new Error(
      `No safe public places available for hunts in ${config.city}.`
    )
  }

  const approxStops = estimateStopCountForDuration(
    config.durationMinutes,
    config.walkingPace
  )
  const targetStops = clamp(
    approxStops,
    Math.min(minStops, candidates.length),
    Math.min(maxStops, candidates.length)
  )

  const orderedPlaces = sortByVariantAndScore(
    candidates,
    variantSeed
  ).slice(0, targetStops)

  const nowIso = new Date().toISOString()

  const stops: HuntStop[] = orderedPlaces.map((item, index) => {
    const { place } = item
    const clueText = buildClueText(place, config)
    const hints = buildHints(place, config)
    const adminSummary = `${place.name} in ${place.areaLabel} (${place.categories.join(
      ', '
    )})`

    return {
      id: `${config.id}-stop-${index + 1}`,
      order: index + 1,
      place,
      clueText,
      adminSummary,
      hints,
      answerKeywords: place.answerKeywords,
      estimatedStopMinutes: 10,
    }
  })

  const summary = `Explore ${stops.length} overlooked spots around ${config.areaLabel} in ${config.city}.`

  const safetyChecklist: string[] = [
    'All stops are marked as public access only.',
    'Avoid night-only play; clues are intended for daytime.',
    'No private residences, schools, or restricted facilities are included.',
  ]

  // Collect any per-place safety notes for faster admin review
  stops.forEach((stop) => {
    if (stop.place.safetyNotes && stop.place.safetyNotes.length > 0) {
      safetyChecklist.push(
        `Check "${stop.place.name}": ${stop.place.safetyNotes.join('; ')}`
      )
    }
  })

  const hunt: HuntDefinition = {
    id: config.id,
    config,
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
    summary,
    stops,
    safetyChecklist,
  }

  return hunt
}

function scorePlaceForConfig(place: PlaceCandidate, config: HuntConfig): number {
  let score = 0

  // Interest overlap
  const interestOverlap = place.interestTags.filter((tag) =>
    config.interests
      .map((t) => t.toLowerCase())
      .includes(tag.toLowerCase())
  ).length
  score += interestOverlap * 3

  // Matching area label (keeps us close to the chosen neighborhood)
  if (
    place.areaLabel.toLowerCase().includes(config.areaLabel.toLowerCase()) ||
    config.areaLabel.toLowerCase().includes(place.areaLabel.toLowerCase())
  ) {
    score += 2
  }

  // Small bonus for family-friendly places when age range is kids/family
  if (
    (config.ageRange === 'kids' || config.ageRange === 'family') &&
    place.tags.includes('family')
  ) {
    score += 2
  }

  return score
}

function estimateStopCountForDuration(
  durationMinutes: number,
  pace: HuntConfig['walkingPace']
): number {
  // Very simple heuristic: slower pace -> fewer stops.
  const walkingComponent =
    pace === 'slow' ? 18 : pace === 'fast' ? 10 : 14
  const stopComponent = 10
  const approxPerStop = walkingComponent + stopComponent
  return Math.max(2, Math.round(durationMinutes / approxPerStop))
}

function sortByVariantAndScore(
  candidates: { place: PlaceCandidate; score: number }[],
  seed: number
): { place: PlaceCandidate; score: number }[] {
  return [...candidates].sort((a, b) => {
    const hashA = stableHash(`${seed}:${a.place.id}`)
    const hashB = stableHash(`${seed}:${b.place.id}`)

    // Combine score with a tiny seed-based jitter so different seeds
    // produce different but still preference-respecting orderings.
    const jitterA = (hashA % 1000) / 1000
    const jitterB = (hashB % 1000) / 1000

    const effectiveA = a.score + jitterA
    const effectiveB = b.score + jitterB

    return effectiveB - effectiveA
  })
}

function stableHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  // Convert to positive 32-bit int
  return hash >>> 0
}

function buildClueText(place: PlaceCandidate, config: HuntConfig): string {
  const categoryLabel = place.categories[0] || 'spot'
  const interestLabel = place.interestTags[0] || 'local life'

  return `In ${config.areaLabel}, find a ${categoryLabel} linked to ${interestLabel}. It is hidden near the flow of visitors but slightly off the main path.`
}

function buildHints(place: PlaceCandidate, config: HuntConfig): string[] {
  const hints: string[] = []

  hints.push(
    `Stay within the ${config.areaLabel} area and look for signs that match the description.`
  )

  if (place.categories.includes('public-art')) {
    hints.push('Look for a wall or surface with color or drawings.')
  } else if (place.categories.includes('courtyard')) {
    hints.push('Look for a narrow passage that opens into a small open space.')
  } else if (place.categories.includes('arcade')) {
    hints.push('Look for a covered walkway with shops or small stalls.')
  } else if (place.categories.includes('square')) {
    hints.push('Head toward an open square where people naturally gather.')
  }

  hints.push('This stop is in a public, open-access place you can reach on foot.')

  return hints
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

