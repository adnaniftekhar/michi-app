/**
 * Utility functions for getting activity images and icons
 * Uses keyword extraction from titles to find relevant images
 * Privacy-focused: uses generic icons and royalty-free images
 */

export type ActivityType = 
  | 'museum'
  | 'nature'
  | 'market'
  | 'historical'
  | 'cultural'
  | 'lab'
  | 'workshop'
  | 'reading'
  | 'discussion'
  | 'reflection'
  | 'audio'
  | 'music'
  | 'art'
  | 'technology'
  | 'food'
  | 'travel'
  | 'writing'
  | 'photography'
  | 'default'

// Keyword to activity type mapping for better image matching
const KEYWORD_MAPPINGS: Record<string, ActivityType> = {
  // Audio/Music
  'audio': 'audio',
  'sound': 'audio',
  'podcast': 'audio',
  'recording': 'audio',
  'music': 'music',
  'song': 'music',
  'melody': 'music',
  'instrument': 'music',
  'piano': 'music',
  'guitar': 'music',
  'orchestra': 'music',
  
  // Art
  'art': 'art',
  'painting': 'art',
  'drawing': 'art',
  'sketch': 'art',
  'canvas': 'art',
  'sculpture': 'art',
  'creative': 'art',
  'design': 'art',
  
  // Technology
  'ai': 'technology',
  'artificial': 'technology',
  'intelligence': 'technology',
  'computer': 'technology',
  'code': 'technology',
  'coding': 'technology',
  'programming': 'technology',
  'digital': 'technology',
  'tech': 'technology',
  'software': 'technology',
  'robot': 'technology',
  
  // Nature
  'nature': 'nature',
  'forest': 'nature',
  'tree': 'nature',
  'ocean': 'nature',
  'beach': 'nature',
  'mountain': 'nature',
  'river': 'nature',
  'garden': 'nature',
  'plant': 'nature',
  'animal': 'nature',
  'bird': 'nature',
  'wildlife': 'nature',
  'outdoor': 'nature',
  'hiking': 'nature',
  
  // Food
  'food': 'food',
  'cooking': 'food',
  'recipe': 'food',
  'cuisine': 'food',
  'restaurant': 'food',
  'meal': 'food',
  'kitchen': 'food',
  'baking': 'food',
  
  // Travel/Cultural
  'immigrant': 'cultural',
  'immigration': 'cultural',
  'culture': 'cultural',
  'heritage': 'cultural',
  'tradition': 'cultural',
  'travel': 'travel',
  'journey': 'travel',
  'explore': 'travel',
  'adventure': 'travel',
  'destination': 'travel',
  
  // Writing
  'essay': 'writing',
  'write': 'writing',
  'writing': 'writing',
  'story': 'writing',
  'narrative': 'writing',
  'journal': 'writing',
  'blog': 'writing',
  'article': 'writing',
  
  // Photography
  'photo': 'photography',
  'photography': 'photography',
  'camera': 'photography',
  'picture': 'photography',
  'image': 'photography',
  
  // Museum/Historical
  'museum': 'museum',
  'gallery': 'museum',
  'exhibition': 'museum',
  'history': 'historical',
  'historical': 'historical',
  'ancient': 'historical',
  'monument': 'historical',
  
  // Lab/Science
  'lab': 'lab',
  'laboratory': 'lab',
  'experiment': 'lab',
  'science': 'lab',
  'research': 'lab',
  'chemistry': 'lab',
  'biology': 'lab',
  'physics': 'lab',
  
  // Workshop
  'workshop': 'workshop',
  'craft': 'workshop',
  'making': 'workshop',
  'build': 'workshop',
  'create': 'workshop',
  'hands': 'workshop',
  
  // Reading
  'reading': 'reading',
  'book': 'reading',
  'literature': 'reading',
  'library': 'reading',
  'novel': 'reading',
  
  // Discussion
  'discussion': 'discussion',
  'debate': 'discussion',
  'talk': 'discussion',
  'conversation': 'discussion',
  'interview': 'discussion',
  
  // Reflection
  'reflection': 'reflection',
  'reflect': 'reflection',
  'think': 'reflection',
  'meditate': 'reflection',
  'contemplate': 'reflection',
  
  // Market
  'market': 'market',
  'shop': 'market',
  'shopping': 'market',
  'store': 'market',
  'vendor': 'market',
}

/**
 * Detects activity type from title and description using keyword analysis
 */
export function detectActivityType(title: string, description?: string, fieldExperience?: string): ActivityType {
  const text = `${title} ${description || ''} ${fieldExperience || ''}`.toLowerCase()
  const words = text.split(/\s+/)
  
  // Count matches for each activity type
  const typeCounts: Record<ActivityType, number> = {} as Record<ActivityType, number>
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '')
    if (KEYWORD_MAPPINGS[cleanWord]) {
      const type = KEYWORD_MAPPINGS[cleanWord]
      typeCounts[type] = (typeCounts[type] || 0) + 1
    }
  }
  
  // Find the type with most matches
  let bestType: ActivityType = 'default'
  let bestCount = 0
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > bestCount) {
      bestCount = count
      bestType = type as ActivityType
    }
  }
  
  return bestType
}

// Curated, kid-safe Unsplash images organized by activity type
// Each array contains multiple image IDs to ensure variety
const IMAGE_COLLECTIONS: Record<ActivityType, string[]> = {
  audio: [
    '1493225457124-a3eb161ffa5f', // Headphones
    '1511671782779-c97d3d27a1d4', // Sound waves
    '1598488035139-bdbb2231ce04', // Microphone
    '1518609878373-06d740f60d8b', // Audio equipment
    '1558618666-fcd25c85cd64', // Recording studio
  ],
  music: [
    '1507838153286-6c95e3f4d4c8', // Piano keys
    '1511379938547-c1f69419868d', // Music notes
    '1514320291840-2e0a9bf2a9ae', // Guitar strings
    '1493225457124-a3eb161ffa5f', // Headphones
    '1459749411175-04bf5292ceea', // Concert hall
  ],
  art: [
    '1460661419201-fd4cecdf8a8d', // Paint brushes
    '1513364776144-60967b0f800f', // Art supplies
    '1579783902614-a3fb3927b6a5', // Canvas
    '1456086272160-b24b0a8e6a80', // Abstract art
    '1547891654-e66ed7ebb968', // Colorful art
  ],
  technology: [
    '1518770660439-4636190af475', // Circuit board
    '1550751827-4bd374c3f58b', // Robot
    '1485827404703-89b55fcc595e', // Technology
    '1526374965328-7f61d4dc18c5', // Code on screen
    '1517077304055-6e89dc36afc3', // AI concept
  ],
  nature: [
    '1441974231531-c6227db76b6e', // Forest
    '1506905925346-21bda4d32df4', // Mountains
    '1511497584788-876760111969', // Tropical
    '1469474968028-56623f02e42e', // Beach sunset
    '1475924156734-496f6cac6ec1', // Lake
  ],
  food: [
    '1476224203421-9ac39bcb3327', // Healthy food
    '1504674900247-0877df9cc836', // Cooking
    '1490645935967-10de6ba17061', // Meal
    '1466637574441-749b8f19452f', // Fresh ingredients
    '1498837167922-ddd27525d352', // Kitchen
  ],
  cultural: [
    '1523050854058-8df90110c9f1', // Diverse community
    '1529156069898-49953e39b3ac', // Cultural celebration
    '1493707553211-f1b5eb1c7b63', // Traditional crafts
    '1511632765486-a01205278f6c', // Cultural artifacts
    '1544967082-d9d25d867d4d', // Heritage site
  ],
  travel: [
    '1500835556837-99ac94a94552', // Airplane window
    '1476514525535-07fb3b4ae5f1', // Travel adventure
    '1528543606781-2f6e6857f318', // Passport
    '1503220317375-aabd63ab2fd7', // Travel destination
    '1501785888041-af3ef285b470', // Scenic view
  ],
  writing: [
    '1455390582262-044cdead277a', // Typewriter
    '1486312338219-ce68d2c6f44d', // Writing desk
    '1517842645767-c639042777db', // Notebook
    '1488190211105-8b0e65b80b4e', // Journal
    '1471107340929-a87cd0f5b5f3', // Writing
  ],
  photography: [
    '1516035069371-29a1b244cc32', // Camera
    '1452780212940-6f5c0d14d848', // Photography
    '1495745966610-2a67f2297e5e', // Lens
    '1542038784456-1ea8e935640e', // Photo camera
    '1554048612-d6a6bb83b7ff', // Photography gear
  ],
  museum: [
    '1554907984-15263bfd63bd', // Museum interior
    '1564399580075-5dfe19c205f3', // Art gallery
    '1513364776144-60967b0f800f', // Exhibition
    '1551966775-a4ddc8df052b', // Museum display
    '1580060405188-b3d52738f188', // Museum hall
  ],
  historical: [
    '1539037116277-4db20889f2d4', // Ancient ruins
    '1564399580075-5dfe19c205f3', // Historical site
    '1548013146-72479768bada', // Monument
    '1555217851-6a1bfb1c90a1', // Historical building
    '1547471080-7cc2caa01a7e', // Heritage
  ],
  lab: [
    '1532094349884-543bc11b234d', // Laboratory
    '1576319155264-99536e0be1ee', // Science equipment
    '1530973428-5bf2db2e4d71', // Chemistry
    '1507413245164-6160d8298b31', // Research
    '1518152006812-edab29b069ac', // Experiment
  ],
  workshop: [
    '1416879595882-3373a0480b5b', // Workshop tools
    '1504148455328-c376907d081c', // Craft workshop
    '1452860606245-08befc0ff44b', // Maker space
    '1530124566582-a618bc2615dc', // Hands-on work
    '1558618666-fcd25c85cd64', // Creative studio
  ],
  reading: [
    '1507842217343-583bb7270b66', // Library
    '1481627834876-b7833e8f5570', // Books
    '1497633762265-9d179a990aa6', // Reading
    '1456513080510-7bf3a84b82f8', // Study books
    '1519682337058-a94d519337bc', // Book stack
  ],
  discussion: [
    '1517048676732-d65bc937f952', // Discussion
    '1529156069898-49953e39b3ac', // Group talk
    '1552664730-d307ca884978', // Conversation
    '1573164574472-797cdf4a583a', // Meeting
    '1560439514-4e9645039924', // Collaboration
  ],
  reflection: [
    '1518241353330-0f7941c2d9b5', // Calm water
    '1506905925346-21bda4d32df4', // Peaceful mountain
    '1507400492013-162706c8c05e', // Meditation
    '1470252649378-9c29740c9fa8', // Sunset
    '1499002238440-d264edd596e5', // Quiet nature
  ],
  market: [
    '1533900298318-6b8da08a523e', // Market stalls
    '1542838132-92c53300491e', // Shopping
    '1556742049-0cfed4f6a45d', // Fresh market
    '1488459716781-31db52582f63', // Vendor
    '1579113800032-c38bd7635818', // Local market
  ],
  default: [
    '1503676260728-1c00da094a0b', // Education
    '1456513080510-7bf3a84b82f8', // Learning
    '1516321318423-f06f85e504b3', // Study
    '1488190211105-8b0e65b80b4e', // Workspace
    '1434030216411-0b793f4b4173', // Materials
  ],
}

/**
 * Gets a unique, kid-appropriate image URL for an activity.
 * Uses activity type detection from title + unique key for variety.
 */
export function getActivityIconUrl(
  activityType: ActivityType, 
  uniqueKey: string,
  usedImageIds?: Set<string>
): string {
  const options = IMAGE_COLLECTIONS[activityType] || IMAGE_COLLECTIONS.default
  
  // Generate a hash from the unique key for consistent but varied selection
  let hash = 0
  for (let i = 0; i < uniqueKey.length; i++) {
    hash = ((hash << 5) - hash) + uniqueKey.charCodeAt(i)
    hash = hash & hash
  }
  
  let index = Math.abs(hash) % options.length
  
  // Try to avoid duplicates if tracking used images
  if (usedImageIds) {
    let attempts = 0
    while (usedImageIds.has(options[index]) && attempts < options.length) {
      index = (index + 1) % options.length
      attempts++
    }
    usedImageIds.add(options[index])
  }
  
  const imageId = options[index]
  return `https://images.unsplash.com/photo-${imageId}?w=800&h=400&fit=crop&auto=format&q=80`
}

/**
 * Gets an image URL based on the activity title (keyword-based)
 * This extracts keywords from the title and finds relevant images
 */
export function getActivityImageFromTitle(
  title: string,
  description?: string,
  index: number = 0
): { url: string; alt: string; type: ActivityType } {
  const type = detectActivityType(title, description)
  const options = IMAGE_COLLECTIONS[type] || IMAGE_COLLECTIONS.default
  
  const imageId = options[index % options.length]
  const url = `https://images.unsplash.com/photo-${imageId}?w=800&h=400&fit=crop&auto=format&q=80`
  
  return {
    url,
    alt: `Image representing ${title}`,
    type,
  }
}

/**
 * Gets SVG fallback icon (used when image fails to load)
 */
export function getActivityIconFallback(activityType: ActivityType): string {
  // Return a generic learning icon as base64 SVG
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGQkZBOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'
}

/**
 * Gets alt text for an activity image
 */
export function getActivityImageAlt(activityType: ActivityType, title: string, location?: string): string {
  const typeLabels: Record<ActivityType, string> = {
    museum: 'museum activity',
    nature: 'nature activity',
    market: 'market activity',
    historical: 'historical site',
    cultural: 'cultural activity',
    lab: 'laboratory activity',
    workshop: 'workshop activity',
    reading: 'reading activity',
    discussion: 'discussion activity',
    reflection: 'reflection activity',
    audio: 'audio activity',
    music: 'music activity',
    art: 'art activity',
    technology: 'technology activity',
    food: 'food activity',
    travel: 'travel activity',
    writing: 'writing activity',
    photography: 'photography activity',
    default: 'learning activity',
  }
  
  const baseLabel = typeLabels[activityType] || typeLabels.default
  if (location) {
    return `${baseLabel} at ${location}`
  }
  return baseLabel
}
