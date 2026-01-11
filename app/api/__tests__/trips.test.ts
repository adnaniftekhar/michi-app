import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../trips/route'
import type { Trip } from '@/types'

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

describe('/api/trips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return empty array if user has no trips', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {},
          }),
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual([])
    })

    it('should return trips if user has trips', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockTrip: Trip = {
        id: 'trip-1',
        title: 'Test Trip',
        startDate: '2024-06-01',
        endDate: '2024-06-14',
        baseLocation: 'San Francisco',
        createdAt: '2024-01-01T00:00:00Z',
      }

      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              trips: {
                trips: [
                  {
                    id: 'trip-1',
                    trip: mockTrip,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                  },
                ],
              },
            },
          }),
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toHaveLength(1)
      expect(data.trips[0]).toEqual(mockTrip)
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Trip',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          baseLocation: 'San Francisco',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if required fields are missing', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Trip',
          // missing startDate, endDate, baseLocation
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should create a trip successfully', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {},
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Trip',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          baseLocation: 'San Francisco',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.trip).toBeDefined()
      expect(data.trip.title).toBe('Test Trip')
      expect(data.trip.id).toBeDefined()
      expect(data.trip.createdAt).toBeDefined()
      expect(updateUserMetadata).toHaveBeenCalled()
      
      // Verify the metadata structure
      const callArgs = updateUserMetadata.mock.calls[0]
      expect(callArgs[0]).toBe('user-123')
      const savedTrips = callArgs[1].privateMetadata.trips
      expect(savedTrips).toBeDefined()
      expect(Array.isArray(savedTrips)).toBe(true)
      expect(savedTrips).toHaveLength(1)
    })

    it('should merge with existing trips', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const existingTrip: Trip = {
        id: 'trip-existing',
        title: 'Existing Trip',
        startDate: '2024-05-01',
        endDate: '2024-05-14',
        baseLocation: 'New York',
        createdAt: '2024-01-01T00:00:00Z',
      }

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              trips: {
                trips: [
                  {
                    id: 'trip-existing',
                    trip: existingTrip,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                  },
                ],
              },
            },
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Trip',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          baseLocation: 'San Francisco',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.trip.title).toBe('New Trip')
      
      // Verify both trips are saved
      const callArgs = updateUserMetadata.mock.calls[0]
      const savedTrips = callArgs[1].privateMetadata.trips
      expect(Array.isArray(savedTrips)).toBe(true)
      expect(savedTrips).toHaveLength(2)
      expect(savedTrips[0].trip.title).toBe('Existing Trip')
      expect(savedTrips[1].trip.title).toBe('New Trip')
    })

    it('should handle null/undefined privateMetadata', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: null, // Simulate null metadata
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Trip',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          baseLocation: 'San Francisco',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.trip).toBeDefined()
      expect(updateUserMetadata).toHaveBeenCalled()
    })

    it('should preserve existing pathways and scheduleBlocks when creating trip', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const existingMetadata = {
        pathways: {
          'trip-existing': {
            days: [{ day: 1, date: '2024-06-01', scheduleBlocks: [] }],
          },
        },
        scheduleBlocks: {
          'trip-existing': [],
        },
      }

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: existingMetadata,
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Trip',
          startDate: '2024-06-15',
          endDate: '2024-06-20',
          baseLocation: 'New York',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.trip.title).toBe('New Trip')
      
      // Verify that pathways and scheduleBlocks are preserved
      const callArgs = updateUserMetadata.mock.calls[0]
      const savedMetadata = callArgs[1].privateMetadata
      expect(savedMetadata.pathways).toEqual(existingMetadata.pathways)
      expect(savedMetadata.scheduleBlocks).toEqual(existingMetadata.scheduleBlocks)
      expect(Array.isArray(savedMetadata.trips)).toBe(true)
      expect(savedMetadata.trips.length).toBe(1)
    })

    it('should handle Clerk API errors gracefully', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockClient = {
        users: {
          getUser: vi.fn().mockRejectedValue(new Error('Clerk API error')),
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Trip',
          startDate: '2024-06-01',
          endDate: '2024-06-14',
          baseLocation: 'San Francisco',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create trip')
    })
  })
})
