import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { Trip } from '@/types'

// Simple in-memory storage for trips (per-user)
// Note: This resets on server restart, but localStorage on client will persist
const tripsStore: Record<string, Trip[]> = {}

// GET /api/trips - Get all trips for the current user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return trips from in-memory store (may be empty, client uses localStorage as primary)
    const trips = tripsStore[userId] || []
    return NextResponse.json({ trips })
  } catch (error) {
    console.error('[Trips API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: any
    try {
      const bodyText = await request.text()
      if (!bodyText) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        )
      }
      body = JSON.parse(bodyText)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { title, startDate, endDate, baseLocation, learningTarget } = body

    if (!title || !startDate || !endDate || !baseLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, endDate, baseLocation' },
        { status: 400 }
      )
    }

    // Create new trip
    const newTrip: Trip = {
      id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      startDate,
      endDate,
      baseLocation,
      learningTarget,
      createdAt: new Date().toISOString(),
    }

    // Store in memory (client will also store in localStorage)
    if (!tripsStore[userId]) {
      tripsStore[userId] = []
    }
    tripsStore[userId].push(newTrip)

    console.log('[Trips API] ✅ Trip created:', newTrip.id)
    return NextResponse.json({ trip: newTrip }, { status: 201 })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}
