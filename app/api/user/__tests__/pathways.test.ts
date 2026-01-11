import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '../pathways/route'
import type { FinalPathwayPlan } from '@/types'

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

describe('/api/user/pathways', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const request = new Request('http://localhost/api/user/pathways?tripId=trip-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if tripId is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const request = new Request('http://localhost/api/user/pathways')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('tripId is required')
    })

    it('should return pathway if it exists', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockPathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Test question',
            fieldExperience: 'Test experience',
            inquiryTask: 'Test task',
            artifact: 'Test artifact',
            reflectionPrompt: 'Test reflection',
            critiqueStep: 'Test critique',
            scheduleBlocks: [],
          },
        ],
      }

      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              pathways: {
                'trip-123': mockPathway,
              },
            },
          }),
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/user/pathways?tripId=trip-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pathway).toEqual(mockPathway)
    })

    it('should return null pathway if it does not exist', async () => {
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

      const request = new Request('http://localhost/api/user/pathways?tripId=trip-456')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pathway).toBeNull()
    })
  })

  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const request = new Request('http://localhost/api/user/pathways', {
        method: 'PUT',
        body: JSON.stringify({
          tripId: 'trip-123',
          pathway: { days: [] },
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if tripId or pathway is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const request = new Request('http://localhost/api/user/pathways', {
        method: 'PUT',
        body: JSON.stringify({
          tripId: 'trip-123',
          // pathway missing
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('tripId and pathway are required')
    })

    it('should save pathway successfully', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockPathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Test question',
            fieldExperience: 'Test experience',
            inquiryTask: 'Test task',
            artifact: 'Test artifact',
            reflectionPrompt: 'Test reflection',
            critiqueStep: 'Test critique',
            scheduleBlocks: [],
          },
        ],
      }

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

      const request = new Request('http://localhost/api/user/pathways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: 'trip-123',
          pathway: mockPathway,
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserMetadata).toHaveBeenCalledWith('user-123', {
        privateMetadata: {
          pathways: {
            'trip-123': mockPathway,
          },
        },
      })
    })

    it('should merge with existing pathways', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const existingPathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-01',
            drivingQuestion: 'Existing',
            fieldExperience: 'Existing',
            inquiryTask: 'Existing',
            artifact: 'Existing',
            reflectionPrompt: 'Existing',
            critiqueStep: 'Existing',
            scheduleBlocks: [],
          },
        ],
      }

      const newPathway: FinalPathwayPlan = {
        days: [
          {
            day: 1,
            date: '2024-06-02',
            drivingQuestion: 'New',
            fieldExperience: 'New',
            inquiryTask: 'New',
            artifact: 'New',
            reflectionPrompt: 'New',
            critiqueStep: 'New',
            scheduleBlocks: [],
          },
        ],
      }

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              pathways: {
                'trip-existing': existingPathway,
              },
            },
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/user/pathways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: 'trip-new',
          pathway: newPathway,
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserMetadata).toHaveBeenCalledWith('user-123', {
        privateMetadata: {
          pathways: {
            'trip-existing': existingPathway,
            'trip-new': newPathway,
          },
        },
      })
    })
  })
})
