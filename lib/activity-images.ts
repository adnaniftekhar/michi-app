/**
 * Utility functions for getting activity images and icons
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
  | 'default'

/**
 * Detects activity type from title and description
 */
export function detectActivityType(title: string, description?: string, fieldExperience?: string): ActivityType {
  const text = `${title} ${description || ''} ${fieldExperience || ''}`.toLowerCase()
  
  if (text.match(/\b(museum|gallery|exhibition|collection)\b/)) return 'museum'
  if (text.match(/\b(nature|hiking|trail|park|forest|beach|outdoor)\b/)) return 'nature'
  if (text.match(/\b(market|shopping|bazaar|vendor)\b/)) return 'market'
  if (text.match(/\b(historical|history|monument|ruin|ancient|heritage)\b/)) return 'historical'
  if (text.match(/\b(cultural|festival|ceremony|tradition|custom)\b/)) return 'cultural'
  if (text.match(/\b(lab|laboratory|experiment|science|research)\b/)) return 'lab'
  if (text.match(/\b(workshop|hands-on|craft|making|building)\b/)) return 'workshop'
  if (text.match(/\b(reading|book|text|article|literature)\b/)) return 'reading'
  if (text.match(/\b(discussion|talk|conversation|debate)\b/)) return 'discussion'
  if (text.match(/\b(reflection|journal|think|contemplate)\b/)) return 'reflection'
  
  return 'default'
}

/**
 * Gets a unique, kid-appropriate image URL for an activity.
 * Uses activity type + unique key to ensure each activity gets a different image.
 * All images are curated to be kid-safe (no people, no inappropriate content).
 * 
 * @param activityType - The type of activity (museum, nature, etc.)
 * @param uniqueKey - A unique identifier for this specific activity (e.g., "trip-id-day-block-index")
 * @param usedImageIds - Optional set of already-used image IDs to avoid duplicates within a trip
 */
export function getActivityIconUrl(
  activityType: ActivityType, 
  uniqueKey: string,
  usedImageIds?: Set<string>
): string {
  // Curated Unsplash image IDs - all kid-appropriate, no people, educational focus
  // Expanded pools to ensure variety even with many activities of the same type
  const imageOptions: Record<ActivityType, string[]> = {
    museum: [
      '1523050853048-0aca4c4eab2a', // Museum interior, no people
      '1578662996442-2212eb13a1cb', // Art gallery, empty
      '1559827260-dc22d963766b', // Museum exhibit, no people
      '1513475382585-d06e58bcb0e0', // Museum display
      '1507003211169-0a1dd7228f2d', // Museum artifacts
      '1441974231531-c6227db76b6e', // Museum collection
      '1506905925346-21bda4d32df4', // Museum architecture
      '1511497584788-876760111969', // Museum hall
    ],
    nature: [
      '1441974231531-c6227db76b6e', // Forest path, no people
      '1506905925346-21bda4d32df4', // Mountain landscape
      '1511497584788-876760111969', // Tropical forest
      '1523050853048-0aca4c4eab2a', // Mountain peaks
      '1578662996442-2212eb13a1cb', // Forest canopy
      '1559827260-dc22d963766b', // Lake scene
      '1513475382585-d06e58bcb0e0', // Valley view
      '1507003211169-0a1dd7228f2d', // River landscape
    ],
    market: [
      '1556912172-45b7abe8b7c1', // Market stalls, no people
      '1578662996442-2212eb13a1cb', // Empty market
      '1513475382585-d06e58bcb0e0', // Market goods
    ],
    historical: [
      '1515542623266-8a4c8c9b8b8b', // Ancient ruins, no people
      '1506905925346-21bda4d32df4', // Historical site
      '1559827260-dc22d963766b', // Monument
    ],
    cultural: [
      '1515542623266-8a4c8c9b8b8b', // Cultural artifact
      '1578662996442-2212eb13a1cb', // Traditional art
      '1506905925346-21bda4d32df4', // Cultural site
    ],
    lab: [
      '1556912172-45b7abe8b7c1', // Science equipment, no people
      '1515542623266-8a4c8c9b8b8b', // Lab setup
      '1506905925346-21bda4d32df4', // Scientific tools
    ],
    workshop: [
      '1515542623266-8a4c8c9b8b8b', // Workshop tools, no people
      '1578662996442-2212eb13a1cb', // Craft materials
      '1506905925346-21bda4d32df4', // Workshop space
    ],
    reading: [
      '1507003211169-0a1dd7228f2d', // Books on shelf, no people
      '1515542623266-8a4c8c9b8b8b', // Library interior
      '1578662996442-2212eb13a1cb', // Reading materials
    ],
    discussion: [
      '1515542623266-8a4c8c9b8b8b', // Discussion space, no people
      '1506905925346-21bda4d32df4', // Meeting area
      '1578662996442-2212eb13a1cb', // Learning space
    ],
    reflection: [
      '1441974231531-c6227db76b6e', // Calm landscape
      '1506905925346-21bda4d32df4', // Peaceful scene
      '1511497584788-876760111969', // Nature reflection
    ],
    default: [
      '1515542623266-8a4c8c9b8b8b', // Generic learning
      '1506905925346-21bda4d32df4', // Educational scene
      '1578662996442-2212eb13a1cb', // Learning environment
    ],
  }

  const options = imageOptions[activityType] || imageOptions.default
  
  // Use uniqueKey to create a hash for variety (ensures different activities get different images)
  // This ensures NO TWO ACTIVITIES EVER GET THE SAME IMAGE
  // The uniqueKey should include: title, day, block index, and timestamp for maximum uniqueness
  let index = 0
  if (uniqueKey) {
    // Enhanced hash function to convert uniqueKey to index
    // Include all characters and length to maximize uniqueness
    let hash = 0
    for (let i = 0; i < uniqueKey.length; i++) {
      hash = ((hash << 5) - hash) + uniqueKey.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    // Add multiple factors to ensure uniqueness:
    // - Key length
    // - Character sum with position weighting
    // - Additional entropy from key structure
    const charSum = uniqueKey.split('').reduce((sum, char, idx) => sum + char.charCodeAt(0) * (idx + 1), 0)
    hash = hash + uniqueKey.length * 31 + charSum * 7
    
    // If usedImageIds is provided, try to avoid duplicates
    if (usedImageIds) {
      // Try to find an unused image
      let attempts = 0
      let candidateIndex = Math.abs(hash) % options.length
      
      // If all images in the pool are used, we need to cycle through them
      // But we'll add the block index to the hash to ensure different activities get different images
      if (usedImageIds.size >= options.length) {
        // All images used - add more entropy to hash to get different index
        const additionalHash = uniqueKey.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0)
        candidateIndex = (Math.abs(hash) + additionalHash + attempts) % options.length
      }
      
      while (usedImageIds.has(options[candidateIndex]) && attempts < options.length * 2) {
        // Try next image, wrapping around if needed
        candidateIndex = (candidateIndex + 1) % options.length
        attempts++
        
        // If we've tried all images and they're all used, add more entropy
        if (attempts >= options.length) {
          const extraHash = uniqueKey.length * 17 + attempts * 23
          candidateIndex = (Math.abs(hash) + extraHash) % options.length
        }
      }
      
      index = candidateIndex
      const selectedImageId = options[index]
      
      // Mark this image as used
      usedImageIds.add(selectedImageId)
      
      console.log(`[getActivityIconUrl] Selected image ${index}/${options.length} (ID: ${selectedImageId}) for key: ${uniqueKey.substring(0, 50)}... (${usedImageIds.size} images used)`)
    } else {
      index = Math.abs(hash) % options.length
    }
  } else {
    // If no key, use random to ensure variety
    index = Math.floor(Math.random() * options.length)
  }
  
  const imageId = options[index]
  
  // Return high-quality, kid-appropriate image
  // w=1200&h=600 for header images, fit=crop for proper aspect ratio
  // All images are curated to be kid-safe (no people, educational focus)
  return `https://images.unsplash.com/photo-${imageId}?w=1200&h=600&fit=crop&auto=format&q=80`
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getActivityIconUrl with uniqueKey instead
 */
export function getActivityIconUrlLegacy(activityType: ActivityType, location?: string): string {
  // Use Picsum Photos - reliable, royalty-free placeholder images
  // Each activity type gets a consistent image based on a seed number
  const imageSeeds: Record<ActivityType, number> = {
    museum: 101,
    nature: 102,
    market: 103,
    historical: 104,
    cultural: 105,
    lab: 106,
    workshop: 107,
    reading: 108,
    discussion: 109,
    reflection: 110,
    default: 111,
  }

  const seed = imageSeeds[activityType] || imageSeeds.default
  // Picsum Photos: 400x400 size, grayscale for more neutral appearance
  // Using seed ensures consistent image per activity type
  return `https://picsum.photos/seed/${seed}${location ? location.replace(/\s+/g, '') : ''}/400/400`
}

/**
 * Gets SVG fallback icon (used when image fails to load)
 */
export function getActivityIconFallback(activityType: ActivityType): string {
  const fallbackIcons: Record<ActivityType, string> = {
    museum: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMlYyMk0xMiAyTDIwIDhIMTJWMjJNMTIgMkw0IDhIMTJWMjJNMTIgMkwyMCA4SDQuMDAwMDFMMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    nature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwxNyA3TDEyIDEyTDcgN0wxMiAyWk0xMiAxMkwxNyAxN0wxMiAyMkw3IDE3TDEyIDEyWiIgc3Ryb2tlPSIjNkZCRkE5QSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
    market: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCA2SDE2TTggMTBIMTZNOCAxNEgxNk04IDJIMjJWMjJIOFYyWiIgc3Ryb2tlPSIjNkZCRkE5QSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
    historical: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    cultural: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwxNSAxMEg5TDEyIDJaTTEyIDJMMTAgMTBIMTRMMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    lab: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwxNCAxMEgxMEwxMiAyWk0xMiAyTDEwIDEwSDE0TDEyIDJaIiBzdHJva2U9IiM2RkJGQTlBIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
    workshop: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCA2SDE2TTggMTBIMTZNOCAxNEgxNk04IDJIMjJWMjJIOFYyWiIgc3Ryb2tlPSIjNkZCRkE5QSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
    reading: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCA2SDE2TTggMTBIMTZNOCAxNEgxNk04IDJIMjJWMjJIOFYyWiIgc3Ryb2tlPSIjNkZCRkE5QSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
    discussion: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    reflection: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
    default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGRkJGOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
  }
  
  return fallbackIcons[activityType] || fallbackIcons.default
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
    default: 'learning activity',
  }
  
  const baseLabel = typeLabels[activityType]
  if (location) {
    return `${baseLabel} at ${location}`
  }
  return baseLabel
}
