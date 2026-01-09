/**
 * User settings for images and maps
 * Stored in localStorage for simplicity
 */

const SETTINGS_KEY = 'michi_user_settings'

export interface UserSettings {
  showImagesAndMaps: boolean
  venueLinksEnabled: boolean
  showExactAddresses: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  showImagesAndMaps: true, // Default to enabled
  venueLinksEnabled: true, // Default to enabled
  showExactAddresses: false, // Default to OFF for privacy
}

export function getUserSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }

  return DEFAULT_SETTINGS
}

export function updateUserSettings(settings: Partial<UserSettings>): void {
  if (typeof window === 'undefined') return

  const current = getUserSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
}
