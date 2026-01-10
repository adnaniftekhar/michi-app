/**
 * TDD Tests for Maps API Configuration
 * Tests verify API key configuration
 */

import { describe, it, expect } from 'vitest'

describe('Maps API Configuration', () => {
  const mapsBrowserKey = process.env.MAPS_BROWSER_KEY || process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY || ''

  describe('API Key Configuration', () => {
    it('should have Maps API key configured', () => {
      expect(mapsBrowserKey).toBeDefined()
      expect(mapsBrowserKey).not.toBe('your_maps_browser_key_here')
      expect(mapsBrowserKey.length).toBeGreaterThan(30)
    })

    it('should have valid API key format', () => {
      expect(mapsBrowserKey).toMatch(/^AIza[0-9A-Za-z_-]+$/)
    })

    it('should have key from either MAPS_BROWSER_KEY or NEXT_PUBLIC_MAPS_BROWSER_KEY', () => {
      const hasMAPS_BROWSER_KEY = !!process.env.MAPS_BROWSER_KEY
      const hasNEXT_PUBLIC = !!process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY
      
      expect(hasMAPS_BROWSER_KEY || hasNEXT_PUBLIC).toBe(true)
    })
  })

  describe('Environment Variables', () => {
    it('should have at least one Maps key set', () => {
      const keys = [
        process.env.MAPS_BROWSER_KEY,
        process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY,
      ].filter(Boolean)

      expect(keys.length).toBeGreaterThan(0)
    })

    it('should not have placeholder values', () => {
      const keys = [
        process.env.MAPS_BROWSER_KEY,
        process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY,
      ]

      keys.forEach(key => {
        if (key) {
          expect(key).not.toBe('your_maps_browser_key_here')
          expect(key).not.toContain('your_')
          expect(key).not.toContain('placeholder')
        }
      })
    })
  })
})
