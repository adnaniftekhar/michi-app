import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { getLearnerProfile } from '@/lib/learner-profiles'
import type { Trip, LearningTarget } from '@/types'

// Mock Vertex AI
vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
}))

// Mock learner profiles
vi.mock('@/lib/learner-profiles', () => ({
  getLearnerProfile: vi.fn(),
}))

describe('POST /api/ai/plan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects request with missing required fields', async () => {
    const request = new Request('http://localhost/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('rejects request with invalid learner profile ID', async () => {
    vi.mocked(getLearnerProfile).mockReturnValue(undefined as any)

    const request = new Request('http://localhost/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerProfileId: 'invalid',
        trip: { id: 'test' },
        learningTarget: { track: '15min' },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid learner profile ID')
  })

  it('rejects invalid JSON response from AI', async () => {
    const { VertexAI } = await import('@google-cloud/vertexai')
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'Invalid JSON response' }],
            },
          }],
        },
      }),
    }

    vi.mocked(VertexAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }) as any)

    vi.mocked(getLearnerProfile).mockReturnValue({
      name: 'Alice',
      timezone: 'America/New_York',
      preferences: {
        preferredLearningTimes: ['morning'],
        preferredDuration: 'medium',
        interactionStyle: 'collaborative',
        contentFormat: ['reading'],
      },
      constraints: {},
      pblProfile: {
        interests: ['history'],
        currentLevel: 'intermediate',
        learningGoals: ['learn'],
        preferredArtifactTypes: ['written'],
      },
      experientialProfile: {
        preferredFieldExperiences: ['museums'],
        reflectionStyle: 'journal',
        inquiryApproach: 'structured',
      },
    })

    const trip: Trip = {
      id: 'test-trip',
      title: 'Test Trip',
      startDate: '2026-06-01',
      endDate: '2026-06-14',
      baseLocation: 'Test Location',
      createdAt: '2026-01-01T00:00:00Z',
    }

    const learningTarget: LearningTarget = {
      track: '15min',
    }

    const request = new Request('http://localhost/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerProfileId: 'alice',
        trip,
        learningTarget,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Invalid JSON response')
  })

  it('rejects AI response that does not match schema', async () => {
    const { VertexAI } = await import('@google-cloud/vertexai')
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ days: [] }) }], // Wrong number of days
            },
          }],
        },
      }),
    }

    vi.mocked(VertexAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }) as any)

    vi.mocked(getLearnerProfile).mockReturnValue({
      name: 'Alice',
      timezone: 'America/New_York',
      preferences: {
        preferredLearningTimes: ['morning'],
        preferredDuration: 'medium',
        interactionStyle: 'collaborative',
        contentFormat: ['reading'],
      },
      constraints: {},
      pblProfile: {
        interests: ['history'],
        currentLevel: 'intermediate',
        learningGoals: ['learn'],
        preferredArtifactTypes: ['written'],
      },
      experientialProfile: {
        preferredFieldExperiences: ['museums'],
        reflectionStyle: 'journal',
        inquiryApproach: 'structured',
      },
    })

    const trip: Trip = {
      id: 'test-trip',
      title: 'Test Trip',
      startDate: '2026-06-01',
      endDate: '2026-06-14',
      baseLocation: 'Test Location',
      createdAt: '2026-01-01T00:00:00Z',
    }

    const learningTarget: LearningTarget = {
      track: '15min',
    }

    const request = new Request('http://localhost/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerProfileId: 'alice',
        trip,
        learningTarget,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('does not match schema')
  })
})

