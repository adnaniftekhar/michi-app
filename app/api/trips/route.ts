import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTripsByUserId, createTrip } from '@/lib/trips-storage'
import type { Trip } from '@/types'

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

    const trips = await getTripsByUserId(userId)
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

    const body = await request.json()
    const { title, startDate, endDate, baseLocation, learningTarget } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !baseLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, endDate, baseLocation' },
        { status: 400 }
      )
    }

    const trip = await createTrip(
      {
        title,
        startDate,
        endDate,
        baseLocation,
        learningTarget,
      },
      userId
    )

    return NextResponse.json({ trip }, { status: 201 })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}
