import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '../schedule-blocks/route'
import type { ScheduleBlock } from '@/types'

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

describe('/api/user/schedule-blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const request = new Request('http://localhost/api/user/schedule-blocks?tripId=trip-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if tripId is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const request = new Request('http://localhost/api/user/schedule-blocks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('tripId is required')
    })

    it('should return empty array if no schedule blocks exist', async () => {
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

      const request = new Request('http://localhost/api/user/schedule-blocks?tripId=trip-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.scheduleBlocks).toEqual([])
    })

    it('should return schedule blocks if they exist', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockBlocks: ScheduleBlock[] = [
        {
          id: 'block-1',
          date: '2024-06-01',
          startTime: '2024-06-01T09:00:00',
          duration: 60,
          title: 'Test Activity',
          isGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              scheduleBlocks: {
                'trip-123': mockBlocks,
              },
            },
          }),
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/user/schedule-blocks?tripId=trip-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.scheduleBlocks).toHaveLength(1)
      expect(data.scheduleBlocks[0].id).toBe('block-1')
    })
  })

  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const request = new Request('http://localhost/api/user/schedule-blocks', {
        method: 'PUT',
        body: JSON.stringify({
          tripId: 'trip-123',
          scheduleBlocks: [],
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if tripId or scheduleBlocks is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const request = new Request('http://localhost/api/user/schedule-blocks', {
        method: 'PUT',
        body: JSON.stringify({
          tripId: 'trip-123',
          // scheduleBlocks missing
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('tripId and scheduleBlocks')
    })

    it('should save schedule blocks successfully', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockBlocks: ScheduleBlock[] = [
        {
          id: 'block-1',
          date: '2024-06-01',
          startTime: '2024-06-01T09:00:00',
          duration: 60,
          title: 'Test Activity',
          isGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

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

      const request = new Request('http://localhost/api/user/schedule-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: 'trip-123',
          scheduleBlocks: mockBlocks,
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserMetadata).toHaveBeenCalledWith('user-123', {
        privateMetadata: {
          scheduleBlocks: {
            'trip-123': mockBlocks,
          },
        },
      })
    })

    it('should merge with existing schedule blocks', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const existingBlocks: ScheduleBlock[] = [
        {
          id: 'block-existing',
          date: '2024-05-01',
          startTime: '2024-05-01T09:00:00',
          duration: 60,
          title: 'Existing Activity',
          isGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      const newBlocks: ScheduleBlock[] = [
        {
          id: 'block-new',
          date: '2024-06-01',
          startTime: '2024-06-01T09:00:00',
          duration: 60,
          title: 'New Activity',
          isGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      const updateUserMetadata = vi.fn().mockResolvedValue(undefined)
      const mockClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            privateMetadata: {
              scheduleBlocks: {
                'trip-existing': existingBlocks,
              },
            },
          }),
          updateUserMetadata,
        },
      }
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any)

      const request = new Request('http://localhost/api/user/schedule-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: 'trip-new',
          scheduleBlocks: newBlocks,
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify both trips are saved
      const callArgs = updateUserMetadata.mock.calls[0]
      const savedBlocks = callArgs[1].privateMetadata.scheduleBlocks
      expect(savedBlocks['trip-existing']).toEqual(existingBlocks)
      expect(savedBlocks['trip-new']).toEqual(newBlocks)
    })

    it('should handle null privateMetadata', async () => {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

      const mockBlocks: ScheduleBlock[] = [
        {
          id: 'block-1',
          date: '2024-06-01',
          startTime: '2024-06-01T09:00:00',
          duration: 60,
          title: 'Test Activity',
          isGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

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

      const request = new Request('http://localhost/api/user/schedule-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: 'trip-123',
          scheduleBlocks: mockBlocks,
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserMetadata).toHaveBeenCalled()
    })
  })
})
