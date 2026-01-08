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
 * Gets an image URL for an activity type
 * Uses Picsum Photos for high-quality placeholder images (royalty-free, no API key)
 * Images are generic and don't contain identifiable faces
 */
export function getActivityIconUrl(activityType: ActivityType, location?: string): string {
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
