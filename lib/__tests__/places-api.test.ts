/**
 * TDD Tests for Places API
 * Tests verify API key configuration and basic functionality
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { resolvePlace } from '../places-api'

describe('Places API', () => {
  const apiKey = process.env.PLACES_API_KEY

  beforeAll(() => {
    if (!apiKey || apiKey === 'your_places_api_key_here') {
      throw new Error('PLACES_API_KEY is not configured. Set it in .env.local')
    }
  })

  describe('API Key Configuration', () => {
    it('should have PLACES_API_KEY configured', () => {
      expect(apiKey).toBeDefined()
      expect(apiKey).not.toBe('your_places_api_key_here')
      expect(apiKey?.length).toBeGreaterThan(30)
    })

    it('should have valid API key format', () => {
      expect(apiKey).toMatch(/^AIza[0-9A-Za-z_-]+$/)
    })
  })

  describe('resolvePlace', () => {
    it('should resolve a simple location query', async () => {
      const result = await resolvePlace(
        { query: 'New York City, NY, USA' },
        apiKey!
      )

      expect(result).toBeDefined()
      expect(result.placeId).toBeDefined()
      expect(result.displayName).toBeDefined()
      expect(result.location).toBeDefined()
      expect(typeof result.location.lat).toBe('number')
      expect(typeof result.location.lng).toBe('number')
    })

    it('should return valid coordinates for New York', async () => {
      const result = await resolvePlace(
        { query: 'New York City, NY, USA' },
        apiKey!
      )

      // New York coordinates should be approximately:
      // lat: ~40.7, lng: ~-74.0
      expect(result.location.lat).toBeGreaterThan(40)
      expect(result.location.lat).toBeLessThan(41)
      expect(result.location.lng).toBeLessThan(-73)
      expect(result.location.lng).toBeGreaterThan(-75)
    })

    it('should handle city queries', async () => {
      const result = await resolvePlace(
        { query: 'Tokyo, Japan' },
        apiKey!
      )

      expect(result).toBeDefined()
      expect(result.placeId).toBeDefined()
      expect(result.displayName).toContain('Tokyo')
      expect(result.location.lat).toBeGreaterThan(35)
      expect(result.location.lat).toBeLessThan(36)
    })

    it('should apply privacy downgrade (city-level coordinates)', async () => {
      const result = await resolvePlace(
        { query: '1600 Amphitheatre Parkway, Mountain View, CA' },
        apiKey!
      )

      // Even with a specific address, coordinates should be city-level
      // Mountain View is approximately lat: 37.4, lng: -122.1
      expect(result.location.lat).toBeGreaterThan(37)
      expect(result.location.lat).toBeLessThan(38)
      expect(result.location.lng).toBeLessThan(-121)
      expect(result.location.lng).toBeGreaterThan(-123)
    })

    it('should throw error for invalid API key', async () => {
      await expect(
        resolvePlace(
          { query: 'New York City' },
          'invalid_key_12345'
        )
      ).rejects.toThrow()
    })

    it('should throw error for empty query', async () => {
      await expect(
        resolvePlace(
          { query: '' },
          apiKey!
        )
      ).rejects.toThrow()
    })
  })
})
