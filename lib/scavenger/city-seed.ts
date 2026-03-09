import type { PlaceCandidate, AgeRange } from './types'

type CityKey = string

interface CitySeed {
  city: string
  areaLabel: string
  popularAreaHint: string
  places: PlaceCandidate[]
}

const commonAgeSuitability: AgeRange[] = ['kids', 'family', 'teens', 'adults']

// Lightweight curated data so the MVP is playable immediately
// without calling any external APIs.
export const CITY_SEEDS: Record<CityKey, CitySeed> = {
  barcelona: {
    city: 'Barcelona',
    areaLabel: 'Gothic Quarter',
    popularAreaHint: 'near the cathedral and main plazas',
    places: [
      {
        id: 'bcn-gothic-archway',
        name: 'Stone Archway Courtyard',
        city: 'Barcelona',
        areaLabel: 'Gothic Quarter',
        description: 'A small stone courtyard with an archway just off a busy shopping street.',
        approxLat: 41.383,
        approxLng: 2.177,
        categories: ['courtyard'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: [
          'Pedestrian-only alley',
          'Avoid late-night play; best during daylight',
        ],
        ageSuitability: commonAgeSuitability,
        interestTags: ['history', 'architecture'],
        canonicalAnswer: 'stone archway courtyard',
        answerKeywords: ['archway', 'stone archway', 'courtyard'],
      },
      {
        id: 'bcn-hidden-mural',
        name: 'Hidden Mural Wall',
        city: 'Barcelona',
        areaLabel: 'Gothic Quarter',
        description: 'A colorful mural tucked at the end of a narrow lane.',
        approxLat: 41.382,
        approxLng: 2.176,
        categories: ['public-art'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['Watch for occasional delivery bikes'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['street-art'],
        canonicalAnswer: 'mural',
        answerKeywords: ['mural', 'painting', 'wall art'],
      },
      {
        id: 'bcn_small_square',
        name: 'Quiet Stone Square',
        city: 'Barcelona',
        areaLabel: 'Gothic Quarter',
        description: 'A quiet square with a central tree and benches.',
        approxLat: 41.384,
        approxLng: 2.179,
        categories: ['square', 'pocket-park'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['Families and tourists during the day'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['people-watching'],
        canonicalAnswer: 'square',
        answerKeywords: ['square', 'plaza'],
      },
    ],
  },
  london: {
    city: 'London',
    areaLabel: 'Covent Garden',
    popularAreaHint: 'around the main market halls',
    places: [
      {
        id: 'ldn_arcade',
        name: 'Glass-roofed Arcade',
        city: 'London',
        areaLabel: 'Covent Garden',
        description: 'A covered arcade with a glass roof and small independent shops.',
        approxLat: 51.512,
        approxLng: -0.123,
        categories: ['arcade'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['Busy at weekends; stay together'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['shopping', 'architecture'],
        canonicalAnswer: 'arcade',
        answerKeywords: ['arcade', 'glass roof'],
      },
      {
        id: 'ldn_courtyard',
        name: 'Hidden Courtyard Bench',
        city: 'London',
        areaLabel: 'Covent Garden',
        description: 'A tucked-away courtyard with a single long bench.',
        approxLat: 51.511,
        approxLng: -0.124,
        categories: ['courtyard'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['No vehicle traffic; good for short stops'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['quiet', 'people-watching'],
        canonicalAnswer: 'bench',
        answerKeywords: ['bench', 'courtyard'],
      },
    ],
  },
  'san francisco': {
    city: 'San Francisco',
    areaLabel: 'Fisherman\'s Wharf',
    popularAreaHint: 'near the piers and waterfront promenades',
    places: [
      {
        id: 'sf-pier-viewpoint',
        name: 'Bay Viewpoint Rail',
        city: 'San Francisco',
        areaLabel: 'Fisherman\'s Wharf',
        description: 'A public railing overlooking the bay with clear views of boats and the islands.',
        approxLat: 37.808,
        approxLng: -122.417,
        categories: ['viewpoint'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: [
          'Stay behind railings; supervise kids near the water edge.',
        ],
        ageSuitability: commonAgeSuitability,
        interestTags: ['views', 'harbor'],
        canonicalAnswer: 'viewpoint',
        answerKeywords: ['viewpoint', 'bay view', 'rail'],
      },
      {
        id: 'sf-hidden-mural',
        name: 'Harbor Alley Mural',
        city: 'San Francisco',
        areaLabel: 'Fisherman\'s Wharf',
        description: 'A colorful mural at the end of a short alley off the main tourist strip.',
        approxLat: 37.807,
        approxLng: -122.416,
        categories: ['public-art'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['Watch for occasional service vehicles in the alley.'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['street-art'],
        canonicalAnswer: 'mural',
        answerKeywords: ['mural', 'wall art', 'painting'],
      },
      {
        id: 'sf-pocket-park',
        name: 'Harbor Pocket Park',
        city: 'San Francisco',
        areaLabel: 'Fisherman\'s Wharf',
        description: 'A small public seating area with benches and planters just off a busier sidewalk.',
        approxLat: 37.806,
        approxLng: -122.418,
        categories: ['pocket-park'],
        tags: ['safe', 'family', 'daytime'],
        isPublicAccess: true,
        safetyNotes: ['Benches near pedestrian path; avoid blocking walkways.'],
        ageSuitability: commonAgeSuitability,
        interestTags: ['people-watching', 'rest'],
        canonicalAnswer: 'park',
        answerKeywords: ['park', 'pocket park', 'benches'],
      },
    ],
  },
}

export function getSeedForCity(rawCity: string | undefined | null): CitySeed | null {
  if (!rawCity) return null
  const key = rawCity.trim().toLowerCase()
  return CITY_SEEDS[key] || null
}

