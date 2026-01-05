/**
 * Auto-detect timezone from browser
 */
export function detectTimezone(): string {
  if (typeof window === 'undefined') {
    return 'America/New_York' // Default fallback
  }
  
  try {
    // Get IANA timezone from Intl API
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Fallback to UTC offset-based guess (not ideal but better than nothing)
    const offset = -new Date().getTimezoneOffset() / 60
    // Common timezone mappings (simplified)
    if (offset === -5) return 'America/New_York'
    if (offset === -6) return 'America/Chicago'
    if (offset === -7) return 'America/Denver'
    if (offset === -8) return 'America/Los_Angeles'
    if (offset === 0) return 'Europe/London'
    if (offset === 1) return 'Europe/Paris'
    if (offset === 9) return 'Asia/Tokyo'
    return 'America/New_York' // Ultimate fallback
  }
}

/**
 * Convert legacy duration enum to minutes
 */
export function durationToMinutes(duration: 'short' | 'medium' | 'long'): number {
  const map: Record<'short' | 'medium' | 'long', number> = {
    short: 30,
    medium: 60,
    long: 90,
  }
  return map[duration] || 60
}

/**
 * Convert minutes to legacy duration enum (for backward compatibility)
 */
export function minutesToDuration(minutes: number): 'short' | 'medium' | 'long' {
  if (minutes <= 45) return 'short'
  if (minutes <= 75) return 'medium'
  return 'long'
}

/**
 * Convert legacy interaction style to new preference
 */
export function interactionStyleToPreference(
  style: 'solo' | 'collaborative' | 'mixed'
): 'prefer-solo' | 'prefer-with-others' | 'either-works' {
  if (style === 'solo') return 'prefer-solo'
  if (style === 'collaborative') return 'prefer-with-others'
  return 'either-works'
}

/**
 * Convert new preference to legacy interaction style
 */
export function preferenceToInteractionStyle(
  pref: 'prefer-solo' | 'prefer-with-others' | 'either-works' | undefined
): 'solo' | 'collaborative' | 'mixed' {
  if (pref === 'prefer-solo') return 'solo'
  if (pref === 'prefer-with-others') return 'collaborative'
  return 'mixed'
}

